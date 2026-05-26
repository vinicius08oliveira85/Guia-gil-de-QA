import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';
import { neuSkeletonBlockClass, neuSkeletonShellClass } from './neuUi';

interface LoadingSkeletonProps {
  variant?: 'task' | 'card' | 'list' | 'text' | 'button' | 'table';
  count?: number;
  className?: string;
}

const shimmerClasses =
  'absolute inset-0 animate-shimmer bg-gradient-to-r from-transparent via-[color-mix(in_srgb,var(--leve-neu-dark)_8%,transparent)] to-transparent';

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'card',
  count = 1,
  className = '',
}) => {
  const blockClass = cn(neuSkeletonBlockClass, 'relative overflow-hidden');
  const shellClass = cn(neuSkeletonShellClass, 'p-4');

  const renderSkeleton = () => {
    switch (variant) {
      case 'task':
        return (
          <motion.div
            className={cn(shellClass)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative">
              <div className="mb-3 flex items-center gap-3">
                <div className={cn(blockClass, 'h-8 w-8 rounded-full')} />
                <div className="flex-1">
                  <div className={cn(blockClass, 'mb-2 h-4 w-1/4')} />
                  <div className={cn(blockClass, 'h-5 w-3/4')} />
                </div>
              </div>
              <div className={cn(blockClass, 'mb-2 h-3 w-full')} />
              <div className={cn(blockClass, 'h-3 w-5/6')} />
              <div className={shimmerClasses} />
            </div>
          </motion.div>
        );
      case 'card':
        return (
          <motion.div
            className={cn(shellClass, 'p-6')}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative">
              <div className={cn(blockClass, 'mb-4 h-6 w-1/3')} />
              <div className="space-y-3">
                <div className={cn(blockClass, 'h-4 w-full')} />
                <div className={cn(blockClass, 'h-4 w-5/6')} />
                <div className={cn(blockClass, 'h-4 w-4/6')} />
              </div>
              <div className={shimmerClasses} />
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
                className={cn(blockClass, 'h-10')}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
              >
                <div className={shimmerClasses} />
              </motion.div>
            ))}
          </motion.div>
        );
      case 'table':
        return (
          <motion.div
            className={cn(shellClass)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative">
              <div className="space-y-3">
                <div className={cn(blockClass, 'h-12 rounded')} />
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className={cn(blockClass, 'h-10 rounded')} />
                ))}
              </div>
              <div className={shimmerClasses} />
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
            <div className={cn(blockClass, 'mb-2 h-4 w-full')} />
            <div className={cn(blockClass, 'mb-2 h-4 w-5/6')} />
            <div className={cn(blockClass, 'h-4 w-4/6')} />
            <div className={shimmerClasses} />
          </motion.div>
        );
      case 'button':
        return (
          <motion.div
            className={cn(blockClass, 'h-10 w-24')}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className={shimmerClasses} />
          </motion.div>
        );
      default:
        return (
          <motion.div
            className={cn(blockClass, 'h-20')}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className={shimmerClasses} />
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

export const TaskListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <LoadingSkeleton variant="task" count={count} />
);

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => (
  <LoadingSkeleton variant="card" count={count} />
);

export const TextSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <LoadingSkeleton variant="text" count={count} />
);
