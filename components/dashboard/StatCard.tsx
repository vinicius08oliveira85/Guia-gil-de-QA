
import React from 'react';
import { Card } from '../common/Card';

export const StatCard: React.FC<{ title: string; value: string; subValue?: string; statusColor?: string }> = ({ title, value, subValue, statusColor }) => (
    <Card className="flex flex-col justify-between">
        <h4 className="text-gray-400 text-sm font-medium">{title}</h4>
        <p className={`text-3xl font-bold text-white mt-2 ${statusColor}`}>{value}</p>
        {subValue && <p className="text-gray-500 text-xs mt-1">{subValue}</p>}
    </Card>
);
