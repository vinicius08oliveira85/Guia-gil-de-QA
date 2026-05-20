import React, { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Download, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { JiraTask } from '../../types';
import {
  generateTestExecutiveSummary,
  generateTestReport,
  generateTestResultsOnlyReport,
} from '../../utils/testReportGenerator';
import { downloadFile } from '../../utils/exportService';
import { logger } from '../../utils/logger';
import { summarizeTestReport } from '../../services/ai/testReportSummaryService';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { TestReportExecutionPanel } from './TestReportExecutionPanel';
import { TestReportTextPreview } from './TestReportTextPreview';
import { cn } from '../../utils/cn';
import {
  taskLabelMutedClass,
  taskModalSectionAccentClass,
  taskModalSectionClass,
  taskPanelBorderClass,
  taskTextStrongClass,
} from './taskActionLayout';

type ReportFormatOption = 'text' | 'resumido';
type CopyVariant = 'full' | 'summary' | 'results' | null;

interface TestReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: JiraTask;
}

function getReportGeneratorOptions(format: ReportFormatOption) {
  if (format === 'resumido') {
    return { format: 'text' as const, concise: true, includeTools: false };
  }

  return {
    format: 'text' as const,
    concise: false,
    includeTools: false,
  };
}

export const TestReportModal: React.FC<TestReportModalProps> = ({ isOpen, onClose, task }) => {
  const [reportText, setReportText] = useState('');
  const [copiedVariant, setCopiedVariant] = useState<CopyVariant>(null);
  const [format, setFormat] = useState<ReportFormatOption>('text');
  const [generationDate, setGenerationDate] = useState<Date | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [isAISummarized, setIsAISummarized] = useState(false);

  const executedTestCases = useMemo(
    () => (task?.testCases || []).filter(testCase => testCase.status !== 'Not Run'),
    [task]
  );

  const visualStats = useMemo(
    () => ({
      approved: executedTestCases.filter(testCase => testCase.status === 'Passed').length,
      failed: executedTestCases.filter(testCase => testCase.status === 'Failed').length,
      blocked: executedTestCases.filter(testCase => testCase.status === 'Blocked').length,
    }),
    [executedTestCases]
  );

  useEffect(() => {
    if (!isOpen || !task) {
      setFormat('text');
      setGenerationDate(null);
      setIsAISummarized(false);
      setCopiedVariant(null);
      return;
    }

    if (isAISummarized) {
      return;
    }

    const baseDate = generationDate ?? new Date();
    if (!generationDate) {
      setGenerationDate(baseDate);
    }

    const report = generateTestReport(task, baseDate, getReportGeneratorOptions(format));
    setReportText(report);
    setCopiedVariant(null);
  }, [format, generationDate, isAISummarized, isOpen, task]);

  const effectiveGenerationDate = generationDate ?? new Date();
  const executiveSummaryText = useMemo(
    () => generateTestExecutiveSummary(task, effectiveGenerationDate),
    [effectiveGenerationDate, task]
  );
  const resultsOnlyText = useMemo(
    () => generateTestResultsOnlyReport(task, effectiveGenerationDate),
    [effectiveGenerationDate, task]
  );

  const copyText = async (text: string, variant: Exclude<CopyVariant, null>, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedVariant(variant);
      toast.success(successMessage);
      setTimeout(() => {
        setCopiedVariant(current => (current === variant ? null : current));
      }, 2000);
    } catch (error) {
      logger.error('Erro ao copiar', 'TestReportModal', error);
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopiedVariant(variant);
        toast.success(successMessage);
        setTimeout(() => {
          setCopiedVariant(current => (current === variant ? null : current));
        }, 2000);
      } catch (err) {
        logger.error('Fallback copy failed', 'TestReportModal', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleCopy = () => copyText(reportText, 'full', 'Registro completo copiado.');
  const handleCopyExecutiveSummary = () =>
    copyText(executiveSummaryText, 'summary', 'Resumo executivo copiado.');
  const handleCopyResultsOnly = () =>
    copyText(resultsOnlyText, 'results', 'Somente os resultados foram copiados.');

  const handleDownload = () => {
    downloadFile(reportText, `${task.id}-registro-testes.txt`, 'text/plain');
  };

  const handleSummarizeWithAI = async () => {
    if (!reportText.trim() || summarizing) {
      return;
    }

    setSummarizing(true);
    try {
      const summarized = await summarizeTestReport(reportText);
      setReportText(summarized);
      setIsAISummarized(true);
      toast.success('Relatório resumido com IA.');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Erro ao resumir com IA. Verifique a API key do Gemini em Configurações.';
      toast.error(message);
    } finally {
      setSummarizing(false);
    }
  };

  const formatOptions: Array<{ label: string; value: ReportFormatOption; description: string }> = [
    {
      label: 'Texto estruturado',
      value: 'text',
      description: 'Resumo organizado, direto ao ponto e pronto para colar.',
    },
    {
      label: 'Resumido',
      value: 'resumido',
      description: 'Versão compacta com foco apenas no resultado final.',
    },
  ];

  const currentFormatLabel = format === 'resumido' ? 'Resumido' : 'Texto estruturado';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registro de Testes Realizados" size="4xl">
      <div className="h-full flex flex-col min-h-0 space-y-5">
        <div className="flex-shrink-0">
          <div className={cn(taskModalSectionClass, 'flex flex-col gap-3 p-4 shadow-sm')}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className={cn('text-sm font-semibold', taskTextStrongClass)}>Saídas prontas para uso</p>
                <p className={cn('text-sm', taskLabelMutedClass)}>
                  Copie o registro completo ou use atalhos mais enxutos conforme a plataforma.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 lg:justify-end">
                <Button
                  type="button"
                  variant="brandOutline"
                  size="panelXs"
                  onClick={handleSummarizeWithAI}
                  disabled={summarizing || !reportText.trim()}
                  aria-label="Resumir relatório com IA"
                  className="justify-start"
                >
                  <Sparkles className="w-3.5 h-3.5" aria-hidden />
                  {summarizing ? 'Resumindo…' : 'Resumir com IA'}
                </Button>
                <Button
                  type="button"
                  variant="brandOutline"
                  size="panelXs"
                  onClick={handleDownload}
                  aria-label="Baixar relatório em .txt"
                  className="justify-start"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden />
                  Baixar .txt
                </Button>
                <Button
                  type="button"
                  variant={copiedVariant === 'full' ? 'default' : 'brand'}
                  size="panelXs"
                  onClick={handleCopy}
                  aria-label={copiedVariant === 'full' ? 'Registro copiado' : 'Copiar registro completo'}
                  className="justify-start"
                >
                  {copiedVariant === 'full' ? (
                    <Check className="w-3.5 h-3.5" aria-hidden />
                  ) : (
                    <Copy className="w-3.5 h-3.5" aria-hidden />
                  )}
                  {copiedVariant === 'full' ? 'Copiado!' : 'Copiar registro'}
                </Button>
              </div>
            </div>

            <div
              className={cn(
                taskPanelBorderClass,
                'flex flex-col gap-2 bg-[var(--brand-chip)] px-3 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between'
              )}
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
                  Atalhos de cópia
                </p>
                <p className="text-xs text-base-content/70">
                  Versões curtas para comentário, evidência rápida ou status executivo.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 sm:justify-end">
                <Button
                  type="button"
                  variant="brandOutline"
                  size="panelXs"
                  onClick={handleCopyExecutiveSummary}
                  aria-label="Copiar resumo executivo"
                  className="justify-start"
                >
                  {copiedVariant === 'summary' ? (
                    <Check className="w-3.5 h-3.5" aria-hidden />
                  ) : (
                    <Copy className="w-3.5 h-3.5" aria-hidden />
                  )}
                  {copiedVariant === 'summary' ? 'Resumo copiado!' : 'Copiar resumo'}
                </Button>
                <Button
                  type="button"
                  variant="brandOutline"
                  size="panelXs"
                  onClick={handleCopyResultsOnly}
                  aria-label="Copiar somente resultados"
                  className="justify-start"
                >
                  {copiedVariant === 'results' ? (
                    <Check className="w-3.5 h-3.5" aria-hidden />
                  ) : (
                    <Copy className="w-3.5 h-3.5" aria-hidden />
                  )}
                  {copiedVariant === 'results' ? 'Resultados copiados!' : 'Copiar resultados'}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 flex flex-col gap-3">
          <p className="text-sm font-semibold text-base-content">Formato do relatório</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {formatOptions.map(option => {
              const isSelected = format === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setFormat(option.value);
                    setIsAISummarized(false);
                  }}
                  role="button"
                  aria-pressed={isSelected}
                  aria-label={`${option.label}: ${option.description}`}
                  className={cn(
                    'flex items-start gap-2 p-4 text-left transition-all duration-200 rounded-[var(--radius)]',
                    isSelected
                      ? cn(
                          taskModalSectionAccentClass,
                          'border-2 border-[var(--brand-cta)] ring-2 ring-[color-mix(in_srgb,var(--brand-cta)_22%,transparent)] text-[var(--brand-text-strong)]'
                        )
                      : cn(
                          taskPanelBorderClass,
                          'text-[var(--brand-text-muted)] hover:border-[var(--brand-surface-border)] hover:bg-[var(--brand-chip-hover)] hover:text-[var(--brand-text-strong)]'
                        )
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2',
                      isSelected
                        ? 'border-[var(--brand-cta)] bg-[var(--brand-surface-strong)]'
                        : 'border-[var(--brand-surface-border)] bg-[var(--brand-surface-strong)]'
                    )}
                  >
                    {isSelected ? (
                      <div className="h-2.5 w-2.5 rounded-full bg-[var(--brand-cta)]" aria-hidden />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{option.label}</p>
                    <p className="mt-1 text-sm text-base-content/70">{option.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid flex-1 min-h-0 gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <TestReportExecutionPanel executedTestCases={executedTestCases} visualStats={visualStats} />

          <div className="min-h-0">
            <TestReportTextPreview
              reportText={reportText}
              formatLabel={currentFormatLabel}
              isAISummarized={isAISummarized}
            />
          </div>
        </div>

        <div className="flex flex-shrink-0 justify-end border-t border-base-200 pt-4">
          <Button
            type="button"
            variant="brandOutline"
            size="panel"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
