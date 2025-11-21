
import React from 'react';
import { Card } from '../common/Card';

type DonutChartProps = {
    title: string;
    percentage: number;
    color: string;
    note?: string;
    className?: string;
    size?: 'sm' | 'md';
};

export const DonutChart: React.FC<DonutChartProps> = ({
    title,
    percentage,
    color,
    note,
    className = '',
    size = 'md',
}) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;
    const dimension = size === 'sm' ? 96 : 128;

    return (
        <Card className={`!p-4 sm:!p-6 !gap-2 ${className}`}>
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-[clamp(0.65rem,1.5vw,0.8rem)] uppercase tracking-[0.15em] text-text-secondary">{title}</p>
                    {note ? (
                        <p className="text-[clamp(0.8rem,1.6vw,0.95rem)] text-text-secondary/80">{note}</p>
                    ) : null}
                </div>
                <div
                    className="rounded-2xl bg-white/5 px-3 py-1 text-[clamp(0.75rem,1.8vw,0.9rem)] font-semibold text-text-primary"
                    aria-hidden="true"
                >
                    {percentage}%
                </div>
            </div>
            <div className="relative mx-auto flex items-center justify-center">
                <svg
                    className="drop-shadow-[0_12px_35px_rgba(4,4,17,0.55)]"
                    viewBox="0 0 120 120"
                    width={dimension}
                    height={dimension}
                    role="img"
                    aria-label={`${title} em ${percentage}%`}
                >
                    <circle
                        className="text-white/5"
                        strokeWidth="12"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="60"
                        cy="60"
                    />
                    <circle
                        className={`transition-all duration-500 ease-out ${color}`}
                        strokeWidth="12"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                        r={radius}
                        cx="60"
                        cy="60"
                        transform="rotate(-90 60 60)"
                    />
                </svg>
                <div className="absolute flex flex-col items-center">
                    <span className="text-[clamp(1.35rem,3vw,2rem)] font-semibold text-text-primary">{percentage}%</span>
                    <span className="text-xs uppercase tracking-[0.2em] text-text-secondary">Atual</span>
                </div>
            </div>
        </Card>
    );
};
