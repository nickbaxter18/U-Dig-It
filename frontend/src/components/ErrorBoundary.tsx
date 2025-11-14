'use client';

import React, { Component, ReactNode, ReactElement } from 'react';
import { logger } from '@/lib/logger';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    logger.error(
      'Error boundary caught error',
      {
        component: 'error-boundary',
        action: 'component_error',
        metadata: {
          errorMessage: error.message,
          errorStack: error.stack,
          componentStack: errorInfo.componentStack,
        },
      },
      error
    );

    this.setState({
      error,
      errorInfo,
    });

    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>

            <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
              Something went wrong
            </h1>

            <p className="mb-6 text-center text-gray-600">
              We apologize for the inconvenience. An error occurred while processing your request.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 rounded-md bg-gray-100 p-4">
                <p className="mb-2 text-sm font-semibold text-gray-700">Error Details:</p>
                <p className="break-all font-mono text-xs text-gray-600">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleReset}
                className="bg-kubota-red flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-white transition-colors hover:bg-red-700"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-gray-200 px-4 py-3 text-gray-700 transition-colors hover:bg-gray-300"
              >
                <Home className="h-4 w-4" />
                Go to Homepage
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-gray-500">
              Error ID: {Date.now().toString(36)}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Specialized error boundaries for specific contexts
export function BookingErrorBoundary({ children }: { children: ReactNode }): ReactElement {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Booking Error</h1>
            <p className="mb-6 text-center text-gray-600">
              We encountered an error processing your booking. Your information has been saved.
            </p>
            <button
              onClick={() => (window.location.href = '/dashboard')}
              className="bg-kubota-red w-full rounded-md px-4 py-3 text-white transition-colors hover:bg-red-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function PaymentErrorBoundary({ children }: { children: ReactNode }): ReactElement {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">
              Payment Processing Error
            </h1>
            <p className="mb-6 text-center text-gray-600">
              Your payment could not be processed at this time. Please try again or contact support.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="bg-kubota-red w-full rounded-md px-4 py-3 text-white transition-colors hover:bg-red-700"
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/contact')}
                className="w-full rounded-md bg-gray-200 px-4 py-3 text-gray-700 transition-colors hover:bg-gray-300"
              >
                Contact Support
              </button>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function AdminErrorBoundary({ children }: { children: ReactNode }): ReactElement {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">Admin Panel Error</h1>
            <p className="mb-6 text-center text-gray-600">
              An error occurred in the admin panel. Please refresh or contact technical support.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="bg-kubota-red w-full rounded-md px-4 py-3 text-white transition-colors hover:bg-red-700"
              >
                Refresh Page
              </button>
              <button
                onClick={() => (window.location.href = '/dashboard')}
                className="w-full rounded-md bg-gray-200 px-4 py-3 text-gray-700 transition-colors hover:bg-gray-300"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}
