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
    accent: 'from-primary/10 via-primary/5',
    success: 'from-success/10 via-success/5',
    warning: 'from-warning/10 via-warning/5',
    danger: 'from-error/10 via-error/5',
    neutral: 'from-base-200/50 via-base-200/20',
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
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card 
                className={`p-5 relative overflow-hidden border border-base-300 hover:border-primary/30 hover:shadow-md transition-all duration-200 ${className}`} 
                aria-live="polite"
            >
                <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accentBackground[accent]} to-transparent opacity-50`}
                />
                <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-base-content/70 mb-1">
                            {title}
                        </p>
                        <p
                            className={`text-3xl font-bold tracking-tight text-base-content ${statusColor || ''}`}
                        >
                            {value}
                        </p>
                    </div>
                    {icon ? (
                        <div className="flex-shrink-0 rounded-lg bg-base-200 p-2.5 text-base-content/60">
                            {icon}
                        </div>
                    ) : null}
                </div>
                {helperText ? (
                    <p className="relative mt-3 text-sm text-base-content/60">{helperText}</p>
                ) : null}
                {typeof trend === 'number' && trendLabel ? (
                    <div className="relative mt-4 flex items-center gap-2">
                        <span
                            className={`badge badge-sm ${
                                trendIsPositive ? 'badge-success' : 'badge-error'
                            }`}
                        >
                            {trendIsPositive ? '↑' : '↓'} {Math.abs(trend)}%
                        </span>
                        <span className="text-xs text-base-content/60">{trendLabel}</span>
                    </div>
                ) : null}
            </Card>
        </motion.div>
    );
};
