import React from 'react';
import { ListChecks, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  formatWorkspaceStatCount,
  glassIndicatorBadgeClass,
  glassIndicatorCardClass,
  glassIndicatorIconClass,
  glassIndicatorIconMutedClass,
  glassIndicatorLabelClass,
  glassIndicatorModifierClass,
  glassIndicatorValueClass,
  glassIndicatorValueMutedClass,
} from '../common/projectCardUi';

/** Tokens semânticos DaisyUI expostos na API pública dos indicadores. */
export type IndicatorColorTheme =
  | 'primary'
  | 'warning'
  | 'warningContrast'
  | 'info'
  | 'success'
  | 'error'
  | 'neutral';

export interface SmallIndicatorItem {
  label: string;
  value: number | string;
  modifier: string;
  icon: LucideIcon;
  colorTheme: IndicatorColorTheme;
  onClick?: () => void;
  isActive?: boolean;
  trend?: 'up' | 'down' | 'neutral';
  progressValue?: number;
}

function formatIndicatorValue(value: number | string): string {
  if (value === '—' || value === '-') return '—';
  if (typeof value === 'number') return formatWorkspaceStatCount(value);
  return value;
}

function isInactiveValue(value: number | string): boolean {
  return value === '—' || value === '-';
}

/** Mini ring progress — laranja Leve */
function MiniRingProgress({
  value,
  size = 36,
}: {
  value: number;
  colorClass?: string;
  size?: number;
}) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, value));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="h-full w-full -rotate-90" viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          className="text-[color-mix(in_srgb,var(--workspace-stat-text)_18%,transparent)]"
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        <circle
          className="text-[var(--workspace-stat-accent)] transition-all duration-700 ease-out"
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          r={radius}
          stroke="currentColor"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
      </svg>
      <span
        className={cn(
          glassIndicatorBadgeClass,
          'absolute inset-0 flex items-center justify-center bg-transparent text-[9px]'
        )}
        aria-label={`${value}%`}
      >
        {value}%
      </span>
    </div>
  );
}

function TrendIndicator({ trend }: { trend: 'up' | 'down' | 'neutral' }) {
  if (trend === 'up') {
    return (
      <span className={cn(glassIndicatorBadgeClass, 'gap-0.5')}>
        <TrendingUp className="h-3 w-3" strokeWidth={1.75} aria-hidden />
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span className={cn(glassIndicatorBadgeClass, 'gap-0.5')}>
        <TrendingDown className="h-3 w-3" strokeWidth={1.75} aria-hidden />
      </span>
    );
  }
  return (
    <span
      className={cn(
        glassIndicatorBadgeClass,
        'gap-0.5 bg-[color-mix(in_srgb,var(--workspace-stat-text)_12%,transparent)] text-[var(--workspace-stat-text)] opacity-65'
      )}
    >
      <Minus className="h-3 w-3" strokeWidth={1.75} aria-hidden />
    </span>
  );
}

function SmallIndicatorCard({ item }: { item: SmallIndicatorItem }) {
  const Icon = item.icon;
  const isClickable = !!item.onClick;
  const hasProgress = typeof item.progressValue === 'number';
  const inactive = isInactiveValue(item.value);
  const displayValue = formatIndicatorValue(item.value);

  const interactiveClasses = isClickable
    ? 'group cursor-pointer hover:border-[color-mix(in_srgb,var(--workspace-stat-accent)_35%,transparent)] hover:shadow-[0_4px_14px_rgba(252,76,2,0.1)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--workspace-stat-accent)_40%,transparent)] focus-visible:ring-offset-2 motion-reduce:transform-none'
    : '';

  const activeClasses = item.isActive
    ? 'border-[color-mix(in_srgb,var(--workspace-stat-accent)_45%,transparent)] ring-2 ring-[color-mix(in_srgb,var(--workspace-stat-accent)_25%,transparent)]'
    : '';

  return (
    <div
      className={cn(
        glassIndicatorCardClass,
        'min-h-[4rem] gap-1.5 sm:min-h-[4.25rem] sm:gap-2',
        interactiveClasses,
        activeClasses
      )}
      role={isClickable ? 'button' : 'article'}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={
        isClickable
          ? `${item.label}: ${displayValue} ${item.modifier}. Clique para filtrar.`
          : `${item.label}: ${displayValue} ${item.modifier}`
      }
      onClick={item.onClick}
      onKeyDown={
        isClickable && item.onClick
          ? e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                item.onClick!();
              }
            }
          : undefined
      }
    >
      <div className="flex w-full items-center justify-center gap-1.5">
        <Icon
          className={cn(inactive ? glassIndicatorIconMutedClass : glassIndicatorIconClass)}
          strokeWidth={1.75}
          aria-hidden
        />
        <span className={glassIndicatorLabelClass}>{item.label}</span>
      </div>

      <div className="flex items-center justify-center gap-1.5">
        <span className={inactive ? glassIndicatorValueMutedClass : glassIndicatorValueClass}>
          {displayValue}
        </span>
        {item.trend ? <TrendIndicator trend={item.trend} /> : null}
      </div>

      {hasProgress ? (
        <div className="flex justify-center">
          <MiniRingProgress value={item.progressValue!} />
        </div>
      ) : null}

      <span className={glassIndicatorModifierClass}>{item.modifier}</span>
    </div>
  );
}

