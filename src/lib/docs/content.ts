/**
 * Doc body loading layer.
 *
 * import.meta.glob is non-eager: Vite emits one chunk per .md and only
 * downloads it when import() runs. So docs going from 3 to 300 does not
 * grow first-screen size.
 *
 * The glob returns raw .md (with frontmatter); here we strip frontmatter at
 * runtime and return only the body. Meta already comes from the build-time
 * index, so it is not re-parsed here.
 */
import type { Doc, DocMeta } from './types'

/** Minimal frontmatter strip, kept in sync with build/docsIndexPlugin.ts */
function stripFrontmatter(raw: string): string {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(raw)
  return match ? raw.slice(match[0].length) : raw
}

/** Values are () => Promise<string> (raw .md), invoked on demand */
const loaders = import.meta.glob<string>('../../content/*/*.md', {
  query: '?raw',
  import: 'default',
})

/** Cached bodies stay in memory so toggling between docs does not re-fetch */
const cache = new Map<string, string>()

/** Relative path prefix matching the glob pattern */
const GLOB_PREFIX = '../../content'

function keyOf(section: string, slug: string): string {
  return `${GLOB_PREFIX}/${section}/${slug}.md`
}

function loaderOf(section: string, slug: string) {
  return loaders[keyOf(section, slug)]
}

/** Prefetch on list-item hover/focus so the body is ready before the click */
export function prefetchDoc(section: string, slug: string): void {
  const key = keyOf(section, slug)
  if (cache.has(key)) return
  const load = loaderOf(section, slug)
  if (!load) return
  void load()
    .then((raw) => cache.set(key, stripFrontmatter(raw)))
    .catch(() => {
      /* prefetch failure is fine; the real click retries */
    })
}

/**
 * Load one doc body on demand, merged with its meta into a full Doc.
 * Returns null when the file is missing (bad URL or file deleted).
 */
export async function loadDoc(meta: DocMeta): Promise<Doc | null> {
  const key = keyOf(meta.section, meta.slug)
  const hit = cache.get(key)
  if (hit !== undefined) return { ...meta, content: hit }

  const load = loaderOf(meta.section, meta.slug)
  if (!load) return null

  const raw = await load()
  const content = stripFrontmatter(raw)
  cache.set(key, content)
  return { ...meta, content }
}
