/**
 * 旅行数据集索引插件。
 *
 * 背景：旅游栏目左侧要能「搜索全部行程」，但如果要搜索就把 N 份完整数据集
 * 都打进首屏，行程一多（几十上百份）首屏就炸了。
 *
 * 做法：在**构建期 / dev server 启动时**扫描 src/content/travel/*.json，
 * 只抽每个文件的 meta 字段，生成一个极小的虚拟模块 `virtual:travel-index`；
 * 完整数据集仍然走运行时动态 import —— 点哪篇才下载哪篇。
 *
 * 对使用者的收益：新增行程 = 往目录里丢一个 .json，索引和列表自动更新，
 * 首屏体积不随行程数增长（只多了几十字节的一条 meta）。
 */
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin, ViteDevServer } from 'vite'

const VIRTUAL_ID = 'virtual:travel-index'
/** \0 前缀是 Rollup/Vite 约定，标记「这个模块不存在于磁盘」 */
const RESOLVED_ID = '\0' + VIRTUAL_ID

/** 索引里放哪些字段：只放列表渲染 + 搜索必要的，切勿往这里塞正文 */
type IndexEntry = {
  slug: string
  title: string
  summary: string
  chips: string[]
  tags: string[]
  order: number
  updated: string
  filters: Record<string, unknown>
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

export function travelIndexPlugin(contentDir: string): Plugin {
  let server: ViteDevServer | undefined

  function scan(): IndexEntry[] {
    if (!fs.existsSync(contentDir)) return []

    return fs
      .readdirSync(contentDir)
      .filter((file) => file.endsWith('.json'))
      .map((file) => {
        const slug = file.replace(/\.json$/, '')
        try {
          const raw = JSON.parse(fs.readFileSync(path.join(contentDir, file), 'utf8')) as {
            meta?: Record<string, unknown>
          }
          const meta = raw?.meta ?? {}

          return {
            slug,
            title: asString(meta.title, slug),
            summary: asString(meta.summary),
            chips: asStringArray(meta.chips),
            tags: asStringArray(meta.tags),
            order: asNumber(meta.order, 999),
            updated: asString(meta.updated),
            filters:
              meta.filters && typeof meta.filters === 'object'
                ? (meta.filters as Record<string, unknown>)
                : {},
          }
        } catch {
          // 单份数据集写坏了不能拖垮整站构建：跳过它，其余照常
          console.warn(`[travel-index] 数据集 ${file} 不是合法 JSON，已跳过`)
          return null
        }
      })
      .filter((entry): entry is IndexEntry => entry !== null)
  }

  /** 数据集文件变动时让虚拟模块失效，dev 下改 json 能立刻看到 */
  function invalidate(file?: string) {
    if (file && !file.endsWith('.json')) return
    if (!server) return

    const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
    if (mod) server.moduleGraph.invalidateModule(mod)
    // 索引影响列表，直接整页刷新最稳；dev 专有，不影响产物
    server.ws.send({ type: 'full-reload' })
  }

  return {
    name: 'travel-index',

    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null
    },

    load(id) {
      if (id !== RESOLVED_ID) return null

      const entries = scan()
      return [
        '// 由 build/travelIndexPlugin.ts 在构建期生成，请勿手改',
        `export const travelIndex = ${JSON.stringify(entries, null, 2)}`,
        'export default travelIndex',
      ].join('\n')
    },

    configureServer(devServer) {
      server = devServer
      server.watcher.add(contentDir)
      server.watcher.on('add', invalidate)
      server.watcher.on('change', invalidate)
      server.watcher.on('unlink', invalidate)
    },
  }
}
