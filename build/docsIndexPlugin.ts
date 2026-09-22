/**
 * Docs index plugin.
 *
 * Background: the docs section used to eager-load all .md bodies into memory,
 * which bloats first-screen size as docs grow. This mirrors the travel section
 * three-layer split: at build time only frontmatter is extracted into a light
 * index; bodies are dynamically imported on click (see src/lib/docs/content.ts).
 *
 * Scans every section directory under the content root for .md files at build
 * time / dev server start, parses only frontmatter (title/date/order/tags/
 * summary), and emits the virtual module virtual:docs-index.
 */
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'

const VIRTUAL_ID = 'virtual:docs-index'
// \0 prefix is the Rollup/Vite convention for "this module does not exist on disk"
const RESOLVED_ID = '\0' + VIRTUAL_ID

/** Only fields needed for list rendering, search, and home stats -- never the body */
type IndexEntry = {
  section: string
  slug: string
  title: string
  summary: string
  date: string
  tags: string[]
  order: number
}

/** Minimal frontmatter parser, kept in sync with src/lib/docs/content.ts */
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

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === 'string') : []
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
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

/** Scan every section subdirectory under the content root for .md files */
function scan(contentRoot: string): IndexEntry[] {
  if (!fs.existsSync(contentRoot)) return []

  const entries: IndexEntry[] = []
  for (const section of fs.readdirSync(contentRoot)) {
    const sectionDir = path.join(contentRoot, section)
    if (!fs.statSync(sectionDir).isDirectory()) continue

    for (const file of fs.readdirSync(sectionDir)) {
      if (!file.endsWith('.md')) continue
      const slug = file.replace(/\.md$/, '')
      const filePath = path.join(sectionDir, file)

      try {
        const raw = fs.readFileSync(filePath, 'utf8')
        const { data, body } = parseFrontmatter(raw)
        entries.push({
          section,
          slug,
          title: asString(data.title, toTitle(body, slug)),
          summary: toSummary(body, data.summary),
          date: asString(data.date),
          tags: asStringArray(data.tags),
          order: asNumber(data.order, 999),
        })
      } catch {
        // One bad file must not break the whole build: skip it, keep going
        console.warn(`[docs-index] failed to read ${section}/${file}, skipped`)
      }
    }
  }
  return entries
}

export function docsIndexPlugin(contentRoot: string): Plugin {
  let server: ViteDevServer | undefined

  function invalidate(file?: string) {
    if (file && !file.endsWith('.md')) return
    if (!server) return

    const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
    if (mod) server.moduleGraph.invalidateModule(mod)
    // Index drives the list and home stats; full-reload is safest (dev only)
    server.ws.send({ type: 'full-reload' })
  }

  return {
    name: 'docs-index',

    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null
    },

    load(id) {
      if (id !== RESOLVED_ID) return null

      const entries = scan(contentRoot)
      return [
        '// Generated by build/docsIndexPlugin.ts at build time; do not edit',
        `export const docsIndex = ${JSON.stringify(entries, null, 2)}`,
        'export default docsIndex',
      ].join('\n')
    },

    configureServer(devServer) {
      server = devServer
      server.watcher.add(contentRoot)
      server.watcher.on('add', invalidate)
      server.watcher.on('change', invalidate)
      server.watcher.on('unlink', invalidate)
    },
  }
}