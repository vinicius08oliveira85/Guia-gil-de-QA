import React, { useId, useState } from 'react';
import { cn } from '../../../utils/cn';
import {
  projectDashboardInsightChipClass,
  projectDashboardInsightMutedClass,
  projectDashboardInsightTextClass,
} from '../../common/projectCardUi';
import { INSIGHT_COLORS } from './insightTokens';

function polar(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

/** Arco SVG (stroke) entre ângulos em radianos. */
function describeArc(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const start = polar(cx, cy, r, a0);
  const end = polar(cx, cy, r, a1);
  const largeArc = a1 - a0 > Math.PI ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

type Slice = { value: number; fill: string; label: string };

export interface ExecutionStatusDonutProps {
  passed: number;
  failed: number;
  blocked: number;
  pending: number;
}

/**
 * Donut interativo com gaps entre fatias, hover e total no centro.
 */
export const ExecutionStatusDonut = React.memo(function ExecutionStatusDonut({
  passed,
  failed,
  blocked,
  pending,
}: ExecutionStatusDonutProps) {
  const gradId = useId();
  const [hoverLabel, setHoverLabel] = useState<string | null>(null);
  const total = passed + failed + blocked + pending;
  const cx = 56;
  const cy = 56;
  const r = 40;
  const stroke = 11;
  const gap = 0.06;

  if (total === 0) {
    return (
      <p className={cn('text-sm', projectDashboardInsightMutedClass)}>
        Sem casos de teste para exibir.
      </p>
    );
  }

  const slices: Slice[] = [
    { value: passed, fill: INSIGHT_COLORS.passed, label: 'Passou' },
    { value: failed, fill: INSIGHT_COLORS.failed, label: 'Falhou' },
    { value: blocked, fill: INSIGHT_COLORS.blocked, label: 'Bloqueado' },
    { value: pending, fill: INSIGHT_COLORS.pending, label: 'Pendente' },
  ];

  const active = slices.find(s => s.label === hoverLabel);
  const centerValue = active ? active.value : total;
  const centerLabel = active ? active.label : 'Total';

  let angle = -Math.PI / 2;
  const arcs: React.ReactNode[] = [];

  for (const s of slices) {
    if (s.value <= 0) continue;
    const sweep = (s.value / total) * 2 * Math.PI;
    const a0 = angle + gap / 2;
    const a1 = angle + sweep - gap / 2;
    if (a1 > a0) {
      const pct = Math.round((s.value / total) * 100);
      const dimmed = hoverLabel !== null && hoverLabel !== s.label;
      arcs.push(
        <path
          key={s.label}
          d={describeArc(cx, cy, r, a0, a1)}
          fill="none"
          stroke={s.fill}
          strokeWidth={hoverLabel === s.label ? stroke + 2 : stroke}
          strokeLinecap="round"
          className="cursor-pointer transition-[stroke-width,opacity,filter] duration-150"
          style={{
            opacity: dimmed ? 0.35 : 1,
            filter: hoverLabel === s.label ? 'brightness(1.08)' : undefined,
          }}
          onMouseEnter={() => setHoverLabel(s.label)}
          onMouseLeave={() => setHoverLabel(null)}
        >
          <title>
            {s.label}: {s.value} casos ({pct}% do total)
          </title>
        </path>
      );
    }
    angle += sweep;
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="dashboard-neu-donut-well relative shrink-0 rounded-full p-2">
        <svg
          width={120}
          height={120}
          viewBox="0 0 112 112"
          className="shrink-0"
          role="img"
          aria-label="Distribuição da execução de testes"
        >
          <desc>Passe o mouse nas fatias para ver totais e percentuais.</desc>
          <defs>
            <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="color-mix(in srgb, var(--project-dashboard-insight-accent) 8%, transparent)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle cx={cx} cy={cy} r={r} fill={`url(#${gradId})`} />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={INSIGHT_COLORS.track}
            strokeWidth={stroke}
            opacity={0.45}
          />
          {arcs}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={cn(
              'text-xl font-extrabold tabular-nums leading-none transition-colors sm:text-2xl',
              projectDashboardInsightTextClass
            )}
            style={active ? { color: active.fill } : undefined}
          >
            {centerValue}
          </span>
          <span className={cn('mt-0.5 text-[10px] font-semibold uppercase tracking-wider', projectDashboardInsightMutedClass)}>
            {centerLabel}
          </span>
        </div>
      </div>

      <ul className={cn('flex w-full flex-col gap-1.5 text-xs sm:w-auto', projectDashboardInsightMutedClass)}>
        {slices.map(s => {
          const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
          return (
            <li key={s.label}>
              <button
                type="button"
                className={cn(
                  'flex w-full cursor-default items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors',
                  hoverLabel === s.label && projectDashboardInsightChipClass
                )}
                onMouseEnter={() => s.value > 0 && setHoverLabel(s.label)}
                onMouseLeave={() => setHoverLabel(null)}
                aria-label={`${s.label}: ${s.value} casos, ${pct}%`}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-white/40"
                  style={{ background: s.fill }}
                  aria-hidden
                />
                <span className="min-w-0 flex-1 truncate">{s.label}</span>
                <strong className={cn('tabular-nums', projectDashboardInsightTextClass)}>{s.value}</strong>
                <span className="w-8 text-right tabular-nums opacity-70">{pct}%</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
});

ExecutionStatusDonut.displayName = 'ExecutionStatusDonut';
