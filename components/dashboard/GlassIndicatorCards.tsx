import React from 'react';
import { ListChecks, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { dashboardKpiCardBaseClass } from '../common/projectCardUi';

/** Tokens semânticos DaisyUI expostos na API pública dos indicadores. */
export type IndicatorColorTheme =
  | 'primary'
  | 'warning'
  /** Mesma família do warning, com texto `*-content` no tema claro (melhor contraste em cards glass). */
  | 'warningContrast'
  | 'info'
  | 'success'
  | 'error'
  /** Categorias genéricas / diversos (cinza neutro). */
  | 'neutral';

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
  /** Tendência: 'up' | 'down' | 'neutral' — se fornecido, mostra um ícone de seta */
  trend?: 'up' | 'down' | 'neutral';
  /** Valor percentual para exibir um mini ring progress (0-100) */
  progressValue?: number;
}

/**
 * Temas semânticos — cada indicador com cor distinta:
 * primary = volume (roxo), warning = fila (âmbar), info = ativo (azul),
 * success = concluído (verde), error = bugs (vermelho).
 */
const themeConfig: Record<
  IndicatorColorTheme,
  {
    card: string;
    labelColor: string;
    valueColor: string;
    iconBg: string;
    iconColor: string;
    ringColor: string;
  }
> = {
  primary: {
    card: 'border-[color-mix(in_srgb,var(--brand-highlight)_28%,transparent)] bg-[color-mix(in_srgb,var(--brand-highlight)_9%,var(--brand-surface-strong))]',
    labelColor: 'text-[var(--brand-highlight)]',
    valueColor: 'text-[var(--brand-text-strong)]',
    iconBg: 'bg-[color-mix(in_srgb,var(--brand-highlight)_16%,transparent)] text-[var(--brand-highlight)]',
    iconColor: 'text-[var(--brand-highlight)]',
    ringColor: 'text-[var(--brand-highlight)]',
  },
  warning: {
    card: 'border-[color-mix(in_srgb,#d97706_28%,transparent)] bg-[color-mix(in_srgb,#d97706_9%,var(--brand-surface-strong))]',
    labelColor: 'text-[#b45309]',
    valueColor: 'text-[#b45309]',
    iconBg: 'bg-[color-mix(in_srgb,#d97706_16%,transparent)] text-[#d97709]',
    iconColor: 'text-[#d97709]',
    ringColor: 'text-[#d97709]',
  },
  warningContrast: {
    card: 'border-[color-mix(in_srgb,#d97706_28%,transparent)] bg-[color-mix(in_srgb,#d97706_9%,var(--brand-surface-strong))]',
    labelColor: 'text-[#b45309]',
    valueColor: 'text-[#b45309]',
    iconBg: 'bg-[color-mix(in_srgb,#d97706_16%,transparent)] text-[#d97709]',
    iconColor: 'text-[#d97709]',
    ringColor: 'text-[#d97709]',
  },
  info: {
    card: 'border-[color-mix(in_srgb,#0ea5e9_26%,transparent)] bg-[color-mix(in_srgb,#0ea5e9_8%,var(--brand-surface-strong))]',
    labelColor: 'text-[#0284c7]',
    valueColor: 'text-[#0284c7]',
    iconBg: 'bg-[color-mix(in_srgb,#0ea5e9_15%,transparent)] text-[#0284c7]',
    iconColor: 'text-[#0284c7]',
    ringColor: 'text-[#0284c7]',
  },
  success: {
    card: 'border-[color-mix(in_srgb,#10b981_24%,transparent)] bg-[color-mix(in_srgb,#10b981_9%,var(--brand-surface-strong))]',
    labelColor: 'text-[#059669]',
    valueColor: 'text-[#059669]',
    iconBg: 'bg-[color-mix(in_srgb,#10b981_15%,transparent)] text-[#059669]',
    iconColor: 'text-[#059669]',
    ringColor: 'text-[#059669]',
  },
  error: {
    card: 'border-[color-mix(in_srgb,#dc2626_24%,transparent)] bg-[color-mix(in_srgb,#dc2626_8%,var(--brand-surface-strong))]',
    labelColor: 'text-[#dc2626]',
    valueColor: 'text-[#dc2626]',
    iconBg: 'bg-[color-mix(in_srgb,#dc2626_14%,transparent)] text-[#dc2626]',
    iconColor: 'text-[#dc2626]',
    ringColor: 'text-[#dc2626]',
  },
  neutral: {
    card: 'border-[color-mix(in_srgb,var(--brand-text-muted)_22%,transparent)] bg-[color-mix(in_srgb,var(--brand-text-muted)_6%,var(--brand-surface-strong))]',
    labelColor: 'text-[var(--brand-text-muted)]',
    valueColor: 'text-[var(--brand-text-strong)]',
    iconBg: 'bg-[color-mix(in_srgb,var(--brand-text-muted)_12%,transparent)] text-[var(--brand-text-muted)]',
    iconColor: 'text-[var(--brand-text-muted)]',
    ringColor: 'text-[var(--brand-text-muted)]',
  },
};

