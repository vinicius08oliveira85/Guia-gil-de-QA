import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

interface LoadingSkeletonProps {
  variant?: 'task' | 'card' | 'list' | 'text' | 'button' | 'table';
  count?: number;
  className?: string;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'card',
  count = 1,
  className = '',
}) => {
  const renderSkeleton = () => {
    const baseClasses = 'relative overflow-hidden rounded-lg';
    const shimmerClasses =
      'absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer';

    switch (variant) {
      case 'task':
        return (
          <motion.div
            className={cn(baseClasses, 'bg-base-100 border border-base-300 p-4')}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-base-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-base-200 rounded w-1/4 mb-2"></div>
                  <div className="h-5 bg-base-200 rounded w-3/4"></div>
                </div>
              </div>
              <div className="h-3 bg-base-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-base-200 rounded w-5/6"></div>
              <div className={shimmerClasses}></div>
            </div>
          </motion.div>
        );
      case 'card':
        return (
          <motion.div
            className={cn(baseClasses, 'bg-base-100 border border-base-300 p-6')}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative">
              <div className="h-6 bg-base-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-base-200 rounded w-full"></div>
                <div className="h-4 bg-base-200 rounded w-5/6"></div>
                <div className="h-4 bg-base-200 rounded w-4/6"></div>
              </div>
              <div className={shimmerClasses}></div>
            </div>
          </motion.div>
        );
      case 'list':
        return (
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className={cn(baseClasses, 'h-10 bg-base-200')}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
              >
                <div className={shimmerClasses}></div>
              </motion.div>
            ))}
          </motion.div>
        );
      case 'table':
        return (
          <motion.div
            className={cn(baseClasses, 'bg-base-100 border border-base-300 p-4')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative">
              <div className="space-y-3">
                <div className="h-12 bg-base-200 rounded"></div>
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="h-10 bg-base-200 rounded"></div>
                ))}
              </div>
              <div className={shimmerClasses}></div>
            </div>
          </motion.div>
        );
      case 'text':
        return (
          <motion.div
            className="relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="h-4 bg-base-200 rounded w-full mb-2"></div>
            <div className="h-4 bg-base-200 rounded w-5/6 mb-2"></div>
            <div className="h-4 bg-base-200 rounded w-4/6"></div>
            <div className={shimmerClasses}></div>
          </motion.div>
        );
      case 'button':
        return (
          <motion.div
            className={cn(baseClasses, 'h-10 bg-base-200 w-24')}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className={shimmerClasses}></div>
          </motion.div>
        );
      default:
        return (
          <motion.div
            className={cn(baseClasses, 'h-20 bg-base-200')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className={shimmerClasses}></div>
          </motion.div>
        );
    }
  };

  if (count === 1) {
    return <div className={className}>{renderSkeleton()}</div>;
  }

  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <motion.div
          key={index}
          className={index < count - 1 ? 'mb-4' : ''}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1, duration: 0.3 }}
        >
          {renderSkeleton()}
        </motion.div>
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
