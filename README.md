# Nonight Hub

Vite + React + TypeScript 搭的个人内容工作台。顶部菜单进栏目，左边挑内容，右边渲染——
文档栏目渲染 Markdown，旅游栏目渲染结构化的行程数据集。

## 快速开始

包管理器是 **pnpm**（仓库里只有 `pnpm-lock.yaml`，用 npm 装会另生一份 lock 造成漂移）。
Node 要求 `^20.19.0 || >=22.12.0`（Vite 8 的硬性要求）。

```bash
corepack enable          # 没装 pnpm 的话先开这个
pnpm install
pnpm dev                 # http://localhost:5173
pnpm build               # 类型检查 + 打包到 dist/
pnpm preview             # 本地预览打包结果
pnpm lint                # ESLint 检查
pnpm test                # 模板、内容加载与容灾 UI 的自动化测试
pnpm test:watch          # 修改时持续运行测试
pnpm test:ci             # CI 评论生成、异常与 fork 关联逻辑的测试
pnpm check:perf          # 构建并检查首屏 gzip 预算（JS 65KB / CSS 5KB）
```

## 目录结构

```
src/
├── config/nav.ts        # 菜单配置（唯一扩展点）
├── lib/docs/            # 文档栏目：meta.ts 轻量索引 / content.ts 按需加载 / useDoc.ts
├── lib/travel/          # 旅游栏目：meta.ts 轻量索引 / dataset.ts 按需加载
├── layouts/MainLayout   # 顶部导航 + 内容区 + 页脚
├── components/
│   ├── NavBar           # 顶部菜单
│   ├── DocList          # 左侧文档列表（搜索 + hover 预取）
│   ├── MarkdownView     # 右侧 Markdown 渲染
│   └── travel/          # 旅游专用：TripList 搜索列表 + TripTemplate 行程模板
├── pages/
│   ├── Home             # 首页：栏目卡片 + 最近更新
│   ├── SectionPage      # 栏目页：按 renderer 分流到 docs / travel 两套渲染
│   ├── TravelSection    # 旅游栏目页：左搜索列表 + 右数据集模板
│   └── NotFound
└── content/             # 所有内容，按栏目分目录
    ├── code/            # .md 文档
    └── travel/          # .json 行程数据集
build/
├── docsIndexPlugin.ts   # 构建期扫描 content/*/*.md，生成 virtual:docs-index
└── travelIndexPlugin.ts # 构建期扫描 travel/*.json，生成 virtual:travel-index
```

## 加一篇文档

在 `src/content/<栏目>/` 下新建 `.md` 文件，保存即生效，不需要注册。

文件头可以写 frontmatter（全部可选）：

```markdown
---
title: 文档标题          # 不写则取正文第一个 # 标题
date: 2026-09-11        # 用于列表展示和首页「最近更新」排序
order: 1                # 排序权重，越小越靠前
tags: [标签1, 标签2]
summary: 一句话摘要      # 不写则自动截取正文首段
---

# 正文标题
```

## 加一篇旅行行程（数据集）

旅游栏目不走 Markdown，走 **一份行程 = 一个 `.json` 数据集**：左侧列表可搜索，
点进去由 `TripTemplate` 把数据灌进统一的行程模板（编号章节 + sticky 锚点导航 +
结论卡 + 高亮表格 + 逐日时间轴 + 可勾清单）。

**加一篇 = 往 `src/content/travel/` 丢一个 `.json`**，文件名（去掉 `.json`）就是 URL 上的 slug。
不用注册、不用改组件，列表和首页「最近更新」自动出现。

