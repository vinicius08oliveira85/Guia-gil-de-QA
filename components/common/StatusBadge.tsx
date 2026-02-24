import React, { useMemo } from 'react';
import { cn } from '../../utils/cn';
import { AlertCircle, CheckCircle, Clock, XCircle, MinusCircle, Info, X } from 'lucide-react';

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
    classNames: 'badge-success text-success-content border-success/60 bg-success/15',
    role: 'status',
  },
  error: {
    icon: XCircle,
    classNames: 'badge-error text-error-content border-error/60 bg-error/15',
    role: 'alert',
  },
  warning: {
    icon: AlertCircle,
    classNames:
      'badge-warning text-warning-content border-warning-content/60 bg-warning-content/20',
    role: 'alert',
  },
  info: {
    icon: Info,
    classNames: 'badge-info text-info-content border-info/60 bg-info/15',
    role: 'status',
  },
  pending: {
    icon: Clock,
    classNames:
      'badge-warning text-warning-content border-warning-content/60 bg-warning-content/20',
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
  /** If true, displays a dismiss button and enables removal. */
  dismissible?: boolean;
  /** Callback called when the badge is dismissed. */
  onDismiss?: () => void;
}

/**
 * A professional, accessible component for displaying status or state.
 * It automatically selects color and icon based on the 'status' prop and theme.
 * Supports dismissible mode with close button.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = ({
  children,
  status,
  className,
  hideIcon = false,
  dismissible = false,
  onDismiss,
}) => {
  const config = useMemo(() => {
    const statusConfigs = getStatusConfig();
    return statusConfigs[status] || statusConfigs['default'];
  }, [status]);

  const IconComponent = config.icon;

  // Estilos para modo dismissible seguindo padrão Radix UI
  const dismissibleStatusStyles: Record<StatusType, string> = {
    success: 'bg-green-50 border border-green-500 text-green-700',
    error: 'bg-pink-50 border border-red-500 text-red-700',
    warning: 'bg-yellow-50 border border-yellow-500 text-yellow-700',
    info: 'bg-blue-50 border border-blue-500 text-blue-700',
    pending: 'bg-yellow-50 border border-yellow-500 text-yellow-700',
    default: 'bg-gray-50 border border-gray-300 text-gray-700',
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDismiss?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onDismiss?.();
    }
  };

  const label = typeof children === 'string' ? children : undefined;

  // Se for dismissible, usa estilo customizado
  if (dismissible && onDismiss) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium cursor-default whitespace-nowrap',
          'transition-colors hover:opacity-80',
          dismissibleStatusStyles[status],
          className
        )}
        role={config.role}
        aria-live={config.role === 'alert' ? 'assertive' : 'polite'}
        aria-label={label}
      >
        {!hideIcon && <IconComponent className="h-3 w-3 flex-shrink-0" aria-hidden="true" />}
        <span className="truncate">{children}</span>
        <button
          type="button"
          onClick={handleDismiss}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex items-center justify-center rounded-full bg-white text-gray-600',
            'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-400',
            'transition-colors cursor-pointer h-5 w-5 min-h-[20px] min-w-[20px]'
          )}
          aria-label={`Remover ${label || 'badge'}`}
          tabIndex={0}
        >
          <X className="h-3 w-3 text-current" aria-hidden="true" />
        </button>
      </span>
    );
  }

  // Comportamento original quando não é dismissible
  return (
    <span
      className={cn(
        'badge badge-sm inline-flex items-center gap-1 font-medium cursor-default whitespace-nowrap',
        config.classNames,
        className
      )}
      role={config.role}
      aria-live={config.role === 'alert' ? 'assertive' : 'polite'}
      aria-label={label}
    >
      {!hideIcon && <IconComponent className="h-3 w-3 flex-shrink-0" aria-hidden="true" />}
      <span className="truncate">{children}</span>
    </span>
  );
};
