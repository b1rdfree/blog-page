import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { expect, it, vi } from 'vitest'
import Home from './Home'

vi.mock('../config/nav', async (importOriginal) => {
  const original = await importOriginal<typeof import('../config/nav')>()
  return {
    ...original,
    sectionItems: [...original.sectionItems, { key: 'life', label: '生活实验', desc: '记录日常的新发现' }],
  }
})

it('新增普通栏目自动展示通用卡片，不依赖代码/旅游专属样式', () => {
  render(<MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Home /></MemoryRouter>)
  const card = screen.getByRole('heading', { name: '生活实验' }).closest('a')!
  expect(card.getAttribute('href')).toBe('/life')
  expect(within(card).getByText('生活实验 · 持续记录')).toBeTruthy()
  expect(within(card).getByText('0 篇')).toBeTruthy()
  expect(card.closest('.channel-archive')).toBeTruthy()
  expect(screen.getByRole('button', { name: '探索全部栏目' })).toBeTruthy()
})
