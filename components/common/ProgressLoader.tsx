import React from 'react';
import { Spinner } from './Spinner';

interface ProgressLoaderProps {
    message: string;
    progress?: number; // 0-100
    estimatedTime?: string;
    subMessage?: string;
}

export const ProgressLoader: React.FC<ProgressLoaderProps> = ({
    message,
    progress,
    estimatedTime,
    subMessage
}) => {
    return (
        <div className="flex flex-col items-center justify-center py-8 px-4">
            <Spinner small />
            <p className="text-sm font-medium text-text-primary mt-4">{message}</p>
            {subMessage && (
                <p className="text-xs text-text-secondary mt-1">{subMessage}</p>
            )}
            {progress !== undefined && (
                <div className="w-full max-w-xs mt-4">
                    <div className="w-full bg-surface-hover rounded-full h-2.5">
                        <div 
                            className="bg-accent h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                    <p className="text-xs text-text-secondary mt-2 text-center">{progress}%</p>
                </div>
            )}
            {estimatedTime && (
                <p className="text-xs text-accent mt-2">⏱️ {estimatedTime}</p>
            )}
        </div>
    );
};

