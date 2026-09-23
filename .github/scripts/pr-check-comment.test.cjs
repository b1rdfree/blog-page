const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { buildComment, postComment } = require('./pr-check-comment.cjs');

const run = {
  id: 123, run_attempt: 1, event: 'pull_request', conclusion: 'success',
  head_sha: 'abcdef1234567890', html_url: 'https://github.com/owner/repo/actions/runs/123',
  pull_requests: [{ number: 42 }], head_repository: { id: 12 }, head_branch: 'feature',
};
const names = ['Install dependencies', 'TypeScript', 'ESLint', 'Tests', 'CI reporter tests'];
const jobsWith = (overrides = {}) => [{
  name: 'Quality checks', steps: names.map((name) => ({ name, conclusion: overrides[name] ?? 'success' })),
}];
function tempLogs(t, logs = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pr-comment-test-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const [file, text] of Object.entries(logs)) fs.writeFileSync(path.join(dir, file), text);
  return dir;
}

test('成功评论列出 TS、ESLint、测试和运行链接', (t) => {
  const { body } = buildComment({ run, jobs: jobsWith(), logDir: tempLogs(t) });
  assert.match(body, /PR 检查成功/);
  for (const command of ['pnpm typecheck', 'pnpm lint', 'pnpm test']) assert.ok(body.includes(command));
  assert.ok(body.includes(run.html_url));
  assert.doesNotMatch(body, /错误信息点/);
});

test('失败评论包含各项错误、文件行号和失败用例，保留成功项', (t) => {
  const logDir = tempLogs(t, {
    'typecheck.log': 'src/App.tsx(3,7): error TS2322: Type string is not assignable to number.',
    'lint.log': 'src/App.tsx\n  8:3  error  unused is assigned a value but never used  @typescript-eslint/no-unused-vars',
    'tests.log': 'FAIL src/pages/Home.test.tsx > renders the menu\nAssertionError: expected 3 to be 4',
  });
  const { body } = buildComment({
    run: { ...run, conclusion: 'failure' }, logDir,
    jobs: jobsWith({ TypeScript: 'failure', ESLint: 'failure', Tests: 'failure' }),
  });
  assert.match(body, /PR 检查未通过/);
  assert.match(body, /src\/App.tsx\(3,7\): error TS2322/);
  assert.match(body, /8:3.*error/);
  assert.match(body, /AssertionError: expected 3 to be 4/);
  assert.match(body, /CI reporter tests.*✅ 成功/);
});

test('安装失败或缺少日志时仍生成失败评论，不误报检查通过', (t) => {
  const jobs = jobsWith(Object.fromEntries(names.map((name) => [name, name === 'Install dependencies' ? 'failure' : 'skipped'])));
  const { body } = buildComment({ run: { ...run, conclusion: 'failure' }, jobs, logDir: tempLogs(t) });
  assert.match(body, /Install dependencies/);
  assert.match(body, /未产生可用摘要/);
  assert.match(body, /TypeScript.*未执行/);
  assert.doesNotMatch(buildComment({ run, jobs: [], logDir: '/missing' }).body, /PR 检查成功/);
});

test('日志按纯文本转义，去除 ANSI，限制长度并拒绝符号链接', (t) => {
  const logDir = tempLogs(t, { 'tests.log': '\u001b[31mFAIL\u001b[0m </pre><script>alert(1)</script> @everyone\n' + 'x'.repeat(10_000) });
  const args = { run: { ...run, conclusion: 'failure' }, jobs: jobsWith({ Tests: 'failure' }), logDir };
  const { body } = buildComment(args);
  assert.match(body, /&lt;\/pre&gt;&lt;script&gt;/);
  assert.match(body, /&#64;everyone/);
  assert.doesNotMatch(body, /\u001b|<script>/);
  assert.ok(body.length < 10_000);
  fs.renameSync(path.join(logDir, 'tests.log'), path.join(logDir, 'other.log'));
  fs.symlinkSync(path.join(logDir, 'other.log'), path.join(logDir, 'tests.log'));
  assert.match(buildComment(args).body, /未产生可用摘要/);
});

function mockApi({ workflowRun = run, comments = [], associated = [] } = {}) {
  const calls = [];
  const rest = {
    actions: { listJobsForWorkflowRunAttempt: 'jobs' },
    repos: { listPullRequestsAssociatedWithCommit: 'associated' },
    pulls: { get: async (args) => { calls.push(['pr', args]); return { data: { base: { repo: { full_name: 'owner/repo' } } } }; } },
    issues: {
      listComments: 'comments',
      createComment: async (args) => calls.push(['create', args]),
      updateComment: async (args) => calls.push(['update', args]),
    },
  };
  return {
    calls,
    github: { rest, paginate: async (endpoint, args) => {
      calls.push([endpoint, args]);
      return { jobs: jobsWith(), comments, associated }[endpoint];
    } },
    context: { repo: { owner: 'owner', repo: 'repo' }, payload: { workflow_run: workflowRun } },
    core: { setFailed: (message) => calls.push(['failed', message]) },
    logDir: '/missing',
  };
}

test('发布成功评论，同一执行的重复通知只更新机器人自己的评论', async () => {
  const first = mockApi();
  await postComment(first);
  const created = first.calls.find(([kind]) => kind === 'create')[1];
  assert.equal(created.issue_number, 42);
  assert.match(created.body, /PR 检查成功/);
  const repeated = mockApi({ comments: [
    { id: 9, user: { login: 'contributor' }, body: created.body },
    { id: 10, user: { login: 'github-actions[bot]' }, body: created.body },
  ] });
  await postComment(repeated);
  assert.equal(repeated.calls.find(([kind]) => kind === 'update')[1].comment_id, 10);
  assert.ok(!repeated.calls.some(([kind]) => kind === 'create'));
});

test('fork 缺少事件 PR 编号时只选择同仓库、同 head 的提交关联 PR', async () => {
  const match = { number: 55, base: { repo: { full_name: 'owner/repo' } }, head: { repo: { id: 12 }, ref: 'feature' } };
  const api = mockApi({ workflowRun: { ...run, pull_requests: [] }, associated: [
    match, { ...match, number: 56, head: { repo: { id: 99 }, ref: 'feature' } },
    { ...match, number: 57, base: { repo: { full_name: 'other/repo' } } },
  ] });
  await postComment(api);
  assert.deepEqual(api.calls.filter(([kind]) => kind === 'create').map(([, args]) => args.issue_number), [55]);
});

test('重跑按 attempt 读取结果并生成独立评论，不覆盖前一次执行', async () => {
  const api = mockApi({ workflowRun: { ...run, run_attempt: 2 } });
  await postComment(api);
  assert.equal(api.calls.find(([kind]) => kind === 'jobs')[1].attempt_number, 2);
  assert.match(api.calls.find(([kind]) => kind === 'create')[1].body, /pr-checks:123:2/);
});

test('无法关联 PR 时明确失败；非 PR 运行不评论', async () => {
  const missing = mockApi({ workflowRun: { ...run, pull_requests: [] } });
  await postComment(missing);
  assert.ok(missing.calls.some(([kind]) => kind === 'failed'));
  assert.ok(!missing.calls.some(([kind]) => kind === 'create'));
  const push = mockApi({ workflowRun: { ...run, event: 'push' } });
  await postComment(push);
  assert.equal(push.calls.length, 0);
});
