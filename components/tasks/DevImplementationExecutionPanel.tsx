import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { DevGuidanceStep, DevImplementationRecord } from '../../types';
import { Badge } from '../common/Badge';
import { cn } from '../../utils/cn';
import {
  leveSettingsHeadingXsClass,
  leveSettingsMutedTextClass,
  leveSettingsMutedTextXsClass,
} from '../common/projectCardUi';
import { testReportModalSectionClass, testReportModalStatCardClass } from './testReportNeuUi';

const SUGGESTED_TESTS_OPTIONS: Array<{
  value: NonNullable<DevImplementationRecord['suggestedTestsResult']>;
  label: string;
}> = [
  { value: 'passed', label: 'Executados com sucesso' },
  { value: 'partial', label: 'Parcialmente executados' },
  { value: 'pending', label: 'Pendentes' },
  { value: 'not_run', label: 'Não executados' },
];

interface DevImplementationExecutionPanelProps {
  steps: DevGuidanceStep[];
  record: DevImplementationRecord;
  onRecordChange: (record: DevImplementationRecord) => void;
  markAsDone: boolean;
  onMarkAsDoneChange: (value: boolean) => void;
  showSuggestedTests: boolean;
}

interface StepRowProps {
  step: DevGuidanceStep;
  checked: boolean;
  onToggle: () => void;
}