export interface ExecutionAutomationProps {
  executedTestCases: number;
  totalTestCases: number;
  automationRatio: number;
  projectName: string;
  executionTrend?: string;
  automationTrend?: string;
}

export function ExecutionAutomationCard({
  executedTestCases,
  totalTestCases,
  automationRatio,
  projectName,
  executionTrend,
  automationTrend,
}: ExecutionAutomationProps) {
  const executionPercent =
    totalTestCases > 0 ? Math.round((executedTestCases / totalTestCases) * 100) : 0;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (automationRatio / 100) * circumference;

  return (
    <div
      className="relative overflow-hidden rounded-[var(--rounded-box)] border border-base-300/50 bg-gradient-to-br from-base-100 to-base-100/95 p-4 backdrop-blur-md transition-all duration-300 dark:border-base-content/8 dark:from-base-200/60 dark:to-base-200/40 sm:p-5"
      role="region"
      aria-label="Execução de Testes e Automatizados"
    >
      <div
        className="absolute -left-10 bottom-0 h-64 w-64 rounded-full bg-primary/15 blur-3xl opacity-50 dark:bg-primary/20"
        aria-hidden
      />
      <div className="relative z-10 grid grid-cols-1 items-center gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="space-y-3 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 dark:bg-primary/15"
                aria-hidden
              >
                <ListChecks className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading text-lg font-bold leading-tight text-base-content sm:text-xl">
                  Execução de Testes
                </h3>
                <p
                  className="truncate text-sm font-medium text-base-content/65"
                  title={projectName}
                >
                  {projectName}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span
                className="text-2xl font-bold tabular-nums text-primary sm:text-3xl"
                aria-label={`${executionPercent}% de execução`}
              >
                {executionPercent}%
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div
              className="h-3 w-full overflow-hidden rounded-full border border-base-300/40 bg-base-200/80 dark:bg-base-300/60"
              role="progressbar"
              aria-valuenow={executionPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progresso: ${executionPercent}%, ${executedTestCases} de ${totalTestCases} casos executados`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary via-primary/90 to-primary/80 shadow-[0_0_8px_color-mix(in_srgb,var(--color-primary)_40%,transparent)] transition-all duration-700 ease-out"
                style={{ width: `${executionPercent}%` }}
              />
            </div>
            <div className="flex flex-wrap justify-between gap-x-2 text-xs font-semibold uppercase tracking-wide text-base-content/65">
              <span>{executedTestCases} executados</span>
              <span>Total {totalTestCases}</span>
            </div>
          </div>
          {executionTrend != null && executionTrend !== '' && (
            <p className="text-sm text-base-content/60">{executionTrend}</p>
          )}
        </div>
        <div className="flex items-center justify-center border-t border-base-300/50 pt-4 lg:col-span-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center sm:h-[5.5rem] sm:w-[5.5rem]">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 96 96" aria-hidden>
                <circle
                  className="text-base-200 dark:text-base-300"
                  cx="48"
                  cy="48"
                  fill="transparent"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                />
                <circle
                  className="text-primary transition-all duration-1000 ease-out"
                  cx="48"
                  cy="48"
                  fill="transparent"
                  r="40"
                  stroke="currentColor"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              </svg>
              <span
                className="absolute text-base font-bold tabular-nums text-base-content sm:text-lg"
                aria-label={`${automationRatio}% automatizados`}
              >
                {automationRatio}%
              </span>
            </div>
            <div className="min-w-0">
              <span className="mb-0.5 block text-xs font-bold uppercase tracking-wide text-base-content/65">
                Automação
              </span>
              <span className="text-lg font-bold text-base-content">Automatizados</span>
              {automationTrend != null && automationTrend !== '' && (
                <div className="mt-1 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 shrink-0 text-success" aria-hidden />
                  <span className="text-xs font-semibold text-success sm:text-sm">
                    {automationTrend}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface GlassIndicatorCardsProps {
  items: SmallIndicatorItem[];
  execution?: ExecutionAutomationProps;
  columns?: 4 | 5;
}

const indicatorGridClass: Record<4 | 5, string> = {
  4: 'grid grid-cols-2 gap-1.5 sm:grid-cols-2 sm:gap-2 lg:grid-cols-4',
  5: 'grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 lg:grid-cols-5',
};

export function GlassIndicatorCards({ items, execution, columns = 5 }: GlassIndicatorCardsProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className={indicatorGridClass[columns]}>
        {items.map((item, index) => (
          <SmallIndicatorCard key={`${item.label}-${index}`} item={item} />
        ))}
      </div>
      {execution != null ? <ExecutionAutomationCard {...execution} /> : null}
    </div>
  );
}

export { SmallIndicatorCard };
