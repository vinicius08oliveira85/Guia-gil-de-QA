import React, { useId, useMemo, useState } from 'react';
import { cn } from '../../../utils/cn';
import { dashboardInsightWellClass } from '../dashboardNeuUi';
import { INSIGHT_COLORS } from './insightTokens';

export interface DefectTrendChartProps {
  values: number[];
}

/**
 * Sparkline com área em gradiente, pontos interativos e tooltip flutuante.
 */
export const DefectTrendChart = React.memo(function DefectTrendChart({
  values,
}: DefectTrendChartProps) {
  const gradId = useId();
  const [hover, setHover] = useState<number | null>(null);
  const w = 220;
  const h = 72;
  const padX = 8;
  const padY = 10;

  const { pts, pathLine, pathArea, max } = useMemo(() => {
    const maxV = Math.max(...values, 1);
    const n = values.length;
    const points = values.map((v, i) => {
      const x = padX + (n <= 1 ? (w - padX * 2) / 2 : (i / (n - 1)) * (w - padX * 2));
      const y = padY + (1 - v / maxV) * (h - padY * 2);
      return { x, y, v, i };
    });
    const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
    const area =
      points.length === 0
        ? ''
        : `${line} L ${points[points.length - 1].x.toFixed(1)} ${(h - padY / 2).toFixed(1)} L ${points[0].x.toFixed(1)} ${(h - padY / 2).toFixed(1)} Z`;
    return { pts: points, pathLine: line, pathArea: area, max: maxV };
  }, [values]);

  const active = hover != null ? pts[hover] : null;

  return (
    <div className={cn(dashboardInsightWellClass, 'relative w-full max-w-full')}>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-[4.5rem] w-full overflow-visible"
        role="img"
        aria-label="Tendência de bugs criados por semana"
        onMouseLeave={() => setHover(null)}
      >
        <desc>Passe o mouse nos pontos para ver bugs por semana.</desc>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={INSIGHT_COLORS.brand} stopOpacity={0.35} />
            <stop offset="100%" stopColor={INSIGHT_COLORS.brand} stopOpacity={0.02} />
          </linearGradient>
        </defs>

        {/* baseline grid */}
        {[0.25, 0.5, 0.75].map(t => {
          const y = padY + t * (h - padY * 2);
          return (
            <line
              key={t}
              x1={padX}
              x2={w - padX}
              y1={y}
              y2={y}
              stroke="color-mix(in srgb, var(--project-dashboard-insight-text) 10%, transparent)"
              strokeDasharray="3 4"
            />
          );
        })}

        <path d={pathArea} fill={`url(#${gradId})`} className="pointer-events-none" />
        <path
          d={pathLine}
          fill="none"
          stroke={INSIGHT_COLORS.brand}
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none"
        />

        {pts.map(p => {
          const isActive = hover === p.i;
          return (
            <g key={p.i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={12}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => setHover(p.i)}
              >
                <title>
                  Semana {p.i + 1}: {p.v} bug{p.v === 1 ? '' : 's'}
                </title>
              </circle>
              <circle
                cx={p.x}
                cy={p.y}
                r={isActive ? 4.5 : 3}
                fill={isActive ? INSIGHT_COLORS.brand : 'var(--project-dashboard-insight-bg)'}
                stroke={INSIGHT_COLORS.brand}
                strokeWidth={2}
                className="pointer-events-none transition-all duration-150"
              />
            </g>
          );
        })}
      </svg>

      {active ? (
        <div
          className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 rounded-lg px-2.5 py-1 text-[11px] font-semibold shadow-md"
          style={{
            background: 'var(--project-dashboard-insight-bg)',
            color: INSIGHT_COLORS.text,
            border: `1px solid color-mix(in srgb, ${INSIGHT_COLORS.brand} 35%, transparent)`,
          }}
          role="status"
        >
          Semana {active.i + 1}:{' '}
          <span style={{ color: INSIGHT_COLORS.brand }}>
            {active.v} bug{active.v === 1 ? '' : 's'}
          </span>
          <span className="ml-1 opacity-60">/ máx {max}</span>
        </div>
      ) : null}
    </div>
  );
});

DefectTrendChart.displayName = 'DefectTrendChart';