const StepRow: React.FC<StepRowProps> = ({ step, checked, onToggle }) => {
  const [expanded, setExpanded] = useState(false);
  const accentClass = checked
    ? 'border-l-4 border-l-success bg-success/5'
    : 'border-l-4 border-l-base-300/80 bg-base-200/30';

  return (
    <div className={cn('p-4 transition-colors', accentClass)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-2">
          <input
            type="checkbox"
            className="checkbox checkbox-sm checkbox-primary mt-0.5"
            checked={checked}
            onChange={onToggle}
            aria-label={`Marcar passo ${step.order} como concluído`}
          />
          <span className="text-sm font-medium text-base-content">
            {step.order}. {step.title}
          </span>
        </label>
        <div className="flex shrink-0 items-center gap-2 self-start">
          {(step.description?.trim() ||
            (step.filesOrModules?.length ?? 0) > 0 ||
            (step.validationChecklist?.length ?? 0) > 0) && (
            <button
              type="button"
              onClick={() => setExpanded(current => !current)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-base-content/72 transition-colors hover:bg-base-content/5"
              aria-expanded={expanded}
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden />
                  Menos
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                  Detalhes
                </>
              )}
            </button>
          )}
          <Badge variant={checked ? 'success' : 'neutral'} appearance="pill" size="sm">
            {checked ? 'Concluído' : 'Pendente'}
          </Badge>
        </div>
      </div>

      {expanded ? (
        <div className="mt-3 space-y-2 rounded-box border border-base-300 bg-base-content/5 p-3">
          {step.description?.trim() ? (
            <div>
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-base-content/72">
                O que foi feito
              </p>
              <p className="whitespace-pre-wrap break-words text-xs text-base-content">
                {step.description.trim()}
              </p>
            </div>
          ) : null}
          {step.filesOrModules?.length ? (
            <div>
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-base-content/72">
                Arquivos / módulos
              </p>
              <ul className="list-disc space-y-0.5 pl-4 text-xs text-base-content">
                {step.filesOrModules.map(file => (
                  <li key={file} className="break-all">
                    {file}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {step.validationChecklist?.length ? (
            <div>
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-base-content/72">
                Validações do guia
              </p>
              <ul className="list-disc space-y-0.5 pl-4 text-xs text-base-content">
                {step.validationChecklist.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export const DevImplementationExecutionPanel: React.FC<DevImplementationExecutionPanelProps> = ({
  steps,
  record,
  onRecordChange,
  markAsDone,
  onMarkAsDoneChange,
  showSuggestedTests,
}) => {
  const completedSet = new Set(record.completedStepOrders ?? []);
  const completed = steps.filter(s => completedSet.has(s.order)).length;
  const pending = Math.max(steps.length - completed, 0);

  const toggleStep = (order: number) => {
    const next = new Set(record.completedStepOrders ?? []);
    if (next.has(order)) next.delete(order);
    else next.add(order);
    onRecordChange({
      ...record,
      completedStepOrders: Array.from(next).sort((a, b) => a - b),
    });
  };

  return (
    <div className="min-h-0 space-y-4">
      <div className={cn(testReportModalSectionClass, 'p-4')}>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className={leveSettingsHeadingXsClass}>Painel da implementação</p>
            <p className={leveSettingsMutedTextXsClass}>
              Indicadores e passos conforme o Guia Dev.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-base-content/72 sm:justify-end">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-success" aria-hidden />
              <span className="whitespace-nowrap">Concluído</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-base-content/30" aria-hidden />
              <span className="whitespace-nowrap">Pendente</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3">
          <div className={cn(testReportModalStatCardClass, 'border-success/30 bg-success/10')}>
            <p className="break-words text-xs font-semibold leading-tight text-success">Concluídos</p>
            <p className="mt-2 text-2xl font-bold text-success">{completed}</p>
          </div>
          <div className={cn(testReportModalStatCardClass, 'border-base-300/60 bg-base-200/40')}>
            <p className="break-words text-xs font-semibold leading-tight text-base-content/70">
              Pendentes
            </p>
            <p className="mt-2 text-2xl font-bold text-base-content/80">{pending}</p>
          </div>
          <div className={cn(testReportModalStatCardClass, 'border-primary/25 bg-primary/10')}>
            <p className="break-words text-xs font-semibold leading-tight text-primary">Total</p>
            <p className="mt-2 text-2xl font-bold text-primary">{steps.length}</p>
          </div>
        </div>
      </div>

      <div
        className={cn(
          testReportModalSectionClass,
          'flex min-h-0 flex-1 flex-col overflow-hidden'
        )}
      >
        <div className="border-b border-base-300 px-4 py-3">
          <p className={leveSettingsHeadingXsClass}>Passos do guia</p>
          <p className={leveSettingsMutedTextXsClass}>
            Marque o que foi implementado antes de gerar o registro.
          </p>
        </div>

        {steps.length > 0 ? (
          <div className="custom-scrollbar max-h-[280px] divide-y divide-base-300 overflow-y-auto">
            {steps.map(step => (
              <StepRow
                key={step.order}
                step={step}
                checked={completedSet.has(step.order)}
                onToggle={() => toggleStep(step.order)}
              />
            ))}
          </div>
        ) : (
          <div className={cn('px-4 py-6', leveSettingsMutedTextClass)}>
            Nenhum passo estruturado no guia Dev.
          </div>
        )}
      </div>

      <div className={cn(testReportModalSectionClass, 'space-y-3 p-4')}>
        <p className={leveSettingsHeadingXsClass}>Complementos do registro</p>

        {showSuggestedTests ? (
          <label className="block space-y-1 text-sm">
            <span className={leveSettingsMutedTextXsClass}>Testes sugeridos</span>
            <select
              className="select select-bordered select-sm w-full"
              value={record.suggestedTestsResult ?? 'passed'}
              onChange={e =>
                onRecordChange({
                  ...record,
                  suggestedTestsResult: e.target
                    .value as DevImplementationRecord['suggestedTestsResult'],
                })
              }
            >
              {SUGGESTED_TESTS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="block space-y-1 text-sm">
          <span className={leveSettingsMutedTextXsClass}>Evidências / links</span>
          <textarea
            className="textarea textarea-bordered min-h-[4rem] w-full text-sm"
            placeholder="Um link por linha (PR, Postman, print…)"
            value={(record.evidenceLinks ?? []).join('\n')}
            onChange={e =>
              onRecordChange({
                ...record,
                evidenceLinks: e.target.value
                  .split('\n')
                  .map(l => l.trim())
                  .filter(Boolean),
              })
            }
          />
        </label>

        <label className="block space-y-1 text-sm">
          <span className={leveSettingsMutedTextXsClass}>Observações</span>
          <textarea
            className="textarea textarea-bordered min-h-[4.5rem] w-full text-sm"
            placeholder="Resumo do que foi feito, validações manuais, pendências…"
            value={record.notes ?? ''}
            onChange={e => onRecordChange({ ...record, notes: e.target.value })}
          />
        </label>

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="checkbox checkbox-sm checkbox-primary"
            checked={markAsDone}
            onChange={e => onMarkAsDoneChange(e.target.checked)}
          />
          Marcar tarefa como <strong className="font-semibold">Concluída</strong> ao salvar
        </label>
      </div>
    </div>
  );
};

DevImplementationExecutionPanel.displayName = 'DevImplementationExecutionPanel';
