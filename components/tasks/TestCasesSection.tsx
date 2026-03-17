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
    { value: 'priority', label: 'Prioridade' },
    { value: 'description', label: 'Descrição (A–Z)' },
] as const;
type SortBy = (typeof SORT_OPTIONS)[number]['value'];

const PRIORITY_ORDER: Record<string, number> = { Urgente: 0, Alta: 1, Média: 2, Baixa: 3 };

function getTestCaseStats(cases: TestCase[]) {
    const total = cases.length;
    const notRun = cases.filter((c) => c.status === 'Not Run').length;
    const passed = cases.filter((c) => c.status === 'Passed').length;
    const failed = cases.filter((c) => c.status === 'Failed').length;
    const blocked = cases.filter((c) => c.status === 'Blocked').length;
    const automated = cases.filter((c) => c.isAutomated).length;
    const executed = passed + failed;
    return { total, notRun, passed, failed, blocked, automated, executed };
}

function matchesSearch(tc: TestCase, q: string): boolean {
    if (!q.trim()) return true;
    const lower = q.trim().toLowerCase();
    const text = [
        tc.description,
        tc.expectedResult,
        tc.preconditions,
        tc.observedResult,
        (tc.steps || []).join(' '),
        (tc.strategies || []).join(' '),
    ]
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
    onTestCaseStatusChange: (testCaseId: string, status: 'Passed' | 'Failed') => void;
    onToggleTestCaseAutomated: (testCaseId: string, isAutomated: boolean) => void;
    onExecutedStrategyChange: (testCaseId: string, strategies: string[]) => void;
    onTestCaseToolsChange?: (testCaseId: string, tools: string[]) => void;
    onEditTestCase?: (taskId: string, testCase: TestCase) => void;
    onDeleteTestCase?: (taskId: string, testCaseId: string) => void;
    onDuplicateTestCase?: (taskId: string, testCase: TestCase) => void;
    onAddTestCaseFromTemplate?: (taskId: string) => void;
}

