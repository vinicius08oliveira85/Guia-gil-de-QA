import React from 'react';
import type { TestCase } from '../../types';
import { getTestCaseListTitle } from '../../utils/testCaseActionDisplay';
import { Badge } from '../common/Badge';
import { cn } from '../../utils/cn';
import {
  taskCardSectionTitleClass,
  taskLabelMutedClass,
  taskModalSectionClass,
  taskTextStrongClass,
} from './taskActionLayout';

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

export const TestReportExecutionPanel: React.FC<TestReportExecutionPanelProps> = ({
  executedTestCases,
  visualStats,
}) => {
  return (
    <div className="min-h-0 space-y-4">
      <div className={cn(taskModalSectionClass, 'p-4 shadow-sm')}>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className={cn('text-sm font-semibold', taskTextStrongClass)}>Painel da execução</p>
            <p className={cn('text-xs', taskLabelMutedClass)}>
              Indicadores rápidos para leitura do resultado.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-base-content/70 sm:justify-end">
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
          <div className="rounded-[var(--radius)] border border-success/30 bg-success/10 px-4 py-3">
            <p className="text-xs font-semibold leading-tight text-success break-words">Aprovados</p>
            <p className="mt-2 text-2xl font-bold text-success">{visualStats.approved}</p>
          </div>
          <div className="rounded-[var(--radius)] border border-error/30 bg-error/10 px-4 py-3">
            <p className="text-xs font-semibold leading-tight text-error break-words">Reprovados</p>
            <p className="mt-2 text-2xl font-bold text-error">{visualStats.failed}</p>
          </div>
          <div className="rounded-[var(--radius)] border border-warning/30 bg-warning/10 px-4 py-3">
            <p className="text-xs font-semibold leading-tight text-warning break-words">Bloqueados</p>
            <p className="mt-2 text-2xl font-bold text-warning">{visualStats.blocked}</p>
          </div>
        </div>
      </div>

      <div className={cn(taskModalSectionClass, 'flex min-h-0 flex-1 flex-col overflow-hidden shadow-sm')}>
        <div className="border-b border-[var(--brand-surface-border)] px-4 py-3">
          <p className={cn('text-sm font-semibold', taskTextStrongClass)}>Casos executados</p>
          <p className={cn('text-xs', taskLabelMutedClass)}>
            Visão resumida dos cenários já validados.
          </p>
        </div>

        {executedTestCases.length > 0 ? (
          <div className="custom-scrollbar max-h-[360px] overflow-y-auto divide-y divide-base-200">
            {executedTestCases.map((testCase, index) => {
              const statusData = getStatusBadge(testCase.status);
              return (
                <div
                  key={`${testCase.id}-${index}`}
                  className={`p-4 transition-colors ${statusData.accentClass}`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-base-content whitespace-pre-wrap break-words">
                        {getTestCaseHeadline(testCase, index)}
                      </p>
                    </div>
                    <Badge
                      variant={statusData.variant}
                      appearance="pill"
                      size="sm"
                      className="self-start"
                    >
                      {statusData.label}
                    </Badge>
                  </div>

                  {testCase.observedResult && testCase.observedResult.trim() && (
                    <div className="mt-2">
                      <p className="text-xs font-medium text-base-content/70 mb-0.5">
                        Resultado Obtido:
                      </p>
                      <p className={`text-xs whitespace-pre-wrap break-words ${statusData.textClass}`}>
                        {testCase.observedResult}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-4 py-6 text-sm text-base-content/70">
            Nenhum teste executado até o momento.
          </div>
        )}
      </div>
    </div>
  );
};
