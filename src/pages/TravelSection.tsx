import { useEffect } from 'react'
import { getNavItem } from '../config/nav'
import TripList from '../components/travel/TripList'
import TripTemplate from '../components/travel/TripTemplate'
import { prefetchTrip } from '../lib/travel/dataset'
import { getTripMeta, travelMeta } from '../lib/travel/meta'
import { useTrip } from '../lib/travel/useTrip'
import NotFound from './NotFound'

// 样式随本页一起异步加载，不进首屏 CSS
import '../components/travel/travel.css'

type Props = {
  section: string
  slug?: string
}

/**
 * 旅游栏目页：左侧可搜索列表，右侧把数据集灌进仿写的行程模板。
 *
 * 这一整块（含模板组件与样式）是被 SectionPage 按需 lazy 出来的独立 chunk，
 * 不进首页首屏；每份数据集又在点击时才单独下载，见 lib/travel/index.ts。
 */
export default function TravelSection({ section, slug }: Props) {
  const navItem = getNavItem(section)
  const items = travelMeta

  // 没带 slug 时默认打开第一篇
  const activeSlug = slug ?? items[0]?.slug
  const { data, loading, missing } = useTrip(activeSlug)

  // 切换行程后回到顶部，否则会停在上一条行程的滚动位置
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [activeSlug])

  // 地址里写了不存在的 slug：走 404，而不是「还没有内容」
  if (slug && !getTripMeta(slug)) return <NotFound />
  if (missing) return <NotFound />

  return (
    <div className="section-page">
      <aside className="section-aside">
        <div className="section-aside-head">
          <h2 className="section-aside-title">
            <span className="section-aside-prompt" aria-hidden="true">
              //
            </span>
            {navItem?.label ?? section}
          </h2>
          {navItem?.desc ? <p className="section-aside-desc">{navItem.desc}</p> : null}
        </div>
        <TripList
          section={section}
          items={items}
          activeSlug={activeSlug}
          onPrefetch={prefetchTrip}
        />
      </aside>

      <section className="section-content">
        {data ? (
          <TripTemplate dataset={data} resetKey={activeSlug ?? ''} />
        ) : loading ? (
          <div className="trip-loading">LOADING…</div>
        ) : (
          <div className="empty-state">
            <h2>还没有行程</h2>
            <p>
              把 .json 数据集放到 <code>src/content/{section}/</code> 目录下就会自动出现在这里。
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
