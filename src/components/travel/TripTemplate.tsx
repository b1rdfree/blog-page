import { useEffect, useMemo, useRef, useState } from 'react'
import type {
  CalloutTone,
  ConclusionTone,
  PillTone,
  TripDataset,
  TripSection,
} from '../../lib/travel/types'

type Props = {
  dataset: TripDataset
  /** 切换行程时用来重置勾选状态等局部 state */
  resetKey: string
}

/** 章节锚点：s0 / s1 / s2 …，与数据集顺序绑定 */
function sectionId(index: number): string {
  return `s${index}`
}

/** 顶部导航显示不下的长标题，用 navLabel 覆盖；没有就直接用 title */
function navLabelOf(section: TripSection): string {
  return section.navLabel ?? section.title
}

const TONE_TEXT: Record<ConclusionTone, string> = {
  key: '关键',
  good: '推荐',
  warn: '注意',
  bad: '劝退',
}

const CALLOUT_TEXT: Record<CalloutTone, string> = {
  tip: '建议',
  danger: '避坑',
  note: '补充',
}

function Pill({ pill }: { pill: { text: string; tone: PillTone } }) {
  return <span className={`trip-pill p-${pill.tone}`}>{pill.text}</span>
}

/** 可勾选清单：状态只存在内存里，刷新即重置（定位是「快速过一遍」） */
function Checklist({ groups, resetKey }: { groups: { title: string; items: string[] }[]; resetKey: string }) {
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set())

  useEffect(() => {
    setChecked(new Set())
  }, [resetKey])

  const total = groups.reduce((sum, group) => sum + group.items.length, 0)

  return (
    <div className="trip-checklist">
      <div className="trip-checklist-progress">
        <span>
          已勾 {checked.size} / {total}
        </span>
        <span className="trip-checklist-bar" aria-hidden="true">
          <span
            className="trip-checklist-bar-fill"
            style={{ width: `${total === 0 ? 0 : (checked.size / total) * 100}%` }}
          />
        </span>
      </div>

      {groups.map((group) => (
        <div key={group.title} className="trip-check-group">
          <h4 className="trip-check-group-title">{group.title}</h4>
          <ul className="trip-check-items">
            {group.items.map((item) => {
              const id = `${group.title}::${item}`
              const isChecked = checked.has(id)
              return (
                <li key={id}>
                  <label className={isChecked ? 'trip-check is-done' : 'trip-check'}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setChecked((prev) => {
                          const next = new Set(prev)
                          if (next.has(id)) next.delete(id)
                          else next.add(id)
                          return next
                        })
                      }}
                    />
                    <span>{item}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

function SectionBody({ section, resetKey }: { section: TripSection; resetKey: string }) {
  switch (section.type) {
    case 'conclusions':
      return (
        <div className="trip-grid g2">
          {section.items.map((item) => (
            <div key={item.title} className={`trip-concl c-${item.tone}`}>
              <div className="trip-concl-t">
                <span className="trip-concl-badge">{TONE_TEXT[item.tone]}</span>
                {item.title}
              </div>
              <div className="trip-concl-d">
                {item.desc}
                {item.link ? (
                  <>
                    {' '}
                    <a className="trip-inline-link" href={item.link.anchor}>
                      {item.link.text}
                    </a>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )

    case 'table':
      return (
        <>
          <div className="trip-tblwrap">
            <table className="trip-tbl">
              {section.columns && section.columns.length > 0 ? (
                <thead>
                  <tr>
                    {section.columns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
              ) : null}
              <tbody>
                {section.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className={row.highlight ? 'hl' : undefined}>
                    {row.cells.map((cell, cellIndex) => (
                      <td key={cellIndex}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {section.footnote ? <p className="trip-footnote">{section.footnote}</p> : null}
        </>
      )

    case 'days':
      return (
        <div className="trip-days">
          {section.days.map((day) => (
            <div key={day.label} className="trip-day">
              <div className="trip-day-hd">
                <div>
                  <span className="trip-day-dt">{day.label}</span>
                  {day.tag ? <span className="trip-day-tag">{day.tag}</span> : null}
                </div>
                {day.cost ? <div className="trip-day-cost">{day.cost}</div> : null}
              </div>
              <div className="trip-day-bd">
                {day.items.map((item, itemIndex) => (
                  <div key={`${item.title}-${itemIndex}`} className="trip-row">
                    <div className="trip-tm">{item.time}</div>
                    <div className="trip-tt">
                      {item.title}
                      {item.pill ? <Pill pill={item.pill} /> : null}
                    </div>
                    {item.desc ? <div className="trip-dd">{item.desc}</div> : null}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )

    case 'checklist':
      return <Checklist groups={section.groups} resetKey={resetKey} />

    case 'callout':
      return (
        <div className={`trip-callout is-${section.tone}`}>
          <div className="trip-callout-label">{CALLOUT_TEXT[section.tone]}</div>
          <ul>
            {section.items.map((item, itemIndex) => (
              <li key={itemIndex}>{item}</li>
            ))}
          </ul>
        </div>
      )

    case 'cards':
      return (
        <div className={`trip-grid ${section.columns === 3 ? 'g3' : 'g2'}`}>
          {section.items.map((card) => (
            <div key={card.title} className="trip-card">
              <div className="trip-card-hd">
                <h4>{card.title}</h4>
                {card.tag ? <span className="trip-card-tag">{card.tag}</span> : null}
              </div>
              <p>{card.desc}</p>
            </div>
          ))}
        </div>
      )

    case 'stats':
      return (
        <div className="trip-stats">
          {section.items.map((stat) => (
            <div key={stat.label} className="trip-stat">
              <span className="trip-stat-v">{stat.value}</span>
              <span className="trip-stat-l">{stat.label}</span>
            </div>
          ))}
        </div>
      )

    case 'prose':
      return (
        <div className="trip-prose">
          {section.paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      )
  }
}

export default function TripTemplate({ dataset, resetKey }: Props) {
  const { meta, sections } = dataset
  const [activeId, setActiveId] = useState<string>('')
  const bodyRef = useRef<HTMLDivElement>(null)

  const navItems = useMemo(
    () => sections.map((section, index) => ({ id: sectionId(index), label: navLabelOf(section) })),
    [sections],
  )

  // 滚动高亮：只观察章节元素，passive 的 IntersectionObserver，无 scroll 监听
  useEffect(() => {
    const root = bodyRef.current
    if (!root || sections.length === 0) return

    const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-trip-section]'))
    if (nodes.length === 0) return

    // 顶部让出 navbar(60) + 章节导航(约 52)，底部收到视口 60% 处，取最靠上的可见章节
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length === 0) return
        const topmost = visible.reduce((a, b) =>
          a.boundingClientRect.top <= b.boundingClientRect.top ? a : b,
        )
        setActiveId(topmost.target.id)
      },
      { rootMargin: '-120px 0px -60% 0px', threshold: 0 },
    )

    nodes.forEach((node) => observer.observe(node))
    return () => observer.disconnect()
  }, [sections])

  return (
    <article className="trip-page">
      <header className="trip-hd">
        <h1 className="trip-title">{meta.title}</h1>
        {meta.summary ? <p className="trip-sub">{meta.summary}</p> : null}
        {meta.chips.length > 0 ? (
          <div className="trip-chips">
            {meta.chips.map((chip) => (
              <span key={chip} className="trip-chip">
                {chip}
              </span>
            ))}
          </div>
        ) : null}
        {meta.updated ? (
          <p className="trip-updated">更新于 {meta.updated}</p>
        ) : null}
      </header>

      {navItems.length > 1 ? (
        <nav className="trip-nav" aria-label="章节导航">
          <div className="trip-nav-inner">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={activeId === item.id ? 'is-active' : undefined}
              >
                {item.label}
              </a>
            ))}
          </div>
        </nav>
      ) : null}

      <div ref={bodyRef} className="trip-body">
        {sections.map((section, index) => {
          const id = sectionId(index)
          return (
            <section key={id} id={id} data-trip-section className="trip-sec">
              <h2 className="trip-sec-title">
                <span className="trip-sec-num">{String(index).padStart(2, '0')}</span>
                {section.title}
              </h2>
              {section.lead ? <p className="trip-sec-lead">{section.lead}</p> : null}
              <SectionBody section={section} resetKey={resetKey} />
            </section>
          )
        })}
      </div>
    </article>
  )
}
