import { lazy, Suspense, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import AnimatedContent from '../components/bits/AnimatedContent'
import { getNavItem, isSectionKey } from '../config/nav'
import { getDocMeta, getSectionDocs } from '../lib/docs/meta'
import { prefetchDoc } from '../lib/docs/content'
import { useDoc } from '../lib/docs/useDoc'
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
      <Suspense fallback={<div className="route-loading">LOADING…</div>}>
        <TravelSection section={section} slug={slug} />
      </Suspense>
    )
  }

  return (
    <DocsSection
      section={section}
      slug={slug}
      navLabel={navItem?.label ?? section}
      navDesc={navItem?.desc}
    />
  )
}

function DocsSection({
  section,
  slug,
  navLabel,
  navDesc,
}: {
  section: string
  slug: string | undefined
  navLabel: string
  navDesc?: string
}) {
  const docs = getSectionDocs(section)
  // 没带 slug 时默认打开第一篇
  const activeMeta = slug ? getDocMeta(section, slug) : docs[0]

  // 正文按需加载：meta 在构建期就有，hook 只负责把它对应的那份 .md 动态 import 进来
  const { doc, loading, missing } = useDoc(activeMeta)

  // 切换文档后回到顶部，否则会停在上一篇的滚动位置
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [section, slug])

  // 指定了 slug 但 meta 里查不到 = 地址写错；或 .md 文件被删了 → 走 404
  if ((slug && !activeMeta) || missing) return <NotFound />

  return (
    <div className="section-page">
      <aside className="section-aside">
        <div className="section-aside-head">
          <h2 className="section-aside-title">
            <span className="section-aside-prompt" aria-hidden="true">
              //
            </span>
            {navLabel}
          </h2>
          {navDesc ? <p className="section-aside-desc">{navDesc}</p> : null}
        </div>
        <DocList
          section={section}
          docs={docs}
          activeSlug={activeMeta?.slug}
          onPrefetch={prefetchDoc}
        />
      </aside>

      <section className="section-content">
        {doc ? (
          <AnimatedContent distance={22} duration={0.55} className="section-content-inner">
            <MarkdownView content={doc.content} />
          </AnimatedContent>
        ) : loading ? (
          <div className="route-loading">LOADING…</div>
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