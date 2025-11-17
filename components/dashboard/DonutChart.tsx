
import React from 'react';
import { Card } from '../common/Card';

export const DonutChart: React.FC<{ title: string; percentage: number; color: string; note?: string }> = ({ title, percentage, color, note }) => {
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <Card>
            <h4 className="text-gray-400 text-sm font-medium mb-2">{title}</h4>
            <div className="flex items-center justify-center relative h-32">
                <svg className="w-32 h-32" viewBox="0 0 120 120">
                    <circle className="text-gray-700" strokeWidth="12" stroke="currentColor" fill="transparent" r={radius} cx="60" cy="60" />
                    <circle
                        className={color}
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
                <span className="absolute text-2xl font-bold text-white">{percentage}%</span>
            </div>
            {note && <p className="text-center text-gray-500 text-xs mt-2">{note}</p>}
        </Card>
    );
};
