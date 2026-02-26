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
  return (
    <div
      className="glass bg-white/60 dark:bg-slate-800/40 p-6 rounded-xl relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
      role="article"
      aria-label={`${item.label}: ${item.value} ${item.modifier}`}
    >
      <div
        className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl transition-colors ${config.orbBg} group-hover:opacity-80`}
        aria-hidden
      />
      <div className="flex justify-between items-start mb-4">
        <span
          className={`text-xs font-semibold uppercase tracking-wide ${config.labelColor}`}
        >
          {item.label}
        </span>
        <div className={`p-2 rounded-lg ${config.iconBg} ${config.glowClass}`}>
          <Icon className={`w-5 h-5 ${config.iconColor}`} aria-hidden />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold ${config.valueColor}`}>
          {item.value}
        </span>
        <span className="text-xs text-base-content/60 font-normal">
          {item.modifier}
        </span>
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
      className="glass bg-white/60 dark:bg-slate-800/40 p-8 rounded-xl relative overflow-hidden"
      role="region"
      aria-label="Execução de Testes e Automatizados"
    >
      <div
        className="absolute -left-10 bottom-0 w-64 h-64 rounded-full blur-3xl opacity-30"
        style={{ backgroundColor: PRIMARY_COLOR }}
        aria-hidden
      />
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div
                className="p-3 rounded-xl border border-orange-500/20 bg-orange-500/15 dark:bg-orange-500/20"
                aria-hidden
              >
                <ListChecks className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-base-content">
                  Execução de Testes
                </h3>
                <p className="text-sm text-base-content/70 font-medium">
                  {projectName}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span
                className="text-2xl font-bold text-orange-600 dark:text-orange-500 animate-pulse-subtle"
                aria-label={`${executionPercent}% de execução`}
              >
                {executionPercent}%
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div
              className="h-4 w-full bg-base-200/80 dark:bg-base-300/80 rounded-full overflow-hidden border border-base-300 dark:border-base-300"
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
            <div className="flex justify-between text-xs font-medium text-base-content/70 uppercase tracking-wide">
              <span>
                {executedTestCases} casos executados
              </span>
              <span>Total de {totalTestCases} casos</span>
            </div>
          </div>
          {executionTrend != null && executionTrend !== '' && (
            <p className="text-xs text-base-content/60">
              {executionTrend}
            </p>
          )}
        </div>
        <div className="lg:col-span-4 flex justify-center lg:justify-end items-center border-t lg:border-t-0 lg:border-l border-base-300 pt-8 lg:pt-0 lg:pl-8">
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" aria-hidden>
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
                className="absolute text-lg font-bold text-base-content"
                aria-label={`${automationRatio}% automatizados`}
              >
                {automationRatio}%
              </span>
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wide text-base-content/70 block mb-1">
                Automação
              </span>
              <span className="text-xl font-bold text-base-content">
                Automatizados
              </span>
              {automationTrend != null && automationTrend !== '' && (
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-4 h-4 text-success shrink-0" aria-hidden />
                  <span className="text-xs text-success font-medium">
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
  execution: ExecutionAutomationProps;
}

export function GlassIndicatorCards({ items, execution }: GlassIndicatorCardsProps) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {items.map((item, index) => (
          <SmallIndicatorCard key={`${item.label}-${index}`} item={item} />
        ))}
      </div>
      <ExecutionAutomationCard {...execution} />
    </div>
  );
}

export { SmallIndicatorCard };
