
import React from 'react';
import { Card } from '../common/Card';

type RadarChartWidgetProps = {
    title: string;
    data: { module: string; quality: number }[];
    className?: string;
};

export const RadarChartWidget: React.FC<RadarChartWidgetProps> = ({ title, data, className = '' }) => {
    const size = 220;
    const center = size / 2;
    const radius = size * 0.38;

    if (!data || data.length === 0) {
        return (
            <Card className={`!p-4 sm:!p-6 ${className}`}>
                <h4 className="heading-card text-text-primary mb-2">{title}</h4>
                <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-surface-border text-text-secondary/70">
                    Nenhum módulo (Epic) encontrado.
                </div>
            </Card>
        );
    }

    const points = data
        .map((item, i) => {
            const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
            const valueRadius = (item.quality / 100) * radius;
            const x = center + valueRadius * Math.cos(angle);
            const y = center + valueRadius * Math.sin(angle);
            return `${x},${y}`;
        })
        .join(' ');

    const guides = [0.25, 0.5, 0.75, 1];

    return (
        <Card className={`!p-4 sm:!p-6 ${className}`}>
            <div className="flex items-center justify-between gap-4">
                <h4 className="heading-card text-text-primary">{title}</h4>
                <span className="eyebrow text-text-secondary/80">Qualidade por Epic</span>
            </div>
            <div className="mt-4 flex justify-center">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {guides.map((ratio) => (
                        <polygon
                            key={ratio}
                            points={data
                                .map((_, i) => {
                                    const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
                                    const x = center + radius * ratio * Math.cos(angle);
                                    const y = center + radius * ratio * Math.sin(angle);
                                    return `${x},${y}`;
                                })
                                .join(' ')}
                            fill="none"
                            stroke="rgba(255,255,255,0.08)"
                            strokeWidth="1"
                        />
                    ))}
                    <polygon points={points} className="fill-teal-400/20 stroke-teal-300" strokeWidth="2.5" />
                    {data.map((item, i) => {
                        const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
                        const labelRadius = radius * 1.1;
                        const x = center + labelRadius * Math.cos(angle);
                        const y = center + labelRadius * Math.sin(angle);
                        return (
                            <text
                                key={item.module}
                                x={x}
                                y={y}
                                fill="var(--text-primary)"
                                fontSize="11"
                                textAnchor="middle"
                                dominantBaseline="middle"
                            >
                                {item.module}
                            </text>
                        );
                    })}
                </svg>
            </div>
        </Card>
    );
};
