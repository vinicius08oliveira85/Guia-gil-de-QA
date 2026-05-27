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
import { TestReportExecutionPanel } from './TestReportExecutionPanel';
import { TestReportTextPreview } from './TestReportTextPreview';
import { cn } from '../../utils/cn';
import {
  leveSettingsHeadingXsClass,
  leveSettingsMutedTextClass,
  leveSettingsMutedTextXsClass,
} from '../common/projectCardUi';
import {
  testReportModalBodyClass,
  testReportModalChipBtnClass,
  testReportModalFormatOptionClass,
  testReportModalInsetPanelClass,
  testReportModalPrimaryBtnClass,
  testReportModalSectionClass,
  testReportModalShellClass,
} from './testReportNeuUi';

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registro de Testes Realizados"
      size="7xl"
      maxHeight="92vh"
      panelClassName={testReportModalShellClass}
      bodyClassName={testReportModalBodyClass}
    >
      <div className="flex h-full min-h-0 flex-col space-y-5">
        <div className="flex-shrink-0">
          <div className={cn(testReportModalSectionClass, 'flex flex-col gap-3 p-4')}>
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className={leveSettingsHeadingXsClass}>Saídas prontas para uso</p>
                <p className={leveSettingsMutedTextClass}>
                  Copie o registro completo ou use atalhos mais enxutos conforme a plataforma.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleSummarizeWithAI}
                  disabled={summarizing || !reportText.trim()}
                  aria-label="Resumir relatório com IA"
                  className={testReportModalChipBtnClass}
                >
                  <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {summarizing ? 'Resumindo…' : 'Resumir com IA'}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  aria-label="Baixar relatório em .txt"
                  className={testReportModalChipBtnClass}
                >
                  <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Baixar .txt
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  aria-label={copiedVariant === 'full' ? 'Registro copiado' : 'Copiar registro completo'}
                  className={testReportModalPrimaryBtnClass}
                >
                  {copiedVariant === 'full' ? (
                    <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  ) : (
                    <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  )}
                  {copiedVariant === 'full' ? 'Copiado!' : 'Copiar registro'}
                </button>
              </div>
            </div>

            <div
              className={cn(
                testReportModalInsetPanelClass,
                'flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between'
              )}
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--leve-header-text-muted)]">
                  Atalhos de cópia
                </p>
                <p className={leveSettingsMutedTextXsClass}>
                  Versões curtas para comentário, evidência rápida ou status executivo.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCopyExecutiveSummary}
                  aria-label="Copiar resumo executivo"
                  className={testReportModalChipBtnClass}
                >
                  {copiedVariant === 'summary' ? (
                    <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  ) : (
                    <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  )}
                  {copiedVariant === 'summary' ? 'Resumo copiado!' : 'Copiar resumo'}
                </button>
                <button
                  type="button"
                  onClick={handleCopyResultsOnly}
                  aria-label="Copiar somente resultados"
                  className={testReportModalChipBtnClass}
                >
                  {copiedVariant === 'results' ? (
                    <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  ) : (
                    <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  )}
                  {copiedVariant === 'results' ? 'Resultados copiados!' : 'Copiar resultados'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-col gap-3">
          <p className={leveSettingsHeadingXsClass}>Formato do relatório</p>
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
                  aria-pressed={isSelected}
                  aria-label={`${option.label}: ${option.description}`}
                  className={testReportModalFormatOptionClass(isSelected)}
                >
                  <div
                    className={cn(
                      'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2',
                      isSelected
                        ? 'border-[var(--leve-header-accent)] bg-[#F2EEE8]'
                        : 'border-[#DED7CD] bg-[#E5DFD5]'
                    )}
                  >
                    {isSelected ? (
                      <div
                        className="h-2.5 w-2.5 rounded-full bg-[var(--leve-header-accent)]"
                        aria-hidden
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="font-medium text-[var(--leve-header-text)]">{option.label}</p>
                    <p className={cn('mt-1', leveSettingsMutedTextClass)}>{option.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-2 lg:gap-6">
          <TestReportExecutionPanel executedTestCases={executedTestCases} visualStats={visualStats} />

          <div className="min-h-0">
            <TestReportTextPreview
              reportText={reportText}
              formatLabel={currentFormatLabel}
              isAISummarized={isAISummarized}
            />
          </div>
        </div>

        <div className="flex flex-shrink-0 justify-end border-t border-[color-mix(in_srgb,#DED7CD_55%,transparent)] pt-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className={testReportModalChipBtnClass}
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};
