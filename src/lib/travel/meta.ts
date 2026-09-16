/**
 * 旅行数据集的「元数据层」——只碰构建期生成的轻量索引，不含任何正文加载逻辑。
 *
 * 单独拆一个文件的原因：首页「最近更新」也要列旅行文章，如果它引了 dataset.ts，
 * 就会把整张 import.meta.glob 加载表拖进首页 chunk。首页只需要这里的几十字节 meta。
 */
import { travelIndex } from 'virtual:travel-index'
import type { TripMeta } from './types'

function compare(a: TripMeta, b: TripMeta): number {
  if (a.order !== b.order) return a.order - b.order
  if (a.updated !== b.updated) return a.updated < b.updated ? 1 : -1
  return a.title.localeCompare(b.title, 'zh-CN')
}

/** 列表数据：order 升序 → 更新时间倒序 → 标题 */
export const travelMeta: TripMeta[] = [...travelIndex].sort(compare)

export function getTripMeta(slug: string): TripMeta | undefined {
  return travelMeta.find((item) => item.slug === slug)
}

export type RecentEntry = { section: string; slug: string; title: string; date: string }

/** 首页「最近更新」用：把旅行数据集摊平成和文档一样的条目 */
export function getRecentTrips(): RecentEntry[] {
  return travelMeta
    .filter((item) => item.updated)
    .map((item) => ({ section: 'travel', slug: item.slug, title: item.title, date: item.updated }))
}
