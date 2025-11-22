'use client';

import { AlertCircle, Info, Maximize2, RefreshCcw } from 'lucide-react';

import { ReactNode } from 'react';

import { cn, formatDateTime } from '@/lib/utils';

type ChartStatus = 'loading' | 'error' | 'empty' | 'ready';

interface ChartInsight {
  title: string;
  description?: string;
  variant?: 'positive' | 'negative' | 'neutral';
}

interface DashboardChartProps {
  title: string;
  description?: string;
  status: ChartStatus;
  className?: string;
  children: ReactNode;
  rangeControl?: ReactNode;
  rightAction?: ReactNode;
  legend?: ReactNode;
  insight?: ChartInsight | null;
  errorMessage?: string | null;
  emptyMessage?: string | null;
  updatedAt?: Date | string | null;
  interactive?: boolean;
  onRetry?: () => void;
  onExpand?: () => void;
}

export function DashboardChart({
  title,
  description,
  status,
  className,
  children,
  rangeControl,
  rightAction,
  legend,
  insight,
  errorMessage,
  emptyMessage = 'No data available for the selected period.',
  updatedAt,
  interactive = true,
  onRetry,
  onExpand,
}: DashboardChartProps) {
  const renderHeader = () => (
    <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description ? <Info className="h-4 w-4 text-gray-400" aria-label={description} /> : null}
        </div>
        {updatedAt ? (
          <p className="text-xs text-gray-500">
            Last updated{' '}
            {typeof updatedAt === 'string' ? formatDateTime(updatedAt) : formatDateTime(updatedAt)}
          </p>
        ) : null}
      </div>
      {(rangeControl || rightAction || (onExpand && status === 'ready')) && (
        <div className="flex flex-col-reverse items-stretch gap-2 sm:flex-row sm:items-center">
          {rangeControl}
          <div className="flex items-center gap-2">
            {onExpand && status === 'ready' && (
              <button
                type="button"
                onClick={onExpand}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                aria-label={`Expand ${title} chart`}
              >
                <Maximize2 className="h-4 w-4" />
                <span className="hidden sm:inline">Expand</span>
              </button>
            )}
            {rightAction}
          </div>
        </div>
      )}
    </div>
  );

  const renderLoading = () => (
    <div
      className="flex h-60 flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-gray-200 bg-gray-50"
      role="status"
      aria-live="polite"
    >
      <div className="flex h-10 w-10 animate-spin items-center justify-center rounded-full border-4 border-gray-200 border-t-premium-gold" />
      <p className="text-sm text-gray-600">Loading chart data…</p>
    </div>
  );

  const renderError = () => (
    <div
      className="flex h-60 flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 text-center"
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="h-6 w-6 text-red-500" />
      <p className="text-sm font-medium text-red-600">
        {errorMessage ?? 'Something went wrong while loading this chart.'}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-red-600 shadow-sm ring-1 ring-red-200 transition hover:bg-red-100"
        >
          <RefreshCcw className="h-4 w-4" />
          Retry
        </button>
      ) : null}
    </div>
  );

  const renderEmpty = () => (
    <div
      className="flex h-60 flex-col items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-4 text-center"
      role="status"
      aria-live="polite"
    >
      <p className="text-sm font-medium text-gray-700">{emptyMessage}</p>
      {description ? <p className="text-xs text-gray-500">{description}</p> : null}
    </div>
  );

  const renderInsight = () => {
    if (!insight) return null;

    const variantClasses =
      insight.variant === 'positive'
        ? 'border-green-200 bg-green-50 text-green-700'
        : insight.variant === 'negative'
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-gray-200 bg-gray-50 text-gray-700';

    return (
      <div className={cn('mt-4 rounded-lg border px-4 py-3 text-sm', variantClasses)}>
        <p className="font-medium">{insight.title}</p>
        {insight.description ? (
          <p className="mt-1 text-xs opacity-80">{insight.description}</p>
        ) : null}
      </div>
    );
  };

  return (
    <section
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition',
        interactive ? 'hover:shadow-md' : null,
        className
      )}
      role="group"
      aria-label={title}
    >
      {renderHeader()}

      <div className="min-h-[16rem] overflow-hidden">
        {status === 'loading' && renderLoading()}
        {status === 'error' && renderError()}
        {status === 'empty' && renderEmpty()}
        {status === 'ready' && (
          <>
            <div className="relative overflow-hidden">{children}</div>
            {legend ? <div className="mt-4">{legend}</div> : null}
          </>
        )}
      </div>

      {renderInsight()}
    </section>
  );
}
