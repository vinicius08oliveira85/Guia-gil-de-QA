import React from 'react';
import { Modal } from './Modal'; // Componente base de modal existente no projeto

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Configurações"
      ariaLabelledBy="settings-modal-title"
    >
      <div className="p-6">
        <h2 id="settings-modal-title" className="heading-section mb-6">
          Configurações Gerais
        </h2>
        <div className="space-y-5">
          <div>
            <label htmlFor="theme-select" className="block text-sm font-medium text-text-secondary mb-2">
              Tema da Interface
            </label>
            <select
              id="theme-select"
              className="w-full px-3 py-2 bg-surface border border-surface-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="system">Padrão do Sistema</option>
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
            </select>
          </div>
          {/* Adicione outras configurações aqui */}
        </div>
        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} className="btn">
            Cancelar
          </button>
          <button onClick={onClose} className="btn btn-primary">
            Salvar
          </button>
        </div>
      </div>
    </Modal>
  );
};