'use client';

import { TrendingDown, TrendingUp } from 'lucide-react';

import { useMemo } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  growth?: number | null;
  growthType?: 'positive' | 'negative' | 'neutral';
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  comparisonLabel?: string;
}

const colorClasses = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  orange: 'bg-premium-gold',
  purple: 'bg-purple-500',
  red: 'bg-red-500',
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  growth = 0,
  growthType = 'neutral',
  color = 'blue',
  comparisonLabel = 'vs previous period',
}: StatsCardProps) {
  const hasGrowthSection = growth !== undefined;
  const isNumericGrowth = typeof growth === 'number';
  const normalizedGrowth = isNumericGrowth ? (growth as number) : 0;
  const shouldShowTrendIcon = isNumericGrowth && growthType !== 'neutral' && normalizedGrowth !== 0;

  const growthFormatter = useMemo(
    () =>
      new Intl.NumberFormat('en-CA', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }),
    []
  );

  const formattedGrowth = useMemo(() => {
    if (!hasGrowthSection) {
      return 'N/A';
    }

    if (!isNumericGrowth) {
      return 'N/A';
    }

    if (normalizedGrowth === 0) {
      return '0%';
    }

    const formatted = growthFormatter.format(normalizedGrowth);
    return `${normalizedGrowth > 0 ? '+' : ''}${formatted}%`;
  }, [growthFormatter, normalizedGrowth, hasGrowthSection, isNumericGrowth]);

  const growthColorClass =
    !hasGrowthSection || !isNumericGrowth
      ? 'text-gray-600'
      : growthType === 'positive'
        ? 'text-green-600'
        : growthType === 'negative'
          ? 'text-red-600'
          : 'text-gray-600';

  return (
    <div className="rounded-lg bg-white p-5 sm:p-6 shadow overflow-hidden min-h-[140px] flex flex-col">
      <div className="flex items-start gap-3 sm:gap-4 flex-1">
        <div className="flex-shrink-0">
          <div className={`rounded-lg p-2.5 sm:p-3 ${colorClasses[color]}`}>
            <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div className="min-w-0 pr-1">
            <p className="text-xs sm:text-sm font-medium text-gray-500 truncate mb-1.5">{title}</p>
            <p
              className="text-xl sm:text-2xl font-semibold text-gray-900 leading-tight"
              style={{
                fontSize: 'clamp(0.875rem, 3.5vw + 0.25rem, 1.75rem)',
                lineHeight: '1.2',
              }}
              title={String(value)}
            >
              {value}
            </p>
          </div>
          {hasGrowthSection && (
            <div className="mt-3 pt-2 border-t border-gray-100 flex items-center gap-1.5 flex-wrap pr-1">
              {shouldShowTrendIcon &&
                (growthType === 'positive' ? (
                  <TrendingUp
                    className="h-3.5 w-3.5 flex-shrink-0 text-green-500"
                    aria-hidden="true"
                  />
                ) : (
                  <TrendingDown
                    className="h-3.5 w-3.5 flex-shrink-0 text-red-500"
                    aria-hidden="true"
                  />
                ))}
              <span className={`text-xs ${growthColorClass} whitespace-nowrap`}>
                {formattedGrowth}
              </span>
              <span className="text-xs text-gray-500 whitespace-nowrap">{comparisonLabel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
