/**
 * Lightweight Line Chart Component (Recharts Replacement)
 *
 * Pure CSS/SVG implementation, zero JavaScript dependencies
 * Perfect for showing trends over time
 *
 * @see QUICK_WIN_3_BUNDLE_OPTIMIZATION.md
 */


export interface LineChartDataPoint {
  label: string;
  value: number;
  description?: string;
}

interface SimpleLineChartProps {
  data: LineChartDataPoint[];
  title?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  height?: number;
  color?: string;
  showDots?: boolean;
  showGrid?: boolean;
  fillArea?: boolean;
  animated?: boolean;
}

export function SimpleLineChart({
  data,
  title,
  valuePrefix = '',
  valueSuffix = '',
  height = 300,
  color = '#3B82F6',
  showDots = true,
  showGrid = true,
  fillArea = false,
  animated = true,
}: SimpleLineChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const minValue = Math.min(...data.map(d => d.value), 0);
  const range = maxValue - minValue || 1;

  // Calculate SVG path
  const width = 800;
  const chartHeight = height - 60; // Reserve space for labels
  const padding = 40;

  const points = data.map((point: any, index: any) => {
    const x = (index / (data.length - 1 || 1)) * (width - padding * 2) + padding;
    const y = chartHeight - ((point.value - minValue) / range) * (chartHeight - padding) + padding / 2;
    return { x, y, ...point };
  });

  // Create SVG path for line
  const linePath = points
    .map((point: any, index: any) => `${index === 0 ? 'M' : 'L'} ${point.x},${point.y}`)
    .join(' ');

  // Create SVG path for area fill
  const areaPath = fillArea
    ? `${linePath} L ${points[points.length - 1].x},${chartHeight} L ${points[0].x},${chartHeight} Z`
    : '';

  return (
    <div className="w-full" aria-label={title || 'Line chart'} role="img">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-gray-900">{title}</h3>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ height: `${height}px` }}
        role="graphics-document"
        aria-label="Line chart visualization"
      >
        {/* Grid lines */}
        {showGrid && (
          <g aria-hidden="true">
            {[0, 25, 50, 75, 100].map((percent: any) => {
              const y = chartHeight - (percent / 100) * (chartHeight - padding) + padding / 2;
              return (
                <line
                  key={percent}
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="#E5E7EB"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
              );
            })}
          </g>
        )}

        {/* Area fill */}
        {fillArea && (
          <path
            d={areaPath}
            fill={color}
            fillOpacity="0.1"
            className={animated ? 'animate-fadeIn' : ''}
          />
        )}

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-all duration-500 ${animated ? 'animate-fadeIn' : ''}`}
          role="graphics-symbol"
          aria-label="Trend line"
        />

        {/* Data points */}
        {showDots && points.map((point: any, index: any) => (
          <g key={index} role="graphics-symbol" aria-label={`${point.label}: ${valuePrefix}${point.value}${valueSuffix}`}>
            <circle
              cx={point.x}
              cy={point.y}
              r="6"
              fill="white"
              stroke={color}
              strokeWidth="3"
              className={`transition-all duration-300 hover:r-8 cursor-pointer ${
                animated ? 'animate-scaleIn' : ''
              }`}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <title>{point.description || `${point.label}: ${valuePrefix}${point.value}${valueSuffix}`}</title>
            </circle>
          </g>
        ))}

        {/* X-axis labels */}
        {points.map((point: any, index: any) => (
          <text
            key={index}
            x={point.x}
            y={chartHeight + 25}
            textAnchor="middle"
            className="text-xs fill-gray-600"
            aria-label={`Label: ${point.label}`}
          >
            {point.label}
          </text>
        ))}
      </svg>

      {/* Screen reader summary */}
      <div className="sr-only" role="status">
        Line chart with {data.length} data points showing trend.
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
 * <SimpleLineChart
 *   title="Revenue Trend (2025)"
 *   data={[
 *     { label: 'Jan', value: 12500 },
 *     { label: 'Feb', value: 15800 },
 *     { label: 'Mar', value: 18200 },
 *     { label: 'Apr', value: 16500 },
 *   ]}
 *   valuePrefix="$"
 *   color="#10B981"
 *   fillArea
 *   animated
 * />
 */



