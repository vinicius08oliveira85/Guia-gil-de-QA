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

/** Sombra no hover: só valores numéricos no rgba (evita cálculos indefinidos no layout). */
const cardHoverShadow = '0 25px 50px -12px rgba(0, 0, 0, 0.22)';
const cardIdleShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.06)';

/** Superfície do cartão: hover gerenciado pelo Framer (sem transition-* do Tailwind no mesmo bloco). */
const cardSurfaceVariants = {
  idle: { boxShadow: cardIdleShadow },
  hover: {
    boxShadow: cardHoverShadow,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
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
        className="h-full group rounded-xl"
        initial="idle"
        animate="idle"
        whileHover="hover"
        variants={cardSurfaceVariants}
      >
        <Card
          className={`
                    p-6 relative overflow-hidden
                    border ${accentBorder[accent]}
                    cursor-pointer
                    ${className}
                `}
          aria-live="polite"
          hoverable={false}
        >
          <div className="absolute inset-0 bg-base-100/60 dark:bg-base-100/40 backdrop-blur-xl" />

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
                                    flex-shrink-0 w-12 h-12 rounded-xl ${accentIconBg[accent]} 
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
              <div className="relative flex items-center gap-2 pt-3 border-t border-base-300/50">
                <motion.span
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
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
                <span className="opacity-0 group-hover:opacity-100">Atualizado agora</span>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};
