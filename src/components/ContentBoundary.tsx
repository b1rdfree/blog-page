import { Component, type ReactNode } from 'react'
import ContentError from './ContentError'

type Props = { children: ReactNode; resetKey?: string }
type State = { failed: boolean; resetKey?: string }

/** React.lazy 会缓存拒绝的 Promise，资源加载失败时需刷新页面重新获取模块。 */
export default class ContentBoundary extends Component<Props, State> {
  state: State = { failed: false, resetKey: this.props.resetKey }

  static getDerivedStateFromProps(props: Props, state: State) {
    return props.resetKey !== state.resetKey ? { failed: false, resetKey: props.resetKey } : null
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? <ContentError kind="render" /> : this.props.children
  }
}
