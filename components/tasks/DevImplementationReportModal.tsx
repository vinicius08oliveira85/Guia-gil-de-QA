import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, Download, FileCheck, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import type { DevImplementationRecord, JiraTask, Project } from '../../types';
import {
  DEV_IMPLEMENTATION_REPORT_MODE_LABELS,
  generateDevImplementationExecutiveSummary,
  generateDevImplementationReport,
  generateDevImplementationStepsOnlyReport,
  type GenerateDevImplementationReportOptions,
} from '../../utils/devImplementationReportGenerator';
import {
  summarizeDevImplementationReport,
  summarizeDevImplementationReportForPo,
} from '../../services/ai/devImplementationReportSummaryService';
import { downloadFile } from '../../utils/exportService';
import { logger } from '../../utils/logger';
import { Modal } from '../common/Modal';
import { DevImplementationExecutionPanel } from './DevImplementationExecutionPanel';
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

export interface DevImplementationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: JiraTask;
  project?: Project;
  onSaveRecord: (record: DevImplementationRecord, markAsDone: boolean) => void | Promise<void>;
}

type ReportFormatOption = 'text' | 'resumido' | 'po' | 'markdown';
type CopyVariant = 'full' | 'summary' | 'steps' | null;
type AISummaryMode = 'executive' | 'po' | null;

function buildInitialRecord(task: JiraTask): DevImplementationRecord {
  const existing = task.devImplementationRecord;
  const steps = task.devGuidance?.implementationSteps ?? [];
  return {
    completedAt: existing?.completedAt ?? new Date().toISOString(),
    completedStepOrders:
      existing?.completedStepOrders ?? steps.map(s => s.order),
    completedValidations: existing?.completedValidations ?? [],
    notes: existing?.notes ?? '',
    evidenceLinks: existing?.evidenceLinks ?? [],
    suggestedTestsResult:
      existing?.suggestedTestsResult ??
      (task.devGuidance?.suggestedTests?.length ? 'passed' : 'not_run'),
  };
}

function getReportGeneratorOptions(format: ReportFormatOption): GenerateDevImplementationReportOptions {
  switch (format) {
    case 'resumido':
      return { mode: 'concise', format: 'text' };
    case 'po':
      return { mode: 'po', format: 'text' };
    case 'markdown':
      return { mode: 'structured', format: 'markdown' };
    default:
      return { mode: 'structured', format: 'text' };
  }
}

function getFormatLabel(format: ReportFormatOption): string {
  switch (format) {
    case 'resumido':
      return DEV_IMPLEMENTATION_REPORT_MODE_LABELS.concise;
    case 'po':
      return DEV_IMPLEMENTATION_REPORT_MODE_LABELS.po;
    case 'markdown':
      return DEV_IMPLEMENTATION_REPORT_MODE_LABELS.markdown;
    default:
      return DEV_IMPLEMENTATION_REPORT_MODE_LABELS.structured;
  }
}

