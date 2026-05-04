import React, { useCallback, useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { useLocalStorage } from '../../hooks/useLocalStorage';

export interface OnboardingGuideProps {
  /** Abre o guia mesmo se o usuário já tiver concluído antes. */
  forceOpen?: boolean;
  /** Chamado ao fechar (botão ou concluir). */
  onClose?: () => void;
}

const STEPS = [
  {
    title: 'Projetos e workspace',
    body: 'Organize o QA por projeto: tarefas, testes, documentos e métricas em um só lugar. Use o dashboard para ver saúde do workspace.',
  },
  {
    title: 'Busca e atalhos',
    body: 'Pressione Ctrl+K (ou Cmd+K) para buscar rapidamente. Pressione Ctrl+? (ou Cmd+?) para ver todos os atalhos.',
  },
  {
    title: 'Sincronização',
    body: 'Configure o Supabase nas Configurações para backup na nuvem. Sem configuração, os dados permanecem locais neste dispositivo.',
  },
] as const;

export const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ forceOpen = false, onClose }) => {
  const [completed, setCompleted] = useLocalStorage<boolean>(
    'qa-agile-onboarding-completed',
    false
  );
  const [isOpen, setIsOpen] = useState(!completed);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setStep(0);
    }
  }, [forceOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onClose?.();
  }, [onClose]);

  const handleFinish = useCallback(() => {
    setCompleted(true);
    setIsOpen(false);
    onClose?.();
  }, [onClose, setCompleted]);

  const isLast = step >= STEPS.length - 1;
  const content = STEPS[step];

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Bem-vindo ao QA Agile Guide" size="lg">
      <div className="space-y-4">
        <p className="text-sm text-base-content/75">
          Passo {step + 1} de {STEPS.length}
        </p>
        <div className="rounded-xl border border-base-300/60 bg-base-200/20 p-4">
          <h3 className="text-lg font-semibold text-base-content">{content.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-base-content/80">{content.body}</p>
        </div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-ghost rounded-full" onClick={handleClose}>
            Agora não
          </button>
          {!isLast ? (
            <button
              type="button"
              className="btn btn-primary rounded-full"
              onClick={() => setStep(s => s + 1)}
            >
              Próximo
            </button>
          ) : (
            <button type="button" className="btn btn-primary rounded-full" onClick={handleFinish}>
              Começar
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};
