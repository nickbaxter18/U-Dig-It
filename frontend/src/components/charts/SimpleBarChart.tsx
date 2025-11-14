/**
 * Lightweight Bar Chart Component (Recharts Replacement)
 *
 * Replaces 80KB recharts library with pure CSS/HTML
 * Zero dependencies, full accessibility support
 *
 * @see QUICK_WIN_3_BUNDLE_OPTIMIZATION.md
 */


export interface BarChartData {
  label: string;
  value: number;
  color?: string;
  description?: string;
}

interface SimpleBarChartProps {
  data: BarChartData[];
  title?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  height?: number;
  showValues?: boolean;
  showGrid?: boolean;
  animated?: boolean;
}

export function SimpleBarChart({
  data,
  title,
  valuePrefix = '',
  valueSuffix = '',
  height = 300,
  showValues = true,
  showGrid = true,
  animated = true,
}: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1); // Avoid division by zero

  return (
    <div className="w-full" aria-label={title || 'Bar chart'} role="img">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
      )}

      <div
        className="relative w-full"
        style={{ height: `${height}px` }}
        aria-label="Chart container"
      >
        {/* Grid lines (optional) */}
        {showGrid && (
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            {[0, 25, 50, 75, 100].map((percent: any) => (
              <div
                key={percent}
                className="border-t border-gray-200"
                aria-hidden="true"
              />
            ))}
          </div>
        )}

        {/* Bars */}
        <div className="absolute inset-0 flex items-end justify-around gap-2 px-4">
          {data.map((item: any, index: any) => {
            const barHeight = (item.value / maxValue) * 100;
            const barColor = item.color || '#3B82F6'; // Default blue

            return (
              <div
                key={index}
                className="flex flex-col items-center flex-1 max-w-[120px]"
                role="group"
                aria-label={`${item.label}: ${valuePrefix}${item.value}${valueSuffix}`}
              >
                {/* Value label */}
                {showValues && (
                  <div
                    className="text-sm font-semibold text-gray-900 mb-2"
                    aria-label={`Value: ${valuePrefix}${item.value}${valueSuffix}`}
                  >
                    {valuePrefix}{item.value.toLocaleString()}{valueSuffix}
                  </div>
                )}

                {/* Bar */}
                <div className="w-full relative">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 hover:opacity-80 cursor-pointer ${
                      animated ? 'animate-scaleIn' : ''
                    }`}
                    style={{
                      height: `${barHeight}%`,
                      backgroundColor: barColor,
                      minHeight: barHeight > 0 ? '4px' : '0',
                    }}
                    title={item.description || `${item.label}: ${valuePrefix}${item.value}${valueSuffix}`}
                    role="graphics-symbol"
                    aria-label={`Bar for ${item.label}`}
                  />
                </div>

                {/* Label */}
                <div
                  className="text-xs text-gray-600 mt-2 text-center w-full truncate"
                  title={item.label}
                  aria-label={`Label: ${item.label}`}
                >
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Screen reader summary */}
      <div className="sr-only" role="status">
        Chart showing {data.length} bars.
        {data.map((item: any, i: any) => (
          <span key={i}>
            {item.label}: {valuePrefix}{item.value}{valueSuffix}.
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Horizontal Bar Chart Variant
 */
export function SimpleHorizontalBarChart({
  data,
  title,
  valuePrefix = '',
  valueSuffix = '',
  height = 400,
  showValues = true,
  animated = true,
}: SimpleBarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="w-full" aria-label={title || 'Horizontal bar chart'} role="img">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
      )}

      <div
        className="space-y-4"
        style={{ maxHeight: `${height}px`, overflowY: 'auto' }}
      >
        {data.map((item: any, index: any) => {
          const barWidth = (item.value / maxValue) * 100;
          const barColor = item.color || '#3B82F6';

          return (
            <div
              key={index}
              className="flex items-center gap-4"
              role="group"
              aria-label={`${item.label}: ${valuePrefix}${item.value}${valueSuffix}`}
            >
              {/* Label */}
              <div className="w-32 text-sm text-gray-700 font-medium truncate" title={item.label}>
                {item.label}
              </div>

              {/* Bar container */}
              <div className="flex-1 bg-gray-100 rounded-full h-10 relative overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 hover:opacity-80 ${
                    animated ? 'animate-slideInRight' : ''
                  }`}
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: barColor,
                    minWidth: barWidth > 0 ? '20px' : '0',
                  }}
                  title={item.description || `${item.label}: ${valuePrefix}${item.value}${valueSuffix}`}
                  role="graphics-symbol"
                />
              </div>

              {/* Value */}
              {showValues && (
                <div className="w-24 text-right font-semibold text-gray-900">
                  {valuePrefix}{item.value.toLocaleString()}{valueSuffix}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Screen reader summary */}
      <div className="sr-only" role="status">
        Horizontal bar chart with {data.length} items.
        {data.map((item: any, i: any) => (
          <span key={i}>
            {item.label}: {valuePrefix}{item.value}{valueSuffix}.
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Example Usage:
 *
 * <SimpleBarChart
 *   title="Monthly Revenue"
 *   data={[
 *     { label: 'Jan', value: 12500, color: '#3B82F6' },
 *     { label: 'Feb', value: 15800, color: '#10B981' },
 *     { label: 'Mar', value: 18200, color: '#F59E0B' },
 *   ]}
 *   valuePrefix="$"
 *   showValues
 *   animated
 * />
 */



