import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeHighlight from 'rehype-highlight'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import dockerfile from 'highlight.js/lib/languages/dockerfile'
import json from 'highlight.js/lib/languages/json'
import markdown from 'highlight.js/lib/languages/markdown'
import python from 'highlight.js/lib/languages/python'
import sql from 'highlight.js/lib/languages/sql'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
// 以 GitHub Dark 为基底；markdown.css 统一补充白天模式的 token 配色。
import 'highlight.js/styles/github-dark.css'
import '../styles/markdown.css'

// 只注册会用到的语言，避免把 highlight.js 全量语言打进包里
const languages = {
  bash,
  css,
  dockerfile,
  json,
  markdown,
  python,
  sql,
  typescript,
  xml,
  yaml,
}

type Props = {
  content: string
}

function isExternal(href: string | undefined): boolean {
  return typeof href === 'string' && /^(https?:)?\/\//.test(href)
}

export default function MarkdownView({ content }: Props) {
  return (
    <article className="markdown-body">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug, [rehypeHighlight, { languages, detect: true }]]}
        components={{
          a: ({ node: _node, href, children, ...props }) =>
            isExternal(href) ? (
              <a href={href} {...props} target="_blank" rel="noreferrer noopener">
                {children}
              </a>
            ) : (
              <a href={href} {...props}>
                {children}
              </a>
            ),
        }}
      >
        {content}
      </Markdown>
    </article>
  )
}
