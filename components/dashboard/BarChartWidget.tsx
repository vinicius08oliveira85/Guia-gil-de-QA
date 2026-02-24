import React, { useState } from 'react';
import { Card } from '../common/Card';
import { cn } from '../../utils/cn';

type BarChartWidgetProps = {
  title: string;
  data: { label: string; value: number; color: string }[];
  rawData: { label: string; value: number; color: string }[];
  className?: string;
  onBarClick?: (label: string, value: number) => void;
  interactive?: boolean;
};

export const BarChartWidget: React.FC<BarChartWidgetProps> = ({
  title,
  data,
  rawData,
  className = '',
  onBarClick,
  interactive = false,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <Card className={cn('!p-4 sm:!p-6', className)}>
      <div className="flex items-center justify-between gap-4">
        <h4 className="text-base font-semibold text-base-content text-[clamp(1rem,2vw,1.3rem)]">
          {title}
        </h4>
        <span className="text-xs text-base-content/60">Atualizado</span>
      </div>
      <div className="mt-4 space-y-4">
        {data.map((item, index) => (
          <div
            key={item.label}
            className={cn(interactive && 'cursor-pointer', 'transition-all')}
            onClick={() => interactive && onBarClick?.(item.label, rawData[index].value)}
            onMouseEnter={() => interactive && setHoveredIndex(index)}
            onMouseLeave={() => interactive && setHoveredIndex(null)}
          >
            <div className="flex items-center justify-between text-[clamp(0.78rem,1.6vw,0.9rem)] text-base-content/70">
              <span
                className={cn(
                  interactive && hoveredIndex === index && 'text-primary font-semibold',
                  'transition-all'
                )}
              >
                {item.label}
              </span>
              <span
                className={cn(
                  'font-semibold text-base-content',
                  interactive && hoveredIndex === index && 'text-primary scale-110',
                  'transition-all'
                )}
              >
                {rawData[index].value}
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-base-200 overflow-hidden">
              <div
                className={cn(
                  `h-2 rounded-full ${item.color}`,
                  'transition-all',
                  interactive && hoveredIndex === index && 'h-3 shadow-lg',
                  interactive && hoveredIndex === index && 'ring-2 ring-primary/20'
                )}
                style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }}
                role="progressbar"
                aria-valuenow={Math.round(item.value)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={item.label}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
