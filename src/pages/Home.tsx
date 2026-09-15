import { Link } from 'react-router-dom'
import { sectionItems } from '../config/nav'
import { countDocs, getRecentDocs } from '../lib/docs'

export default function Home() {
  const recent = getRecentDocs(6)

  return (
    <div className="home">
      <section className="home-hero">
        <h1 className="home-title">Nonight Hub</h1>
        <p className="home-subtitle">
          一个把 Markdown 当数据库用的个人工作台。左边挑文档，右边直接读。
        </p>
      </section>

      <section className="home-section">
        <h2 className="home-section-title">栏目</h2>
        <div className="card-grid">
          {sectionItems.map((item) => (
            <Link key={item.key} to={`/${item.key}`} className="section-card">
              <div className="section-card-head">
                <h3 className="section-card-title">{item.label}</h3>
                <span className="section-card-count">{countDocs(item.key)} 篇</span>
              </div>
              <p className="section-card-desc">{item.desc}</p>
              <span className="section-card-more">进入 →</span>
            </Link>
          ))}
        </div>
      </section>

      {recent.length > 0 ? (
        <section className="home-section">
          <h2 className="home-section-title">最近更新</h2>
          <ul className="recent-list">
            {recent.map((doc) => (
              <li key={`${doc.section}-${doc.slug}`}>
                <Link to={`/${doc.section}/${doc.slug}`} className="recent-item">
                  <span className="recent-item-title">{doc.title}</span>
                  <span className="recent-item-meta">
                    {doc.section} · {doc.date}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