```jsonc
{
  "version": 1,
  "meta": {
    "title": "桂林 + 阳朔 3 日休闲线",
    "summary": "不赶路的走法，适合带家人或第一次去。",   // 列表和页头都显示
    "chips": ["3 天", "休闲", "人均 ¥1100 起"],          // 页头小胶囊
    "tags": ["桂林", "阳朔", "休闲"],                    // 参与搜索
    "order": 2,                                          // 越小越靠前
    "updated": "2026-09-10",
    "filters": {                                         // 左侧筛选 + 参与搜索，随便加字段
      "days": 3, "pace": "休闲", "budget": "经济",
      "themes": ["自然山水"], "from": "成都", "to": ["桂林", "阳朔"]
    }
  },
  "sections": [
    { "type": "conclusions", "title": "先看这 3 条结论", "items": [
        { "tone": "key",  "title": "…", "desc": "…" },   // key 关键 / good 推荐 / warn 注意 / bad 劝退
        { "tone": "warn", "title": "…", "desc": "…", "link": { "text": "见第 03 节", "anchor": "#s2" } }
    ]},
    { "type": "table", "title": "预算参考", "columns": ["项目", "经济", "舒适"],
      "rows": [{ "cells": ["交通", "300", "700"] },
               { "cells": ["合计", "约 1100", "约 2300"], "highlight": true }],
      "footnote": "不含往返大交通" },
    { "type": "days", "title": "逐日行程", "days": [
        { "label": "Day 1", "tag": "抵达 · 市区", "cost": "人均 ¥260", "items": [
            { "time": "上午", "title": "…", "desc": "…",
              "pill": { "text": "推荐", "tone": "yes" } }   // yes 推荐 / no 不推荐 / mid 看情况
    ]}]},
    { "type": "checklist", "title": "出门前照着勾一遍",
      "groups": [{ "title": "证件与钱", "items": ["身份证", "…"] }] },
    { "type": "callout", "title": "避坑", "tone": "danger", "items": ["…"] },  // tip 建议 / danger 避坑 / note 补充
    { "type": "cards", "title": "从成都出发", "columns": 3,
      "items": [{ "title": "飞机", "desc": "…", "tag": "最快" }] },
    { "type": "stats", "title": "速览", "items": [{ "value": "6天5晚", "label": "行程长度" }] },
    { "type": "prose", "title": "写在最后", "paragraphs": ["…"] }
  ]
}
```

字段的完整定义与注释见 `src/lib/travel/types.ts`。几个约定：

- `sections` 里每个 `type` 对应模板里的一个模块，加新模块 = `types.ts` 加一支联合类型 +
  `TripTemplate.tsx` 的 `SectionBody` 加一个 `case`。
- 顶部导航的短名默认取 `title`，太长了用 `navLabel` 覆盖；锚点按数组下标生成 `#s0` `#s1`…，
  所以结论卡里的 `link.anchor` 填 `#s2` 就跳到第 3 个小节。

> **数据集里写 `#s2`，但页面里千万别渲染成 `<a href="#s2">`。** 站点是 `HashRouter`，
> URL 上的 `#` 已经被路由占用，原生锚点会把 hash 改成 `#s2`、被解析成路径 `s2` 而落到 404。
> `TripTemplate` 里导航和卡内跳转全是 `<button>` + 程序化 `window.scrollTo`。
> 将来若换成 `BrowserRouter`，才可以用回原生锚点。
- **meta 里别写正文**：它会被构建期抽成索引常驻首屏，正文只在点开时才下载。

> 文档栏目也是同样的三层拆分（见下文「按需加载」）：meta 抽索引、正文点击时才下载。
> 列表搜索只覆盖标题 / 摘要 / 标签，不再搜正文片段——要搜正文得点开后用 Ctrl-F。
> 别在这个目录放非 `.md` 文件——`docsIndexPlugin` 只认 `.md` 后缀。

## 加一个栏目

两步，不用碰组件代码：

1. 在 `src/config/nav.ts` 的 `navItems` 里加一项，`key` 同时决定路由和目录名：

   ```ts
   { key: 'smart-home', label: '智能家居', desc: 'Home Assistant 与设备接入' },
   ```

2. 建目录 `src/content/smart-home/`，往里放 `.md`

路由、左侧列表、首页卡片会自动出现。

如果这个栏目也要走「数据集 + 模板」而不是 Markdown，在那一加个
`renderer: 'travel'`（并准备对应的模板组件），`SectionPage` 会按它分流。

