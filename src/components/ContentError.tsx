type Props = {
  kind: 'load' | 'timeout' | 'render'
  onRetry?: () => void
}

export default function ContentError({ kind, onRetry }: Props) {
  return (
    <div className="empty-state content-error" role="alert">
      <span className="content-error-code" aria-hidden="true">CONNECTION INTERRUPTED</span>
      <h2>{kind === 'timeout' ? '内容加载超时' : kind === 'render' ? '页面暂时无法显示' : '内容加载失败'}</h2>
      <p>{kind === 'render'
        ? '页面资源可能未能加载或出现异常，请刷新页面后再试。'
        : '请检查网络连接后重试。如果仍然失败，可以刷新页面获取最新版本。'}</p>
      <div className="content-error-actions">
        {onRetry ? <button type="button" onClick={onRetry}>重新尝试</button> : null}
        <button type="button" onClick={() => window.location.reload()}>刷新页面</button>
      </div>
      <p className="content-error-hint">也可以通过导航继续浏览其他内容。</p>
    </div>
  )
}
