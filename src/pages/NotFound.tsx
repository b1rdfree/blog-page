import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="empty-state nf">
      <p className="nf-code" aria-hidden="true">
        [ERR 404]
      </p>
      <h2>页面不存在</h2>
      <p className="nf-detail">
        这个地址没有对应的内容，可能是栏目还没建，或者文档被移走了。
      </p>
      <Link to="/" className="empty-state-link nf-link">
        cd /home<span className="nf-caret" aria-hidden="true" />
      </Link>
    </div>
  )
}
