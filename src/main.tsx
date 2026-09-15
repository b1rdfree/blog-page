import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './styles/global.css'

/**
 * 这里用 HashRouter 是为了让站点丢到任何静态服务器（含 GitHub Pages 子路径）
 * 都能直接跑、刷新不 404。若你用 nginx 自托管并配了 try_files fallback，
 * 可以换成 BrowserRouter，URL 会更干净。
 */
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
)