export const DevImplementationReportModal: React.FC<DevImplementationReportModalProps> = ({
  isOpen,
  onClose,
  task,
  project,
  onSaveRecord,
}) => {
  const [record, setRecord] = useState<DevImplementationRecord>(() => buildInitialRecord(task));
  const [format, setFormat] = useState<ReportFormatOption>('text');
  const [generationDate, setGenerationDate] = useState<Date | null>(null);
  const [reportText, setReportText] = useState('');
  const [copiedVariant, setCopiedVariant] = useState<CopyVariant>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [aiSummaryMode, setAiSummaryMode] = useState<AISummaryMode>(null);
  const [markAsDone, setMarkAsDone] = useState(task.status !== 'Done');
  const [saving, setSaving] = useState(false);

  const steps = useMemo(
    () =>
      [...(task.devGuidance?.implementationSteps ?? [])].sort((a, b) => a.order - b.order),
    [task.devGuidance?.implementationSteps]
  );

  useEffect(() => {
    if (!isOpen) return;
    setRecord(buildInitialRecord(task));
    setFormat('text');
    setGenerationDate(null);
    setAiSummaryMode(null);
    setCopiedVariant(null);
    setMarkAsDone(task.status !== 'Done');
  }, [isOpen, task]);

  useEffect(() => {
    if (!isOpen || !task.devGuidance) return;
    if (aiSummaryMode) return;

    const baseDate = generationDate ?? new Date();
    if (!generationDate) {
      setGenerationDate(baseDate);
    }

    const report = generateDevImplementationReport(task, {
      ...getReportGeneratorOptions(format),
      record,
      project,
      generatedAt: baseDate,
    });
    setReportText(report);
    setCopiedVariant(null);
  }, [aiSummaryMode, format, generationDate, isOpen, project, record, task]);

  const effectiveGenerationDate = generationDate ?? new Date();
  const reportBaseOptions = useMemo(
    () => ({ record, project, generatedAt: effectiveGenerationDate }),
    [effectiveGenerationDate, project, record]
  );

  const executiveSummaryText = useMemo(
    () => generateDevImplementationExecutiveSummary(task, reportBaseOptions),
    [reportBaseOptions, task]
  );

  const stepsOnlyText = useMemo(
    () => generateDevImplementationStepsOnlyReport(task, reportBaseOptions),
    [reportBaseOptions, task]
  );

  const copyText = useCallback(
    async (text: string, variant: Exclude<CopyVariant, null>, successMessage: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedVariant(variant);
        toast.success(successMessage);
        window.setTimeout(() => {
          setCopiedVariant(current => (current === variant ? null : current));
        }, 2000);
      } catch (error) {
        logger.error('Erro ao copiar registro Dev', 'DevImplementationReportModal', error);
        toast.error('Não foi possível copiar.');
      }
    },
    []
  );

  const handleCopy = () => copyText(reportText, 'full', 'Registro completo copiado.');
  const handleCopyExecutiveSummary = () =>
    copyText(executiveSummaryText, 'summary', 'Resumo executivo copiado.');
  const handleCopyStepsOnly = () =>
    copyText(stepsOnlyText, 'steps', 'Somente os passos foram copiados.');

  const handleDownloadTxt = () => {
    downloadFile(reportText, `${task.id}-registro-implementacao.txt`, 'text/plain');
  };

  const handleDownloadMarkdown = () => {
    const markdown = generateDevImplementationReport(task, {
      mode: 'structured',
      format: 'markdown',
      record,
      project,
      generatedAt: effectiveGenerationDate,
    });
    downloadFile(markdown, `${task.id}-registro-implementacao.md`, 'text/markdown');
  };

  const runAiSummary = async (mode: Exclude<AISummaryMode, null>) => {
    if (!reportText.trim() || summarizing) return;

    setSummarizing(true);
    try {
      const summarized =
        mode === 'po'
          ? await summarizeDevImplementationReportForPo(reportText)
          : await summarizeDevImplementationReport(reportText);
      setReportText(summarized);
      setAiSummaryMode(mode);
      toast.success(mode === 'po' ? 'Narrativa para PO gerada com IA.' : 'Relatório resumido com IA.');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Erro ao processar com IA. Verifique a API key do Gemini em Configurações.';
      toast.error(message);
    } finally {
      setSummarizing(false);
    }
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const finalRecord: DevImplementationRecord = {
        ...record,
        completedAt: new Date().toISOString(),
      };
      await onSaveRecord(finalRecord, markAsDone);
      toast.success(
        markAsDone
          ? 'Implementação registrada e tarefa marcada como concluída.'
          : 'Registro de implementação salvo.'
      );
      onClose();
    } catch {
      toast.error('Não foi possível salvar o registro.');
    } finally {
      setSaving(false);
    }
  }, [markAsDone, onClose, onSaveRecord, record]);

  const formatOptions: Array<{ label: string; value: ReportFormatOption; description: string }> = [
    {
      label: 'Texto estruturado',
      value: 'text',
      description: 'Registro completo com passos, evidências e observações.',
    },
    {
      label: 'Resumido',
      value: 'resumido',
      description: 'Versão compacta focada no resultado da implementação.',
    },
    {
      label: 'Para o PO',
      value: 'po',
      description: 'Linguagem de negócio para stakeholders e Product Owner.',
    },
    {
      label: 'Markdown',
      value: 'markdown',
      description: 'Formato para Confluence, Notion ou documentação técnica.',
    },
  ];

  if (!task.devGuidance) {
    return null;
  }

  const currentFormatLabel = getFormatLabel(format);
  const isAISummarized = aiSummaryMode !== null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registro de Implementação Dev"
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
                  Copie o registro completo ou use atalhos para comentário no Jira.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => void runAiSummary('executive')}
                  disabled={summarizing || !reportText.trim()}
                  aria-label="Resumir registro com IA"
                  className={testReportModalChipBtnClass}
                >
                  <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {summarizing ? 'Processando…' : 'Resumir com IA'}
                </button>
                <button
                  type="button"
                  onClick={() => void runAiSummary('po')}
                  disabled={summarizing || !reportText.trim()}
                  aria-label="Gerar narrativa para Product Owner com IA"
                  className={testReportModalChipBtnClass}
                >
                  <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {summarizing ? 'Processando…' : 'Narrativa PO'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadTxt}
                  aria-label="Baixar registro em .txt"
                  className={testReportModalChipBtnClass}
                >
                  <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Baixar .txt
                </button>
                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  aria-label="Baixar registro em Markdown"
                  className={testReportModalChipBtnClass}
                >
                  <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Baixar .md
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
                <p className="text-xs font-semibold uppercase tracking-wide text-base-content/72">
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
                  onClick={handleCopyStepsOnly}
                  aria-label="Copiar somente passos"
                  className={testReportModalChipBtnClass}
                >
                  {copiedVariant === 'steps' ? (
                    <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  ) : (
                    <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  )}
                  {copiedVariant === 'steps' ? 'Passos copiados!' : 'Copiar passos'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-shrink-0 flex-col gap-3">
          <p className={leveSettingsHeadingXsClass}>Formato do relatório</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {formatOptions.map(option => {
              const isSelected = format === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setFormat(option.value);
                    setAiSummaryMode(null);
                  }}
                  aria-pressed={isSelected}
                  aria-label={`${option.label}: ${option.description}`}
                  className={testReportModalFormatOptionClass(isSelected)}
                >
                  <div
                    className={cn(
                      'mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2',
                      isSelected
                        ? 'border-primary bg-primary/18'
                        : 'border-base-300/55 bg-base-300'
                    )}
                  >
                    {isSelected ? (
                      <div className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden />
                    ) : null}
                  </div>
                  <div className="min-w-0 text-left">
                    <p className="font-medium text-base-content">{option.label}</p>
                    <p className={cn('mt-1', leveSettingsMutedTextClass)}>{option.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid min-h-0 flex-1 gap-5 lg:grid-cols-2 lg:gap-6">
          <DevImplementationExecutionPanel
            steps={steps}
            record={record}
            onRecordChange={setRecord}
            markAsDone={markAsDone}
            onMarkAsDoneChange={setMarkAsDone}
            showSuggestedTests={(task.devGuidance.suggestedTests?.length ?? 0) > 0}
          />

          <div className="min-h-0">
            <TestReportTextPreview
              reportText={reportText}
              formatLabel={currentFormatLabel}
              isAISummarized={isAISummarized}
              aiSummaryMode={aiSummaryMode}
              previewAriaLabel="Prévia do registro de implementação"
            />
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center justify-between gap-3 border-t border-[color-mix(in_srgb,#5C524B_38%,transparent)] pt-4">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className={testReportModalPrimaryBtnClass}
            aria-label="Salvar registro de implementação"
          >
            <FileCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {saving ? 'Salvando…' : 'Salvar registro'}
          </button>
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

DevImplementationReportModal.displayName = 'DevImplementationReportModal';
