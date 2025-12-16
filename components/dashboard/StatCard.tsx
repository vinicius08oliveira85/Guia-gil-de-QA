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
    accent: 'from-primary/15 via-primary/8 to-primary/3',
    success: 'from-success/15 via-success/8 to-success/3',
    warning: 'from-warning/15 via-warning/8 to-warning/3',
    danger: 'from-error/15 via-error/8 to-error/3',
    neutral: 'from-base-200/60 via-base-200/30 to-base-200/10',
};

const accentIconBg: Record<NonNullable<StatCardProps['accent']>, string> = {
    accent: 'bg-primary/10 group-hover:bg-primary/15',
    success: 'bg-success/10 group-hover:bg-success/15',
    warning: 'bg-warning/10 group-hover:bg-warning/15',
    danger: 'bg-error/10 group-hover:bg-error/15',
    neutral: 'bg-base-200/80 group-hover:bg-base-200',
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
            transition={{ duration: 0.3, ease: 'easeOut' }}
        >
            <Card 
                className={`p-6 relative overflow-hidden border border-base-300 hover:border-primary/40 hover:shadow-lg transition-all duration-300 group ${className}`} 
                aria-live="polite"
            >
                {/* Gradiente de fundo mais profundo */}
                <div
                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accentBackground[accent]} to-transparent`}
                />
                
                {/* Shimmer effect sutil */}
                <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
                </div>
                
                <div className="relative flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-base-content/70 mb-2 uppercase tracking-wider">
                            {title}
                        </p>
                        <motion.p
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.3, delay: 0.1 }}
                            className={`text-3xl font-bold tracking-tight text-base-content ${statusColor || ''}`}
                        >
                            {value}
                        </motion.p>
                    </div>
                    {icon ? (
                        <motion.div 
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.3, delay: 0.15 }}
                            className={`flex-shrink-0 rounded-xl ${accentIconBg[accent]} p-3 transition-all duration-300`}
                        >
                            <div className="text-base-content/80 group-hover:text-base-content transition-colors">
                                {icon}
                            </div>
                        </motion.div>
                    ) : null}
                </div>
                {helperText ? (
                    <p className="relative mt-4 text-sm text-base-content/60 leading-relaxed">{helperText}</p>
                ) : null}
                {typeof trend === 'number' && trendLabel ? (
                    <div className="relative mt-4 flex items-center gap-2 pt-3 border-t border-base-300/50">
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
                ) : null}
            </Card>
        </motion.div>
    );
};
