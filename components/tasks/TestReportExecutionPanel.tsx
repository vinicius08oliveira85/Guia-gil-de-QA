import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { TestCase } from '../../types';
import {
  getTestCaseActionSummary,
  getTestCaseContextLine,
  getTestCaseListTitle,
  getTestCasePoSummary,
  parseTestCaseActionSteps,
  stripLeadingStepIndex,
} from '../../utils/testCaseActionDisplay';
import { Badge } from '../common/Badge';
import { cn } from '../../utils/cn';
import {
  leveSettingsHeadingXsClass,
  leveSettingsMutedTextClass,
  leveSettingsMutedTextXsClass,
} from '../common/projectCardUi';
import { testReportModalSectionClass, testReportModalStatCardClass } from './testReportNeuUi';

interface TestReportExecutionPanelProps {
  executedTestCases: TestCase[];
  visualStats: {
    approved: number;
    failed: number;
    blocked: number;
  };
}

function getStatusBadge(status: TestCase['status']) {
  if (status === 'Passed') {
    return {
      label: 'Aprovado',
      variant: 'success' as const,
      accentClass: 'border-l-4 border-l-success bg-success/5',
      textClass: 'text-success',
    };
  }

  if (status === 'Blocked') {
    return {
      label: 'Bloqueado',
      variant: 'warning' as const,
      accentClass: 'border-l-4 border-l-warning bg-warning/10',
      textClass: 'text-warning',
    };
  }

  return {
    label: 'Reprovado',
    variant: 'error' as const,
    accentClass: 'border-l-4 border-l-error bg-error/5',
    textClass: 'text-error',
  };
}

function getTestCaseHeadline(testCase: TestCase, index: number) {
  const title = getTestCaseListTitle(testCase, { truncate: false }).trim();
  if (title && title !== 'Caso de teste') {
    return title;
  }
  return `Caso de teste ${index + 1}`;
}

interface ExecutedCaseRowProps {
  testCase: TestCase;
  index: number;
}

