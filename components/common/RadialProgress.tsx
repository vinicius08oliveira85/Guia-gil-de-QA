import React, { useId, useMemo } from 'react';
import { cn } from '../../utils/cn';

export interface RadialProgressProps {
  /** Valor 0–100. */
  value: number;
  /** Diâmetro em px. */
  size?: number;
  /** Espessura do anel em px. */
  strokeWidth?: number;
  /** Rótulo acessível (ex.: "Conclusão de tarefas"). */
  ariaLabel: string;
  /** Conteúdo central (ex.: "68%"). Quando ausente, exibe o valor arredondado. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Anel de progresso circular (SVG) com gradiente da marca e trilho neumórfico.
 * Componente moderno e reutilizável para destacar um KPI principal.
 */
export const RadialProgress = React.memo<RadialProgressProps>(
  ({ value, size = 56, strokeWidth = 6, ariaLabel, children, className }) => {
    const gradientId = useId();
    const progress = Math.min(100, Math.max(0, Math.round(value)));

    const { radius, circumference, dashOffset, center } = useMemo(() => {
      const r = (size - strokeWidth) / 2;
      const c = 2 * Math.PI * r;
      return {
        radius: r,
        circumference: c,
        dashOffset: c - (progress / 100) * c,
        center: size / 2,
      };
    }, [size, strokeWidth, progress]);

    return (
      <div
        className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
        style={{ width: size, height: size }}
        role="img"
        aria-label={`${ariaLabel}: ${progress}%`}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          aria-hidden
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop
                offset="0%"
                stopColor="color-mix(in srgb, var(--project-card-accent) 70%, white)"
              />
              <stop offset="100%" stopColor="var(--project-card-accent)" />
            </linearGradient>
          </defs>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            stroke="color-mix(in srgb, var(--project-card-neu-dark) 30%, var(--project-card-bg))"
          />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            stroke={`url(#${gradientId})`}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center">
          {children ?? (
            <span className="font-sans text-sm font-extrabold tabular-nums text-[var(--project-card-accent)]">
              {progress}%
            </span>
          )}
        </span>
      </div>
    );
  }
);

RadialProgress.displayName = 'RadialProgress';
