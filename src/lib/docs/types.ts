/** Doc metadata (build-time generated, no body). See build/docsIndexPlugin.ts */
export type DocMeta = {
  /** Section key, matching config/nav.ts */
  section: string
  /** Doc id, equals filename without .md */
  slug: string
  title: string
  summary: string
  date: string
  tags: string[]
  /** Sort weight, lower comes first */
  order: number
}

/** Full doc at runtime = meta + body */
export type Doc = DocMeta & {
  /** Body with frontmatter stripped */
  content: string
}