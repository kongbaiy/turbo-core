import React from 'react'

type ErrorBoundaryState = {
    error: Error | null
}

export default class RepoErrorBoundary extends React.Component<
    React.PropsWithChildren<unknown>,
    ErrorBoundaryState
> {
    constructor(props: React.PropsWithChildren<unknown>) {
        super(props)
        this.state = { error: null }
    }

    static getDerivedStateFromError(error: Error) {
        return { error }
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('RepoErrorBoundary caught an error:', error, info)
    }

    render() {
        if (this.state.error) {
            return (
                <main className='app-shell error-shell'>
                    <h1>应用发生错误</h1>
                    <p>{this.state.error.message}</p>
                    <pre>{this.state.error.stack}</pre>
                </main>
            )
        }

        return this.props.children
    }
}
