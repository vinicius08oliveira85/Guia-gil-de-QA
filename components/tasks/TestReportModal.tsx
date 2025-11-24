import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { windows12Styles } from '../../utils/windows12Styles';
import { JiraTask } from '../../types';
import { generateTestReport } from '../../utils/testReportGenerator';

interface TestReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: JiraTask;
}

export const TestReportModal: React.FC<TestReportModalProps> = ({
  isOpen,
  onClose,
  task
}) => {
  const [reportText, setReportText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && task) {
      const generationDate = new Date();
      const report = generateTestReport(task, generationDate);
      setReportText(report);
      setCopied(false);
    }
  }, [isOpen, task]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
      // Fallback para navegadores antigos
      const textArea = document.createElement('textarea');
      textArea.value = reportText;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Fallback copy failed:', err);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registro de Testes Realizados">
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-text-secondary">
            Copie o registro abaixo para colar em outras plataformas
          </p>
          <button
            onClick={handleCopy}
            className={`
              ${windows12Styles.buttonPrimary}
              flex items-center gap-2
              ${copied ? 'bg-green-500 hover:bg-green-600' : ''}
            `}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>

        <div className={`
          ${windows12Styles.card}
          ${windows12Styles.spacing.md}
          relative
        `}>
          <textarea
            value={reportText}
            readOnly
            className={`
              w-full h-96
              bg-surface border border-surface-border rounded-lg
              px-4 py-3 text-sm text-text-primary
              font-mono
              resize-none
              focus:outline-none focus:ring-2 focus:ring-accent/50
              ${windows12Styles.transition.fast}
            `}
            onClick={(e) => {
              (e.target as HTMLTextAreaElement).select();
            }}
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className={windows12Styles.buttonSecondary}
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};

