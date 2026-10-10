import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, Copy, RotateCw } from 'lucide-react'

interface Props {
  children: ReactNode
}
interface State {
  error: Error | null
  copied: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, copied: false }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Novelty render error:', error, info.componentStack)
  }

  private copy = (): void => {
    const { error } = this.state
    if (!error) return
    const text = `${error.name}: ${error.message}\n\n${error.stack ?? ''}`
    void navigator.clipboard.writeText(text).then(() => {
      this.setState({ copied: true })
      window.setTimeout(() => this.setState({ copied: false }), 1600)
    })
  }

  render(): ReactNode {
    const { error, copied } = this.state
    if (!error) return this.props.children

    return (
      <div className="overlay scrim center">
        <div className="empty error-boundary">
          <span className="empty-mark">
            <AlertTriangle size={24} />
          </span>
          <span className="empty-title">Something went wrong</span>
          <span className="empty-desc">
            Novelty hit an unexpected error while rendering. Your notes are safe on disk — reload to keep writing, or copy the details below
            if you want to report it.
          </span>
          <pre className="error-boundary-detail">{`${error.name}: ${error.message}`}</pre>
          <div className="empty-actions">
            <button className="btn btn-primary" onClick={() => window.location.reload()}>
              <RotateCw size={14} /> Reload
            </button>
            <button className="btn" onClick={this.copy}>
              <Copy size={14} /> {copied ? 'Copied' : 'Copy details'}
            </button>
          </div>
        </div>
      </div>
    )
  }
}
