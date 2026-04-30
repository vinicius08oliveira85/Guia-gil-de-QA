import React from 'react';
import {
  ClipboardList,
  Clock,
  Zap,
  CheckCircle,
  AlertTriangle,
  ListChecks,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type IndicatorColorTheme = 'orange' | 'yellow' | 'blue' | 'emerald' | 'red';

export interface SmallIndicatorItem {
  label: string;
  value: number | string;
  modifier: string;
  icon: LucideIcon;
  colorTheme: IndicatorColorTheme;
  /** Se definido, o card fica clicável e aplica o filtro rápido ao clicar. */
  onClick?: () => void;
  /** Se true, indica que o filtro correspondente a este indicador está ativo (estilo de destaque). */
  isActive?: boolean;
}

const themeConfig: Record<
  IndicatorColorTheme,
  {
    orbBg: string;
    labelColor: string;
    valueColor: string;
    iconBg: string;
    iconColor: string;
    glowClass: string;
  }
> = {
  orange: {
    orbBg: 'bg-orange-500/10 dark:bg-orange-500/5',
    labelColor: 'text-orange-600 dark:text-orange-400/80',
    valueColor: 'text-orange-600 dark:text-orange-500',
    iconBg: 'bg-orange-100 dark:bg-orange-500/20',
    iconColor: 'text-orange-600 dark:text-orange-400',
    glowClass: 'glow-orange',
  },
  yellow: {
    orbBg: 'bg-yellow-500/10 dark:bg-yellow-500/5',
    labelColor: 'text-yellow-600 dark:text-yellow-400/80',
    valueColor: 'text-yellow-600 dark:text-yellow-400',
    iconBg: 'bg-yellow-100 dark:bg-yellow-500/20',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    glowClass: 'glow-yellow',
  },
  blue: {
    orbBg: 'bg-blue-500/10 dark:bg-blue-500/5',
    labelColor: 'text-blue-600 dark:text-blue-400/80',
    valueColor: 'text-blue-600 dark:text-blue-500',
    iconBg: 'bg-blue-100 dark:bg-blue-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    glowClass: 'glow-blue',
  },
  emerald: {
    orbBg: 'bg-emerald-500/10 dark:bg-emerald-500/5',
    labelColor: 'text-emerald-600 dark:text-emerald-400/80',
    valueColor: 'text-emerald-600 dark:text-emerald-500',
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    glowClass: 'glow-green',
  },
  red: {
    orbBg: 'bg-red-500/10 dark:bg-red-500/5',
    labelColor: 'text-red-600 dark:text-red-400/80',
    valueColor: 'text-red-600 dark:text-red-500',
    iconBg: 'bg-red-100 dark:bg-red-500/20',
    iconColor: 'text-red-600 dark:text-red-400',
    glowClass: 'glow-red',
  },
};

function SmallIndicatorCard({ item }: { item: SmallIndicatorItem }) {
  const config = themeConfig[item.colorTheme];
  const Icon = item.icon;
  const isClickable = !!item.onClick;
  return (
    <div
      className={`glass relative overflow-hidden rounded-lg border border-base-200/60 bg-white/70 p-3 shadow-sm transition-all duration-200 dark:border-base-300/40 dark:bg-slate-800/45 sm:p-3.5 ${isClickable ? 'group cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30' : ''} ${item.isActive ? 'ring-2 ring-primary/45 shadow-md' : ''}`}
      role={isClickable ? 'button' : 'article'}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={isClickable ? `${item.label}: ${item.value} ${item.modifier}. Clique para filtrar.` : `${item.label}: ${item.value} ${item.modifier}`}
      onClick={item.onClick}
      onKeyDown={isClickable && item.onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.onClick!(); } } : undefined}
    >
      <div
        className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl transition-colors ${config.orbBg} group-hover:opacity-80`}
        aria-hidden
      />
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className={`text-xs font-bold uppercase tracking-wide ${config.labelColor}`}>{item.label}</span>
        <div className={`rounded-md p-1.5 ${config.iconBg} ${config.glowClass}`}>
          <Icon className={`h-4 w-4 ${config.iconColor}`} aria-hidden />
        </div>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className={`text-2xl font-bold tabular-nums sm:text-3xl ${config.valueColor}`}>{item.value}</span>
        <span className="text-xs font-medium text-base-content/70 sm:text-sm">{item.modifier}</span>
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

const PRIMARY_COLOR = '#FF6B35';

export function ExecutionAutomationCard({
  executedTestCases,
  totalTestCases,
  automationRatio,
  projectName,
  executionTrend,
  automationTrend,
}: ExecutionAutomationProps) {
  const executionPercent =
    totalTestCases > 0
      ? Math.round((executedTestCases / totalTestCases) * 100)
      : 0;
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (automationRatio / 100) * circumference;

  return (
    <div
      className="glass relative overflow-hidden rounded-xl border border-base-200/60 bg-white/75 p-4 shadow-sm dark:border-base-300/40 dark:bg-slate-800/50 sm:p-5"
      role="region"
      aria-label="Execução de Testes e Automatizados"
    >
      <div
        className="absolute -left-10 bottom-0 w-64 h-64 rounded-full blur-3xl opacity-30"
        style={{ backgroundColor: PRIMARY_COLOR }}
        aria-hidden
      />
      <div className="relative z-10 grid grid-cols-1 items-center gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="space-y-3 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="shrink-0 rounded-lg border border-orange-500/25 bg-orange-500/12 p-2 dark:bg-orange-500/18"
                aria-hidden
              >
                <ListChecks className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold leading-tight text-base-content sm:text-xl">Execução de Testes</h3>
                <p className="truncate text-sm font-medium text-base-content/75" title={projectName}>
                  {projectName}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span
                className="text-xl font-bold tabular-nums text-orange-600 animate-pulse-subtle dark:text-orange-500 sm:text-2xl"
                aria-label={`${executionPercent}% de execução`}
              >
                {executionPercent}%
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <div
              className="h-3 w-full overflow-hidden rounded-full border border-base-300/80 bg-base-200/90 dark:border-base-300 dark:bg-base-300/80"
              role="progressbar"
              aria-valuenow={executionPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Progresso: ${executionPercent}%, ${executedTestCases} de ${totalTestCases} casos executados`}
            >
              <div
                className="h-full bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 rounded-full transition-all duration-500 shadow-[0_0_15px_rgba(255,107,53,0.3)]"
                style={{ width: `${executionPercent}%` }}
              />
            </div>
            <div className="flex flex-wrap justify-between gap-x-2 text-xs font-semibold uppercase tracking-wide text-base-content/75">
              <span>{executedTestCases} executados</span>
              <span>Total {totalTestCases}</span>
            </div>
          </div>
          {executionTrend != null && executionTrend !== '' && (
            <p className="text-sm text-base-content/65">{executionTrend}</p>
          )}
        </div>
        <div className="flex items-center justify-center border-t border-base-300/70 pt-4 lg:col-span-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center sm:h-[5.25rem] sm:w-[5.25rem]">
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
                  className="text-orange-500 glow-orange transition-all duration-1000 ease-out"
                  cx="48"
                  cy="48"
                  fill="transparent"
                  r="40"
                  stroke="currentColor"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeWidth="8"
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
              <span className="mb-0.5 block text-xs font-bold uppercase tracking-wide text-base-content/75">
                Automação
              </span>
              <span className="text-lg font-bold text-base-content">Automatizados</span>
              {automationTrend != null && automationTrend !== '' && (
                <div className="mt-1 flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 shrink-0 text-success" aria-hidden />
                  <span className="text-xs font-semibold text-success sm:text-sm">{automationTrend}</span>
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
  execution: ExecutionAutomationProps;
}

export function GlassIndicatorCards({ items, execution }: GlassIndicatorCardsProps) {
  return (
    <div className="flex flex-col gap-tasks-panel-loose">
      <div className="grid grid-cols-1 gap-tasks-panel sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {items.map((item, index) => (
          <SmallIndicatorCard key={`${item.label}-${index}`} item={item} />
        ))}
      </div>
      <ExecutionAutomationCard {...execution} />
    </div>
  );
}

export { SmallIndicatorCard };