const ExecutedCaseRow: React.FC<ExecutedCaseRowProps> = ({ testCase, index }) => {
  const [expanded, setExpanded] = useState(false);
  const statusData = getStatusBadge(testCase.status);
  const headline = getTestCaseHeadline(testCase, index);
  const poSummary = getTestCasePoSummary(testCase);
  const contextLine = getTestCaseContextLine(testCase);
  const actionSteps = parseTestCaseActionSteps(testCase.action || '').map(step =>
    stripLeadingStepIndex(step)
  );
  const actionSummary = getTestCaseActionSummary(testCase);
  const hasDetails =
    poSummary !== headline ||
    Boolean(contextLine) ||
    actionSteps.length > 0 ||
    Boolean(testCase.observedResult?.trim());

  return (
    <div className={`p-4 transition-colors ${statusData.accentClass}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="whitespace-pre-wrap break-words text-sm font-medium text-base-content">
            {headline}
          </p>
          {!expanded && poSummary !== headline ? (
            <p className={cn('mt-1 line-clamp-2 text-xs', leveSettingsMutedTextClass)}>
              {poSummary}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2 self-start">
          {hasDetails ? (
            <button
              type="button"
              onClick={() => setExpanded(current => !current)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-base-content/72 transition-colors hover:bg-base-content/5"
              aria-expanded={expanded}
              aria-label={expanded ? `Recolher detalhes do caso ${index + 1}` : `Expandir detalhes do caso ${index + 1}`}
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
          ) : null}
          <Badge variant={statusData.variant} appearance="pill" size="sm">
            {statusData.label}
          </Badge>
        </div>
      </div>

      {expanded ? (
        <div className="mt-3 space-y-2 rounded-box border border-base-300 bg-base-content/5 p-3">
          <div>
            <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-base-content/72">
              O que foi validado
            </p>
            <p className="whitespace-pre-wrap break-words text-xs text-base-content">
              {poSummary}
            </p>
          </div>

          {actionSteps.length > 0 ? (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-base-content/72">
                Como foi testado
              </p>
              <ol className="list-decimal space-y-1 pl-4 text-xs text-base-content">
                {actionSteps.map((step, stepIndex) => (
                  <li key={`${testCase.id}-step-${stepIndex}`} className="break-words">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ) : actionSummary ? (
            <div>
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-base-content/72">
                Como foi testado
              </p>
              <p className="text-xs text-base-content">{actionSummary}</p>
            </div>
          ) : null}

          {contextLine ? (
            <div>
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-base-content/72">
                Dados / contexto
              </p>
              <p className="whitespace-pre-wrap break-words text-xs text-base-content">
                {contextLine}
              </p>
            </div>
          ) : null}

          <div>
            <p className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-base-content/72">
              Resultado obtido
            </p>
            <p className={`whitespace-pre-wrap break-words text-xs ${statusData.textClass}`}>
              {testCase.observedResult?.trim() ||
                (testCase.status === 'Passed' ? 'Conforme esperado.' : '—')}
            </p>
          </div>
        </div>
      ) : testCase.observedResult && testCase.observedResult.trim() ? (
        <div className="mt-2">
          <p className="mb-0.5 text-xs font-medium text-base-content/72">
            Resultado Obtido:
          </p>
          <p className={`text-xs whitespace-pre-wrap break-words ${statusData.textClass}`}>
            {testCase.observedResult}
          </p>
        </div>
      ) : null}
    </div>
  );
};

export const TestReportExecutionPanel: React.FC<TestReportExecutionPanelProps> = ({
  executedTestCases,
  visualStats,
}) => {
  return (
    <div className="min-h-0 space-y-4">
      <div className={cn(testReportModalSectionClass, 'p-4')}>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className={leveSettingsHeadingXsClass}>Painel da execução</p>
            <p className={leveSettingsMutedTextXsClass}>
              Indicadores rápidos para leitura do resultado.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-base-content/72 sm:justify-end">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-success" aria-hidden />
              <span className="whitespace-nowrap">Aprovado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-error" aria-hidden />
              <span className="whitespace-nowrap">Reprovado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-warning" aria-hidden />
              <span className="whitespace-nowrap">Bloqueado</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3">
          <div className={cn(testReportModalStatCardClass, 'border-success/30 bg-success/10')}>
            <p className="text-xs font-semibold leading-tight text-success break-words">Aprovados</p>
            <p className="mt-2 text-2xl font-bold text-success">{visualStats.approved}</p>
          </div>
          <div className={cn(testReportModalStatCardClass, 'border-error/30 bg-error/10')}>
            <p className="text-xs font-semibold leading-tight text-error break-words">Reprovados</p>
            <p className="mt-2 text-2xl font-bold text-error">{visualStats.failed}</p>
          </div>
          <div className={cn(testReportModalStatCardClass, 'border-warning/30 bg-warning/10')}>
            <p className="text-xs font-semibold leading-tight text-warning break-words">Bloqueados</p>
            <p className="mt-2 text-2xl font-bold text-warning">{visualStats.blocked}</p>
          </div>
        </div>
      </div>

      <div className={cn(testReportModalSectionClass, 'flex min-h-0 flex-1 flex-col overflow-hidden')}>
        <div className="border-b border-base-300 px-4 py-3">
          <p className={leveSettingsHeadingXsClass}>Casos executados</p>
          <p className={leveSettingsMutedTextXsClass}>
            Expanda cada caso para ver critério, passos e contexto antes de copiar.
          </p>
        </div>

        {executedTestCases.length > 0 ? (
          <div className="custom-scrollbar max-h-[360px] overflow-y-auto divide-y divide-base-300">
            {executedTestCases.map((testCase, index) => (
              <ExecutedCaseRow key={`${testCase.id}-${index}`} testCase={testCase} index={index} />
            ))}
          </div>
        ) : (
          <div className={cn('px-4 py-6', leveSettingsMutedTextClass)}>
            Nenhum teste executado até o momento.
          </div>
        )}
      </div>
    </div>
  );
};
