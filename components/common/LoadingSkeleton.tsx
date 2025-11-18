import React from 'react';

interface LoadingSkeletonProps {
    variant?: 'task' | 'card' | 'list' | 'text' | 'button';
    count?: number;
    className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
    variant = 'card', 
    count = 1,
    className = '' 
}) => {
    const renderSkeleton = () => {
        switch (variant) {
            case 'task':
                return (
                    <div className="bg-surface border border-surface-border rounded-lg p-4 animate-pulse">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 bg-surface-hover rounded-full"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-surface-hover rounded w-1/4 mb-2"></div>
                                <div className="h-5 bg-surface-hover rounded w-3/4"></div>
                            </div>
                        </div>
                        <div className="h-3 bg-surface-hover rounded w-full mb-2"></div>
                        <div className="h-3 bg-surface-hover rounded w-5/6"></div>
                    </div>
                );
            case 'card':
                return (
                    <div className="bg-surface border border-surface-border rounded-lg p-6 animate-pulse">
                        <div className="h-6 bg-surface-hover rounded w-1/3 mb-4"></div>
                        <div className="space-y-3">
                            <div className="h-4 bg-surface-hover rounded w-full"></div>
                            <div className="h-4 bg-surface-hover rounded w-5/6"></div>
                            <div className="h-4 bg-surface-hover rounded w-4/6"></div>
                        </div>
                    </div>
                );
            case 'list':
                return (
                    <div className="space-y-2 animate-pulse">
                        <div className="h-10 bg-surface-hover rounded"></div>
                        <div className="h-10 bg-surface-hover rounded"></div>
                        <div className="h-10 bg-surface-hover rounded"></div>
                    </div>
                );
            case 'text':
                return (
                    <div className="animate-pulse">
                        <div className="h-4 bg-surface-hover rounded w-full mb-2"></div>
                        <div className="h-4 bg-surface-hover rounded w-5/6 mb-2"></div>
                        <div className="h-4 bg-surface-hover rounded w-4/6"></div>
                    </div>
                );
            case 'button':
                return (
                    <div className="h-10 bg-surface-hover rounded w-24 animate-pulse"></div>
                );
            default:
                return (
                    <div className="h-20 bg-surface-hover rounded animate-pulse"></div>
                );
        }
    };

    if (count === 1) {
        return <div className={className}>{renderSkeleton()}</div>;
    }

    return (
        <div className={className}>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className={index < count - 1 ? 'mb-4' : ''}>
                    {renderSkeleton()}
                </div>
            ))}
        </div>
    );
};

// Componentes específicos para diferentes contextos
export const TaskListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
    <LoadingSkeleton variant="task" count={count} />
);

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => (
    <LoadingSkeleton variant="card" count={count} />
);

export const TextSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
    <LoadingSkeleton variant="text" count={count} />
);
