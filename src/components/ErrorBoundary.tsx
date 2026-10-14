import { Component, type ErrorInfo, type ReactNode } from 'react'
import { trackEvent } from '../lib/analytics'

type Props = { children: ReactNode }
type State = { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Krøll]', error, info)
    trackEvent('technical_error', {
      source: 'error_boundary',
      properties: {
        // Safe metadata only — no stack/tokens/secrets
        name: (error.name || 'Error').slice(0, 40),
        path:
          typeof location !== 'undefined' ? location.pathname.slice(0, 80) : '/',
        component_stack_len: info.componentStack?.length ?? 0,
      },
    })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary">
          <h1>Noe gikk galt</h1>
          <p>Last siden på nytt, eller gå tilbake.</p>
          <button type="button" onClick={() => window.location.assign('/')}>
            Til forsiden
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
