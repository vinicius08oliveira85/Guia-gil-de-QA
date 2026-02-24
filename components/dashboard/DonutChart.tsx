import React, { useState } from 'react';
import { Card } from '../common/Card';
import { cn } from '../../utils/cn';

type DonutChartProps = {
  title: string;
  percentage: number;
  color: string;
  note?: string;
  className?: string;
  size?: 'sm' | 'md';
  onClick?: () => void;
  interactive?: boolean;
};

export const DonutChart: React.FC<DonutChartProps> = ({
  title,
  percentage,
  color,
  note,
  className = '',
  size = 'md',
  onClick,
  interactive = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const dimension = size === 'sm' ? 96 : 128;

  return (
    <Card
      className={cn(
        '!p-4 sm:!p-6 !gap-2',
        interactive && 'hover:shadow-lg hover:border-primary/30 transition-all',
        interactive && 'cursor-pointer',
        className
      )}
      onClick={interactive ? onClick : undefined}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-base-content/70">{title}</p>
          {note ? <p className="text-muted text-[clamp(0.8rem,1.6vw,0.95rem)]">{note}</p> : null}
        </div>
        <div
          className={cn(
            'rounded-2xl bg-base-200 px-3 py-1 text-[clamp(0.75rem,1.8vw,0.9rem)] font-semibold text-base-content',
            interactive && isHovered && 'ring-2 ring-primary/20'
          )}
          aria-hidden="true"
        >
          {percentage}%
        </div>
      </div>
      <div className="relative mx-auto flex items-center justify-center">
        <svg
          className={cn(
            'drop-shadow-[0_12px_35px_rgba(4,4,17,0.18)]',
            interactive && 'transition-all',
            interactive && isHovered && 'scale-105'
          )}
          viewBox="0 0 120 120"
          width={dimension}
          height={dimension}
          role="img"
          aria-label={`${title} em ${percentage}%`}
        >
          <circle
            className="text-white/5"
            strokeWidth="12"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="60"
            cy="60"
          />
          <circle
            className={cn(
              `transition-all duration-500 ease-out ${color}`,
              interactive && isHovered && 'stroke-[14]'
            )}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="60"
            cy="60"
            transform="rotate(-90 60 60)"
          />
        </svg>
        <div
          className={cn(
            'absolute flex flex-col items-center',
            interactive && 'transition-all',
            interactive && isHovered && 'scale-110'
          )}
        >
          <span className="text-[clamp(1.35rem,3vw,2rem)] font-semibold text-base-content">
            {percentage}%
          </span>
          <span className="text-xs uppercase tracking-[0.2em] text-base-content/60">Atual</span>
        </div>
      </div>
    </Card>
  );
};
