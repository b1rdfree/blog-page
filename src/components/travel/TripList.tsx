import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import type { TripMeta } from '../../lib/travel/types'

type Props = {
  section: string
  items: TripMeta[]
  activeSlug?: string
  /** hover / focus 时把数据集提前下载好，点开几乎不用等 */
  onPrefetch: (slug: string) => void
}

/** 参与搜索的所有文本；filters 里的维度也一并纳入，这样搜「成都」「3」都能命中 */
function haystackOf(item: TripMeta): string {
  const parts: string[] = [item.title, item.summary, ...item.chips, ...item.tags]

  for (const value of Object.values(item.filters)) {
    if (Array.isArray(value)) parts.push(...value.map(String))
    else if (typeof value === 'string' || typeof value === 'number') parts.push(String(value))
  }

  return parts.join(' ').toLowerCase()
}

function uniqueOf(items: TripMeta[], key: 'pace' | 'budget'): string[] {
  const set = new Set<string>()
  for (const item of items) {
    const value = item.filters[key]
    if (typeof value === 'string' && value) set.add(value)
  }
  return [...set]
}

export default function TripList({ section, items, activeSlug, onPrefetch }: Props) {
  const [query, setQuery] = useState('')
  const [pace, setPace] = useState('')
  const [budget, setBudget] = useState('')

  // 索引条目很小，但预先算好搜索串，敲键时只做 includes
  const haystacks = useMemo(
    () => new Map(items.map((item) => [item.slug, haystackOf(item)])),
    [items],
  )

  const paces = useMemo(() => uniqueOf(items, 'pace'), [items])
  const budgets = useMemo(() => uniqueOf(items, 'budget'), [items])

  const filtered = useMemo(() => {
    const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean)

    return items.filter((item) => {
      if (pace && item.filters.pace !== pace) return false
      if (budget && item.filters.budget !== budget) return false
      if (tokens.length === 0) return true

      const hay = haystacks.get(item.slug) ?? ''
      return tokens.every((token) => hay.includes(token))
    })
  }, [items, query, pace, budget, haystacks])

  if (items.length === 0) {
    return (
      <div className="doc-list-empty">
        <p>这个栏目还没有行程。</p>
        <p className="doc-list-empty-hint">
          在 <code>src/content/{section}/</code> 下新建一个 .json 数据集即可自动出现。
        </p>
      </div>
    )
  }

  const hasFacet = paces.length > 0 || budgets.length > 0

  return (
    <div className="trip-list">
      <div className="trip-search">
        <input
          type="search"
          className="trip-search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="搜目的地、标签、天数…"
          aria-label="搜索行程"
        />
        {query ? (
          <button type="button" className="trip-search-clear" onClick={() => setQuery('')} aria-label="清空搜索">
            ×
          </button>
        ) : null}
      </div>

      {hasFacet ? (
        <div className="trip-facets">
          {paces.length > 0 ? (
            <div className="trip-facet-row">
              <span className="trip-facet-label">节奏</span>
              {paces.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={pace === value ? 'trip-facet is-active' : 'trip-facet'}
                  onClick={() => setPace(pace === value ? '' : value)}
                >
                  {value}
                </button>
              ))}
            </div>
          ) : null}
          {budgets.length > 0 ? (
            <div className="trip-facet-row">
              <span className="trip-facet-label">预算</span>
              {budgets.map((value) => (
                <button
                  key={value}
                  type="button"
                  className={budget === value ? 'trip-facet is-active' : 'trip-facet'}
                  onClick={() => setBudget(budget === value ? '' : value)}
                >
                  {value}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <p className="trip-count">
        {filtered.length === items.length
          ? `共 ${items.length} 篇`
          : `筛出 ${filtered.length} / ${items.length} 篇`}
      </p>

      {filtered.length === 0 ? (
        <p className="trip-empty">没有匹配的行程，换个词试试。</p>
      ) : (
        <nav className="doc-list" aria-label="行程列表">
          {filtered.map((item) => (
            <NavLink
              key={item.slug}
              to={`/${section}/${item.slug}`}
              className={item.slug === activeSlug ? 'doc-item is-active' : 'doc-item'}
              onMouseEnter={() => onPrefetch(item.slug)}
              onFocus={() => onPrefetch(item.slug)}
            >
              <span className="doc-item-title">{item.title}</span>
              {item.summary ? <span className="doc-item-summary">{item.summary}</span> : null}
              {item.chips.length > 0 ? (
                <span className="trip-item-chips">
                  {item.chips.map((chip) => (
                    <span key={chip} className="trip-item-chip">
                      {chip}
                    </span>
                  ))}
                </span>
              ) : null}
              <span className="doc-item-meta">
                {item.updated ? <span>{item.updated}</span> : null}
                {item.tags.length > 0 ? (
                  <span className="doc-item-tags">{item.tags.join(' · ')}</span>
                ) : null}
              </span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