## 全站科幻视觉与性能预算

首页、所有栏目、404 和错误提示共用白天 / 黑夜主题。色彩、面板边缘、焦点反馈、
导航与加载态由 `src/styles/global.css` 管理；旅游的语义色绑定到同一套变量。
正文用高不透明面板保证阅读对比度，不对动态背景做大面积 `backdrop-filter` 模糊。

### 首页与主题

首页定位为可扩展的个人内容空间，不限定栏目类型。主视觉为静态 SVG 轨道星球和灵感卡片，
不加载图片、字体或新动画依赖。栏目入口、统计由 `sectionItems` 与内容索引生成；
`nav.ts` 的可选 `visual` 字段只控制卡片插画，未配置的新栏目自动使用通用卡片。
导航菜单过多时可横向滚动，主题按钮保持可见。

导航右侧提供白天、黑夜、跟随系统三种选择。首次跟随系统，手动选择写入
`localStorage` 的 `nonight-theme`，跨刷新和标签页同步；存储不可用时本次访问仍可切换。
`index.html` 的短脚本在首次绘制前设置 `data-theme`，避免主题闪烁；
`useTheme` 处理后续系统变化和交互。新增组件应优先使用共享颜色变量。
白天使用浅色阅读面板、对应的语法高亮和旅行语义色，GPU 背景卸载；黑夜按下述条件启用。

### React Bits 选型

