import React from 'react';
import { Loader2 } from 'lucide-react';

interface WorkspaceActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  isLoading?: boolean;
  'aria-label'?: string;
  title?: string;
  /** toolbar = sm:hidden label; card/inline = text-xs label */
  labelVisibility?: 'toolbar' | 'card' | 'inline';
}

export const WorkspaceActionButton: React.FC<WorkspaceActionButtonProps> = ({
  icon,
  label,
  onClick,
  disabled,
  className = '',
  isLoading,
  'aria-label': ariaLabel,
  title,
  labelVisibility = 'toolbar',
}) => {
  const labelClass =
    labelVisibility === 'toolbar' ? 'hidden sm:inline' :
    labelVisibility === 'inline' ? 'text-xs' : 'text-xs';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
      aria-label={ariaLabel}
      title={title}
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
      ) : (
        icon
      )}
      <span className={labelClass}>{label}</span>
    </button>
  );
};
