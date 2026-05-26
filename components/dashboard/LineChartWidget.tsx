import React from 'react';
import { Card } from '../common/Card';
import { dashboardChartContainerClass } from './dashboardNeuUi';

interface SeriesInfo {
  name: string;
  color: string;
}

interface ChartData {
  date: number;
  series: number[];
}

type LineChartWidgetProps = {
  title: string;
  data: ChartData[];
  series: SeriesInfo[];
  className?: string;
};

export const LineChartWidget: React.FC<LineChartWidgetProps> = ({
  title,
  data,
  series,
  className = '',
}) => {
  if (data.length < 2) {
    return (
      <Card className={`!p-4 sm:!p-6 ${className}`}>
        <h4 className="text-lg font-semibold text-base-content mb-2">{title}</h4>
        <div className="flex h-48 items-center justify-center rounded-[var(--rounded-box)] border border-dashed border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] text-base-content/60">
          Dados insuficientes para exibir o gráfico.
        </div>
      </Card>
    );
  }

  const maxValue = Math.max(...data.flatMap(d => d.series), 1);
  const minDate = data[0].date;
  const maxDate = data[data.length - 1].date;

  const formatDate = (timestamp: number) => {
    const formatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
    return formatter.format(new Date(timestamp));
  };

  const getPoints = (seriesIndex: number) =>
    data
      .map((point, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - (point.series[seriesIndex] / maxValue) * 100;
        return `${x},${y}`;
      })
      .join(' ');

  return (
    <Card className={`!p-4 sm:!p-6 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-lg font-semibold text-base-content">{title}</h4>
        <span className="text-xs text-base-content/70">
          {formatDate(minDate)} — {formatDate(maxDate)}
        </span>
      </div>
      <div className={dashboardChartContainerClass}>
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              className="stroke-base-content/12 dark:stroke-base-content/18"
              strokeWidth="0.3"
            />
          ))}
          {series.map((s, index) => (
            <polyline
              key={s.name}
              fill="none"
              className={s.color}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={getPoints(index)}
            />
          ))}
        </svg>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.2em] text-base-content/70">
        {series.map(item => (
          <span key={item.name} className="inline-flex items-center gap-2">
            <span className={`h-2 w-6 rounded-full ${item.color.replace('stroke', 'bg')}`} />
            {item.name}
          </span>
        ))}
      </div>
    </Card>
  );
};
