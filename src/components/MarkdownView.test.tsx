import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import MarkdownView from './MarkdownView'

describe('Markdown 模板', () => {
  it('渲染标题、GFM 表格/清单/删除线和语法高亮', () => {
    const content = '# Article\n\n| 名称 | 数值 |\n| --- | --- |\n| 项目 | 42 |\n\n- [x] 完成\n\n~~删除~~\n\n```typescript\nconst count = 42\n```'
    const { container } = render(<MarkdownView content={content} />)
    expect(screen.getByRole('heading', { level: 1 }).id).toBe('article')
    expect(screen.getByRole('cell', { name: '42' })).toBeTruthy()
    const checkbox = screen.getByRole('checkbox') as HTMLInputElement
    expect(checkbox.checked).toBe(true)
    expect(checkbox.disabled).toBe(true)
    expect(container.querySelector('del')?.textContent).toBe('删除')
    expect(container.querySelector('code.hljs .hljs-keyword')?.textContent).toBe('const')
  })

  it('外链安全新窗口打开，站内路由保持原窗口；不执行嵌入 HTML', () => {
    const { container } = render(<MarkdownView content={'[外部](https://example.com) [站内](#/code/git-cheatsheet)\n\n<script>alert(1)</script>'} />)
    const external = screen.getByRole('link', { name: '外部' })
    expect(external.getAttribute('target')).toBe('_blank')
    expect(external.getAttribute('rel')).toBe('noreferrer noopener')
    expect(screen.getByRole('link', { name: '站内' }).getAttribute('target')).toBeNull()
    expect(container.querySelector('script')).toBeNull()
  })
})
