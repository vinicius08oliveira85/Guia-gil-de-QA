
import React from 'react';
import { Card } from '../common/Card';

export const RadarChartWidget: React.FC<{ title: string; data: { module: string; quality: number }[] }> = ({ title, data }) => {
    const size = 200;
    const center = size / 2;
    const radius = size * 0.4;

    if (!data || data.length === 0) {
        return (
             <Card className="col-span-1 md:col-span-2">
                <h4 className="text-gray-400 text-sm font-medium mb-2">{title}</h4>
                 <div className="flex justify-center items-center h-48">
                    <p className="text-gray-500">Nenhum módulo (Epic) encontrado.</p>
                </div>
            </Card>
        )
    }

    const points = data.map((item, i) => {
        const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
        const valueRadius = (item.quality / 100) * radius;
        const x = center + valueRadius * Math.cos(angle);
        const y = center + valueRadius * Math.sin(angle);
        return `${x},${y}`;
    }).join(' ');
    
    const labels = data.map((item, i) => {
        const angle = (Math.PI * 2 * i) / data.length - Math.PI / 2;
        const labelRadius = radius * 1.2;
        const x = center + labelRadius * Math.cos(angle);
        const y = center + labelRadius * Math.sin(angle);
        return { x, y, label: item.module };
    });

    return (
        <Card className="col-span-1 md:col-span-2">
            <h4 className="text-gray-400 text-sm font-medium mb-2">{title}</h4>
            <div className="flex justify-center items-center">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <polygon points={points} className="fill-teal-500/30 stroke-teal-400" strokeWidth="2" />
                    {labels.map(l => (
                        <text key={l.label} x={l.x} y={l.y} fill="white" fontSize="10" textAnchor="middle" dominantBaseline="middle">
                            {l.label}
                        </text>
                    ))}
                </svg>
            </div>
        </Card>
    );
};
