import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Copy, Download, FileCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import type { DevImplementationRecord, JiraTask, Project } from '../../types';
import {
  DEV_IMPLEMENTATION_REPORT_MODE_LABELS,
  generateDevImplementationReport,
  type DevImplementationReportFormat,
  type DevImplementationReportMode,
} from '../../utils/devImplementationReportGenerator';
import { downloadFile } from '../../utils/exportService';
import { Modal } from '../common/Modal';
import { cn } from '../../utils/cn';
import {
  leveSettingsHeadingXsClass,
  leveSettingsMutedTextClass,
} from '../common/projectCardUi';
import {
  testReportModalBodyClass,
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

type ReportFormatOption = 'text' | 'markdown';
type ReportModeOption = DevImplementationReportMode;

function buildInitialRecord(task: JiraTask): DevImplementationRecord {
  const existing = task.devImplementationRecord;
  const steps = task.devGuidance?.implementationSteps ?? [];
  return {
    completedAt: existing?.completedAt ?? new Date().toISOString(),
    completedStepOrders:
      existing?.completedStepOrders ??
      steps.map(s => s.order),
    completedValidations: existing?.completedValidations ?? [],
    notes: existing?.notes ?? '',
    evidenceLinks: existing?.evidenceLinks ?? [],
    suggestedTestsResult:
      existing?.suggestedTestsResult ??
      (task.devGuidance?.suggestedTests?.length ? 'passed' : 'not_run'),
  };
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
  const [mode, setMode] = useState<ReportModeOption>('structured');
  const [markAsDone, setMarkAsDone] = useState(task.status !== 'Done');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setRecord(buildInitialRecord(task));
    setFormat('text');
    setMode('structured');
    setMarkAsDone(task.status !== 'Done');
    setCopied(false);
  }, [isOpen, task]);

  const reportText = useMemo(
    () =>
      generateDevImplementationReport(task, {
        format,
        mode,
        record,
        project,
        generatedAt: new Date(record.completedAt),
      }),
    [task, format, mode, record, project]
  );

  const steps = useMemo(
    () =>
      [...(task.devGuidance?.implementationSteps ?? [])].sort((a, b) => a.order - b.order),
    [task.devGuidance?.implementationSteps]
  );

  const toggleStep = useCallback((order: number) => {
    setRecord(prev => {
      const set = new Set(prev.completedStepOrders ?? []);
      if (set.has(order)) set.delete(order);
      else set.add(order);
      return { ...prev, completedStepOrders: Array.from(set).sort((a, b) => a - b) };
    });
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      toast.success('Registro copiado.');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Não foi possível copiar.');
    }
  }, [reportText]);

  const handleDownload = useCallback(() => {
    const ext = format === 'markdown' ? 'md' : 'txt';
    downloadFile(reportText, `registro-dev-${task.id}.${ext}`, 'text/plain;charset=utf-8');
    toast.success('Download iniciado.');
  }, [format, reportText, task.id]);

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

  if (!task.devGuidance) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registro de Implementação Dev"
      size="2xl"
      panelClassName={testReportModalShellClass}
      bodyClassName={testReportModalBodyClass}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <section className={testReportModalSectionClass}>
            <h3 className={leveSettingsHeadingXsClass}>Passos concluídos</h3>
            <p className={cn(leveSettingsMutedTextClass, 'mt-1 text-xs')}>
              Marque o que foi implementado conforme o Guia Dev.
            </p>
            <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto">
              {steps.map(step => {
                const checked = (record.completedStepOrders ?? []).includes(step.order);
                return (
                  <li key={step.order}>
                    <label className="flex cursor-pointer items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-primary mt-0.5"
                        checked={checked}
                        onChange={() => toggleStep(step.order)}
                      />
                      <span>
                        <span className="font-medium">{step.order}. {step.title}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>

          {(task.devGuidance.suggestedTests?.length ?? 0) > 0 ? (
            <section className={testReportModalSectionClass}>
              <label className={leveSettingsHeadingXsClass} htmlFor="dev-suggested-tests-result">
                Testes sugeridos
              </label>
              <select
                id="dev-suggested-tests-result"
                className="select select-bordered select-sm mt-2 w-full"
                value={record.suggestedTestsResult ?? 'passed'}
                onChange={e =>
                  setRecord(prev => ({
                    ...prev,
                    suggestedTestsResult: e.target
                      .value as DevImplementationRecord['suggestedTestsResult'],
                  }))
                }
              >
                <option value="passed">Executados com sucesso</option>
                <option value="partial">Parcialmente executados</option>
                <option value="pending">Pendentes</option>
                <option value="not_run">Não executados</option>
              </select>
            </section>
          ) : null}

          <section className={testReportModalSectionClass}>
            <label className={leveSettingsHeadingXsClass} htmlFor="dev-evidence-links">
              Evidências / links
            </label>
            <textarea
              id="dev-evidence-links"
              className="textarea textarea-bordered mt-2 min-h-[4rem] w-full text-sm"
              placeholder="Um link por linha (PR, Postman, print…)"
              value={(record.evidenceLinks ?? []).join('\n')}
              onChange={e =>
                setRecord(prev => ({
                  ...prev,
                  evidenceLinks: e.target.value
                    .split('\n')
                    .map(l => l.trim())
                    .filter(Boolean),
                }))
              }
            />
          </section>

          <section className={testReportModalSectionClass}>
            <label className={leveSettingsHeadingXsClass} htmlFor="dev-impl-notes">
              Observações
            </label>
            <textarea
              id="dev-impl-notes"
              className="textarea textarea-bordered mt-2 min-h-[5rem] w-full text-sm"
              placeholder="Resumo do que foi feito, validações manuais, pendências…"
              value={record.notes ?? ''}
              onChange={e => setRecord(prev => ({ ...prev, notes: e.target.value }))}
            />
          </section>

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="checkbox checkbox-sm checkbox-primary"
              checked={markAsDone}
              onChange={e => setMarkAsDone(e.target.checked)}
            />
            Marcar tarefa como <strong className="font-semibold">Concluída</strong> ao salvar
          </label>
        </div>

        <div className="flex min-h-0 flex-col gap-3">
          <section className={testReportModalSectionClass}>
            <p className={leveSettingsHeadingXsClass}>Formato do relatório</p>
            <div className="mt-2 grid gap-2">
              {(
                [
                  ['text', 'structured', DEV_IMPLEMENTATION_REPORT_MODE_LABELS.structured],
                  ['text', 'concise', DEV_IMPLEMENTATION_REPORT_MODE_LABELS.concise],
                  ['markdown', 'structured', 'Markdown'],
                ] as const
              ).map(([fmt, m, label]) => {
                const selected = format === fmt && mode === m;
                return (
                  <button
                    key={`${fmt}-${m}`}
                    type="button"
                    className={testReportModalFormatOptionClass(selected)}
                    onClick={() => {
                      setFormat(fmt);
                      setMode(m);
                    }}
                  >
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className={cn(testReportModalSectionClass, 'flex min-h-0 flex-1 flex-col')}>
            <p className={leveSettingsHeadingXsClass}>Prévia</p>
            <pre
              className={cn(
                testReportModalInsetPanelClass,
                'mt-2 max-h-[min(22rem,50vh)] flex-1 overflow-auto p-3 text-xs leading-relaxed'
              )}
              aria-label="Prévia do registro de implementação"
            >
              {reportText}
            </pre>
          </section>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={testReportModalPrimaryBtnClass}
              onClick={() => void handleSave()}
              disabled={saving}
            >
              <FileCheck className="h-4 w-4" aria-hidden />
              {saving ? 'Salvando…' : 'Salvar registro'}
            </button>
            <button type="button" className="btn btn-ghost btn-sm gap-1" onClick={() => void handleCopy()}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              Copiar
            </button>
            <button type="button" className="btn btn-ghost btn-sm gap-1" onClick={handleDownload}>
              <Download className="h-4 w-4" aria-hidden />
              Baixar
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

DevImplementationReportModal.displayName = 'DevImplementationReportModal';
