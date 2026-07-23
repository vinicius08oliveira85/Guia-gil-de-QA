import React, { useMemo, useState, useCallback } from 'react';
import { JiraTask, TestCase, TestCaseDetailLevel } from '../../types';
import { TestCaseItem } from './TestCaseItem';
import { EmptyState } from '../common/EmptyState';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { Spinner } from '../common/Spinner';
import { FileExportModal } from '../common/FileExportModal';
import { ClipboardList, Download, SlidersHorizontal } from 'lucide-react';
import { Button } from '../common/Button';
import { cn } from '../../utils/cn';
import {
  leveSettingsSectionIconWrapClass,
  leveTaskModalMutedClass,
  leveTaskModalMutedXsClass,
  leveTaskModalSectionAccentClass,
  leveTaskModalStrongClass,
  leveTaskModalTabBadgeIdleClass,
} from '../common/projectCardUi';
import {
  taskDetailsModalGhostBtnClass,
  taskDetailsModalSectionClass,
  taskDetailsModalStatusPillClass,
  taskDetailsModalStatusTrackClass,
} from './taskDetailsNeuUi';
import {
  TEST_CASE_STATUS_BADGE_TONE,
  TEST_CASE_TOTAL_BADGE_TONE,
} from './testCaseStatusVisuals';

function getTestCaseStats(cases: TestCase[]) {
  const total = cases.length;
  const notRun = cases.filter(c => c.status === 'Not Run').length;
  const passed = cases.filter(c => c.status === 'Passed').length;
  const failed = cases.filter(c => c.status === 'Failed').length;
  const blocked = cases.filter(c => c.status === 'Blocked').length;
  return { total, notRun, passed, failed, blocked };
}

export interface TestCasesSectionProps {
  task: JiraTask;
  isGenerating?: boolean;
  onGenerateTests?: (taskId: string, detailLevel: TestCaseDetailLevel) => Promise<void>;
  detailLevel?: TestCaseDetailLevel;
  onTestCaseStatusChange: (testCaseId: string, status: TestCase['status']) => void;
  onObservedResultChange?: (testCaseId: string, value: string) => void;
  onTestCaseExecutionKindChange?: (testCaseId: string, kind: TestCase['executionKind']) => void;
  onEditTestCase?: (taskId: string, testCase: TestCase) => void;
  onDeleteTestCase?: (taskId: string, testCaseId: string) => void;
  onDuplicateTestCase?: (taskId: string, testCase: TestCase) => void;
  onAddTestCaseFromTemplate?: (taskId: string) => void;
}

