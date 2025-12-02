
import React from 'react';
import { Card } from '../common/Card';

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
    accent: 'from-accent/25 via-accent/10',
    success: 'from-emerald-400/20 via-emerald-500/10',
    warning: 'from-amber-400/25 via-amber-500/15',
    danger: 'from-rose-500/30 via-rose-500/10',
    neutral: 'from-white/10 via-white/5',
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

    return (
        <Card className={`!p-4 sm:!p-5 !gap-3 relative overflow-hidden ${className}`} aria-live="polite">
            <div
                className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accentBackground[accent]} to-transparent opacity-70`}
            />
            <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="data-label text-[0.7rem] text-text-secondary/80">
                        {title}
                    </p>
                    <p
                        className={`data-value mt-1 text-[clamp(1.45rem,3.6vw,2.25rem)] leading-snug text-text-primary ${statusColor || ''}`}
                    >
                        {value}
                    </p>
                </div>
                {icon ? (
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-lg text-text-primary shadow-inner">
                        {icon}
                    </span>
                ) : null}
            </div>
            {helperText ? (
                <p className="relative text-[clamp(0.78rem,1.6vw,0.92rem)] text-muted">{helperText}</p>
            ) : null}
            {typeof trend === 'number' && trendLabel ? (
                <div className="relative flex items-center gap-2 text-sm font-semibold">
                    <span
                        className={`inline-flex h-6 min-w-[2.5rem] items-center justify-center rounded-full px-2 text-xs ${
                            trendIsPositive ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-rose-500/20 text-rose-700 dark:text-rose-300'
                        }`}
                    >
                        {trendIsPositive ? '▲' : '▼'} {Math.abs(trend)}%
                    </span>
                    <span className="text-text-secondary">{trendLabel}</span>
                </div>
            ) : null}
        </Card>
    );
};
