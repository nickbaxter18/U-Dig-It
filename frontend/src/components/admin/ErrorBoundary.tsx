'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

import { logger } from '@/lib/logger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error(
      'Error boundary caught an error',
      {
        component: 'ErrorBoundary',
        action: 'error_caught',
        metadata: {
          error: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        },
      },
      error
    );

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50 p-8"
          role="alert"
          aria-live="assertive"
        >
          <h2 className="mb-4 text-xl font-semibold text-red-800">Something went wrong</h2>
          <p className="mb-4 text-red-700">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            type="button"
          >
            Reload page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
