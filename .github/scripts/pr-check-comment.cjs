const fs = require('node:fs');
const path = require('node:path');
const { stripVTControlCharacters } = require('node:util');

const checks = [
  { step: 'TypeScript', command: 'pnpm typecheck', log: 'typecheck.log' },
  { step: 'ESLint', command: 'pnpm lint', log: 'lint.log' },
  { step: 'Tests', command: 'pnpm test', log: 'tests.log' },
  { step: 'CI reporter tests', command: 'pnpm test:ci', log: 'reporter-tests.log' },
];
const labels = {
  success: '✅ 成功', failure: '❌ 失败', cancelled: '⚪ 已取消',
  skipped: '⚪ 未执行', timed_out: '❌ 超时', action_required: '⚠️ 需要处理',
};
const escapeHtml = (text) => text.replace(/[&<>@]/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '@': '&#64;',
})[char]);

function readExcerpt(logDir, file) {
  try {
    const target = path.join(logDir, file);
    const stat = fs.lstatSync(target);
    if (!stat.isFile() || stat.size > 2 * 1024 * 1024) return null;
    const text = stripVTControlCharacters(fs.readFileSync(target, 'utf8')).replace(/\r/g, '').trim();
    if (!text) return null;
    const lines = text.split('\n');
    // 保留开头的文件定位和末尾的失败摘要；限制评论体积，完整信息仍在 Actions。
    const excerpt = lines.length > 70
      ? [...lines.slice(0, 25), '… 中间日志已省略 …', ...lines.slice(-45)].join('\n')
      : text;
    const bounded = excerpt.length > 5500
      ? `${excerpt.slice(0, 2500)}\n… 日志已截断 …\n${excerpt.slice(-3000)}`
      : excerpt;
    return escapeHtml(bounded);
  } catch {
    return null;
  }
}

function buildComment({ run, jobs, logDir }) {
  const marker = `<!-- pr-checks:${run.id}:${run.run_attempt} -->`;
  const job = jobs.find((entry) => entry.name === 'Quality checks');
  const steps = job?.steps ?? [];
  const results = checks.map((check) => ({
    ...check, conclusion: steps.find((step) => step.name === check.step)?.conclusion ?? 'skipped',
  }));
  const passed = run.conclusion === 'success' && results.every((check) => check.conclusion === 'success');
  const lines = [
    marker,
    passed ? '## ✅ PR 检查成功' : '## ❌ PR 检查未通过',
    '',
    `提交：\`${run.head_sha.slice(0, 12)}\` · 第 ${run.run_attempt} 次执行`,
    `[查看完整检查日志](${run.html_url})`,
    '',
    '| 检查项 | 命令 | 结果 |',
    '| --- | --- | --- |',
    ...results.map((check) => `| ${check.step} | \`${check.command}\` | ${labels[check.conclusion] ?? '⚠️ 未完成'} |`),
  ];
  if (!passed) {
    lines.push('', '### 错误信息点');
    const failed = steps.filter((step) => !['success', 'skipped'].includes(step.conclusion));
    if (!failed.length) lines.push('- 检查未完整执行或结果异常，请打开完整日志定位。');
    for (const step of failed) {
      const check = checks.find((entry) => entry.step === step.name);
      const file = check?.log ?? (step.name === 'Install dependencies' ? 'install.log' : null);
      lines.push('', `- <strong>${escapeHtml(step.name)}</strong>：${labels[step.conclusion] ?? '未完成'}`);
      const excerpt = file && readExcerpt(logDir, file);
      lines.push(excerpt
        ? `\n<details><summary>错误输出（文件位置、错误原因或失败用例）</summary>\n\n<pre>${excerpt}</pre>\n\n</details>`
        : '  此步骤未产生可用摘要，请查看上方完整日志。');
    }
  }
  return { marker, body: lines.join('\n') };
}

async function postComment({ github, context, core, logDir }) {
  const run = context.payload.workflow_run;
  if (run.event !== 'pull_request') return;
  const repo = context.repo;
  const fullName = `${repo.owner}/${repo.repo}`;
  // PR 编号来自 GitHub 事件/API，而不是 PR 可修改的日志产物。
  let numbers = (run.pull_requests ?? []).map((pr) => pr.number);
  if (!numbers.length) {
    // fork 的 workflow_run.pull_requests 可能为空，通过提交关联查找。
    const associated = await github.paginate(github.rest.repos.listPullRequestsAssociatedWithCommit, {
      ...repo, commit_sha: run.head_sha, per_page: 100,
    });
    numbers = associated.filter((pr) => pr.base.repo.full_name === fullName
      && pr.head.repo?.id === run.head_repository?.id
      && pr.head.ref === run.head_branch).map((pr) => pr.number);
  }
  if (!numbers.length) {
    core.setFailed('无法从 GitHub 事件或提交关联定位 PR，未发布评论。');
    return;
  }
  const jobs = await github.paginate(github.rest.actions.listJobsForWorkflowRunAttempt, {
    ...repo, run_id: run.id, attempt_number: run.run_attempt, per_page: 100,
  });
  const { marker, body } = buildComment({ run, jobs, logDir });
  for (const number of new Set(numbers)) {
    const { data: pr } = await github.rest.pulls.get({ ...repo, pull_number: number });
    if (pr.base.repo.full_name !== fullName) continue;
    const comments = await github.paginate(github.rest.issues.listComments, {
      ...repo, issue_number: number, per_page: 100,
    });
    const previous = comments.find((comment) => comment.user?.login === 'github-actions[bot]'
      && comment.body?.startsWith(marker));
    if (previous) {
      await github.rest.issues.updateComment({ ...repo, comment_id: previous.id, body });
    } else {
      await github.rest.issues.createComment({ ...repo, issue_number: number, body });
    }
  }
}

module.exports = { buildComment, postComment };
