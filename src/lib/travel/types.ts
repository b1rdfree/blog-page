/**
 * 旅行数据集的结构定义。
 *
 * 设计原则：
 * 1. **一份行程 = 一个 .json 文件**，放在 src/content/travel/ 下，
 *    文件名（去掉 .json）就是路由上的 slug。丢进去即生效，无需注册。
 * 2. **meta 与正文分离**：meta 会被构建期抽成轻量索引供左侧列表搜索，
 *    正文 sections 只在点开该篇时才动态加载。所以 meta 里别写长文。
 * 3. **sections 是联合类型**：每个 section 的 type 对应模板里的一个模块，
 *    新增模块类型只需在这里加一支 + TripTemplate 里加一个 case。
 */

/** 结论卡语气：key=关键 / good=推荐 / warn=注意 / bad=劝退 */
export type ConclusionTone = 'key' | 'good' | 'warn' | 'bad'

/** 时间轴行尾的小徽标：yes=推荐 / no=不推荐 / mid=看情况 */
export type PillTone = 'yes' | 'no' | 'mid'

/** 提示框语气：tip=建议 / danger=避坑 / note=补充说明 */
export type CalloutTone = 'tip' | 'danger' | 'note'

/** 可选的筛选维度，自由扩展；未定义的不参与筛选 UI */
export type TripFilters = {
  /** 行程天数 */
  days?: number
  /** 预算档位：经济 / 舒适 / 品质 */
  budget?: string
  /** 节奏：休闲 / 紧凑 */
  pace?: string
  /** 主题：自然山水 / 户外徒步 / 城市溜街 / 历史人文 / 博物馆 / 度假娱乐 / 寻味美食 */
  themes?: string[]
  /** 出发地 */
  from?: string
  /** 目的地 */
  to?: string[]
  /** 将来加新维度直接往这里加，不影响既有数据集 */
  [key: string]: unknown
}

/** 列表条目（构建期生成，见 build/travelIndexPlugin.ts） */
export type TripMeta = {
  slug: string
  title: string
  /** 一句话摘要，会显示在列表和页头 */
  summary: string
  /** 页头的小胶囊：如「6天5晚」「成都出发」 */
  chips: string[]
  /** 参与搜索的标签 */
  tags: string[]
  /** 排序权重，越小越靠前 */
  order: number
  /** 更新日期 YYYY-MM-DD */
  updated: string
  filters: TripFilters
}

export type ConclusionItem = {
  tone: ConclusionTone
  title: string
  desc: string
  /** 可选：跳到本文档另一个小节，anchor 填 section 的 id */
  link?: { text: string; anchor: string }
}

export type TableRow = {
  cells: string[]
  /** 高亮整行（参考页里的 .hl） */
  highlight?: boolean
}

export type DayItem = {
  time?: string
  title: string
  desc?: string
  pill?: { text: string; tone: PillTone }
}

export type TripDay = {
  /** 如「Day 1」 */
  label: string
  /** 右上角主题标签，如「抵达 · 免税城踩点」 */
  tag?: string
  /** 当天花费，如「人均 ¥260」 */
  cost?: string
  items: DayItem[]
}

/** 所有小节共有字段 */
type SectionBase = {
  title: string
  /** 顶部导航里显示的短名，缺省用 title 去掉序号后的部分 */
  navLabel?: string
  /** 标题下的一句话引言 */
  lead?: string
}

export type TripSection =
  /** 结论卡网格：开头「先看这几条」 */
  | (SectionBase & {
      type: 'conclusions'
      items: ConclusionItem[]
    })
  /** 对比表格，可高亮行 */
  | (SectionBase & {
      type: 'table'
      columns?: string[]
      rows: TableRow[]
      footnote?: string
    })
  /** 逐日时间轴 */
  | (SectionBase & {
      type: 'days'
      days: TripDay[]
    })
  /** 分组清单（可勾选） */
  | (SectionBase & {
      type: 'checklist'
      groups: { title: string; items: string[] }[]
    })
  /** 提示 / 避坑框 */
  | (SectionBase & { type: 'callout'; tone: CalloutTone; items: string[] })
  /** 卡片网格 */
  | (SectionBase & {
      type: 'cards'
      columns?: 2 | 3
      items: { title: string; desc: string; tag?: string }[]
    })
  /** 数字速览 */
  | (SectionBase & { type: 'stats'; items: { value: string; label: string }[] })
  /** 纯文字段落 */
  | (SectionBase & { type: 'prose'; paragraphs: string[] })

export type TripDataset = {
  /** 结构版本，将来做破坏性升级时用来兼容 */
  version: 1
  /** slug 不写在文件里，由文件名决定 */
  meta: Omit<TripMeta, 'slug'>
  sections: TripSection[]
}
