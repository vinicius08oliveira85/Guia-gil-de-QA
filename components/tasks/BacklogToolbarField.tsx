import React from 'react';
import { cn } from '../../utils/cn';
import {
  backlogToolbarFieldClass,
  backlogToolbarLabelClass,
  backlogToolbarSelectClass,
} from './backlogToolbarLayout';

export interface BacklogToolbarFieldProps {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  ariaLabel: string;
  children: React.ReactNode;
  className?: string;
}

export const BacklogToolbarField: React.FC<BacklogToolbarFieldProps> = ({
  id,
  label,
  value,
  disabled = false,
  onChange,
  ariaLabel,
  children,
  className,
}) => (
  <div className={cn(backlogToolbarFieldClass, className)}>
    <label htmlFor={id} className={backlogToolbarLabelClass}>
      {label}
    </label>
    <select
      id={id}
      value={value}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
      className={backlogToolbarSelectClass}
      aria-label={ariaLabel}
    >
      {children}
    </select>
  </div>
);
