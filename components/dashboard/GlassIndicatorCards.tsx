import React from 'react';
import { ListChecks, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

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
  /** Tendência: 'up' | 'down' | 'neutral' — se fornecido, mostra um ícone de seta */
  trend?: 'up' | 'down' | 'neutral';
  /** Valor percentual para exibir um mini ring progress (0-100) */
  progressValue?: number;
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
    ringColor: string;
    gradientFrom: string;
    gradientTo: string;
  }
> = {
  primary: {
    orbBg: 'bg-primary/10 dark:bg-primary/5',
    labelColor: 'text-primary',
    valueColor: 'text-primary',
    iconBg: 'border border-primary/25 bg-primary/10 dark:bg-primary/15',
    iconColor: 'text-primary',
    glowClass: 'glow-primary',
    ringColor: 'text-primary',
    gradientFrom: 'from-primary/8',
    gradientTo: 'to-transparent',
  },
  warning: {
    orbBg: 'bg-warning/10 dark:bg-warning/5',
    labelColor: 'text-warning',
    valueColor: 'text-warning',
    iconBg: 'border border-warning/25 bg-warning/10 dark:bg-warning/15',
    iconColor: 'text-warning',
    glowClass: 'glow-warning',
    ringColor: 'text-warning',
    gradientFrom: 'from-warning/8',
    gradientTo: 'to-transparent',
  },
  warningContrast: {
    orbBg: 'bg-warning/10 dark:bg-warning/5',
    labelColor: 'text-warning-content dark:text-warning',
    valueColor: 'text-warning-content dark:text-warning',
    iconBg:
      'border border-warning/35 bg-warning/15 dark:border-warning/30 dark:bg-warning/15',
    iconColor: 'text-warning-content dark:text-warning',
    glowClass: 'glow-warning',
    ringColor: 'text-warning',
    gradientFrom: 'from-warning/8',
    gradientTo: 'to-transparent',
  },
  info: {
    orbBg: 'bg-info/10 dark:bg-info/5',
    labelColor: 'text-info',
    valueColor: 'text-info',
    iconBg: 'border border-info/25 bg-info/10 dark:bg-info/15',
    iconColor: 'text-info',
    glowClass: 'glow-info',
    ringColor: 'text-info',
    gradientFrom: 'from-info/8',
    gradientTo: 'to-transparent',
  },
  success: {
    orbBg: 'bg-success/10 dark:bg-success/5',
    labelColor: 'text-success',
    valueColor: 'text-success',
    iconBg: 'border border-success/25 bg-success/10 dark:bg-success/15',
    iconColor: 'text-success',
    glowClass: 'glow-success',
    ringColor: 'text-success',
    gradientFrom: 'from-success/8',
    gradientTo: 'to-transparent',
  },
  error: {
    orbBg: 'bg-error/10 dark:bg-error/5',
    labelColor: 'text-error',
    valueColor: 'text-error',
    iconBg: 'border border-error/25 bg-error/10 dark:bg-error/15',
    iconColor: 'text-error',
    glowClass: 'glow-error',
    ringColor: 'text-error',
    gradientFrom: 'from-error/8',
    gradientTo: 'to-transparent',
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
    ? 'group cursor-pointer hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--brand-cta)_40%,transparent)] hover:shadow-lg hover:shadow-[color-mix(in_srgb,var(--brand-cta)_8%,transparent)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--brand-cta)_35%,transparent)] motion-reduce:transform-none motion-reduce:hover:shadow-none'
    : 'hover:border-base-300/80';

  const activeClasses = item.isActive
    ? 'ring-2 ring-[color-mix(in_srgb,var(--brand-cta)_40%,transparent)] border-[color-mix(in_srgb,var(--brand-cta)_30%,transparent)] bg-[color-mix(in_srgb,var(--brand-cta)_3%,transparent)]'
    : '';

  return (
    <div
      className={cn(
        'relative flex min-h-[100px] flex-col justify-between overflow-hidden rounded-[var(--rounded-box)] border border-base-300/50 bg-gradient-to-br from-base-100 to-base-100/95 p-3.5 backdrop-blur-md transition-all duration-300 dark:border-base-content/8 dark:from-base-200/60 dark:to-base-200/40 sm:p-4',
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
      {/* Gradient orb background */}
      <div
        className={cn(
          'absolute -right-6 -top-6 h-28 w-28 rounded-full blur-3xl opacity-60 transition-opacity duration-500 group-hover:opacity-80',
          config.orbBg
        )}
        aria-hidden
      />

      {/* Bottom accent line */}
      <div
        className={cn(
          'absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r opacity-40',
          config.gradientFrom,
          config.gradientTo
        )}
        aria-hidden
      />

      {/* Header: label + icon */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <span
          className={cn(
            'text-[10px] font-bold uppercase tracking-widest sm:text-[11px]',
            config.labelColor
          )}
        >
          {item.label}
        </span>
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-transform duration-300 group-hover:scale-110 sm:h-9 sm:w-9',
            config.iconBg,
            config.glowClass
          )}
        >
          <Icon className={cn('h-4 w-4 sm:h-[18px] sm:w-[18px]', config.iconColor)} aria-hidden />
        </div>
      </div>

      {/* Value section */}
      <div className="relative z-10 mt-auto flex items-end justify-between gap-3 pt-2">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                'text-3xl font-bold tabular-nums leading-none sm:text-4xl',
                config.valueColor
              )}
            >
              {item.value}
            </span>
            {item.trend && <TrendIndicator trend={item.trend} colorTheme={item.colorTheme} />}
          </div>
          <span className="text-[11px] font-medium text-base-content/60 sm:text-xs">
            {item.modifier}
          </span>
        </div>

        {/* Mini ring progress (optional) */}
        {hasProgress && (
          <MiniRingProgress
            value={item.progressValue!}
            colorClass={config.ringColor}
            size={44}
          />
        )}
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
}

export function GlassIndicatorCards({ items, execution }: GlassIndicatorCardsProps) {
  return (
    <div className="flex flex-col gap-tasks-panel-loose">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 sm:gap-4">
        {items.map((item, index) => (
          <SmallIndicatorCard key={`${item.label}-${index}`} item={item} />
        ))}
      </div>
      {execution != null ? <ExecutionAutomationCard {...execution} /> : null}
    </div>
  );
}

export { SmallIndicatorCard };
