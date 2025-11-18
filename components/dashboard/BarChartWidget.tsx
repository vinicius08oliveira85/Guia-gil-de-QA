import React from 'react';
import { Card } from '../common/Card';

export const BarChartWidget: React.FC<{ 
    title: string; 
    data: { label: string; value: number; color: string }[];
    // Fix: Add rawData to props to accept the raw values for tooltips.
    rawData: { label: string; value: number; color: string }[];
}> = ({ title, data, rawData }) => (
    <Card className="col-span-1 md:col-span-2">
        <h4 className="text-gray-400 text-sm font-medium mb-4">{title}</h4>
        <div className="flex justify-around items-end h-40 gap-4">
            {data.map((item, index) => (
                <div key={item.label} className="flex flex-col items-center flex-1">
                    <div className="w-full h-full flex items-end tooltip-container">
                       <div className={item.color} style={{ height: `${item.value}%`, width: '100%' }}></div>
                       <span className="tooltip-text !px-2 !py-1 !text-xs">
                            {item.label}: {rawData[index].value}
                        </span>
                    </div>
                    <span className="text-xs text-gray-500 mt-2">{item.label}</span>
                </div>
            ))}
        </div>
    </Card>
);