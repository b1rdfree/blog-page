/**
 * 文档加载层。
 *
 * 所有 src/content/<栏目>/*.md 会在构建时被 Vite 静态扫描进来（import.meta.glob），
 * 因此新增文档只需丢一个 .md 文件进对应目录，无需注册、无需重启配置。
 */

export type Doc = {
  /** 所属栏目，等于 config/nav.ts 里的 key */
  section: string
  /** 文档标识，等于文件名（不含 .md） */
  slug: string
  title: string
  summary: string
  date: string
  tags: string[]
  /** 排序权重，越小越靠前 */
  order: number
  /** 去掉 frontmatter 后的正文 */
  content: string
}

const modules = import.meta.glob<string>('../content/*/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
})

/** 解析极简 frontmatter，只支持 key: value 与数组，避免引入 YAML/Buffer 依赖 */
function parseFrontmatter(raw: string): { data: Record<string, unknown>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  if (!match) return { data: {}, body: raw }

  const data: Record<string, unknown> = {}
  for (const line of match[1].split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf(':')
    if (index === -1) continue

    const key = trimmed.slice(0, index).trim()
    let value: unknown = trimmed.slice(index + 1).trim()

    if (typeof value === 'string') {
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value
          .slice(1, -1)
          .split(',')
          .map((item) => item.trim().replace(/^["']|["']$/g, ''))
          .filter(Boolean)
      } else if (/^\d+$/.test(value)) {
        value = Number(value)
      } else {
        value = value.replace(/^["']|["']$/g, '')
      }
    }
    if (key) data[key] = value
  }

  return { data, body: raw.slice(match[0].length) }
}

function toTitle(body: string, fallback: string): string {
  const heading = /^#\s+(.+)$/m.exec(body)
  return heading ? heading[1].trim() : fallback
}

function toSummary(body: string, explicit?: unknown): string {
  if (typeof explicit === 'string' && explicit.trim()) return explicit.trim()
  const firstParagraph = body
    .split(/\r?\n/)
    .find((line) => line.trim() && !line.trim().startsWith('#') && !line.trim().startsWith('```'))
  return firstParagraph ? firstParagraph.trim().slice(0, 80) : ''
}

function buildDoc(path: string, raw: string): Doc {
  const matched = /content\/([^/]+)\/(.+)\.md$/.exec(path)
  const section = matched ? matched[1] : 'misc'
  const slug = matched ? matched[2] : path

  const { data, body } = parseFrontmatter(raw)

  return {
    section,
    slug,
    title: typeof data.title === 'string' && data.title ? data.title : toTitle(body, slug),
    summary: toSummary(body, data.summary),
    date: typeof data.date === 'string' ? data.date : '',
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    order: typeof data.order === 'number' ? data.order : 999,
    content: body,
  }
}

export const allDocs: Doc[] = Object.entries(modules).map(([path, raw]) => buildDoc(path, raw))

export function getSectionDocs(section: string): Doc[] {
  return allDocs
    .filter((doc) => doc.section === section)
    .sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order
      if (a.date !== b.date) return a.date < b.date ? 1 : -1
      return a.title.localeCompare(b.title, 'zh-CN')
    })
}

export function getDoc(section: string, slug: string): Doc | undefined {
  return allDocs.find((doc) => doc.section === section && doc.slug === slug)
}

/** 首页「最近更新」用：按日期倒序取前 n 篇 */
export function getRecentDocs(limit = 6): Doc[] {
  return [...allDocs]
    .filter((doc) => doc.date)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, limit)
}

export function countDocs(section: string): number {
  return allDocs.filter((doc) => doc.section === section).length
}
