import React from 'react';
import { Card } from '../common/Card';

type BarChartWidgetProps = {
    title: string;
    data: { label: string; value: number; color: string }[];
    rawData: { label: string; value: number; color: string }[];
    className?: string;
};

export const BarChartWidget: React.FC<BarChartWidgetProps> = ({ title, data, rawData, className = '' }) => (
    <Card className={`!p-4 sm:!p-6 ${className}`}>
        <div className="flex items-center justify-between gap-4">
            <h4 className="text-[clamp(0.9rem,2vw,1.1rem)] font-semibold text-text-primary">{title}</h4>
            <span className="text-xs uppercase tracking-[0.2em] text-text-secondary">Atualizado</span>
        </div>
        <div className="mt-4 space-y-4">
            {data.map((item, index) => (
                <div key={item.label}>
                    <div className="flex items-center justify-between text-[clamp(0.78rem,1.6vw,0.9rem)] text-text-secondary">
                        <span>{item.label}</span>
                        <span className="font-semibold text-text-primary">{rawData[index].value}</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-white/5">
                        <div
                            className={`h-2 rounded-full ${item.color}`}
                            style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }}
                            role="progressbar"
                            aria-valuenow={Math.round(item.value)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={item.label}
                        />
                    </div>
                </div>
            ))}
        </div>
    </Card>
);