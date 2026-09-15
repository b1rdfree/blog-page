import { useParams } from 'react-router-dom'
import { getNavItem, isSectionKey } from '../config/nav'
import { getDoc, getSectionDocs } from '../lib/docs'
import DocList from '../components/DocList'
import MarkdownView from '../components/MarkdownView'
import NotFound from './NotFound'

export default function SectionPage() {
  const { section = '', slug } = useParams()

  if (!isSectionKey(section)) return <NotFound />

  const navItem = getNavItem(section)
  const docs = getSectionDocs(section)
  const active = slug ? getDoc(section, slug) : docs[0]

  return (
    <div className="section-page">
      <aside className="section-aside">
        <div className="section-aside-head">
          <h2 className="section-aside-title">{navItem?.label ?? section}</h2>
          {navItem?.desc ? <p className="section-aside-desc">{navItem.desc}</p> : null}
        </div>
        <DocList section={section} docs={docs} activeSlug={active?.slug} />
      </aside>

      <section className="section-content">
        {active ? (
          <MarkdownView content={active.content} />
        ) : (
          <div className="empty-state">
            <h2>还没有内容</h2>
            <p>
              把 .md 文件放到 <code>src/content/{section}/</code> 目录下就会自动出现在这里。
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
