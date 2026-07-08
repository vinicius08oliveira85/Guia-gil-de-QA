import React from 'react';
import { ListChecks, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { RadialProgress } from '../common/RadialProgress';
import { dashboardKpiIconPlateClass } from './dashboardNeuUi';
import {
  formatWorkspaceStatCount,
  glassIndicatorBadgeClass,
  glassIndicatorCardActiveClass,
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

/** Variáveis de cor do anel adaptadas ao tema escuro do dashboard. */
const DASHBOARD_RING_STYLE = {
  '--radial-accent': 'var(--workspace-stat-accent)',
  '--radial-track': 'color-mix(in srgb, var(--workspace-stat-text) 18%, transparent)',
} as React.CSSProperties;

/** Mini anel de progresso — usa o RadialProgress compartilhado com cores do tema escuro. */
function MiniRingProgress({ value }: { value: number }) {
  return (
    <div className="dashboard-neu-insight-inset flex items-center justify-center rounded-full p-[3px]">
      <RadialProgress value={value} size={36} strokeWidth={3} ariaLabel="Progresso" style={DASHBOARD_RING_STYLE}>
        <span className="font-sans text-[9px] font-bold tabular-nums text-[var(--workspace-stat-accent)]">
          {value}%
        </span>
      </RadialProgress>
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
    ? 'group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--workspace-stat-accent)_35%,transparent)] focus-visible:ring-offset-2 motion-reduce:transform-none'
    : '';

  const activeClasses = item.isActive ? glassIndicatorCardActiveClass : '';

  return (
    <div
      className={cn(
        glassIndicatorCardClass,
        'dashboard-project-kpi-card min-h-[4.5rem] gap-1.5 sm:min-h-[4.75rem] sm:gap-2',
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
      <div className="flex w-full items-center gap-2">
        <span className={dashboardKpiIconPlateClass} aria-hidden>
          <Icon
            className={cn(
              'h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4',
              inactive ? glassIndicatorIconMutedClass : glassIndicatorIconClass
            )}
            strokeWidth={1.75}
            aria-hidden
          />
        </span>
        <span className={cn(glassIndicatorLabelClass, 'text-left')}>{item.label}</span>
      </div>

      <div className="mt-auto flex w-full flex-col items-start gap-0.5">
        <div className="flex items-center gap-1.5">
          <span className={inactive ? glassIndicatorValueMutedClass : glassIndicatorValueClass}>
            {displayValue}
          </span>
          {item.trend ? <TrendIndicator trend={item.trend} /> : null}
        </div>

        {hasProgress ? (
          <div className="mt-0.5">
            <MiniRingProgress value={item.progressValue!} />
          </div>
        ) : null}

        <span className={cn(glassIndicatorModifierClass, 'text-left')}>{item.modifier}</span>
      </div>
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
      className="leve-neu-surface relative overflow-hidden p-4 transition-[box-shadow] duration-300 sm:p-5"
      role="region"
      aria-label="Execução de Testes e Automatizados"
    >
      <div
        className="pointer-events-none absolute -left-10 bottom-0 h-64 w-64 rounded-full bg-primary/12 opacity-60"
        aria-hidden
      />
      <div className="relative z-10 grid grid-cols-1 items-center gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="space-y-3 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="leve-neu-pill flex h-11 w-11 shrink-0 items-center justify-center text-primary"
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
              className="workspace-stat-neu-track relative h-3 w-full"
              role="progressbar"
              aria-valuenow={executionPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progresso: ${executionPercent}%, ${executedTestCases} de ${totalTestCases} casos executados`}
            >
              <div
                className="workspace-stat-neu-fill h-full transition-all duration-700 ease-out"
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
        <div className="flex items-center justify-center border-t border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)] pt-4 lg:col-span-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
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
  4: 'dashboard-glass-indicator-grid grid grid-cols-2 gap-1.5 max-sm:grid-cols-1 max-md:gap-1 sm:gap-2 lg:grid-cols-4',
  5: 'dashboard-glass-indicator-grid grid grid-cols-2 gap-1.5 max-sm:grid-cols-1 max-md:gap-1 sm:grid-cols-3 sm:gap-2 lg:grid-cols-5',
};

export function GlassIndicatorCards({ items, execution, columns = 5 }: GlassIndicatorCardsProps) {
  return (
    <div className="flex flex-col gap-3 max-md:gap-2">
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
