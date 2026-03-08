import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onReset?: () => void;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);

        // Handle chunk load errors (deployments) automatically
        if (error.message.includes('Failed to fetch dynamically imported module') ||
            error.message.includes('Importing a module script failed')) {

            const storageKey = 'lune_reload_attempted';
            const timeNow = Date.now();
            const lastReload = sessionStorage.getItem(storageKey);

            // Only reload if we haven't done so in the last 10 seconds (loop protection)
            if (!lastReload || (timeNow - parseInt(lastReload) > 10000)) {
                sessionStorage.setItem(storageKey, timeNow.toString());
                window.location.reload();
                return;
            } else {
                // If we JUST reloaded and it failed again, clear the key so we don't get stuck
                console.error('Reload loop detected, stopping auto-reload');
                sessionStorage.removeItem(storageKey);
            }
        }

        this.setState({ error, errorInfo });

        // Log to error reporting service (e.g., Sentry)
        // Sentry.captureException(error, { extra: errorInfo });
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        this.props.onReset?.();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-cream flex items-center justify-center p-4">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="bg-red-100 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={32} />
                        </div>

                        <h2 className="text-2xl font-bold text-gray-900 mb-2">
                            Oops! Something went wrong
                        </h2>

                        <p className="text-gray-600 mb-6">
                            We encountered an unexpected error. Don't worry, your data is safe.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <details className="text-left mb-6 bg-gray-50 p-4 rounded-lg">
                                <summary className="cursor-pointer font-semibold text-sm text-gray-700 mb-2">
                                    Error Details (Dev Only)
                                </summary>
                                <pre className="text-xs text-red-600 overflow-auto max-h-48">
                                    {this.state.error.toString()}
                                    {this.state.errorInfo?.componentStack}
                                </pre>
                            </details>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={this.handleReset}
                                className="flex-1 px-4 py-3 bg-black text-white rounded-lg font-bold hover:bg-gray-800 transition flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={16} />
                                Try Again
                            </button>

                            <button
                                onClick={() => window.location.href = '/'}
                                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                            >
                                <Home size={16} />
                                Go Home
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

// Lightweight error fallback for smaller components
export const ErrorFallback: React.FC<{
    error?: Error;
    resetError?: () => void;
    message?: string;
}> = ({ error, resetError, message = 'Failed to load this section' }) => (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="mx-auto text-red-600 mb-3" size={32} />
        <p className="text-red-900 font-semibold mb-2">{message}</p>
        {error && (
            <p className="text-red-700 text-sm mb-4">{error.message}</p>
        )}
        {resetError && (
            <button
                onClick={resetError}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition"
            >
                Try Again
            </button>
        )}
    </div>
);
