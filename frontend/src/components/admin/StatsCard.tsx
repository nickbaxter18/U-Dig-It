'use client';

import { useMemo } from 'react';

import { TrendingDown, TrendingUp } from 'lucide-react';

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
  orange: 'bg-kubota-orange',
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
  const shouldShowTrendIcon =
    isNumericGrowth && growthType !== 'neutral' && normalizedGrowth !== 0;

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
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`rounded-lg p-3 ${colorClasses[color]}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {hasGrowthSection && (
            <div className="mt-1 flex items-center">
              {shouldShowTrendIcon &&
                (growthType === 'positive' ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                ))}
              <span className={`ml-1 text-sm ${growthColorClass}`}>
                {formattedGrowth}
              </span>
              <span className="ml-1 text-sm text-gray-500">{comparisonLabel}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
