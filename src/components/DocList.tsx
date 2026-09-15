import { NavLink } from 'react-router-dom'
import type { Doc } from '../lib/docs'

type Props = {
  section: string
  docs: Doc[]
  activeSlug?: string
}

export default function DocList({ section, docs, activeSlug }: Props) {
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

  return (
    <nav className="doc-list" aria-label="文档列表">
      {docs.map((doc) => (
        <NavLink
          key={doc.slug}
          to={`/${section}/${doc.slug}`}
          className={({ isActive }) =>
            isActive || doc.slug === activeSlug ? 'doc-item is-active' : 'doc-item'
          }
        >
          <span className="doc-item-title">{doc.title}</span>
          {doc.summary ? <span className="doc-item-summary">{doc.summary}</span> : null}
          <span className="doc-item-meta">
            {doc.date ? <span>{doc.date}</span> : null}
            {doc.tags.length > 0 ? (
              <span className="doc-item-tags">{doc.tags.join(' · ')}</span>
            ) : null}
          </span>
        </NavLink>
      ))}
    </nav>
  )
}
