import { fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadDoc } from '../lib/docs/content'
import { loadTrip } from '../lib/travel/dataset'
import { getDocMeta } from '../lib/docs/meta'
import type { TripDataset } from '../lib/travel/types'
import packing from '../content/travel/packing-list.json'
import SectionPage from './SectionPage'

vi.mock('../lib/docs/content', () => ({ loadDoc: vi.fn(), prefetchDoc: vi.fn() }))
vi.mock('../lib/travel/dataset', () => ({ loadTrip: vi.fn(), prefetchTrip: vi.fn() }))

beforeEach(() => {
  vi.mocked(loadDoc).mockReset()
  vi.mocked(loadTrip).mockReset()
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('IntersectionObserver', class {
    observe = vi.fn()
    disconnect = vi.fn()
  })
})

function open(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes><Route path="/:section/:slug" element={<SectionPage />} /></Routes>
    </MemoryRouter>,
  )
}

describe('栏目容灾 UI', () => {
  it.each(['code', 'travel'])('%s 下载失败保留列表，点击重试恢复真实模板', async (section) => {
    const slug = section === 'code' ? 'git-cheatsheet' : 'packing-list'
    const title = section === 'code' ? '恢复后的文章' : packing.meta.title
    vi.mocked(loadDoc).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce({
      ...getDocMeta('code', 'git-cheatsheet')!, content: '# 恢复后的文章',
    })
    vi.mocked(loadTrip).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(packing as TripDataset)
    open(`/${section}/${slug}`)
    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('内容加载失败')
    expect(within(screen.getByRole('complementary')).getAllByRole('link').length).toBeGreaterThan(0)
    expect(within(alert).getByRole('button', { name: '刷新页面' })).toBeTruthy()
    fireEvent.click(within(alert).getByRole('button', { name: '重新尝试' }))
    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeTruthy()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(section === 'code' ? loadDoc : loadTrip).toHaveBeenCalledTimes(2)
  })

  it.each(['code', 'travel'])('%s 不存在的地址仍显示 404', async (section) => {
    vi.mocked(loadTrip).mockResolvedValue(null)
    open(`/${section}/does-not-exist`)
    expect(await screen.findByRole('heading', { name: '页面不存在' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: '重新尝试' })).toBeNull()
  })
})
