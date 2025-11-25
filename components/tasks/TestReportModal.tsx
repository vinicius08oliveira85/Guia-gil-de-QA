import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { windows12Styles } from '../../utils/windows12Styles';
import { JiraTask } from '../../types';
import { generateTestReport, TestReportFormat } from '../../utils/testReportGenerator';
import { downloadFile } from '../../utils/exportService';
import { Badge } from '../common/Badge';

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
  const [format, setFormat] = useState<TestReportFormat>('text');
  const [generationDate, setGenerationDate] = useState<Date | null>(null);
  const executedTestCases = useMemo(
    () => (task?.testCases || []).filter(testCase => testCase.status !== 'Not Run'),
    [task]
  );

  useEffect(() => {
    if (isOpen && task) {
      const now = new Date();
      setGenerationDate(now);
      const report = generateTestReport(task, now, { format });
      setReportText(report);
      setCopied(false);
    } else {
      setFormat('text');
      setGenerationDate(null);
    }
  }, [isOpen, task]);

  useEffect(() => {
    if (!isOpen || !task) {
      return;
    }
    const baseDate = generationDate ?? new Date();
    if (!generationDate) {
      setGenerationDate(baseDate);
    }
    const report = generateTestReport(task, baseDate, { format });
    setReportText(report);
    setCopied(false);
  }, [format, generationDate, isOpen, task]);

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

  const handleDownload = () => {
    if (!task) {
      return;
    }
    const extension = format === 'markdown' ? 'md' : 'txt';
    const mimeType = format === 'markdown' ? 'text/markdown' : 'text/plain';
    downloadFile(
      reportText,
      `${task.id}-registro-testes.${extension}`,
      mimeType
    );
  };

  const formatOptions: Array<{ label: string; value: TestReportFormat; description: string }> = [
    { label: 'Texto estruturado', value: 'text', description: 'Formato ideal para colar em campos comuns.' },
    { label: 'Markdown', value: 'markdown', description: 'Melhor para docs e wikis com formatação.' }
  ];

  const getStatusBadge = (status: string) => {
    const isApproved = status === 'Passed';
    return {
      label: isApproved ? 'Aprovado' : 'Reprovado',
      variant: isApproved ? 'success' : 'error'
    } as const;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registro de Testes Realizados">
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-text-secondary">
            Copie o registro abaixo para colar em outras plataformas
          </p>
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              className="btn btn-secondary flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16h16M8 12h8m-8 4h5" />
              </svg>
              <span>Baixar .{format === 'markdown' ? 'md' : 'txt'}</span>
            </button>
            <button
              onClick={handleCopy}
              className={`
                btn btn-primary
                flex items-center gap-2
                ${copied ? '!bg-green-500 hover:!bg-green-600' : ''}
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
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-wide text-text-secondary">Formato do relatório</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {formatOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormat(option.value)}
                className={`
                  border rounded-lg px-4 py-3 text-left transition
                  ${format === option.value
                    ? 'border-accent bg-accent/10 text-white shadow-md'
                    : 'border-surface-border text-text-secondary hover:text-text-primary hover:border-accent/40'}
                `}
              >
                <p className="font-medium">{option.label}</p>
                <p className="text-sm text-text-secondary">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-wide text-text-secondary">Resumo visual</p>
            <div className="flex gap-4 text-xs text-text-secondary">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span>Aprovado</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-danger"></span>
                <span>Reprovado</span>
              </div>
            </div>
          </div>
          {executedTestCases.length > 0 ? (
            <ul className="space-y-2">
              {executedTestCases.map((testCase, index) => {
                const statusData = getStatusBadge(testCase.status);
                return (
                  <li
                    key={`${testCase.id}-${index}`}
                    className="flex flex-col gap-1 rounded-lg border border-surface-border bg-surface px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-text-primary">
                          {testCase.description || `Teste ${index + 1}`}
                        </p>
                        {testCase.executedStrategy && (
                          <p className="text-xs text-text-secondary">
                            {Array.isArray(testCase.executedStrategy)
                              ? testCase.executedStrategy.join(', ')
                              : testCase.executedStrategy}
                          </p>
                        )}
                      </div>
                      <Badge variant={statusData.variant} size="sm">
                        {statusData.label}
                      </Badge>
                    </div>
                    {testCase.toolsUsed && testCase.toolsUsed.length > 0 && (
                      <p className="text-xs text-text-secondary">
                        Ferramentas: {testCase.toolsUsed.join(', ')}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-text-secondary">Nenhum teste executado até o momento.</p>
          )}
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

