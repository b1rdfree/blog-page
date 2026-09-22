/**
 * Doc metadata layer -- touches only the build-time lightweight index, no body loading.
 *
 * Split into its own file: the home page stats and the section list need only meta.
 * If they imported content.ts they would pull the whole import.meta.glob loader table
 * into their chunk. The home page needs only a few hundred bytes of meta from here.
 */
import { docsIndex } from 'virtual:docs-index'
import type { DocMeta } from './types'

function compare(a: DocMeta, b: DocMeta): number {
  if (a.order !== b.order) return a.order - b.order
  if (a.date !== b.date) return a.date < b.date ? 1 : -1
  return a.title.localeCompare(b.title, 'zh-CN')
}

/** All doc metadata (build-time generated, no body) */
export const allDocs: DocMeta[] = [...docsIndex].sort(compare)

/** Docs meta in a section, sorted by order, then date, then title */
export function getSectionDocs(section: string): DocMeta[] {
  return allDocs
    .filter((doc) => doc.section === section)
    .sort(compare)
}

/** Single doc meta */
export function getDocMeta(section: string, slug: string): DocMeta | undefined {
  return allDocs.find((doc) => doc.section === section && doc.slug === slug)
}

export function countDocs(section: string): number {
  return allDocs.filter((doc) => doc.section === section).length
}

export type RecentEntry = {
  section: string
  slug: string
  title: string
  date: string
}

/** For the home "recent updates" list: top n by date desc */
export function getRecentDocs(limit = 6): RecentEntry[] {
  return [...allDocs]
    .filter((doc) => doc.date)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, limit)
    .map((doc) => ({ section: doc.section, slug: doc.slug, title: doc.title, date: doc.date }))
}