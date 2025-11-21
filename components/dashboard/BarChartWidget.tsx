import React, { useState } from 'react';
import { Card } from '../common/Card';
import { windows12Styles, cn } from '../../utils/windows12Styles';

type BarChartWidgetProps = {
    title: string;
    data: { label: string; value: number; color: string }[];
    rawData: { label: string; value: number; color: string }[];
    className?: string;
    onBarClick?: (label: string, value: number) => void;
    interactive?: boolean;
};

export const BarChartWidget: React.FC<BarChartWidgetProps> = ({ 
    title, 
    data, 
    rawData, 
    className = '',
    onBarClick,
    interactive = false
}) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <Card className={cn('!p-4 sm:!p-6', className)}>
            <div className="flex items-center justify-between gap-4">
                <h4 className="text-[clamp(0.9rem,2vw,1.1rem)] font-semibold text-text-primary">{title}</h4>
                <span className="text-xs uppercase tracking-[0.2em] text-text-secondary">Atualizado</span>
            </div>
            <div className="mt-4 space-y-4">
                {data.map((item, index) => (
                    <div 
                        key={item.label}
                        className={cn(
                            interactive && 'cursor-pointer',
                            windows12Styles.transition.all
                        )}
                        onClick={() => interactive && onBarClick?.(item.label, rawData[index].value)}
                        onMouseEnter={() => interactive && setHoveredIndex(index)}
                        onMouseLeave={() => interactive && setHoveredIndex(null)}
                    >
                        <div className="flex items-center justify-between text-[clamp(0.78rem,1.6vw,0.9rem)] text-text-secondary">
                            <span className={cn(
                                interactive && hoveredIndex === index && "text-accent font-semibold",
                                windows12Styles.transition.all
                            )}>{item.label}</span>
                            <span className={cn(
                                "font-semibold text-text-primary",
                                interactive && hoveredIndex === index && "text-accent scale-110",
                                windows12Styles.transition.all
                            )}>{rawData[index].value}</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-white/5 overflow-hidden">
                            <div
                                className={cn(
                                    `h-2 rounded-full ${item.color}`,
                                    windows12Styles.transition.all,
                                    interactive && hoveredIndex === index && "h-3 shadow-lg",
                                    interactive && hoveredIndex === index && windows12Styles.glow('accent')
                                )}
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
};