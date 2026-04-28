import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  children: ReactNode
  fallback: ReactNode
  /** When this value changes (e.g. `location.key`), clear the error so the map can mount again. */
  resetKey?: string | number
}
type State = { hasError: boolean }

/**
 * Catches Leaflet / chunk failures so we can show a list fallback instead of a blank screen.
 */
export default class ExploreMapErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('[ExploreMap]', error.message, info.componentStack)
  }

  componentDidUpdate(prevProps: Props) {
    const k = this.props.resetKey
    if (k !== undefined && k !== prevProps.resetKey && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  render() {
    if (this.state.hasError) return this.props.fallback
    return this.props.children
  }
}
