import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getNavItem, sectionItems } from '../config/nav'
import { allDocs, countDocs, getRecentDocs } from '../lib/docs/meta'
import { getRecentTrips, travelMeta } from '../lib/travel/meta'
import SpotlightCard from '../components/bits/SpotlightCard'

/** 旅游栏目走数据集而非 markdown，篇数要分开统计 */
function countOf(key: string): number {
  return getNavItem(key)?.renderer === 'travel' ? travelMeta.length : countDocs(key)
}

export default function Home() {
  // 文档与旅行数据集混在一起按日期倒序
  const recent = useMemo(
    () =>
      [
        ...getRecentDocs(6).map((doc) => ({
          section: doc.section,
          slug: doc.slug,
          title: doc.title,
          date: doc.date,
        })),
        ...getRecentTrips(),
      ]
        .sort((a, b) => (a.date < b.date ? 1 : -1))
        .slice(0, 6),
    [],
  )

  const totalCount = allDocs.length + travelMeta.length
  const tagCount = new Set([
    ...allDocs.flatMap((doc) => doc.tags),
    ...travelMeta.flatMap((trip) => trip.tags),
  ]).size

  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-hero-inner">
          <p className="home-eyebrow"><span className="home-eyebrow-dot" aria-hidden="true" />NONIGHT HUB · 灵感存档</p>
          <h1 className="home-title">保持好奇，<br /><span>探索不止一面。</span></h1>
          <p className="home-subtitle">收藏值得留下的经验，记录每一次新的发现。<br />从熟悉的日常，到尚未抵达的领域。</p>
          <div className="hero-actions"><button type="button" onClick={() => document.getElementById('home-channels')?.scrollIntoView()}>探索全部栏目 <span aria-hidden="true">↗</span></button><button type="button" onClick={() => document.getElementById('home-recent')?.scrollIntoView()}>看看最近更新 <span aria-hidden="true">↓</span></button></div>
          <div className="home-stats">
            <div className="stat"><span className="stat-num">{String(totalCount).padStart(2, '0')}</span><span className="stat-label">篇内容</span></div>
            <div className="stat-divider" aria-hidden="true" />
            <div className="stat"><span className="stat-num">{String(sectionItems.length).padStart(2, '0')}</span><span className="stat-label">个栏目</span></div>
            <div className="stat-divider" aria-hidden="true" />
            <div className="stat"><span className="stat-num">{String(tagCount).padStart(2, '0')}</span><span className="stat-label">个标签</span></div>
          </div>
        </div>
        <div className="home-observatory" aria-hidden="true">
          <span className="observatory-label">IDEAS IN ORBIT / 01</span>
          <svg className="orbit-art" viewBox="0 0 480 400" fill="none">
            <defs>
              <radialGradient id="planet-fill" cx="30%" cy="22%" r="80%"><stop stopColor="var(--planet-light)" /><stop offset=".52" stopColor="var(--planet-mid)" /><stop offset="1" stopColor="var(--planet-dark)" /></radialGradient>
              <linearGradient id="orbit-stroke"><stop stopColor="var(--signal)" /><stop offset="1" stopColor="var(--accent)" /></linearGradient>
              <clipPath id="planet-clip"><circle cx="250" cy="200" r="116" /></clipPath>
            </defs>
            <circle cx="250" cy="200" r="162" stroke="var(--line)" strokeDasharray="3 8" />
            <path d="M250 18v28m0 308v28M68 200h28m308 0h28" stroke="var(--signal)" opacity=".5" />
            <circle cx="250" cy="200" r="116" fill="url(#planet-fill)" />
            <g clipPath="url(#planet-clip)" stroke="var(--planet-grid)" strokeWidth=".8">
              <ellipse cx="250" cy="200" rx="54" ry="116" /><ellipse cx="250" cy="200" rx="92" ry="116" />
              <ellipse cx="250" cy="200" rx="116" ry="35" /><ellipse cx="250" cy="200" rx="116" ry="79" />
              <path d="M134 200h232M250 84v232" />
            </g>
            <ellipse cx="250" cy="200" rx="199" ry="60" transform="rotate(-28 250 200)" stroke="url(#orbit-stroke)" strokeWidth="1.5" />
            <circle cx="78" cy="269" r="6" fill="var(--signal)" /><circle cx="411" cy="102" r="4" fill="var(--accent)" />
            <path d="m309 68 6-6m-6 0 6 6M122 100v8m-4-4h8M372 304v8m-4-4h8" stroke="var(--signal)" />
          </svg>
          <div className="orbit-note note-idea"><span>✦ INSPIRATION LOG</span><strong>让每个想法，有迹可循。</strong><small>发现 → 记录 → 连接</small></div>
          <div className="orbit-note note-explore"><span>↗ OPEN TO EXPLORE</span><strong>下一份好奇，不设边界。</strong><small>知识 · 生活 · 更多可能</small></div>
          <span className="observatory-caption">记录此刻 / 探索未至</span>
        </div>
      </section>

      <section className="home-section" id="home-channels">
        <h2 className="home-section-title"><span aria-hidden="true">01 /</span> 探索栏目</h2>
        <div className="card-grid">
          {sectionItems.map((item, index) => (
            <SpotlightCard key={item.key} className={`channel-${item.visual ?? 'archive'}`}>
              <Link to={`/${item.key}`} className="section-card-link">
                <span className="section-card-code" aria-hidden="true">{String(index + 1).padStart(2, '0')} / {item.key.toUpperCase()}</span>
                <div className="section-card-head"><h3 className="section-card-title">{item.label}</h3><span className="section-card-count">{countOf(item.key)} 篇</span></div>
                <p className="section-card-desc">{item.desc}</p>
                <div className="channel-preview" aria-hidden="true">
                  {item.visual === 'landscape' ? <><svg viewBox="0 0 360 70" fill="none"><path d="m0 65 64-45 39 26 72-39 64 42 54-30 67 46" stroke="currentColor" /><path d="m0 68 82-29 43 20 70-34 45 33 68-21 52 31" stroke="currentColor" opacity=".35" /><path d="M48 48Q135 75 185 26T318 35" stroke="currentColor" strokeDasharray="3 5" /><circle cx="185" cy="26" r="4" fill="currentColor" /></svg><span>山川有迹，旅途有序。</span></> : item.visual === 'terminal' ? <><code><span>01</span> $ git switch -c new-ideas<br /><span>02</span> <b>✓</b> 从一个想法，到一次实现。</code><span className="channel-symbol">{'{ }'}</span></> : <><span>{item.label} · 持续记录</span><svg viewBox="0 0 360 70" fill="none"><path d="M180 14h140M155 30h165M190 46h130M165 62h155" stroke="currentColor" strokeWidth="2" /><circle cx="120" cy="35" r="22" stroke="currentColor" /></svg></>}
                </div>
                <span className="section-card-more">进入栏目 <span aria-hidden="true">↗</span></span>
              </Link>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {recent.length > 0 && (
        <section className="home-section" id="home-recent">
          <h2 className="home-section-title"><span aria-hidden="true">02 /</span> 最近更新</h2>
          <ul className="recent-list">
            {recent.map((doc, index) => (
              <li key={`${doc.section}-${doc.slug}`}>
                <Link to={`/${doc.section}/${doc.slug}`} className="recent-item">
                  <span className="recent-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <span className="recent-item-title">{doc.title}</span>
                  <span className="recent-item-meta">{getNavItem(doc.section)?.label ?? doc.section} · {doc.date}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
