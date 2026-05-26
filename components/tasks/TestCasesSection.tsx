import React, { useMemo, useState, useCallback } from 'react';
import { useDebounceValue } from 'usehooks-ts';
import { JiraTask, TestCase, TestCaseDetailLevel } from '../../types';
import { TestCaseItem } from './TestCaseItem';
import { EmptyState } from '../common/EmptyState';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { Spinner } from '../common/Spinner';
import { FileExportModal } from '../common/FileExportModal';
import { Badge } from '../common/Badge';
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Search,
  Download,
  X,
  Filter,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { AppSelect } from '../common/AppSelect';
import {
  leveSettingsSectionIconWrapClass,
  leveSettingsSelectClass,
  leveTaskModalMutedClass,
  leveTaskModalMutedXsClass,
  leveTaskModalSectionAccentClass,
  leveTaskModalStatPillActiveClass,
  leveTaskModalStatPillIdleClass,
  leveTaskModalStrongClass,
  leveTaskModalTabBadgeIdleClass,
  leveViewOutlineBtnClass,
  leveViewSearchInputClass,
} from '../common/projectCardUi';

const STATUS_OPTIONS: Array<TestCase['status']> = ['Not Run', 'Passed', 'Failed', 'Blocked'];
const STATUS_LABEL: Record<TestCase['status'], string> = {
  'Not Run': 'Não Executado',
  Passed: 'Aprovado',
  Failed: 'Reprovado',
  Blocked: 'Bloqueado',
};

const SORT_OPTIONS = [
  { value: 'default', label: 'Padrão' },
  { value: 'status', label: 'Status' },
  { value: 'action', label: 'Ação necessária (A–Z)' },
] as const;
type SortBy = (typeof SORT_OPTIONS)[number]['value'];

function getTestCaseStats(cases: TestCase[]) {
  const total = cases.length;
  const notRun = cases.filter(c => c.status === 'Not Run').length;
  const passed = cases.filter(c => c.status === 'Passed').length;
  const failed = cases.filter(c => c.status === 'Failed').length;
  const blocked = cases.filter(c => c.status === 'Blocked').length;
  const executed = passed + failed + blocked;
  return { total, notRun, passed, failed, blocked, executed };
}

