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
  /**
   * Estilos extras no contêiner. Use para sobrescrever as cores via variáveis CSS:
   * `--radial-accent` (cor do progresso) e `--radial-track` (cor do trilho).
   */
  style?: React.CSSProperties;
}

const DEFAULT_ACCENT = 'var(--radial-accent, var(--project-card-accent))';
const DEFAULT_TRACK =
  'var(--radial-track, color-mix(in srgb, var(--project-card-neu-dark) 30%, var(--project-card-bg)))';

/**
 * Anel de progresso circular (SVG) com gradiente da marca e trilho neumórfico.
 * Componente moderno e reutilizável para destacar um KPI principal.
 * As cores podem ser ajustadas por contexto via variáveis CSS `--radial-accent`
 * e `--radial-track` (passadas em `style`).
 */
export const RadialProgress = React.memo<RadialProgressProps>(
  ({ value, size = 56, strokeWidth = 6, ariaLabel, children, className, style }) => {
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
        style={{ width: size, height: size, ...style }}
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
              <stop offset="0%" stopColor={`color-mix(in srgb, ${DEFAULT_ACCENT} 70%, white)`} />
              <stop offset="100%" stopColor={DEFAULT_ACCENT} />
            </linearGradient>
          </defs>
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            stroke={DEFAULT_TRACK}
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
            <span
              className="font-sans text-sm font-extrabold tabular-nums"
              style={{ color: DEFAULT_ACCENT }}
            >
              {progress}%
            </span>
          )}
        </span>
      </div>
    );
  }
);

RadialProgress.displayName = 'RadialProgress';
