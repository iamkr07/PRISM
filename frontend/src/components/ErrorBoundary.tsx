import React from 'react'

interface State {
  hasError: boolean
  error?: Error | null
}

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(_error: Error, _info: any) {
    // Could log to an external service here
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mb-6 rounded-xl border border-crimson/20 bg-crimson/10 px-4 py-3 text-sm text-crimson">
          Something went wrong rendering this section.
        </div>
      )
    }

    return this.props.children as React.ReactElement
  }
}
