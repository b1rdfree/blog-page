import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TripDataset } from '../../lib/travel/types'
import TripTemplate from './TripTemplate'

const dataset: TripDataset = {
  version: 1,
  meta: { title: '测试行程', summary: '一份完整行程', chips: ['三天'], tags: [], order: 1, updated: '2026-09-23', filters: {} },
  sections: [
    { type: 'conclusions', title: '出行结论', items: [{ title: '提前预订', tone: 'key', desc: '票源紧张', link: { text: '查看安排', anchor: '#s2' } }] },
    { type: 'table', title: '费用对比', columns: ['项目', '费用'], rows: [{ cells: ['住宿', '200 元'], highlight: true }], footnote: '按人均计算' },
    { type: 'days', title: '每日安排', navLabel: '日程', days: [{ label: 'Day 1', tag: '抵达', cost: '300 元', items: [{ time: '09:00', title: '到达车站', desc: '乘坐地铁', pill: { text: '方便', tone: 'yes' } }] }] },
    { type: 'checklist', title: '行李检查', groups: [{ title: '证件', items: ['身份证', '车票'] }] },
    { type: 'callout', title: '天气提醒', tone: 'tip', items: ['携带雨伞'] },
    { type: 'cards', title: '住宿建议', columns: 3, items: [{ title: '临江酒店', tag: '安静', desc: '交通便利' }] },
    { type: 'stats', title: '行程速览', items: [{ value: '3 天', label: '旅行时长' }] },
    { type: 'prose', title: '旅行笔记', paragraphs: ['一路风景很好。'] },
  ],
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe = vi.fn()
    disconnect = vi.fn()
  })
  vi.stubGlobal('scrollTo', vi.fn())
})

describe('旅行模板', () => {
  it('展示元信息和全部八种小节内容', () => {
    const { container } = render(<TripTemplate dataset={dataset} resetKey="one" />)
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('测试行程')
    expect(screen.getByText('更新于 2026-09-23')).toBeTruthy()
    expect(container.querySelectorAll('[data-trip-section]')).toHaveLength(8)
    for (const text of ['提前预订', '到达车站', '携带雨伞', '临江酒店', '3 天', '一路风景很好。']) {
      expect(screen.getByText(text)).toBeTruthy()
    }
    expect(screen.getByRole('cell', { name: '200 元' }).closest('tr')?.className).toBe('hl')
    expect(screen.getAllByRole('checkbox')).toHaveLength(2)
  })

  it('勾选与取消实时计数，切换行程重置状态', () => {
    const { rerender } = render(<TripTemplate dataset={dataset} resetKey="one" />)
    const check = screen.getByRole('checkbox', { name: '身份证' }) as HTMLInputElement
    fireEvent.click(check)
    expect(check.checked).toBe(true)
    expect(screen.getByText('已勾 1 / 2')).toBeTruthy()
    fireEvent.click(check)
    expect(screen.getByText('已勾 0 / 2')).toBeTruthy()
    fireEvent.click(check)
    rerender(<TripTemplate dataset={dataset} resetKey="two" />)
    expect(check.checked).toBe(false)
    expect(screen.getByText('已勾 0 / 2')).toBeTruthy()
  })

  it('章节导航和结论跳转使用滚动，不破坏 HashRouter 地址', () => {
    window.location.hash = '#/travel/test'
    render(<TripTemplate dataset={dataset} resetKey="one" />)
    const target = document.getElementById('s2')!
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({ top: 500 } as DOMRect)
    const nav = screen.getByRole('navigation', { name: '章节导航' })
    fireEvent.click(within(nav).getByRole('button', { name: '日程' }))
    expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 428, behavior: 'smooth' })
    expect(within(nav).getByRole('button', { name: '日程' }).getAttribute('aria-current')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: '查看安排' }))
    expect(window.scrollTo).toHaveBeenCalledTimes(2)
    expect(window.location.hash).toBe('#/travel/test')
  })

  it('空行程与空清单正常显示，不出现无效进度', () => {
    const { rerender, container } = render(<TripTemplate dataset={{ ...dataset, sections: [] }} resetKey="empty" />)
    expect(screen.queryByRole('navigation')).toBeNull()
    rerender(<TripTemplate dataset={{ ...dataset, sections: [{ type: 'checklist', title: '清单', groups: [] }] }} resetKey="list" />)
    expect(screen.getByText('已勾 0 / 0')).toBeTruthy()
    expect(container.querySelector<HTMLElement>('.trip-checklist-bar-fill')?.style.width).toBe('0%')
  })
})
