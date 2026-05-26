import React from 'react';
import { AppSelect } from '../common/AppSelect';
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
    <AppSelect
      id={id}
      value={value}
      disabled={disabled}
      onChange={onChange}
      className={backlogToolbarSelectClass}
      aria-label={ariaLabel}
    >
      {children}
    </AppSelect>
  </div>
);
