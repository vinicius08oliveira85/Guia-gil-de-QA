import React from 'react';
import { Card } from '../common/Card';
import { motion } from 'framer-motion';

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  subValue?: string;
  statusColor?: string;
  trend?: number;
  trendLabel?: string;
  icon?: React.ReactNode;
  accent?: 'accent' | 'success' | 'warning' | 'danger' | 'neutral';
  className?: string;
};

const accentBackground: Record<NonNullable<StatCardProps['accent']>, string> = {
  accent: 'from-primary/20 via-primary/10 to-primary/5',
  success: 'from-emerald-500/20 via-green-500/10 to-emerald-500/5',
  warning: 'from-orange-500/20 via-amber-500/10 to-orange-500/5',
  danger: 'from-rose-500/20 via-red-500/10 to-rose-500/5',
  neutral: 'from-base-200/60 via-base-200/30 to-base-200/10',
};

const accentBorder: Record<NonNullable<StatCardProps['accent']>, string> = {
  accent: 'border-primary/30 group-hover:border-primary/50',
  success: 'border-emerald-500/30 group-hover:border-emerald-500/50',
  warning: 'border-orange-500/30 group-hover:border-orange-500/50',
  danger: 'border-rose-500/30 group-hover:border-rose-500/50',
  neutral: 'border-base-300 group-hover:border-base-300/60',
};

const accentGlow: Record<NonNullable<StatCardProps['accent']>, string> = {
  accent: 'shadow-primary/20',
  success: 'shadow-emerald-500/20',
  warning: 'shadow-orange-500/20',
  danger: 'shadow-rose-500/20',
  neutral: 'shadow-base-300/20',
};

const accentIconBg: Record<NonNullable<StatCardProps['accent']>, string> = {
  accent: 'bg-primary/10 group-hover:bg-primary/15',
  success: 'bg-emerald-500/10 group-hover:bg-emerald-500/15',
  warning: 'bg-orange-500/10 group-hover:bg-orange-500/15',
  danger: 'bg-rose-500/10 group-hover:bg-rose-500/15',
  neutral: 'bg-base-200/80 group-hover:bg-base-200',
};

const accentTextColor: Record<NonNullable<StatCardProps['accent']>, string> = {
  accent: 'text-primary',
  success: 'text-emerald-400 dark:text-emerald-300',
  warning: 'text-orange-400 dark:text-orange-300',
  danger: 'text-rose-400 dark:text-rose-300',
  neutral: 'text-base-content',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  subValue,
  statusColor,
  trend,
  trendLabel,
  icon,
  accent = 'neutral',
  className = '',
}) => {
  const trendIsPositive = typeof trend === 'number' ? trend >= 0 : undefined;
  const helperText = description ?? subValue;
  const valueColor = statusColor || accentTextColor[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="h-full"
    >
      <Card
        className={`
                    p-6 relative overflow-hidden 
                    border ${accentBorder[accent]}
                    transition-all duration-500 ease-out
                    group cursor-pointer
                    hover:scale-[1.02] hover:shadow-2xl
                    ${accent === 'accent' ? 'hover:shadow-primary/20' : ''}
                    ${accent === 'success' ? 'hover:shadow-emerald-500/20' : ''}
                    ${accent === 'warning' ? 'hover:shadow-orange-500/20' : ''}
                    ${accent === 'danger' ? 'hover:shadow-rose-500/20' : ''}
                    ${accent === 'neutral' ? 'hover:shadow-base-300/20' : ''}
                    ${className}
                `}
        aria-live="polite"
        hoverable={false}
      >
        {/* Glassmorphism overlay */}
        <div className="absolute inset-0 bg-base-100/60 dark:bg-base-100/40 backdrop-blur-xl" />

        {/* Gradiente de fundo animado */}
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accentBackground[accent]} to-transparent`}
        />

        {/* Animated gradient orb no hover */}
        <div
          className={`
                        pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full
                        bg-gradient-to-br ${accentBackground[accent]}
                        opacity-0 group-hover:opacity-100 blur-3xl
                        transition-opacity duration-700
                    `}
        />

        {/* Shine effect no hover */}
        <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
        </div>

        {/* Conteúdo */}
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-base-content/70 mb-2 uppercase tracking-wider">
                {title}
              </p>
              <motion.p
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className={`
                                    text-5xl font-bold tracking-tight
                                    transition-transform duration-500
                                    group-hover:scale-110
                                    ${valueColor}
                                `}
              >
                {value}
              </motion.p>
            </div>
            {icon ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className={`
                                    flex-shrink-0 w-12 h-12 rounded-xl ${accentIconBg[accent]} 
                                    flex items-center justify-center
                                    transition-all duration-500
                                    group-hover:scale-110 group-hover:rotate-6
                                `}
              >
                <div className={`${accentTextColor[accent]} transition-colors`}>{icon}</div>
              </motion.div>
            ) : null}
          </div>

          {helperText ? (
            <p className="relative text-sm text-base-content/60 leading-relaxed">{helperText}</p>
          ) : null}

          {typeof trend === 'number' && trendLabel ? (
            <div className="relative flex items-center gap-2 pt-3 border-t border-base-300/50">
              <motion.span
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className={`badge badge-sm rounded-full px-2.5 py-1 ${
                  trendIsPositive
                    ? 'badge-success bg-success/20 text-success border-success/30'
                    : 'badge-error bg-error/20 text-error border-error/30'
                }`}
              >
                {trendIsPositive ? '↑' : '↓'} {Math.abs(trend)}%
              </motion.span>
              <span className="text-xs text-base-content/60">{trendLabel}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-base-content/50">
              <div className="h-px flex-1 bg-gradient-to-r from-base-300/50 to-transparent" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                Atualizado agora
              </span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};
