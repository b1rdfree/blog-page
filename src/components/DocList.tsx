import { useEffect, useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import type { Doc } from '../lib/docs'

type Props = {
  section: string
  docs: Doc[]
  activeSlug?: string
  /** 少于这个篇数就不显示搜索框，省得只有两三篇时还占一行 */
  searchThreshold?: number
}

/**
 * 参与搜索的文本。
 * 正文 content 已经在内存里（构建期 eager 导入），拿它一起做匹配不额外花代价，
 * 但搜索体验差别很大——在代码栏目里可以直接搜 `docker run` 这样的片段。
 */
function haystackOf(doc: Doc): string {
  return [doc.title, doc.summary, doc.slug, doc.tags.join(' '), doc.content]
    .join('\n')
    .toLowerCase()
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** 把命中的关键词包成 <mark>，split 带捕获组时奇数下标就是匹配段 */
function Highlight({ text, tokens }: { text: string; tokens: string[] }) {
  if (tokens.length === 0) return <>{text}</>

  const parts = text.split(new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi'))

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark key={index} className="doc-mark">
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  )
}

export default function DocList({
  section,
  docs,
  activeSlug,
  searchThreshold = 3,
}: Props) {
  const [query, setQuery] = useState('')

  // 换栏目时清掉关键词，否则会带着上一个栏目的词进入新列表
  useEffect(() => setQuery(''), [section])

  // 篇数不多，但预先拼好搜索串，敲键时只做 includes
  const haystacks = useMemo(
    () => new Map(docs.map((doc) => [doc.slug, haystackOf(doc)])),
    [docs],
  )

  const tokens = useMemo(
    () => query.trim().toLowerCase().split(/\s+/).filter(Boolean),
    [query],
  )

  const filtered = useMemo(() => {
    if (tokens.length === 0) return docs
    return docs.filter((doc) => {
      const hay = haystacks.get(doc.slug) ?? ''
      return tokens.every((token) => hay.includes(token))
    })
  }, [docs, tokens, haystacks])

  if (docs.length === 0) {
    return (
      <div className="doc-list-empty">
        <p>这个栏目还没有文档。</p>
        <p className="doc-list-empty-hint">
          在 <code>src/content/{section}/</code> 下新建一个 .md 文件即可自动出现。
        </p>
      </div>
    )
  }

  const showSearch = docs.length >= searchThreshold

  return (
    <div className="doc-list-wrap">
      {showSearch ? (
        <div className="doc-search">
          <input
            type="search"
            className="doc-search-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setQuery('')
            }}
            placeholder="搜标题、标签、正文…"
            aria-label={`搜索${section}栏目文档`}
          />
          {query ? (
            <button
              type="button"
              className="doc-search-clear"
              onClick={() => setQuery('')}
              aria-label="清空搜索"
            >
              ×
            </button>
          ) : null}
        </div>
      ) : null}

      {showSearch ? (
        <p className="doc-search-count">
          {filtered.length === docs.length
            ? `共 ${docs.length} 篇`
            : `筛出 ${filtered.length} / ${docs.length} 篇`}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <p className="doc-search-empty">没有匹配的文档，换个词试试。</p>
      ) : (
        <nav className="doc-list" aria-label="文档列表">
          {filtered.map((doc) => (
            <NavLink
              key={doc.slug}
              to={`/${section}/${doc.slug}`}
              className={({ isActive }) =>
                isActive || doc.slug === activeSlug ? 'doc-item is-active' : 'doc-item'
              }
            >
              <span className="doc-item-title">
                <Highlight text={doc.title} tokens={tokens} />
              </span>
              {doc.summary ? (
                <span className="doc-item-summary">
                  <Highlight text={doc.summary} tokens={tokens} />
                </span>
              ) : null}
              <span className="doc-item-meta">
                {doc.date ? <span>{doc.date}</span> : null}
                {doc.tags.length > 0 ? (
                  <span className="doc-item-tags">{doc.tags.join(' · ')}</span>
                ) : null}
              </span>
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}
