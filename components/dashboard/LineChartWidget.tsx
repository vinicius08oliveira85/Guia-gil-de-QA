import React from 'react';
import { Card } from '../common/Card';

// Fix: Define interfaces for multi-series chart data and series information.
interface SeriesInfo {
    name: string;
    color: string;
}

interface ChartData {
    date: number;
    series: number[];
}

export const LineChartWidget: React.FC<{ 
    title: string; 
    data: ChartData[]; 
    series: SeriesInfo[] 
}> = ({ title, data, series }) => {
    if (data.length < 2) {
        return (
            <Card className="col-span-1 md:col-span-2">
                <h4 className="text-gray-400 text-sm font-medium mb-4">{title}</h4>
                <div className="h-48 bg-gray-900/50 rounded-md p-2 flex items-center justify-center">
                    <p className="text-gray-500">Dados insuficientes para exibir o gráfico.</p>
                </div>
            </Card>
        );
    }
    
    // Fix: Calculate max value across all series for proper scaling.
    const maxValue = Math.max(...data.flatMap(d => d.series), 1);
    
    // Fix: Helper function to generate SVG points for a specific series.
    const getPoints = (seriesIndex: number) => {
        return data.map((point, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - (point.series[seriesIndex] / maxValue) * 100;
            return `${x},${y}`;
        }).join(' ');
    };

    return (
        <Card className="col-span-1 md:col-span-2">
            <h4 className="text-gray-400 text-sm font-medium mb-4">{title}</h4>
            <div className="h-48 bg-gray-900/50 rounded-md p-2">
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Fix: Render a polyline for each series provided. */}
                    {series.map((s, index) => (
                        <polyline 
                            key={s.name} 
                            fill="none" 
                            className={s.color} 
                            strokeWidth="2" 
                            points={getPoints(index)} 
                        />
                    ))}
                </svg>
            </div>
        </Card>
    );
};
