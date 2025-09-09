import React from 'react';

interface DataPoint {
  label: string;
  value: number;
}

interface ChartProps {
  data: DataPoint[];
  type?: 'bar' | 'line';
  title?: string;
  className?: string;
}

export default function Chart({ data, type = 'bar', title, className = '' }: ChartProps) {
  const maxValue = Math.max(...data.map(d => d.value));
  const chartHeight = 200;
  const chartWidth = 400;

  return (
    <div className={`p-4 bg-white dark:bg-dark-2 rounded-lg border border-neutral-200 dark:border-neutral-700 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-primary-light dark:text-white">
          {title}
        </h3>
      )}
      <div className="relative">
        <svg
          width={chartWidth}
          height={chartHeight}
          className="overflow-visible"
          role="img"
          aria-labelledby="chart-title"
        >
          <title id="chart-title">{title || 'Chart'}</title>

          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Bars or Line */}
          {data.map((point, index) => {
            const x = (index * chartWidth) / data.length;
            const barWidth = chartWidth / data.length - 10;
            const height = (point.value / maxValue) * (chartHeight - 40);
            const y = chartHeight - height - 20;

            if (type === 'bar') {
              return (
                <rect
                  key={index}
                  x={x + 5}
                  y={y}
                  width={barWidth}
                  height={height}
                  fill="#0ea5e9"
                  className="hover:fill-primary-700 transition-colors"
                />
              );
            } else {
              // Line chart - simplified
              const nextPoint = data[index + 1];
              if (nextPoint) {
                const nextX = ((index + 1) * chartWidth) / data.length;
                const nextHeight = (nextPoint.value / maxValue) * (chartHeight - 40);
                const nextY = chartHeight - nextHeight - 20;

                return (
                  <line
                    key={index}
                    x1={x + barWidth / 2}
                    y1={y + height}
                    x2={nextX + barWidth / 2}
                    y2={nextY + nextHeight}
                    stroke="#0ea5e9"
                    strokeWidth="2"
                  />
                );
              }
              return null;
            }
          })}

          {/* Labels */}
          {data.map((point, index) => {
            const x = (index * chartWidth) / data.length + (chartWidth / data.length) / 2;
            return (
              <text
                key={index}
                x={x}
                y={chartHeight - 5}
                textAnchor="middle"
                className="text-xs fill-secondary-light dark:fill-neutral-400"
              >
                {point.label}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}