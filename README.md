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
```

## 目录结构

```
src/
├── config/nav.ts        # 菜单配置（唯一扩展点）
├── lib/docs.ts          # 扫描 content 下的 md，解析 frontmatter
├── lib/travel/          # 旅游栏目：meta.ts 轻量索引 / dataset.ts 按需加载
├── layouts/MainLayout   # 顶部导航 + 内容区 + 页脚
├── components/
│   ├── NavBar           # 顶部菜单
│   ├── DocList          # 左侧文档列表
│   ├── MarkdownView     # 右侧 Markdown 渲染
│   └── travel/          # 旅游专用：TripList 搜索列表 + TripTemplate 行程模板
├── pages/
│   ├── Home             # 首页：栏目卡片 + 最近更新
│   ├── SectionPage      # 文档栏目页：左列表 + 右正文
│   ├── TravelSection    # 旅游栏目页：左搜索列表 + 右数据集模板
│   └── NotFound
└── content/             # 所有内容，按栏目分目录
    ├── code/            # .md 文档
    └── travel/          # .json 行程数据集
build/
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

> 别在这个目录放 `.md` 文件——`lib/docs.ts` 会把它当成一篇文档扫进「最近更新」。

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

## 全站统一深色背景

所有页面共用同一片背景：`src/components/SiteBackground.tsx` 固定在视口底层，
**挂在 `MainLayout` 而不是某个页面**，所以切路由时不卸载、canvas 只初始化一次。

内容层靠**玻璃拟态**保证可读性——底色不透明度是按信息密度分别定的：

| 区域 | 底色 | 说明 |
| --- | --- | --- |
| 侧栏 `.section-aside` | `rgba(11,8,18,.8)` | 列表字号小，透太多会和字符矩阵糊在一起 |
| 正文 `.section-content` | `rgba(11,8,18,.86)` | 面积大、停留久，再透就伤眼 |
| 空态 / 404 `.app-main > .empty-state` | `rgba(11,8,18,.75)` | 只有一两行字，可以多透一点 |

> **调这几个值时别手抖。** 0.5 左右字符矩阵会透上来和正文打架，
> 0.9 以上背景就白做了。0.8~0.86 是实测能兼顾「背景看得见」和「正文读得清」的区间。

早先的版本是「亮色底 + 淡紫极光」，实测极光在米色上几乎没有对比度、看不出在动；
中间试过「首页深色 / 文档页亮色」的双主题，结果切页像换了两个站——
所以现在是全站一套。`--ink/--line/--accent` 等变量统一定义在 `:root`，没有分主题覆盖。

## 动效从哪来

首页与文档页的动画全部来自 [React Bits](https://reactbits.dev)（**TS + CSS 变体**，
MIT + Commons Clause），源码拷贝在 `src/components/bits/`，参数按本站主题调过：

| 组件 | 用在哪 | 依赖 |
| --- | --- | --- |
| `Plasma` | 全站背景：紫青流动等离子（WebGL） | `ogl` |
| `LetterGlitch` | 全站背景叠加：字符乱码矩阵 | 无（canvas 2D） |
| `DecryptedText` | 首页标题逐字解码 | `motion` |
| `CountUp` | 首页统计数字滚动 | `motion` |
| `BorderGlow` | 首页栏目卡片：彩色网格边 + 鼠标锥形边缘光 | 无 |
| `ClickSpark` | 全局点击迸发火花 | 无 |
| `AnimatedContent` | 各区块入场 / 文档正文揭示 | `gsap` + ScrollTrigger |

`src/components/SiteBackground.tsx` 是背景层封装：先 `canvas.getContext('webgl')` 探测，
再给每层套错误边界，**不支持 WebGL 时退回纯 CSS 光晕**——否则 ogl 初始化抛错会把整棵
React 树带崩成白屏。

两个背景层都是 `lazy()` 加载，首屏先出文字，氛围层随后接管。调参入口：

- **Plasma**：`color` 控色相、`speed` 控流速、`scale` 越小纹理越细密、`opacity` 控强度；
  `renderScale` / `targetFps` / `iterations` 是性能档位（已从默认 0.55/60/60 降到 0.5/30/48）
- **LetterGlitch**：`glitchColors` 控字符颜色、`glitchSpeed` 是刷新间隔（越大越慢）。
  它默认会铺一层**不透明黑底**，叠加时必须传 `backgroundColor="transparent"`
- **LetterGlitch 的遮罩**在 `global.css` 的 `.site-glitch`：用 `mask-image` 把中心挖空，
  只在四周显现。不这么做满屏乱码会把标题糊掉

### 对上游源码的两处本地修复

`src/components/bits/LetterGlitch.tsx` 里标了 `【本地修复】`，同步上游时注意保留：

1. `drawLetters` 里上游用 `canvasRef.current!` 非空断言，卸载后 rAF 回调进来会抛
   `getBoundingClientRect of null`；
2. cleanup 漏了 `clearTimeout(resizeTimeout)`，导致「改变视口后立刻切路由」时，
   100ms 防抖回调会在已卸载的组件上执行。

## 按需加载

Vite 生产构建默认就做 tree-shaking，本项目在此之上手动控了三处：

**1. highlight.js 只注册用到的语言。** `MarkdownView.tsx` 里逐个 `import 'highlight.js/lib/languages/xxx'`
再交给 `rehype-highlight`，而不是 `import hljs from 'highlight.js'`——后者会把 190+ 种语言全打进包。

**2. 路由级懒加载。** 文档页是唯一依赖 react-markdown / highlight.js 的页面，`App.tsx` 里用
`lazy()` 拆出去，`MainLayout` 的 `<Outlet />` 外面套 `Suspense`（NavBar 常驻，只换内容区）。

**3. 背景层懒加载。** `SiteBackground.tsx` 里 `Plasma` 与 `LetterGlitch` 各自 `lazy()`。
因为挂载点是布局层，这两个 chunk 全站只请求一次，之后切页复用。

`vite.config.ts` 的 `codeSplitting.groups` 配合拆包，其中 `ogl` 单独成 `plasma` 组——
混进 `anim` 会被首页首屏一起 preload。

实测首屏 gzip：**约 151 KB**（react 53.7 + anim 84.2 + 入口 13.2）；
markdown 116.6 KB、ogl 12.9 KB 与背景层 4.3 KB 都改为按需下载：

| 页面 | 加载的 chunk |
| --- | --- |
| `/` | index + react + anim + Plasma + LetterGlitch + plasma(ogl) |
| `/#/code/xxx` | + SectionPage + markdown |
| `/#/travel/xxx` | + SectionPage + TravelSection + **该篇**数据集（1~3 KB） |

**旅游栏目的三层拆分**（行程从 3 篇涨到 300 篇，首屏也不受影响）：

1. **索引**：`build/travelIndexPlugin.ts` 在构建期扫描 `src/content/travel/*.json`，
   只抽 `meta` 生成虚拟模块 `virtual:travel-index`。左侧列表靠它搜索，
   体积恒定在几百字节，不随行程数增长。
2. **模板**：`TravelSection`（组件 + 9 KB CSS，gzip 2.2）由 `SectionPage` 按需 `lazy()`，
   不进旅游页就不下载。
3. **数据集**：`dataset.ts` 用**非 eager** 的 `import.meta.glob`，每份 `.json` 单独成 chunk，
   只有点开那一篇才下载；鼠标 hover 列表项时 `prefetchTrip()` 会提前取，点开基本零等待。

> 新增依赖后建议跑一次 `pnpm build` 看产物表，确认没有东西意外落回首屏。

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
