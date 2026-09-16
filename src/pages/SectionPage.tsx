import { lazy, Suspense } from 'react'
import { useParams } from 'react-router-dom'
import AnimatedContent from '../components/bits/AnimatedContent'
import { getNavItem, isSectionKey } from '../config/nav'
import { getDoc, getSectionDocs } from '../lib/docs'
import DocList from '../components/DocList'
import MarkdownView from '../components/MarkdownView'
import NotFound from './NotFound'

// 旅游栏目用「数据集 + 行程模板」渲染，只在真的进旅游页时才下载这块代码
const TravelSection = lazy(() => import('./TravelSection'))

export default function SectionPage() {
  const { section = '', slug } = useParams()

  if (!isSectionKey(section)) return <NotFound />

  const navItem = getNavItem(section)

  if (navItem?.renderer === 'travel') {
    return (
      <Suspense fallback={<div className="route-loading">加载中…</div>}>
        <TravelSection section={section} slug={slug} />
      </Suspense>
    )
  }

  const docs = getSectionDocs(section)
  const active = slug ? getDoc(section, slug) : docs[0]

  // 指定了文档却找不到，说明地址是错的，走 404 而不是「还没有内容」
  if (slug && !active) return <NotFound />

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
          <AnimatedContent distance={22} duration={0.55} className="section-content-inner">
            <MarkdownView content={active.content} />
          </AnimatedContent>
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