export const TestCasesSection: React.FC<TestCasesSectionProps> = ({
    task,
    isGenerating,
    onGenerateTests,
    detailLevel = 'Padrão',
    onTestCaseStatusChange,
    onToggleTestCaseAutomated,
    onExecutedStrategyChange,
    onTestCaseToolsChange,
    onEditTestCase,
    onDeleteTestCase,
    onDuplicateTestCase,
    onAddTestCaseFromTemplate,
}) => {
    const cases = task.testCases || [];
    const [statusFilter, setStatusFilter] = useState<TestCase['status'][]>([]);
    const [automatedFilter, setAutomatedFilter] = useState<'all' | boolean>('all');
    const [strategyFilter, setStrategyFilter] = useState<string>('all');
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch] = useDebounceValue(searchInput, 300);
    const [sortBy, setSortBy] = useState<SortBy>('default');
    const [showExportModal, setShowExportModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    /** Controla expandir/recolher todos os "Detalhes". null = cada item usa estado interno. */
    const [detailsOpenOverride, setDetailsOpenOverride] = useState<boolean | null>(null);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

    const strategies = useMemo(() => {
        const set = new Set<string>();
        cases.forEach((c) => (c.strategies || []).forEach((s) => set.add(s)));
        return Array.from(set).sort();
    }, [cases]);

    const stats = useMemo(() => getTestCaseStats(cases), [cases]);

    const filteredAndSorted = useMemo(() => {
        let list = cases.filter((tc) => {
            if (statusFilter.length > 0 && !statusFilter.includes(tc.status)) return false;
            if (automatedFilter !== 'all' && !!tc.isAutomated !== automatedFilter) return false;
            if (strategyFilter !== 'all' && !(tc.strategies || []).includes(strategyFilter)) return false;
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
        } else if (sortBy === 'priority') {
            list = [...list].sort((a, b) => {
                const pa = PRIORITY_ORDER[a.priority || ''] ?? 4;
                const pb = PRIORITY_ORDER[b.priority || ''] ?? 4;
                return pa - pb;
            });
        } else if (sortBy === 'description') {
            list = [...list].sort((a, b) => a.description.localeCompare(b.description, 'pt-BR'));
        }

        return list;
    }, [cases, statusFilter, automatedFilter, strategyFilter, debouncedSearch, sortBy]);

    const activeFiltersCount =
        statusFilter.length +
        (automatedFilter !== 'all' ? 1 : 0) +
        (strategyFilter !== 'all' ? 1 : 0) +
        (debouncedSearch.trim() ? 1 : 0);

    const clearAllFilters = useCallback(() => {
        setStatusFilter([]);
        setAutomatedFilter('all');
        setStrategyFilter('all');
        setSearchInput('');
    }, []);

    const toggleStatusFilter = useCallback((status: TestCase['status']) => {
        setStatusFilter((prev) =>
            prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
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
                label: 'Autom.',
                value: stats.automated,
                onClick: () => setAutomatedFilter((p) => (p === true ? 'all' : true)),
                isActive: automatedFilter === true,
            },
        ],
        [stats, statusFilter, automatedFilter, toggleStatusFilter]
    );

    const handleApproveSelected = useCallback(() => {
        selectedIds.forEach((id) => onTestCaseStatusChange(id, 'Passed'));
        setSelectedIds(new Set());
    }, [selectedIds, onTestCaseStatusChange]);

    const handleMarkAutomatedSelected = useCallback(() => {
        selectedIds.forEach((id) => onToggleTestCaseAutomated(id, true));
        setSelectedIds(new Set());
    }, [selectedIds, onToggleTestCaseAutomated]);

    const handleUnmarkAutomatedSelected = useCallback(() => {
        selectedIds.forEach((id) => onToggleTestCaseAutomated(id, false));
        setSelectedIds(new Set());
    }, [selectedIds, onToggleTestCaseAutomated]);

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds((prev) => {
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
            setSelectedIds(new Set(filteredAndSorted.map((tc) => tc.id)));
        }
    }, [filteredAndSorted, selectedIds.size]);

    if (!task.id) return null;

    return (
        <div>
            <header className="flex flex-col gap-3 mb-4">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="p-1.5 bg-primary/10 rounded-lg">
                        <ClipboardList className="w-5 h-5 text-primary" aria-hidden />
                    </div>
                    <h2 className="text-lg font-bold text-base-content">Casos de Teste</h2>
                    <span className="text-xs font-medium text-base-content/70 bg-base-200 px-3 py-1 rounded-full">
                        {stats.total} caso(s)
                    </span>
                    {cases.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setShowExportModal(true)}
                            className="btn btn-ghost btn-sm gap-1.5 text-base-content/80 hover:text-primary"
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
                            {indicatorItems.map((item) => (
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
                                    className={`badge gap-1.5 py-2 text-xs font-medium transition-all ${
                                        item.isActive
                                            ? 'badge-primary'
                                            : 'badge-ghost badge-outline hover:badge-primary/20'
                                    }`}
                                    aria-pressed={item.isActive}
                                >
                                    {!item.isActive && (
                                        <SlidersHorizontal className="w-2.5 h-2.5 opacity-40" />
                                    )}
                                    {item.label}: {item.value}
                                </button>
                            ))}
                        </div>

                        {/* Barra de progresso */}
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-xs text-base-content/70">
                                <span>
                                    {stats.executed} de {stats.total} executados
                                    {stats.total > 0 &&
                                        ` (${Math.round((stats.executed / stats.total) * 100)}%)`}
                                </span>
                                <span>{stats.passed} aprovados</span>
                            </div>
                            <progress
                                className="progress progress-primary w-full h-2"
                                value={stats.total > 0 ? stats.executed : 0}
                                max={stats.total || 1}
                                aria-label="Progresso de execução dos casos de teste"
                            />
                        </div>

                        {/* Filtros, ordenação, busca, expandir/recolher */}
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative flex-1 min-w-[140px] max-w-xs">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
                                <input
                                    type="search"
                                    placeholder="Buscar na descrição, passos ou resultado..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="input input-bordered input-sm w-full pl-8 text-sm"
                                    aria-label="Buscar nos casos de teste"
                                />
                            </div>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortBy)}
                                className="select select-bordered select-sm text-sm"
                                aria-label="Ordenar casos por"
                            >
                                {SORT_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={() => setShowAdvancedFilters((p) => !p)}
                                className={`btn btn-ghost btn-sm gap-1.5 text-xs ${showAdvancedFilters ? 'btn-active' : ''}`}
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
                                    className="btn btn-ghost btn-sm gap-1 text-xs"
                                    aria-label="Expandir detalhes de todos"
                                >
                                    <ChevronDown className="w-4 h-4" />
                                    Expandir
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDetailsOpenOverride(false)}
                                    className="btn btn-ghost btn-sm gap-1 text-xs"
                                    aria-label="Recolher detalhes de todos"
                                >
                                    <ChevronUp className="w-4 h-4" />
                                    Recolher
                                </button>
                            </div>
                        </div>

                        {/* Filtros avançados: painel colapsável */}
                        {showAdvancedFilters && (
                            <div className="flex flex-wrap items-center gap-2 p-2.5 bg-base-200/60 rounded-xl border border-base-300">
                                <span className="text-xs text-base-content/60 font-medium">Status:</span>
                                {STATUS_OPTIONS.map((s) => (
                                    <label key={s} className="label cursor-pointer gap-1.5 py-0">
                                        <input
                                            type="checkbox"
                                            checked={statusFilter.includes(s)}
                                            onChange={() => toggleStatusFilter(s)}
                                            className="checkbox checkbox-sm"
                                        />
                                        <span className="text-xs">{STATUS_LABEL[s]}</span>
                                    </label>
                                ))}
                                <select
                                    value={automatedFilter === 'all' ? 'all' : automatedFilter ? 'yes' : 'no'}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        setAutomatedFilter(v === 'all' ? 'all' : v === 'yes');
                                    }}
                                    className="select select-bordered select-sm text-xs w-auto"
                                    aria-label="Filtrar por automatizado"
                                >
                                    <option value="all">Automatizado: Todos</option>
                                    <option value="yes">Sim</option>
                                    <option value="no">Não</option>
                                </select>
                                {strategies.length > 0 && (
                                    <select
                                        value={strategyFilter}
                                        onChange={(e) => setStrategyFilter(e.target.value)}
                                        className="select select-bordered select-sm text-xs w-auto max-w-[180px]"
                                        aria-label="Filtrar por estratégia"
                                    >
                                        <option value="all">Estratégia: Todas</option>
                                        {strategies.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}

                        {/* Chips de filtros ativos */}
                        {activeFiltersCount > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                {statusFilter.map((s) => (
                                    <span
                                        key={s}
                                        className="badge badge-primary badge-outline gap-1 pr-1 py-1.5 text-xs"
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
                                {automatedFilter !== 'all' && (
                                    <span className="badge badge-primary badge-outline gap-1 pr-1 py-1.5 text-xs">
                                        Autom.: {automatedFilter ? 'Sim' : 'Não'}
                                        <button
                                            type="button"
                                            onClick={() => setAutomatedFilter('all')}
                                            className="btn btn-ghost btn-xs btn-circle p-0 min-h-0 h-4 w-4"
                                            aria-label="Remover filtro automatizado"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
                                {strategyFilter !== 'all' && (
                                    <span className="badge badge-primary badge-outline gap-1 pr-1 py-1.5 text-xs">
                                        {strategyFilter}
                                        <button
                                            type="button"
                                            onClick={() => setStrategyFilter('all')}
                                            className="btn btn-ghost btn-xs btn-circle p-0 min-h-0 h-4 w-4"
                                            aria-label="Remover filtro estratégia"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                )}
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
                            <p className="text-xs text-base-content/60">
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
                        <p className="mt-2 text-sm text-base-content/70">Gerando casos de teste com IA...</p>
                        <p className="mt-1 text-xs text-base-content/70">⏱️ Isso pode levar 10-30 segundos</p>
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
                        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 p-2 rounded-xl bg-primary/10 border border-primary/30">
                            <span className="text-sm font-medium text-base-content">
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
                                onClick={handleMarkAutomatedSelected}
                                className="btn btn-primary btn-xs"
                            >
                                Marcar automatizados
                            </button>
                            <button
                                type="button"
                                onClick={handleUnmarkAutomatedSelected}
                                className="btn btn-ghost btn-xs"
                            >
                                Desmarcar automatizados
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
                                    filteredAndSorted.length > 0 &&
                                    selectedIds.size === filteredAndSorted.length
                                }
                                onChange={toggleSelectAll}
                                className="checkbox checkbox-sm"
                                aria-label="Selecionar todos os casos visíveis"
                            />
                            <span className="text-xs text-base-content/70">Selecionar todos</span>
                        </label>
                    </div>

                    {filteredAndSorted.map((tc) => (
                        <TestCaseItem
                            key={tc.id}
                            testCase={tc}
                            onStatusChange={(status) => onTestCaseStatusChange(tc.id, status)}
                            onToggleAutomated={(isAutomated) =>
                                onToggleTestCaseAutomated(tc.id, isAutomated)
                            }
                            onExecutedStrategyChange={(strategies) =>
                                onExecutedStrategyChange(tc.id, strategies)
                            }
                            onToolsChange={
                                onTestCaseToolsChange
                                    ? (tools) => onTestCaseToolsChange(tc.id, tools)
                                    : undefined
                            }
                            onEdit={
                                onEditTestCase ? () => onEditTestCase(task.id, tc) : undefined
                            }
                            onDelete={
                                onDeleteTestCase
                                    ? () => onDeleteTestCase(task.id, tc.id)
                                    : undefined
                            }
                            onDuplicate={
                                onDuplicateTestCase
                                    ? () => onDuplicateTestCase(task.id, tc)
                                    : undefined
                            }
                            detailsOpenOverride={
                                detailsOpenOverride !== null ? detailsOpenOverride : undefined
                            }
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
