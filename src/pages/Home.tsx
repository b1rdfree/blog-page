import { Link } from 'react-router-dom'
import { getNavItem, sectionItems } from '../config/nav'
import { allDocs, countDocs, getRecentDocs } from '../lib/docs'
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion'
import AnimatedContent from '../components/bits/AnimatedContent'
import BorderGlow from '../components/bits/BorderGlow'
import ClickSpark from '../components/bits/ClickSpark'
import CountUp from '../components/bits/CountUp'
import DecryptedText from '../components/bits/DecryptedText'

// 解码动画用的字符集（只用 ASCII，中文不参与乱码替换）
const DECRYPT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>/\\|=_+'

export default function Home() {
  const recent = getRecentDocs(6)
  const tagCount = new Set(allDocs.flatMap((doc) => doc.tags)).size
  // DecryptedText 内部没有处理该偏好，开了「减少动态效果」就直接渲染纯文本
  const reduceMotion = usePrefersReducedMotion()

  return (
    <div className="home">
      <ClickSpark sparkColor="#a78bfa" sparkSize={12} sparkRadius={20} sparkCount={10} duration={520}>
        <div className="home-content">
          <section className="home-hero">
            <AnimatedContent distance={26} duration={0.7} className="home-hero-inner">
              <p className="home-eyebrow">
                <span className="home-eyebrow-dot" aria-hidden="true" />
                个人内容工作台
              </p>
              <h1 className="home-title">
                {reduceMotion ? (
                  'Nonight Hub'
                ) : (
                  <DecryptedText
                    text="Nonight Hub"
                    speed={42}
                    maxIterations={16}
                    sequential
                    revealDirection="start"
                    animateOn="view"
                    characters={DECRYPT_CHARS}
                    className="home-title-char"
                    encryptedClassName="home-title-scramble"
                  />
                )}
              </h1>
              <p className="home-subtitle">
                一个把 Markdown 当数据库用的个人工作台。
                <br />
                左边挑文档，右边直接读。
              </p>

              <div className="home-stats">
                <div className="stat">
                  <CountUp to={allDocs.length} duration={1.4} className="stat-num" />
                  <span className="stat-label">篇文档</span>
                </div>
                <div className="stat-divider" aria-hidden="true" />
                <div className="stat">
                  <CountUp to={sectionItems.length} duration={1.4} className="stat-num" />
                  <span className="stat-label">个栏目</span>
                </div>
                <div className="stat-divider" aria-hidden="true" />
                <div className="stat">
                  <CountUp to={tagCount} duration={1.4} className="stat-num" />
                  <span className="stat-label">个标签</span>
                </div>
              </div>
            </AnimatedContent>

            <span className="home-scroll-hint" aria-hidden="true">
              <span className="home-scroll-line" />
            </span>
          </section>

          <AnimatedContent distance={30} duration={0.7} className="home-section">
            <h2 className="home-section-title">栏目</h2>
            <div className="card-grid">
              {sectionItems.map((item) => (
                <BorderGlow
                  key={item.key}
                  className="section-glow"
                  backgroundColor="rgba(255, 255, 255, 0.035)"
                  glowColor="265 90 70"
                  borderRadius={18}
                  glowRadius={34}
                  glowIntensity={1}
                  coneSpread={32}
                  fillOpacity={0.32}
                  colors={['#a78bfa', '#22d3ee', '#f472b6']}
                >
                  <Link to={`/${item.key}`} className="section-card-link">
                    <div className="section-card-head">
                      <h3 className="section-card-title">{item.label}</h3>
                      <span className="section-card-count">{countDocs(item.key)} 篇</span>
                    </div>
                    <p className="section-card-desc">{item.desc}</p>
                    <span className="section-card-more">进入 →</span>
                  </Link>
                </BorderGlow>
              ))}
            </div>
          </AnimatedContent>

          {recent.length > 0 ? (
            <AnimatedContent distance={30} duration={0.7} className="home-section">
              <h2 className="home-section-title">最近更新</h2>
              <ul className="recent-list">
                {recent.map((doc) => (
                  <li key={`${doc.section}-${doc.slug}`}>
                    <Link to={`/${doc.section}/${doc.slug}`} className="recent-item">
                      <span className="recent-item-title">{doc.title}</span>
                      <span className="recent-item-meta">
                        {getNavItem(doc.section)?.label ?? doc.section} · {doc.date}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </AnimatedContent>
          ) : null}
        </div>
      </ClickSpark>
    </div>
  )
}