/** Mini ring progress component */
function MiniRingProgress({
  value,
  colorClass,
  size = 44,
}: {
  value: number;
  colorClass: string;
  size?: number;
}) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, value));
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="h-full w-full -rotate-90"
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
      >
        <circle
          className="text-base-300/60 dark:text-base-300/40"
          cx={size / 2}
          cy={size / 2}
          fill="transparent"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
        />
        <circle
          className={cn(colorClass, 'transition-all duration-700 ease-out')}
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
        className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums text-base-content/80"
        aria-label={`${value}%`}
      >
        {value}%
      </span>
    </div>
  );
}

/** Trend indicator icon */
function TrendIndicator({ trend, colorTheme }: { trend: 'up' | 'down' | 'neutral'; colorTheme: IndicatorColorTheme }) {
  if (trend === 'up') {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success">
        <TrendingUp className="h-3 w-3" aria-hidden />
      </span>
    );
  }
  if (trend === 'down') {
    const isNegativeGood = colorTheme === 'error';
    return (
      <span
        className={cn(
          'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
          isNegativeGood
            ? 'bg-success/10 text-success'
            : 'bg-error/10 text-error'
        )}
      >
        <TrendingDown className="h-3 w-3" aria-hidden />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-base-300/40 px-1.5 py-0.5 text-[10px] font-semibold text-base-content/60">
      <Minus className="h-3 w-3" aria-hidden />
    </span>
  );
}

function SmallIndicatorCard({ item }: { item: SmallIndicatorItem }) {
  const config = themeConfig[item.colorTheme];
  const Icon = item.icon;
  const isClickable = !!item.onClick;
  const hasProgress = typeof item.progressValue === 'number';

  const interactiveClasses = isClickable
    ? 'group cursor-pointer hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--brand-cta)_35%,transparent)] hover:shadow-[0_10px_24px_-14px_var(--brand-surface-shadow)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--brand-cta)_35%,transparent)] motion-reduce:transform-none motion-reduce:hover:shadow-none'
    : '';

  const activeClasses = item.isActive
    ? 'ring-2 ring-[color-mix(in_srgb,var(--brand-cta)_40%,transparent)] border-[color-mix(in_srgb,var(--brand-cta)_32%,transparent)]'
    : '';

  return (
    <div
      className={cn(
        dashboardKpiCardBaseClass,
        'relative flex min-h-0 flex-col gap-1 p-2.5 sm:gap-1.5 sm:p-3',
        config.card,
        interactiveClasses,
        activeClasses
      )}
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
        className={cn(
          'grid w-full grid-rows-[auto_auto_auto] gap-x-2.5 gap-y-0.5',
          hasProgress ? 'grid-cols-[minmax(0,1fr)_2.25rem_2rem]' : 'grid-cols-[minmax(0,1fr)_2.25rem]'
        )}
      >
        <span
          className={cn(
            'col-start-1 row-start-1 min-w-0 pr-0.5 text-[9px] font-bold uppercase leading-snug tracking-wide sm:text-[10px]',
            config.labelColor
          )}
        >
          {item.label}
        </span>

        <div
          className={cn(
            'col-start-2 row-start-1 row-span-3 flex h-8 w-8 items-center justify-center self-center justify-self-end rounded-lg ring-1 ring-[color-mix(in_srgb,var(--brand-surface-border)_80%,transparent)] sm:h-9 sm:w-9',
            config.iconBg
          )}
        >
          <Icon className={cn('h-4 w-4 shrink-0', config.iconColor)} aria-hidden />
        </div>

        <div className="col-start-1 row-start-2 flex min-w-0 items-baseline gap-1">
          <span className={cn('font-heading text-xl font-bold tabular-nums leading-none sm:text-2xl', config.valueColor)}>
            {item.value}
          </span>
          {item.trend ? <TrendIndicator trend={item.trend} colorTheme={item.colorTheme} /> : null}
        </div>

        <span className="col-start-1 row-start-3 text-[10px] font-medium leading-tight text-[var(--brand-text-muted)]">
          {item.modifier}
        </span>

        {hasProgress ? (
          <div className="col-start-3 row-start-1 row-span-3 flex items-center justify-self-end">
            <MiniRingProgress value={item.progressValue!} colorClass={config.ringColor} size={32} />
          </div>
        ) : null}
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
  /** Se omitido, mostra apenas a grade de indicadores compactos (sem o bloco Execução/Automação). */
  execution?: ExecutionAutomationProps;
  /** Colunas na grade em telas grandes (padrão: 5). */
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
