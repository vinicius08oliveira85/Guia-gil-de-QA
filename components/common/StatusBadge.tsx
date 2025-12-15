import React, { useMemo } from 'react';
import { cn } from '../../utils/cn';
import { AlertCircle, CheckCircle, Clock, XCircle, MinusCircle, Info } from 'lucide-react';

// Define the available standard statuses
export type StatusType = 'success' | 'error' | 'warning' | 'info' | 'pending' | 'default';

// --- Internal Configuration ---
interface StatusConfig {
  icon: React.ElementType;
  /** Classes CSS para o badge */
  classNames: string;
  /** ARIA role for accessibility */
  role: 'status' | 'alert' | 'none';
}

const getStatusConfig = (): Record<StatusType, StatusConfig> => ({
  success: {
    icon: CheckCircle,
    classNames: 'badge-success badge-outline',
    role: 'status',
  },
  error: {
    icon: XCircle,
    classNames: 'badge-error badge-outline',
    role: 'alert',
  },
  warning: {
    icon: AlertCircle,
    classNames: 'badge-warning badge-outline',
    role: 'alert',
  },
  info: {
    icon: Info,
    classNames: 'badge-info badge-outline',
    role: 'status',
  },
  pending: {
    icon: Clock,
    classNames: 'badge-warning badge-outline',
    role: 'status',
  },
  default: {
    icon: MinusCircle,
    classNames: 'badge-base-content badge-outline',
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
  const config = useMemo(() => {
    const statusConfigs = getStatusConfig();
    return statusConfigs[status] || statusConfigs['default'];
  }, [status]);

  const IconComponent = config.icon;

  return (
    <span
      className={cn(
        "badge badge-sm inline-flex items-center gap-1 font-medium cursor-default whitespace-nowrap",
        config.classNames,
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
