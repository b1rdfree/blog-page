/**
 * 站点菜单配置 —— 这是唯一的扩展点。
 *
 * 新增一个栏目只需要两步：
 *   1. 在下面的数组里加一项（key 同时是路由地址和 content 目录名）
 *   2. 在 src/content/<key>/ 下放 .md 文件
 * 路由、侧边列表、首页卡片都会自动出现，不需要改任何组件。
 */
export type NavItem = {
  /** 栏目标识：同时用作路由路径与 src/content 下的目录名 */
  key: string
  /** 菜单显示名 */
  label: string
  /** 一句话说明，展示在首页卡片上 */
  desc: string
  /** 可选：菜单右上角小标记 */
  badge?: string
  /**
   * 栏目用哪套渲染器：
   * - 缺省 / 'docs'：src/content/<key>/*.md，走 Markdown 文档阅读器
   * - 'travel'：src/content/<key>/*.json 数据集，走可搜索列表 + 行程模板
   */
  renderer?: 'docs' | 'travel'
}

export const HOME_KEY = 'home'

export const navItems: NavItem[] = [
  {
    key: HOME_KEY,
    label: '首页',
    desc: '站点总览与最近更新',
  },
  {
    key: 'code',
    label: '代码',
    desc: '开发笔记、配置片段与踩坑记录',
  },
  {
    key: 'travel',
    label: '旅游',
    desc: '行程方案、路线与实用信息',
    renderer: 'travel',
  },
  // 以后新增栏目，照着上面加就行，例如：
  // { key: 'smart-home', label: '智能家居', desc: 'Home Assistant 与设备接入' },
]

/** 除首页外、真正承载文档的栏目 */
export const sectionItems = navItems.filter((item) => item.key !== HOME_KEY)

export const sectionKeys = sectionItems.map((item) => item.key)

export function getNavItem(key: string): NavItem | undefined {
  return navItems.find((item) => item.key === key)
}

export function isSectionKey(key: string): boolean {
  return sectionKeys.includes(key)
}
