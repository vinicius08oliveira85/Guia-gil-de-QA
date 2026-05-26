import React from 'react';
import { Card } from '../common/Card';
import { motion } from 'framer-motion';
import { neuDividerClass } from '../common/neuUi';
import { cn } from '../../utils/cn';

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
  success: 'from-success/20 via-success/10 to-success/5',
  warning: 'from-warning/20 via-warning/10 to-warning/5',
  danger: 'from-error/20 via-error/10 to-error/5',
  neutral:
    'from-[color-mix(in_srgb,var(--leve-neu-dark)_12%,var(--leve-neu-bg))] via-[color-mix(in_srgb,var(--leve-neu-dark)_6%,var(--leve-neu-bg))] to-transparent',
};

const accentBorder: Record<NonNullable<StatCardProps['accent']>, string> = {
  accent: 'border-primary/30 group-hover:border-primary/50',
  success: 'border-success/30 group-hover:border-success/50',
  warning: 'border-warning/30 group-hover:border-warning/50',
  danger: 'border-error/30 group-hover:border-error/50',
  neutral:
    'border-[color-mix(in_srgb,var(--leve-neu-light)_40%,transparent)] group-hover:border-[color-mix(in_srgb,var(--leve-neu-light)_55%,transparent)]',
};

const accentIconBg: Record<NonNullable<StatCardProps['accent']>, string> = {
  accent: 'bg-primary/10 group-hover:bg-primary/15',
  success: 'bg-success/10 group-hover:bg-success/15',
  warning: 'bg-warning/10 group-hover:bg-warning/15',
  danger: 'bg-error/10 group-hover:bg-error/15',
  neutral:
    'bg-[color-mix(in_srgb,var(--leve-neu-dark)_10%,var(--leve-neu-bg))] group-hover:bg-[color-mix(in_srgb,var(--leve-neu-dark)_14%,var(--leve-neu-bg))]',
};

const accentTextColor: Record<NonNullable<StatCardProps['accent']>, string> = {
  accent: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-error',
  neutral: 'text-base-content',
};

const valueHoverVariants = {
  idle: { scale: 1 },
  hover: {
    scale: 1.06,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
};

const iconHoverVariants = {
  idle: { scale: 1, rotate: 0 },
  hover: {
    scale: 1.1,
    rotate: 6,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
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
      className="h-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="h-full group rounded-[var(--rounded-box)]"
        initial="idle"
        animate="idle"
        whileHover="hover"
      >
        <Card
          className={`
                    p-6 relative overflow-hidden
                    border ${accentBorder[accent]}
                    cursor-pointer
                    transition-[transform,box-shadow] duration-200 ease-out
                    hover:-translate-y-0.5 hover:ring-2 hover:ring-[color-mix(in_oklch,oklch(var(--p))_22%,transparent)]
                    motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:ring-0
                    ${className}
                `}
          aria-live="polite"
          hoverable={false}
        >
          <div className="pointer-events-none absolute inset-0 bg-[color-mix(in_srgb,var(--leve-neu-bg)_72%,transparent)]" />

          <div
            className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accentBackground[accent]} to-transparent`}
          />

          <div
            className={`
                        pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full
                        bg-gradient-to-br ${accentBackground[accent]}
                        opacity-0 group-hover:opacity-100 blur-3xl
                    `}
          />

          <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full" />
          </div>

          <div className="relative z-10 flex flex-col" style={{ gap: '1rem' }}>
            <div className="flex items-start justify-between" style={{ gap: '1rem' }}>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-base-content/70 mb-2 uppercase tracking-wider">
                  {title}
                </p>
                <motion.div
                  variants={valueHoverVariants}
                  initial="idle"
                  className="inline-block"
                  style={{ transformOrigin: '0% 50%' }}
                >
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.28, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className={`block text-5xl font-bold tracking-tight ${valueColor}`}
                  >
                    {value}
                  </motion.span>
                </motion.div>
              </div>
              {icon ? (
                <motion.div
                  variants={iconHoverVariants}
                  initial="idle"
                  className={`
                                    flex-shrink-0 w-12 h-12 rounded-[var(--radius)] ${accentIconBg[accent]} 
                                    flex items-center justify-center
                                `}
                  style={{ transformOrigin: '50% 50%' }}
                >
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.28, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className={accentTextColor[accent]}
                  >
                    {icon}
                  </motion.div>
                </motion.div>
              ) : null}
            </div>

            {helperText ? (
              <p className="relative text-sm text-base-content/60 leading-relaxed">{helperText}</p>
            ) : null}

            {typeof trend === 'number' && trendLabel ? (
              <div className={cn('relative flex items-center gap-2 border-t pt-3', neuDividerClass)}>
                <motion.span
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={`badge badge-sm rounded-[var(--radius)] px-2.5 py-1 ${
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
                <span className="opacity-0 group-hover:opacity-100">Atualizado agora</span>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};
