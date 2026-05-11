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

/** Tokens semânticos DaisyUI expostos na API pública dos indicadores. */
export type IndicatorColorTheme =
  | 'primary'
  | 'warning'
  /** Mesma família do warning, com texto `*-content` no tema claro (melhor contraste em cards glass). */
  | 'warningContrast'
  | 'info'
  | 'success'
  | 'error';

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

/** Temas alinhados à paleta DaisyUI (primary, warning, info, success, error) — sem cores hex soltas. */
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
  primary: {
    orbBg: 'bg-primary/10 dark:bg-primary/5',
    labelColor: 'text-primary',
    valueColor: 'text-primary',
    iconBg: 'border border-primary/25 bg-primary/10 dark:bg-primary/15',
    iconColor: 'text-primary',
    glowClass: 'glow-primary',
  },
  warning: {
    orbBg: 'bg-warning/10 dark:bg-warning/5',
    labelColor: 'text-warning',
    valueColor: 'text-warning',
    iconBg: 'border border-warning/25 bg-warning/10 dark:bg-warning/15',
    iconColor: 'text-warning',
    glowClass: 'glow-warning',
  },
  warningContrast: {
    orbBg: 'bg-warning/10 dark:bg-warning/5',
    labelColor: 'text-warning-content dark:text-warning',
    valueColor: 'text-warning-content dark:text-warning',
    iconBg:
      'border border-warning/35 bg-warning/15 dark:border-warning/30 dark:bg-warning/15',
    iconColor: 'text-warning-content dark:text-warning',
    glowClass: 'glow-warning',
  },
  info: {
    orbBg: 'bg-info/10 dark:bg-info/5',
    labelColor: 'text-info',
    valueColor: 'text-info',
    iconBg: 'border border-info/25 bg-info/10 dark:bg-info/15',
    iconColor: 'text-info',
    glowClass: 'glow-info',
  },
  success: {
    orbBg: 'bg-success/10 dark:bg-success/5',
    labelColor: 'text-success',
    valueColor: 'text-success',
    iconBg: 'border border-success/25 bg-success/10 dark:bg-success/15',
    iconColor: 'text-success',
    glowClass: 'glow-success',
  },
  error: {
    orbBg: 'bg-error/10 dark:bg-error/5',
    labelColor: 'text-error',
    valueColor: 'text-error',
    iconBg: 'border border-error/25 bg-error/10 dark:bg-error/15',
    iconColor: 'text-error',
    glowClass: 'glow-error',
  },
};

function SmallIndicatorCard({ item }: { item: SmallIndicatorItem }) {
  const config = themeConfig[item.colorTheme];
  const Icon = item.icon;
  const isClickable = !!item.onClick;
  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-base-300/80 bg-base-100/95 p-3 shadow-sm backdrop-blur-sm transition-all duration-200 dark:border-base-300/60 dark:bg-base-200/50 sm:p-3.5 ${isClickable ? 'group cursor-pointer hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30' : ''} ${item.isActive ? 'shadow-md ring-2 ring-primary/40' : ''}`}
      role={isClickable ? 'button' : 'article'}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={
        isClickable
          ? `${item.label}: ${item.value} ${item.modifier}. Clique para filtrar.`
          : `${item.label}: ${item.value} ${item.modifier}`
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
      <div
        className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl transition-colors ${config.orbBg} group-hover:opacity-80`}
        aria-hidden
      />
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className={`text-[10px] font-bold uppercase tracking-widest ${config.labelColor}`}>
          {item.label}
        </span>
        <div className={`rounded-md p-1.5 ${config.iconBg} ${config.glowClass}`}>
          <Icon className={`h-4 w-4 ${config.iconColor}`} aria-hidden />
        </div>
      </div>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className={`text-2xl font-bold tabular-nums sm:text-3xl ${config.valueColor}`}>
          {item.value}
        </span>
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
      className="relative overflow-hidden rounded-xl border border-base-300/80 bg-base-100/95 p-4 shadow-sm backdrop-blur-sm dark:border-base-300/60 dark:bg-base-200/40 sm:p-5"
      role="region"
      aria-label="Execução de Testes e Automatizados"
    >
      <div
        className="absolute -left-10 bottom-0 h-64 w-64 rounded-full bg-primary/20 blur-3xl opacity-40 dark:bg-primary/25"
        aria-hidden
      />
      <div className="relative z-10 grid grid-cols-1 items-center gap-4 lg:grid-cols-12 lg:gap-5">
        <div className="space-y-3 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div
                className="shrink-0 rounded-lg border border-primary/25 bg-primary/10 p-2 dark:bg-primary/15"
                aria-hidden
              >
                <ListChecks className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading text-lg font-bold leading-tight text-base-content sm:text-xl">
                  Execução de Testes
                </h3>
                <p
                  className="truncate text-sm font-medium text-base-content/75"
                  title={projectName}
                >
                  {projectName}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <span
                className="text-xl font-bold tabular-nums text-primary animate-pulse-subtle sm:text-2xl"
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
                className="h-full rounded-full bg-gradient-to-r from-primary via-primary/90 to-primary transition-all duration-500 shadow-md shadow-primary/20"
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
                  className="text-primary transition-all duration-1000 ease-out"
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
  /** Se omitido, mostra apenas a grade de indicadores compactos (sem o bloco Execução/Automação). */
  execution?: ExecutionAutomationProps;
}

export function GlassIndicatorCards({ items, execution }: GlassIndicatorCardsProps) {
  return (
    <div className="flex flex-col gap-tasks-panel-loose">
      <div className="grid grid-cols-1 gap-tasks-panel sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {items.map((item, index) => (
          <SmallIndicatorCard key={`${item.label}-${index}`} item={item} />
        ))}
      </div>
      {execution != null ? <ExecutionAutomationCard {...execution} /> : null}
    </div>
  );
}

export { SmallIndicatorCard };
