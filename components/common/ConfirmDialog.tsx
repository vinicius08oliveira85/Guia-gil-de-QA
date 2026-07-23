import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { leveSettingsMutedTextClass } from './projectCardUi';

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
          <Button
            onClick={onClose}
            disabled={isLoading}
            variant="outline"
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            isLoading={isLoading}
            loadingText="Processando..."
            variant={variant === 'danger' ? 'destructive' : 'default'}
            className={variant === 'info' ? 'btn-primary' : ''}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
