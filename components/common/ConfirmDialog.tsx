import React from 'react';
import { Modal } from './Modal';
import { cn } from '../../utils/cn';
import { leveSettingsMutedTextClass, leveViewOutlineBtnClass, leveViewPrimaryBtnClass } from './projectCardUi';

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
    danger: '!bg-[#e54b4f] !shadow-[0_2px_8px_rgba(229,75,79,0.25)] hover:brightness-105',
    warning: '!bg-[color-mix(in_srgb,#f59e0b_90%,#e65100)] hover:brightness-105',
    info: '',
  } as const;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className="space-y-4">
        <p className={leveSettingsMutedTextClass}>{message}</p>
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={cn(leveViewOutlineBtnClass, 'min-h-10')}
            type="button"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(leveViewPrimaryBtnClass, 'min-h-10', confirmVariantClass[variant])}
            type="button"
          >
            {isLoading ? 'Processando...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