export const TestCasesSection: React.FC<TestCasesSectionProps> = ({
  task,
  isGenerating,
  onGenerateTests,
  detailLevel = 'Estruturado',
  onTestCaseStatusChange,
  onObservedResultChange,
  onTestCaseExecutionKindChange,
  onEditTestCase,
  onDeleteTestCase,
  onDuplicateTestCase,
  onAddTestCaseFromTemplate,
}) => {
  const cases = task.testCases || [];
  const [statusFilter, setStatusFilter] = useState<TestCase['status'][]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const stats = useMemo(() => getTestCaseStats(cases), [cases]);

  const filteredCases = useMemo(
    () =>
      cases.filter(
        tc => statusFilter.length === 0 || statusFilter.includes(tc.status)
      ),
    [cases, statusFilter]
  );

  const clearAllFilters = useCallback(() => {
    setStatusFilter([]);
  }, []);

  const toggleStatusFilter = useCallback((status: TestCase['status']) => {
    setStatusFilter(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  }, []);

  const indicatorItems = useMemo(
    () => [
      {
        label: 'Total',
        value: stats.total,
        status: undefined as TestCase['status'] | undefined,
        tone: TEST_CASE_TOTAL_BADGE_TONE,
        onClick: () => setStatusFilter([]),
        isActive: statusFilter.length === 0,
      },
      {
        label: 'Não exec.',
        value: stats.notRun,
        status: 'Not Run' as const,
        tone: TEST_CASE_STATUS_BADGE_TONE['Not Run'],
        onClick: () => toggleStatusFilter('Not Run'),
        isActive: statusFilter.includes('Not Run'),
      },
      {
        label: 'Aprovados',
        value: stats.passed,
        status: 'Passed' as const,
        tone: TEST_CASE_STATUS_BADGE_TONE.Passed,
        onClick: () => toggleStatusFilter('Passed'),
        isActive: statusFilter.includes('Passed'),
      },
      {
        label: 'Reprovados',
        value: stats.failed,
        status: 'Failed' as const,
        tone: TEST_CASE_STATUS_BADGE_TONE.Failed,
        onClick: () => toggleStatusFilter('Failed'),
        isActive: statusFilter.includes('Failed'),
      },
      {
        label: 'Bloqueados',
        value: stats.blocked,
        status: 'Blocked' as const,
        tone: TEST_CASE_STATUS_BADGE_TONE.Blocked,
        onClick: () => toggleStatusFilter('Blocked'),
        isActive: statusFilter.includes('Blocked'),
      },
    ],
    [stats, statusFilter, toggleStatusFilter]
  );

  const handleApproveSelected = useCallback(() => {
    selectedIds.forEach(id => onTestCaseStatusChange(id, 'Passed'));
    setSelectedIds(new Set());
  }, [selectedIds, onTestCaseStatusChange]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (!task.id) return null;

  return (
    <div className="font-sans tracking-[var(--letter-spacing)] text-base-content">
      <header className={cn(taskDetailsModalSectionClass, 'mb-2.5 overflow-visible')}>
        <div className="flex flex-wrap items-center gap-2 px-3 py-2">
          <span className={cn(leveSettingsSectionIconWrapClass, 'h-8 w-8')}>
            <ClipboardList className="h-4 w-4" aria-hidden />
          </span>
          <h2 className={cn('text-base font-bold', leveTaskModalStrongClass)}>Casos de Teste</h2>
          <span className={cn(leveTaskModalTabBadgeIdleClass, 'px-2 py-0.5 normal-case')}>
            {stats.total} caso(s)
          </span>
          {cases.length > 0 && (
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className={cn(taskDetailsModalGhostBtnClass, 'ml-auto gap-1')}
              aria-label="Exportar lista de casos de teste"
            >
              <Download className="h-3.5 w-3.5" aria-hidden />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          )}
        </div>

        {cases.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-base-300/45 px-2.5 py-1.5">
            <div
              className={cn(taskDetailsModalStatusTrackClass, 'min-w-0 flex-1')}
              role="group"
              aria-label="Filtrar casos por status"
            >
              {indicatorItems.map(item => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.onClick}
                  title={
                    item.isActive
                      ? item.status
                        ? `Remover filtro: ${item.label}`
                        : 'Remover filtros de status'
                      : item.status
                        ? `Filtrar por: ${item.label}`
                        : 'Ver todos'
                  }
                  className={taskDetailsModalStatusPillClass(item.isActive)}
                  aria-pressed={item.isActive}
                >
                  {!item.isActive && (
                    <SlidersHorizontal className="h-3 w-3 shrink-0 opacity-40" aria-hidden />
                  )}
                  <span>{item.label}</span>
                  <span
                    className={cn(
                      'rounded-full px-1 text-[10px] font-bold tabular-nums',
                      item.tone
                    )}
                  >
                    {item.value}
                  </span>
                </button>
              ))}
            </div>
            {statusFilter.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <Button
                  onClick={clearAllFilters}
                  size="sm"
                  variant="ghost"
                  className="min-h-7 px-2 text-xs text-error hover:bg-error/10"
                  aria-label="Limpar filtros de status"
                >
                  Limpar filtros
                </Button>
                {filteredCases.length !== cases.length && (
                  <span className={cn(leveTaskModalMutedXsClass, 'tabular-nums')}>
                    {filteredCases.length}/{cases.length}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </header>

      {isGenerating ? (
        <div className="space-y-2">
          <LoadingSkeleton variant="task" count={3} />
          <div className="flex flex-col items-center justify-center py-3">
            <Spinner small />
            <p className={cn('mt-2 text-sm', leveTaskModalMutedClass)}>Gerando casos de teste com IA...</p>
            <p className={cn('mt-1 text-xs', leveTaskModalMutedXsClass)}>
              Isso pode levar 10-30 segundos
            </p>
          </div>
        </div>
      ) : cases.length === 0 ? (
        <EmptyState
          icon="🧪"
          title="Nenhum caso de teste ainda"
          description="Comece gerando casos de teste com IA ou adicione manualmente."
          action={
            onGenerateTests
              ? {
                  label: 'Gerar com IA',
                  onClick: () => onGenerateTests(task.id, detailLevel),
                }
              : undefined
          }
          secondaryAction={
            onAddTestCaseFromTemplate
              ? {
                  label: 'Usar Template',
                  onClick: () => onAddTestCaseFromTemplate(task.id),
                }
              : undefined
          }
        />
      ) : filteredCases.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Nenhum caso corresponde aos filtros"
          description="Tente outro indicador de status acima ou limpe os filtros."
          action={{
            label: 'Limpar filtros',
            onClick: clearAllFilters,
          }}
        />
      ) : (
        <div className="space-y-2">
          {/* Ações em lote */}
          {selectedIds.size > 0 && (
            <div
              className={cn(
                leveTaskModalSectionAccentClass,
                'sticky top-0 z-10 flex flex-wrap items-center gap-2 p-2'
              )}
            >
              <span className={cn('text-sm font-medium', leveTaskModalStrongClass)}>
                {selectedIds.size} selecionado(s)
              </span>
              <Button
                onClick={handleApproveSelected}
                size="xs" variant="success"
              >
                Aprovar
              </Button>
              <Button
                onClick={() => setSelectedIds(new Set())}
                size="xs" variant="ghost"
              >
                Limpar seleção
              </Button>
            </div>
          )}

          {filteredCases.map(tc => (
            <TestCaseItem
              key={tc.id}
              testCase={tc}
              onStatusChange={status => onTestCaseStatusChange(tc.id, status)}
              onObservedResultChange={
                onObservedResultChange ? v => onObservedResultChange(tc.id, v) : undefined
              }
              onExecutionKindChange={
                onTestCaseExecutionKindChange
                  ? kind => onTestCaseExecutionKindChange(tc.id, kind)
                  : undefined
              }
              onEdit={onEditTestCase ? () => onEditTestCase(task.id, tc) : undefined}
              onDelete={onDeleteTestCase ? () => onDeleteTestCase(task.id, tc.id) : undefined}
              onDuplicate={onDuplicateTestCase ? () => onDuplicateTestCase(task.id, tc) : undefined}
              selected={selectedIds.has(tc.id)}
              onToggleSelect={() => toggleSelect(tc.id)}
              onBatchSelect={true}
            />
          ))}
        </div>
      )}

      <FileExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        exportType="test-cases"
        tasks={[task]}
      />
    </div>
  );
};
