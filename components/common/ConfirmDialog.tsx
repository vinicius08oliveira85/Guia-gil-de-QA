import React from 'react';
import { Modal } from './Modal';
import { cn } from '../../utils/cn';
import { outlineActionBtn, primaryActionBtn } from './viewUi';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading = false,
}) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const confirmVariantClass = {
    danger: 'btn-error border-transparent',
    warning: 'btn-warning border-transparent',
    info: 'btn-info border-transparent',
  } as const;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="app-element-typography text-[var(--brand-text-muted)]">{message}</p>
        <div className="flex gap-3 justify-end pt-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={cn(outlineActionBtn, 'min-h-10')}
            type="button"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              primaryActionBtn,
              'btn min-h-10',
              confirmVariantClass[variant],
              variant === 'danger' && '!bg-[var(--destructive)] !border-[var(--destructive)]'
            )}
            type="button"
          >
            {isLoading ? 'Processando...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