function matchesSearch(tc: TestCase, q: string): boolean {
  if (!q.trim()) return true;
  const lower = q.trim().toLowerCase();
  const text = [tc.action, tc.parameters, tc.expectedResult, tc.observedResult]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return text.includes(lower);
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
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch] = useDebounceValue(searchInput, 300);
  const [sortBy, setSortBy] = useState<SortBy>('default');
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  /** Controla expandir/recolher todos os "Detalhes". null = cada item usa estado interno. */
  const [detailsOpenOverride, setDetailsOpenOverride] = useState<boolean | null>(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const stats = useMemo(() => getTestCaseStats(cases), [cases]);

  const filteredAndSorted = useMemo(() => {
    let list = cases.filter(tc => {
      if (statusFilter.length > 0 && !statusFilter.includes(tc.status)) return false;
      if (!matchesSearch(tc, debouncedSearch)) return false;
      return true;
    });

    if (sortBy === 'status') {
      const order: Record<TestCase['status'], number> = {
        'Not Run': 0,
        Blocked: 1,
        Failed: 2,
        Passed: 3,
      };
      list = [...list].sort((a, b) => order[a.status] - order[b.status]);
    } else if (sortBy === 'action') {
      list = [...list].sort((a, b) => a.action.localeCompare(b.action, 'pt-BR'));
    }

    return list;
  }, [cases, statusFilter, debouncedSearch, sortBy]);

  const activeFiltersCount =
    statusFilter.length + (debouncedSearch.trim() ? 1 : 0);

  const clearAllFilters = useCallback(() => {
    setStatusFilter([]);
    setSearchInput('');
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
        onClick: () => setStatusFilter([]),
        isActive: statusFilter.length === 0,
      },
      {
        label: 'Não exec.',
        value: stats.notRun,
        status: 'Not Run' as const,
        onClick: () => toggleStatusFilter('Not Run'),
        isActive: statusFilter.includes('Not Run'),
      },
      {
        label: 'Aprovados',
        value: stats.passed,
        status: 'Passed' as const,
        onClick: () => toggleStatusFilter('Passed'),
        isActive: statusFilter.includes('Passed'),
      },
      {
        label: 'Reprovados',
        value: stats.failed,
        status: 'Failed' as const,
        onClick: () => toggleStatusFilter('Failed'),
        isActive: statusFilter.includes('Failed'),
      },
      {
        label: 'Bloqueados',
        value: stats.blocked,
        status: 'Blocked' as const,
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

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === filteredAndSorted.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAndSorted.map(tc => tc.id)));
    }
  }, [filteredAndSorted, selectedIds.size]);

  if (!task.id) return null;

  return (
    <div className="font-sans tracking-[var(--letter-spacing)] text-[var(--leve-header-text)]">
      <header className="mb-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className={leveSettingsSectionIconWrapClass}>
            <ClipboardList className="h-5 w-5" aria-hidden />
          </span>
          <h2 className={cn('text-lg font-bold', leveTaskModalStrongClass)}>Casos de Teste</h2>
          <span className={cn(leveTaskModalTabBadgeIdleClass, 'rounded-full px-3 py-1 normal-case')}>
            {stats.total} caso(s)
          </span>
          {cases.length > 0 && (
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              className={cn(leveViewOutlineBtnClass, 'btn-sm gap-1.5')}
              aria-label="Exportar lista de casos de teste"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          )}
        </div>

        {cases.length > 0 && (
          <>
            {/* Indicadores clicáveis */}
            <div className="flex flex-wrap items-center gap-2">
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
                  className={
                    item.isActive ? leveTaskModalStatPillActiveClass : leveTaskModalStatPillIdleClass
                  }
                  aria-pressed={item.isActive}
                >
                  {!item.isActive && (
                    <SlidersHorizontal className="h-3 w-3 shrink-0 opacity-40" aria-hidden />
                  )}
                  <span>
                    {item.label}: {item.value}
                  </span>
                </button>
              ))}
            </div>

            {/* Barra de progresso */}
            <div className="flex flex-col gap-1">
              <div className={cn('flex items-center justify-between text-xs', leveTaskModalMutedXsClass)}>
                <span>
                  {stats.executed} de {stats.total} executados
                  {stats.total > 0 && ` (${Math.round((stats.executed / stats.total) * 100)}%)`}
                </span>
                <span>{stats.passed} aprovados</span>
              </div>
              <progress
                className="progress h-2 w-full [&::-moz-progress-bar]:bg-[var(--leve-header-accent)] [&::-webkit-progress-value]:bg-[var(--leve-header-accent)]"
                value={stats.total > 0 ? stats.executed : 0}
                max={stats.total || 1}
                aria-label="Progresso de execução dos casos de teste"
              />
            </div>

            {/* Filtros, ordenação, busca, expandir/recolher */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[140px] max-w-xs">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--leve-header-text-muted)]" />
                <input
                  type="search"
                  placeholder="Buscar na descrição, passos ou resultado..."
                  value={searchInput}
                  onChange={v => setSearchInput(v)}
                  className={cn(leveViewSearchInputClass, 'input-sm w-full pl-8 text-sm')}
                  aria-label="Buscar nos casos de teste"
                />
              </div>
              <AppSelect
                value={sortBy}
                onChange={v => setSortBy(v as SortBy)}
                className={cn(leveSettingsSelectClass, 'select-sm h-9 min-h-0 text-sm')}
                aria-label="Ordenar casos por"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </AppSelect>
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(p => !p)}
                className={cn(
                  leveViewOutlineBtnClass,
                  'btn-sm gap-1.5 text-xs',
                  showAdvancedFilters &&
                    'border-[var(--leve-header-accent)] bg-[color-mix(in_srgb,var(--leve-header-accent)_12%,var(--leve-header-bg))]'
                )}
                aria-expanded={showAdvancedFilters}
                aria-label="Abrir filtros avançados"
              >
                <Filter className="w-3.5 h-3.5" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge size="xs" appearance="pill" variant="primary">
                    {activeFiltersCount}
                  </Badge>
                )}
              </button>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setDetailsOpenOverride(true)}
                  className="win-icon-button"
                  aria-label="Expandir detalhes de todos"
                  title="Expandir detalhes"
                >
                  <ChevronDown className="h-5 w-5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => setDetailsOpenOverride(false)}
                  className="win-icon-button"
                  aria-label="Recolher detalhes de todos"
                  title="Recolher detalhes"
                >
                  <ChevronUp className="h-5 w-5" aria-hidden />
                </button>
              </div>
            </div>

            {/* Filtros avançados: painel colapsável */}
            {showAdvancedFilters && (
              <div
                className={cn(
                  'flex flex-wrap items-center gap-2 rounded-[var(--leve-header-radius)] border border-[var(--leve-header-border)]',
                  'bg-[color-mix(in_srgb,var(--leve-header-text)_4%,var(--leve-header-bg))] p-2.5'
                )}
              >
                <span className={cn('text-xs font-medium', leveTaskModalMutedXsClass)}>Status:</span>
                {STATUS_OPTIONS.map(s => (
                  <label key={s} className="label cursor-pointer gap-1.5 py-0">
                    <input
                      type="checkbox"
                      checked={statusFilter.includes(s)}
                      onChange={() => toggleStatusFilter(s)}
                      className="checkbox checkbox-sm checkbox-highlight"
                    />
                    <span className="text-xs">{STATUS_LABEL[s]}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Chips de filtros ativos */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {statusFilter.map(s => (
                  <span
                    key={s}
                    className={cn(leveTaskModalStatPillActiveClass, 'gap-1 pr-1 py-1.5')}
                  >
                    {STATUS_LABEL[s]}
                    <button
                      type="button"
                      onClick={() => toggleStatusFilter(s)}
                      className="btn btn-ghost btn-xs btn-circle p-0 min-h-0 h-4 w-4"
                      aria-label={`Remover filtro ${STATUS_LABEL[s]}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {debouncedSearch.trim() && (
                  <span className="badge badge-primary badge-outline gap-1 pr-1 py-1.5 text-xs">
                    Busca
                    <button
                      type="button"
                      onClick={() => setSearchInput('')}
                      className="btn btn-ghost btn-xs btn-circle p-0 min-h-0 h-4 w-4"
                      aria-label="Limpar busca"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="btn btn-ghost btn-sm text-error hover:bg-error/10 text-xs"
                >
                  Limpar filtros
                </button>
              </div>
            )}

            {/* Contador exibindo X de Y */}
            {(activeFiltersCount > 0 || filteredAndSorted.length !== cases.length) && (
              <p className={leveTaskModalMutedXsClass}>
                Exibindo {filteredAndSorted.length} de {cases.length} caso(s)
              </p>
            )}
          </>
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
      ) : filteredAndSorted.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Nenhum caso corresponde aos filtros"
          description="Tente alterar os filtros ou a busca."
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
              <button
                type="button"
                onClick={handleApproveSelected}
                className="btn btn-success btn-xs"
              >
                Aprovar
              </button>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="btn btn-ghost btn-xs"
              >
                Limpar seleção
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 py-1">
            <label className="label cursor-pointer gap-2 py-0">
              <input
                type="checkbox"
                checked={
                  filteredAndSorted.length > 0 && selectedIds.size === filteredAndSorted.length
                }
                onChange={toggleSelectAll}
                className="checkbox checkbox-sm checkbox-highlight"
                aria-label="Selecionar todos os casos visíveis"
              />
              <span className={leveTaskModalMutedXsClass}>Selecionar todos</span>
            </label>
          </div>

          {filteredAndSorted.map(tc => (
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
              detailsOpenOverride={detailsOpenOverride !== null ? detailsOpenOverride : undefined}
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