| 效果 | 采用方式 | 性能取舍 |
| --- | --- | --- |
| [Molten Metal](https://reactbits.dev/backgrounds/molten-metal) | 保留官方 shader，重写运行时；全站唯一动态背景 | 替代 Plasma + 星空 + 乱码三层，不叠加 canvas |
| [Spotlight Card](https://reactbits.dev/components/spotlight-card) | 改编为栏目入口的局部聚光 | 仅鼠标移动时合并到一帧更新，不更新 React state，无常驻循环 |
| [Star Border](https://reactbits.dev/animations/star-border) | 借鉴细线发光，使用共享 CSS 静态光边和交互透明度反馈 | 不引入原版无限流动边框 |
| [Fade Content](https://reactbits.dev/animations/fade-content) | 评估后未引入 | 正文直接可见，不等待 GSAP 或滚动触发器 |

标题和统计数字直接展示。旧 React Bits 组件源码保留供参考，但没有入口引用，
GSAP / Motion 不进入当前生产包；全站没有点击火花或字符矩阵的常驻 2D 循环。

### 背景运行约束

`SiteBackground.tsx` 挂载于 `MainLayout`，切换页面时复用同一个背景。

- CSS 光晕与细网格立即显示；`load` 完成后等待 1200ms，再在 `requestIdleCallback`
  空闲时加载 Molten Metal 与 OGL；不支持 idle API 时使用延时回退。
- 白天模式、手机 / 粗指针设备、视口 ≤900px、系统减少动态效果、Save-Data 或 2G 连接使用静态 CSS 背景。
  媒体偏好变化会卸载 GPU 背景；网络偏好在后续调度时重新读取。
- 唯一 canvas 的 DPR 固定为 1，内部尺寸最多为 CSS 尺寸的一半，总像素上限 40 万。
- shader 只做 3 次折叠迭代；渲染上限 24fps（定时器 + rAF，对齐屏幕刷新，实际可能更低）。
- 标签页隐藏立即停止调度；滚动时暂停，停止滚动 180ms 后恢复。
- 卸载时清理定时器、rAF、监听、观察器和 GPU 资源；WebGL 2 不支持、加载失败或 context lost
  时保留 CSS 背景。没有额外的探测用 WebGL context。
- 所有界面 CSS 动画与过渡遵循 `prefers-reduced-motion`；搜索、阅读、清单不依赖动画运行。

调色与质量参数位于 `src/components/bits/MoltenMetal.tsx` 的 uniforms 与 resize 逻辑。
背景无指针事件；不要直接添加 canvas 鼠标监听，避免影响上层内容交互。

### 按需加载

1. `App.tsx` 按需加载栏目页，`SectionPage.tsx` 再按栏目加载 `MarkdownView` 或 `TravelSection`。
   只访问旅游时不加载 Markdown 解析器与代码高亮依赖。
2. `build/docsIndexPlugin.ts` 与 `build/travelIndexPlugin.ts` 构建轻量元数据索引，首页只用索引。
   索引随内容数量增长，但不包含正文。
3. 文档和旅行数据使用非 eager 的 `import.meta.glob`，每篇独立 chunk；hover / focus 时预取，
   加载后缓存。搜索只覆盖元数据。
4. highlight.js 只注册选定的语言；背景与 OGL 为独立异步 chunk。
5. 阅读布局和 Markdown 样式分别随栏目页与 Markdown 模板下载，不占首页 CSS。

当前 `check:perf` 统计：首页同步 JS gzip 约 **61.1 KB**，首屏 CSS 约 **4.0 KB**（含昼夜模式与新首页）。Molten Metal + OGL 约 **15.2 KB gzip**，在 load + idle 后下载。
这些是打包体积与实现预算，不等于所有设备上的实测加载时间或 GPU 帧耗时。

新增特效后跑 `pnpm check:perf`：基于构建 manifest 递归统计同步依赖，限制 JS ≤65KB、CSS ≤5KB gzip，
检查背景与 Markdown 是否误入首屏。此检查不替代浏览器中的滚动、暂停和低性能设备验证。

本地 1280×720 浏览器的 3 秒采样中，新背景绘制 70 次（约 23fps），只保留一个 640×360 canvas；
模拟隐藏事件后的 1.5 秒采样为 0 次绘制 / 0 次 rAF。模拟减少动态效果时没有 canvas 或背景资源请求。

## PR 质量检查与自动评论

`.github/workflows/pr-checks.yml` 在 PR 创建、更新提交、重新打开或转为待审阅时触发，
对所有目标分支生效。单纯 push main 或 tag 不触发这个检查工作流。

安装锁定依赖后，分别执行 `pnpm typecheck --pretty false`、`pnpm lint`、`pnpm test`，
并运行 `pnpm test:ci` 验证评论逻辑。任意一项失败都会让检查失败，但不会跳过其余检查。
每项输出单独保存，Actions 日志产物保留 7 天；安装失败时其余检查标记为未执行。

`.github/workflows/pr-checks-comment.yml` 在检查结束后发布 PR 评论：

- 成功：显示「PR 检查成功」和每项检查结果。
- 失败：显示「PR 检查未通过」、失败项和错误输出，包括文件行号、ESLint 规则或失败用例信息。
- 评论附检查提交、执行次数和完整日志链接；过长日志截断，缺失日志时明确提示。
- 每次新运行/重跑各留一条评论，同一次执行的重复通知更新已有机器人评论。

评论使用 `workflow_run`，兼容 fork PR 的只读检查令牌。执行 PR 代码的工作流仅授予
`contents: read`；评论工作流持有 `actions: read`、`contents: read`、`pull-requests: write`，
只执行默认分支的脚本，下载的日志仅当作文本，PR 编号和结果从 GitHub API 获取。

**首次启用需将两个工作流及 `.github/scripts/` 合入默认分支**：
GitHub 只有在默认分支存在对应工作流时才触发 `workflow_run`，因此首次引入这些文件的 PR
还不能依赖自动评论。无需额外 PAT；仓库/组织策略需要允许声明的评论权限。
本地可用 `pnpm test:ci` 验证评论逻辑。部署仍由下面独立的发布工作流处理。

## 部署

流水线在 `.github/workflows/deploy.yml`，**只在打 tag 时触发**（`v*`），推 `main` 不会部署：

```bash
git tag v0.2.0 && git push origin v0.2.0
```

流程：**build → GitHub Pages（OIDC artifact）→ 可选自托管 rsync**。
走的是官方 `actions/deploy-pages`，不往 `gh-pages` 分支强推。
也可在 Actions 页面用 `workflow_dispatch` 手动触发一次。

流水线开箱即用，**下面这些配置全部留空也不会报错**——配了才启用对应步骤。
到仓库 Settings → Secrets and variables → Actions 里加同名条目即可。

### 根路径（自托管、Vercel、Netlify）

直接 `pnpm build`，把 `dist/` 丢上去。

### GitHub Pages 子路径

仓库 Settings → Pages → Source 选 **GitHub Actions** 即可，流水线已自动处理 `base` 和 `.nojekyll`。
本地想手动构建同样效果的包：

```bash
VITE_BASE=/你的仓库名/ pnpm build
```

### 预留的可选配置

变量（variables，非敏感）：

| 名称 | 作用 |
| --- | --- |
| `CUSTOM_DOMAIN` | 自定义域名，配了会在产物里写 `CNAME` |
| `SITE_URL` | 站点完整地址，构建期注入 `VITE_SITE_URL`，给 SEO / OG 用 |
| `DEPLOY_PORT` | 自托管 SSH 端口，默认 22 |

密钥（secrets，敏感）：

| 名称 | 作用 |
| --- | --- |
| `DEPLOY_HOST` | 自托管服务器地址 |
| `DEPLOY_USER` | SSH 用户名，默认 root |
| `DEPLOY_SSH_KEY` | SSH 私钥全文（PEM） |
| `DEPLOY_TARGET` | 服务器站点根目录，如 `/var/www/blog-page` |

自托管同步只在 `DEPLOY_SSH_KEY`、`DEPLOY_HOST`、`DEPLOY_TARGET` **三个都配齐**时才执行，用 rsync `--delete` 覆盖目标目录，请先确认路径写对。

### nginx 自托管

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## 关于路由模式

默认用 `HashRouter`（URL 形如 `/#/code/git-cheatsheet`），好处是丢到任何静态服务器都不会刷新 404。

想换成干净的 URL：把 `src/main.tsx` 里的 `HashRouter` 改成 `BrowserRouter`，同时确保服务器配了上面的 `try_files`。

## 内容加载、异常恢复与测试

代码文章是 Markdown + frontmatter，统一由 `MarkdownView` 渲染；旅行文章是 JSON 数据集，
统一由 `TripTemplate` 渲染。构建时只抽取元信息供列表和首页使用，正文通过非 eager 的
`import.meta.glob` 拆成独立 JS 资源块。进入文章（或栏目默认第一篇）时按需加载；列表 hover/focus
会提前预取，成功结果缓存在内存中。这里没有向后端文章 API 请求原始 Markdown/JSON。

两个栏目共用 `useAsyncContent` 处理加载状态：

- 下载失败显示「内容加载失败」，单次等待超过 15 秒显示「内容加载超时」。
- 错误面板提供「重新尝试」和「刷新页面」，保留列表和导航，允许切换文章。
- 切换、卸载、重试及超时后的旧响应不会覆盖当前文章；加载新文章时不显示上一篇正文。
- 无效地址仍显示 404；页面/模板资源下载失败或渲染异常由错误边界兜底，提供刷新入口。
- 重新尝试会再次调用正文加载器；若浏览器缓存了模块失败或部署后旧资源已失效，需要刷新页面。
- 缓存仅在当前页面内有效，不提供持久离线阅读；底层 `import()` 无法取消，超时只停止等待并忽略迟到结果。

使用 Vitest + Testing Library + jsdom（仅开发依赖），运行 `pnpm test`。用例覆盖 Markdown 的
GFM/高亮/链接、旅行模板八种小节/清单重置/章节导航，以及下载失败重试、超时、过期响应、
卸载清理、两个栏目错误 UI、404 和异步模块错误边界。这些是组件与加载行为测试，
另有主题持久化、系统跟随、存储受限、标签页同步和新增栏目通用卡片的测试。
不替代真实浏览器视觉与网络验证。测试文件不进入生产包；PR 检查见上文，部署触发条件保持不变。
