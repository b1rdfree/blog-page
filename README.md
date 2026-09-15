# Nonight Hub

Vite + React + TypeScript 搭的个人内容工作台。顶部菜单进栏目，左边挑文档，右边渲染 Markdown。

## 快速开始

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 类型检查 + 打包到 dist/
npm run preview  # 本地预览打包结果
```

## 目录结构

```
src/
├── config/nav.ts        # 菜单配置（唯一扩展点）
├── lib/docs.ts          # 扫描 content 下的 md，解析 frontmatter
├── layouts/MainLayout   # 顶部导航 + 内容区 + 页脚
├── components/
│   ├── NavBar           # 顶部菜单
│   ├── DocList          # 左侧文档列表
│   └── MarkdownView     # 右侧 Markdown 渲染
├── pages/
│   ├── Home             # 首页：栏目卡片 + 最近更新
│   ├── SectionPage      # 栏目页：左列表 + 右正文
│   └── NotFound
└── content/             # 所有文档，按栏目分目录
    ├── code/
    └── travel/
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

## 加一个栏目

两步，不用碰组件代码：

1. 在 `src/config/nav.ts` 的 `navItems` 里加一项，`key` 同时决定路由和目录名：

   ```ts
   { key: 'smart-home', label: '智能家居', desc: 'Home Assistant 与设备接入' },
   ```

2. 建目录 `src/content/smart-home/`，往里放 `.md`

路由、左侧列表、首页卡片会自动出现。

## 部署

### 根路径（自托管、Vercel、Netlify）

直接 `npm run build`，把 `dist/` 丢上去。

### GitHub Pages 子路径

仓库 Settings → Pages → Source 选 **GitHub Actions**，然后：

```bash
VITE_BASE=/你的仓库名/ npm run build
```

仓库里已经带了 `.github/workflows/deploy.yml`，推到 `main` 分支会自动构建部署，其中已经处理了 `base` 和 `.nojekyll`。

### nginx 自托管

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

## 关于路由模式

默认用 `HashRouter`（URL 形如 `/#/code/git-cheatsheet`），好处是丢到任何静态服务器都不会刷新 404。

想换成干净的 URL：把 `src/main.tsx` 里的 `HashRouter` 改成 `BrowserRouter`，同时确保服务器配了上面的 `try_files`。
