import React, { useMemo } from 'react';
import { cn } from '../../utils/windows12Styles';
import { AlertCircle, CheckCircle, Clock, XCircle, MinusCircle, Info } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

// Define the available standard statuses
export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'pending' | 'default';

// --- Internal Configuration ---
interface StatusConfig {
  icon: React.ElementType;
  /** Tailwind classes for the badge variant */
  classNames: (theme: string) => string;
  /** ARIA role for accessibility */
  role: 'status' | 'alert' | 'none';
}

const getStatusConfig = (theme: string): Record<StatusType, StatusConfig> => ({
  success: {
    icon: CheckCircle,
    classNames: (theme) => {
      if (theme === 'leve-saude') {
        return 'bg-green-100 text-green-900 border-green-400 hover:bg-green-200 dark:bg-green-950/40 dark:text-green-200 dark:border-green-600';
      }
      return 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30';
    },
    role: 'status',
  },
  error: {
    icon: XCircle,
    classNames: (theme) => {
      if (theme === 'leve-saude') {
        return 'bg-red-100 text-red-900 border-red-400 hover:bg-red-200 dark:bg-red-950/40 dark:text-red-200 dark:border-red-600';
      }
      return 'bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30';
    },
    role: 'alert',
  },
  warning: {
    icon: AlertCircle,
    classNames: (theme) => {
      if (theme === 'leve-saude') {
        return 'bg-yellow-100 text-yellow-900 border-yellow-400 hover:bg-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-200 dark:border-yellow-600';
      }
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30';
    },
    role: 'alert',
  },
  info: {
    icon: Info,
    classNames: (theme) => {
      if (theme === 'leve-saude') {
        return 'bg-blue-100 text-blue-900 border-blue-400 hover:bg-blue-200 dark:bg-blue-950/40 dark:text-blue-200 dark:border-blue-600';
      }
      return 'bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30';
    },
    role: 'status',
  },
  pending: {
    icon: Clock,
    classNames: (theme) => {
      if (theme === 'leve-saude') {
        return 'bg-orange-100 text-orange-900 border-orange-400 hover:bg-orange-200 dark:bg-orange-950/40 dark:text-orange-200 dark:border-orange-600';
      }
      return 'bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30';
    },
    role: 'status',
  },
  default: {
    icon: MinusCircle,
    classNames: (theme) => {
      if (theme === 'leve-saude') {
        return 'bg-gray-100 text-gray-900 border-gray-400 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600';
      }
      return 'bg-surface-hover text-text-primary border-surface-border hover:bg-surface';
    },
    role: 'none',
  },
});

// --- 📦 API (Props) Definition ---
export interface StatusBadgeProps {
  /** The text content displayed inside the badge. */
  children: React.ReactNode;
  /** The predefined status type to determine color and icon. */
  status: StatusType;
  /** Optional custom Tailwind classes for further styling. */
  className?: string;
  /** If true, the icon will not be displayed. */
  hideIcon?: boolean;
}

/**
 * A professional, accessible component for displaying status or state.
 * It automatically selects color and icon based on the 'status' prop and theme.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  children,
  status,
  className,
  hideIcon = false,
}) => {
  const { theme } = useTheme();
  const config = useMemo(() => {
    const statusConfigs = getStatusConfig(theme);
    return statusConfigs[status] || statusConfigs['default'];
  }, [status, theme]);

  const IconComponent = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-medium text-xs h-5 px-2 py-0 rounded-full border transition-all duration-200 cursor-default whitespace-nowrap",
        config.classNames(theme),
        className
      )}
      role={config.role}
      aria-live={config.role === 'alert' ? 'assertive' : 'polite'}
    >
      {!hideIcon && (
        <IconComponent className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
      )}
      <span className="truncate">{children}</span>
    </span>
  );
};
