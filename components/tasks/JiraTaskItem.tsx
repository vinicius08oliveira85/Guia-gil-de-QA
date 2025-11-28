import React, { useEffect, useMemo, useState } from 'react';
import { JiraTask, BddScenario, TestCaseDetailLevel, TeamRole, Project, TestCase } from '../../types';
import { Spinner } from '../common/Spinner';
import { TaskTypeIcon, TaskStatusIcon, PlusIcon, EditIcon, TrashIcon, ChevronDownIcon, RefreshIcon } from '../common/Icons';
import { BddScenarioForm, BddScenarioItem } from './BddScenario';
import { TestCaseItem } from './TestCaseItem';
import { TestStrategyCard } from './TestStrategyCard';
import { ToolsSelector } from './ToolsSelector';
import { TestReportModal } from './TestReportModal';
import { CommentSection } from '../common/CommentSection';
import { DependencyManager } from '../common/DependencyManager';
import { AttachmentManager } from '../common/AttachmentManager';
import { ChecklistView } from '../common/ChecklistView';
import { EstimationInput } from '../common/EstimationInput';
import { QuickActions } from '../common/QuickActions';
import { TimeTracker } from '../common/TimeTracker';
import { getTagColor, getTaskVersions } from '../../utils/tagService';
import { VersionBadges } from './VersionBadge';
import { updateChecklistItem } from '../../utils/checklistService';
import { getTaskPhase, getPhaseBadgeStyle, getNextStepForTask } from '../../utils/taskPhaseHelper';
import { useBeginnerMode } from '../../hooks/useBeginnerMode';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { ensureJiraHexColor, getJiraStatusColor, getJiraStatusTextColor } from '../../utils/jiraStatusColors';
import { windows12Styles } from '../../utils/windows12Styles';

// Componente para renderizar descrição com suporte a imagens
const DescriptionRenderer: React.FC<{ description: string }> = ({ description }) => {
    // Garantir que description é uma string válida
    if (!description || typeof description !== 'string') {
        return <p className="text-text-secondary italic">Sem descrição</p>;
    }
    
    // Detectar imagens no formato markdown ![alt](data:image/...)
    const imageRegex = /!\[([^\]]*)\]\((data:image\/[^)]+)\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = imageRegex.exec(description)) !== null) {
        // Adicionar texto antes da imagem
        if (match.index > lastIndex) {
            parts.push(
                <span key={key++}>{description.substring(lastIndex, match.index)}</span>
            );
        }
        
        // Adicionar imagem
        parts.push(
            <img
                key={key++}
                src={match[2]}
                alt={match[1] || 'Imagem'}
                className="max-w-full h-auto rounded-lg border border-surface-border my-2"
            />
        );
        
        lastIndex = match.index + match[0].length;
    }
    
    // Adicionar texto restante
    if (lastIndex < description.length) {
        parts.push(
            <span key={key++}>{description.substring(lastIndex)}</span>
        );
    }
    
    return <div className="whitespace-pre-wrap">{parts.length > 0 ? parts : description}</div>;
};

export type TaskWithChildren = JiraTask & { children: TaskWithChildren[] };

type DetailSection = 'overview' | 'bdd' | 'tests' | 'planning' | 'collaboration';

const normalizeStatusName = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();

const TeamRoleBadge: React.FC<{ role: TeamRole }> = ({ role }) => {
    const roleStyles: Record<TeamRole, { bg: string, text: string }> = {
        'Product': { bg: 'bg-purple-500/30', text: 'text-purple-300' },
        'QA': { bg: 'bg-accent/30', text: 'text-accent-light' },
        'Dev': { bg: 'bg-blue-500/30', text: 'text-blue-300' },
    };
    const styles = roleStyles[role];

    return (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles.bg} ${styles.text}`}>
            {role}
        </span>
    );
};

export const JiraTaskItem: React.FC<{
    task: TaskWithChildren;
    onTestCaseStatusChange: (testCaseId: string, status: 'Passed' | 'Failed') => void;
    onToggleTestCaseAutomated: (testCaseId: string, isAutomated: boolean) => void;
    onExecutedStrategyChange: (testCaseId: string, strategies: string[]) => void;
    onTaskToolsChange?: (tools: string[]) => void;
    onTestCaseToolsChange?: (testCaseId: string, tools: string[]) => void;
    onStrategyExecutedChange?: (strategyIndex: number, executed: boolean) => void;
    onStrategyToolsChange?: (strategyIndex: number, tools: string[]) => void;
    onDelete: (taskId: string) => void;
    onGenerateTests: (taskId: string, detailLevel: TestCaseDetailLevel) => Promise<void>;
    isGenerating: boolean;
    onAddSubtask: (parentId: string) => void;
    onEdit: (task: JiraTask) => void;
    onGenerateBddScenarios: (taskId: string) => Promise<void>;
    isGeneratingBdd: boolean;
    onSaveBddScenario: (taskId: string, scenario: Omit<BddScenario, 'id'>, scenarioId?: string) => void;
    onDeleteBddScenario: (taskId: string, scenarioId: string) => void;
    onTaskStatusChange: (status: 'To Do' | 'In Progress' | 'Done') => void;
    onAddTestCaseFromTemplate?: (taskId: string) => void;
    onAddComment?: (content: string) => void;
    onEditComment?: (commentId: string, content: string) => void;
    onDeleteComment?: (commentId: string) => void;
    onEditTestCase?: (taskId: string, testCase: TestCase) => void;
    onDeleteTestCase?: (taskId: string, testCaseId: string) => void;
    project?: Project;
    onUpdateProject?: (project: Project) => void;
    isSelected?: boolean;
    onToggleSelect?: () => void;
    children?: React.ReactNode;
    level: number;
    activeTaskId?: string | null;
    onFocusTask?: (taskId: string | null) => void;
}> = React.memo(({ task, onTestCaseStatusChange, onToggleTestCaseAutomated, onExecutedStrategyChange, onTaskToolsChange, onTestCaseToolsChange, onStrategyExecutedChange, onStrategyToolsChange, onDelete, onGenerateTests, isGenerating, onAddSubtask, onEdit, onGenerateBddScenarios, isGeneratingBdd, onSaveBddScenario, onDeleteBddScenario, onTaskStatusChange, onAddTestCaseFromTemplate, onAddComment, onEditComment, onDeleteComment, onEditTestCase, onDeleteTestCase, project, onUpdateProject, isSelected, onToggleSelect, children, level, activeTaskId, onFocusTask }) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false); // Colapsado por padrão para compactar
    const [isChildrenOpen, setIsChildrenOpen] = useState(false);
    const [editingBddScenario, setEditingBddScenario] = useState<BddScenario | null>(null);
    const [isCreatingBdd, setIsCreatingBdd] = useState(false);
    const [detailLevel, setDetailLevel] = useState<TestCaseDetailLevel>('Padrão');
    const [showDependencies, setShowDependencies] = useState(false);
    const [showAttachments, setShowAttachments] = useState(false);
    const [showEstimation, setShowEstimation] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showTestReport, setShowTestReport] = useState(false);
    const [activeSection, setActiveSection] = useState<DetailSection>('overview');
    const hasTests = task.testCases && task.testCases.length > 0;
    const hasChildren = task.children && task.children.length > 0;
    const { isBeginnerMode } = useBeginnerMode();
    const taskPhase = getTaskPhase(task);
    const phaseStyle = getPhaseBadgeStyle(taskPhase);
    const nextStep = getNextStepForTask(task);
    const jiraStatusPalette = project?.settings?.jiraStatuses;
    const currentStatusColor = useMemo(() => {
        const statusName = task.jiraStatus || task.status;
        if (!statusName) {
            return undefined;
        }
        if (jiraStatusPalette && jiraStatusPalette.length > 0) {
            const normalizedTarget = normalizeStatusName(statusName);
            const matched = jiraStatusPalette.find(statusEntry => {
                const entryName = typeof statusEntry === 'string' ? statusEntry : statusEntry.name;
                return normalizeStatusName(entryName) === normalizedTarget;
            });
            if (matched) {
                if (typeof matched === 'string') {
                    return ensureJiraHexColor(undefined, matched);
                }
                return ensureJiraHexColor(matched.color, matched.name);
            }
        }
        return getJiraStatusColor(statusName);
    }, [jiraStatusPalette, task.jiraStatus, task.status]);
    const statusTextColor = currentStatusColor ? getJiraStatusTextColor(currentStatusColor) : undefined;

    const testExecutionSummary = useMemo(() => {
        const total = task.testCases?.length || 0;
        const passed = (task.testCases?.filter(tc => tc.status === 'Passed') ?? []).length;
        const failed = (task.testCases?.filter(tc => tc.status === 'Failed') ?? []).length;
        const executed = passed + failed;
        return {
            total,
            passed,
            failed,
            executed,
            pending: Math.max(total - executed, 0)
        };
    }, [task.testCases]);

    const testTypeBadges = useMemo(() => {
        const typeMap = new Map<string, { total: number; executed: number; failed: number; hasStrategy: boolean; strategyExecuted: boolean }>();
        const ensureType = (type: string) => {
            if (!typeMap.has(type)) {
                typeMap.set(type, { total: 0, executed: 0, failed: 0, hasStrategy: false, strategyExecuted: false });
            }
            return typeMap.get(type)!;
        };

        (task.testStrategy || []).forEach((strategy, index) => {
            if (!strategy?.testType) return;
            const entry = ensureType(strategy.testType);
            entry.hasStrategy = true;
            if (task.executedStrategies?.includes(index)) {
                entry.strategyExecuted = true;
            }
        });

        (task.testCases || []).forEach(testCase => {
            const fallbackType = task.testStrategy && task.testStrategy.length > 0
                ? task.testStrategy[0]?.testType || 'Testes Gerais'
                : 'Testes Gerais';
            const associatedTypes = testCase.strategies && testCase.strategies.length > 0
                ? testCase.strategies
                : [fallbackType];
            
            // Normalizar executedStrategy para array
            const executedStrategies = testCase.executedStrategy 
                ? (Array.isArray(testCase.executedStrategy) 
                    ? testCase.executedStrategy.filter(s => s && s.trim() !== '')
                    : [testCase.executedStrategy].filter(s => s && s.trim() !== ''))
                : [];
            
            // Verificar quais estratégias da task estão marcadas como "Realizada" no toggle
            // (usado apenas como fallback se não houver executedStrategy no testCase)
            const taskExecutedStrategyTypes = new Set<string>();
            (task.testStrategy || []).forEach((strategy, index) => {
                if (strategy?.testType && task.executedStrategies?.includes(index)) {
                    taskExecutedStrategyTypes.add(strategy.testType);
                }
            });
            
            // Se há estratégias selecionadas no seletor, usar apenas essas
            // Se não há, usar o toggle da task como fallback
            const hasExecutedStrategies = executedStrategies.length > 0;
            
            associatedTypes.forEach(type => {
                if (!type) return;
                const entry = ensureType(type);
                entry.total += 1;
                
                let isExecuted = false;
                
                if (hasExecutedStrategies) {
                    // Se há estratégias selecionadas no seletor, contar APENAS para essas
                    const isInExecutedStrategies = executedStrategies.some(es => 
                        es.trim().toLowerCase() === type.trim().toLowerCase()
                    );
                    
                    if (isInExecutedStrategies) {
                        // Se a estratégia está selecionada, considerar executado
                        // O status do testCase (Passed/Failed) só confirma, mas não é obrigatório
                        isExecuted = true;
                    }
                } else {
                    // Fallback: se não há estratégias selecionadas, usar o toggle da task
                    // Mas só se o status não for 'Not Run' (para evitar contar testes não executados)
                    const isInTaskStrategy = taskExecutedStrategyTypes.has(type);
                    const hasStatus = testCase.status !== 'Not Run';
                    
                    if (isInTaskStrategy && hasStatus) {
                        isExecuted = true;
                    }
                }
                
                if (isExecuted) {
                    entry.executed += 1;
                }
                
                if (testCase.status === 'Failed') {
                    entry.failed += 1;
                }
            });
        });

        return Array.from(typeMap.entries()).map(([type, data]) => {
            const pendingCases = Math.max(data.total - data.executed, 0);
            let status: 'pending' | 'partial' | 'done' | 'failed' = 'pending';
            if (data.failed > 0) {
                status = 'failed';
            } else if (pendingCases === 0 && data.executed > 0) {
                // Só marca como 'done' se todos os testes foram executados E há pelo menos um executado
                status = 'done';
            } else if (data.executed > 0) {
                // Há testes executados mas ainda há pendentes
                status = 'partial';
            } else if (data.hasStrategy) {
                // Tem estratégia mas nenhum teste executado ainda
                status = 'pending';
            }

            const label = data.total > 0
                ? `${data.executed}/${data.total}`
                : data.hasStrategy
                    ? 'Planejado'
                    : '—';

            return { type, status, label };
        }).sort((a, b) => a.type.localeCompare(b.type));
    }, [task.testCases, task.testStrategy, task.executedStrategies]);

    const sectionTabs = useMemo(() => {
        const tabs: { id: DetailSection; label: string; badge?: number }[] = [
            { id: 'overview', label: 'Resumo' },
            { id: 'bdd', label: 'Cenários BDD', badge: task.bddScenarios?.length || 0 }
        ];

        // Adicionar aba "Testes" apenas para tipo "Tarefa"
        if (task.type === 'Tarefa') {
            tabs.push({ id: 'tests', label: 'Testes', badge: task.testCases?.length || 0 });
        }

        if (project && onUpdateProject) {
            const planningBadge = (task.dependencies?.length || 0) + (task.attachments?.length || 0) + (task.checklist?.length || 0) + (task.estimatedHours ? 1 : 0);
            tabs.push({ id: 'planning', label: 'Planejamento', badge: planningBadge });
        }

        if (onAddComment) {
            tabs.push({ id: 'collaboration', label: 'Colaboração', badge: task.comments?.length || 0 });
        }

        return tabs;
    }, [
        task.type,
        task.bddScenarios,
        task.testCases,
        task.dependencies,
        task.attachments,
        task.checklist,
        task.estimatedHours,
        task.comments,
        project,
        onUpdateProject,
        onAddComment
    ]);

    useEffect(() => {
        if (activeTaskId === undefined) {
            return;
        }
        if (activeTaskId === task.id && !isDetailsOpen) {
            setIsDetailsOpen(true);
        } else if (activeTaskId !== task.id && isDetailsOpen) {
            setIsDetailsOpen(false);
        }
    }, [activeTaskId, task.id, isDetailsOpen]);

    useEffect(() => {
        if (isDetailsOpen && !sectionTabs.find(tab => tab.id === activeSection)) {
            setActiveSection(sectionTabs[0]?.id ?? 'overview');
        }
        // Se estiver na aba "tests" e não for tipo "Tarefa", redirecionar para "overview" ou "bdd"
        if (activeSection === 'tests' && task.type !== 'Tarefa') {
            const firstAvailableTab = sectionTabs.find(tab => tab.id === 'bdd') || sectionTabs[0];
            if (firstAvailableTab) {
                setActiveSection(firstAvailableTab.id);
            }
        }
    }, [isDetailsOpen, sectionTabs, activeSection, task.type]);

    const handleToggleDetails = () => {
        if (isDetailsOpen) {
            setIsDetailsOpen(false);
            onFocusTask?.(null);
        } else {
            onFocusTask?.(task.id);
            setActiveSection(sectionTabs[0]?.id ?? 'overview');
            setIsDetailsOpen(true);
        }
    };

    const handleSaveScenario = (scenario: Omit<BddScenario, 'id'>) => {
        onSaveBddScenario(task.id, scenario, editingBddScenario?.id);
        setEditingBddScenario(null);
        setIsCreatingBdd(false);
    };

    const handleCancelBddForm = () => {
        setEditingBddScenario(null);
        setIsCreatingBdd(false);
    };
    
    const indentationStyle = { paddingLeft: `${level * 1.2}rem` };

    const iconButtonClass = 'task-card-compact_icon-btn';

    const renderOverviewSection = () => (
        <div className="space-y-md">
            {project && onUpdateProject && (
                <div>
                    <QuickActions
                        task={task}
                        project={project}
                        onUpdateProject={onUpdateProject}
                    />
                </div>
            )}
            
            {/* Botão para Gerar Registro de Testes - apenas para tipo "Tarefa" */}
            {task.type === 'Tarefa' && (task.testCases?.length > 0 || task.testStrategy?.length > 0) && (
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowTestReport(true)}
                        className={`
                            ${windows12Styles.buttonPrimary}
                            flex items-center gap-2
                        `}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Gerar Registro de Testes</span>
                    </button>
                </div>
            )}
            <div className="text-text-secondary">
                {task.description ? (
                    <DescriptionRenderer description={task.description} />
                ) : (
                    <p className="text-text-secondary italic">Sem descrição</p>
                )}
            </div>
            {(task.priority || task.severity || task.owner || task.assignee || nextStep) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {task.owner && (
                        <div className="p-3 bg-surface border border-surface-border rounded-lg">
                            <p className="text-[11px] uppercase text-text-secondary tracking-wide">Owner</p>
                            <p className="text-sm font-semibold text-text-primary">{task.owner}</p>
                        </div>
                    )}
                    {task.assignee && (
                        <div className="p-3 bg-surface border border-surface-border rounded-lg">
                            <p className="text-[11px] uppercase text-text-secondary tracking-wide">Responsável</p>
                            <p className="text-sm font-semibold text-text-primary">{task.assignee}</p>
                        </div>
                    )}
                    {task.priority && (
                        <div className="p-3 bg-surface border border-surface-border rounded-lg">
                            <p className="text-[11px] uppercase text-text-secondary tracking-wide">Prioridade</p>
                            <p className="text-sm font-semibold text-text-primary">{task.priority}</p>
                        </div>
                    )}
                    {task.severity && (
                        <div className="p-3 bg-surface border border-surface-border rounded-lg">
                            <p className="text-[11px] uppercase text-text-secondary tracking-wide">Severidade</p>
                            <p className="text-sm font-semibold text-text-primary">{task.severity}</p>
                        </div>
                    )}
                      {nextStep && (
                          <div className="p-3 bg-accent/10 border border-accent/40 rounded-lg">
                              <p className="text-[0.65rem] uppercase text-accent tracking-wide">Próximo passo</p>
                              <p className="text-[0.82rem] font-semibold text-text-primary line-clamp-2">{nextStep}</p>
                          </div>
                      )}
                </div>
            )}
            {(() => {
                const versions = getTaskVersions(task);
                const otherTags = task.tags?.filter(tag => !/^V\d+/i.test(tag.trim())) || [];
                
                return (versions.length > 0 || otherTags.length > 0) && (
                    <div className="space-y-2">
                        {versions.length > 0 && (
                            <div>
                                <p className="text-[11px] uppercase text-text-secondary tracking-wide mb-1.5">Versão do Projeto</p>
                                <VersionBadges versions={versions} size="md" />
                            </div>
                        )}
                        {otherTags.length > 0 && (
                            <div>
                                {versions.length > 0 && (
                                    <p className="text-[11px] uppercase text-text-secondary tracking-wide mb-1.5">Tags</p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                    {otherTags.map(tag => (
                                        <span
                                            key={tag}
                                            className="text-xs px-2 py-0.5 rounded-full text-white"
                                            style={{ backgroundColor: getTagColor(tag) }}
                                        >
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );

    const renderBddSection = () => (
        <div className="space-y-md">
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-text-primary">Cenários BDD (Gherkin)</h3>
                <span className="text-xs text-text-secondary">{task.bddScenarios?.length || 0} cenário(s)</span>
            </div>
            <div className="space-y-3">
                {(task.bddScenarios || []).map(sc => (
                    editingBddScenario?.id === sc.id ? (
                        <BddScenarioForm key={sc.id} existingScenario={sc} onSave={handleSaveScenario} onCancel={handleCancelBddForm} />
                    ) : (
                        <BddScenarioItem key={sc.id} scenario={sc} onEdit={() => setEditingBddScenario(sc)} onDelete={() => onDeleteBddScenario(task.id, sc.id)} />
                    )
                ))}
            </div>
            {isCreatingBdd && !editingBddScenario && (
                <BddScenarioForm onSave={handleSaveScenario} onCancel={handleCancelBddForm} />
            )}
            {isGeneratingBdd && <div className="flex justify-center py-2"><Spinner small /></div>}
            <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => onGenerateBddScenarios(task.id)} disabled={isGeneratingBdd || isCreatingBdd || !!editingBddScenario} className="btn btn-secondary !text-sm bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed">
                    Gerar Cenários com IA
                </button>
                <button onClick={() => setIsCreatingBdd(true)} disabled={isGeneratingBdd || isCreatingBdd || !!editingBddScenario} className="btn btn-secondary !text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                    Adicionar Cenário Manualmente
                </button>
            </div>
        </div>
    );

    const renderTestsSection = () => {
        // Retornar null se não for tipo "Tarefa" - não deve ser acessado, mas por segurança
        if (task.type !== 'Tarefa') {
            return null;
        }

        const canHaveTestCases = task.type === 'Tarefa';
        
        return (
            <div className="space-y-md">
                <div>
                    <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-semibold text-text-primary">Estratégia de Teste</h3>
                        <span className="text-xs text-text-secondary">{task.testStrategy?.length || 0} item(ns)</span>
                    </div>
                    {isGenerating && <div className="flex justify-center py-2"><Spinner small /></div>}
                    {task.testStrategy && task.testStrategy.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-md mt-md">
                            {task.testStrategy.map((strategy, i) => {
                                if (!strategy) return null;
                                return (
                                    <TestStrategyCard 
                                        key={i} 
                                        strategy={strategy}
                                        strategyIndex={i}
                                        isExecuted={(task.executedStrategies && task.executedStrategies.includes(i)) || false}
                                        onToggleExecuted={onStrategyExecutedChange}
                                        toolsUsed={(task.strategyTools && task.strategyTools[i]) || []}
                                        onToolsChange={onStrategyToolsChange}
                                    />
                                );
                            })}
                        </div>
                    ) : (
                        !isGenerating && (
                            <EmptyState
                                icon="📊"
                                title="Nenhuma estratégia de teste gerada ainda"
                                description="Gere uma estratégia de teste com IA para esta tarefa."
                                action={{
                                    label: "Gerar Estratégia com IA",
                                    onClick: () => onGenerateTests(task.id, detailLevel)
                                }}
                                tip="A estratégia de teste ajuda a definir quais tipos de teste são necessários para validar esta funcionalidade."
                            />
                        )
                    )}
                </div>

                {canHaveTestCases ? (
                    <div>
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-lg font-semibold text-text-primary">Casos de Teste</h3>
                            <span className="text-xs text-text-secondary">{task.testCases?.length || 0} caso(s)</span>
                        </div>
                        {isGenerating ? (
                            <div className="space-y-3 mt-4">
                                <LoadingSkeleton variant="task" count={3} />
                                <div className="flex flex-col items-center justify-center py-4">
                                    <Spinner small />
                                    <p className="text-sm text-text-secondary mt-2">Gerando casos de teste com IA...</p>
                                    <p className="text-xs text-text-secondary mt-1">⏱️ Isso pode levar 10-30 segundos</p>
                                </div>
                            </div>
                        ) : (task.testCases || []).length > 0 ? (
                            <div className="space-y-3 mt-4">
                                {task.testCases.map(tc => (
                                    <TestCaseItem 
                                        key={tc.id} 
                                        testCase={tc} 
                                        onStatusChange={(status) => onTestCaseStatusChange(tc.id, status)}
                                        onToggleAutomated={(isAutomated) => onToggleTestCaseAutomated(tc.id, isAutomated)}
                                        onExecutedStrategyChange={(strategies) => onExecutedStrategyChange(tc.id, strategies)}
                                        onToolsChange={onTestCaseToolsChange ? (tools) => onTestCaseToolsChange(tc.id, tools) : undefined}
                                        onEdit={onEditTestCase ? () => onEditTestCase(task.id, tc) : undefined}
                                        onDelete={onDeleteTestCase ? () => onDeleteTestCase(task.id, tc.id) : undefined}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="mt-4">
                                <EmptyState
                                    icon="🧪"
                                    title="Nenhum caso de teste ainda"
                                    description="Comece gerando casos de teste com IA ou adicione manualmente."
                                    tips={isBeginnerMode ? [
                                        "Use a IA para gerar casos de teste automaticamente",
                                        "Ou adicione manualmente usando templates",
                                        "Cada caso de teste deve ter passos claros e resultado esperado"
                                    ] : undefined}
                                    action={{
                                        label: "Gerar com IA",
                                        onClick: () => onGenerateTests(task.id, detailLevel)
                                    }}
                                    secondaryAction={onAddTestCaseFromTemplate ? {
                                        label: "Usar Template",
                                        onClick: () => {
                                            // Abrir modal de templates com esta tarefa pré-selecionada
                                            onAddTestCaseFromTemplate(task.id);
                                        }
                                    } : undefined}
                                />
                            </div>
                        )}
                    </div>
                ) : null}

                {/* Ferramentas Utilizadas na Task */}
                {onTaskToolsChange && (
                    <div className="mt-md p-3 bg-surface-hover rounded-lg border border-surface-border">
                        <ToolsSelector
                            selectedTools={task.toolsUsed || []}
                            onToolsChange={onTaskToolsChange}
                            label="Ferramentas Utilizadas (Geral)"
                            compact={false}
                        />
                    </div>
                )}

                {!isGenerating && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                        <button onClick={() => onGenerateTests(task.id, detailLevel)} className="btn btn-primary">
                            {hasTests ? <RefreshIcon /> : <PlusIcon />}
                            <span>{hasTests ? 'Regerar com IA' : 'Gerar com IA'}</span>
                        </button>
                        <div className="flex-1">
                            <label htmlFor={`detail-level-${task.id}`} className="block text-sm text-text-secondary mb-1">Nível de Detalhe</label>
                            <select
                                id={`detail-level-${task.id}`}
                                value={detailLevel}
                                onChange={(e) => setDetailLevel(e.target.value as TestCaseDetailLevel)}
                            >
                                <option value="Padrão">Padrão</option>
                                <option value="Resumido">Resumido</option>
                                <option value="Detalhado">Detalhado</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderPlanningSection = () => {
        if (!project || !onUpdateProject) {
            return (
                <p className="text-sm text-text-secondary">Conecte um projeto para gerenciar dependências e planejamento.</p>
            );
        }

        return (
            <div className="space-y-md">
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-text-primary">Dependências</h3>
                        <button
                            onClick={() => setShowDependencies(!showDependencies)}
                            className="text-sm text-accent hover:text-accent-light"
                        >
                            {showDependencies ? 'Ocultar' : 'Gerenciar'}
                        </button>
                    </div>
                    {showDependencies && (
                        <DependencyManager
                            task={task}
                            project={project}
                            onUpdateProject={onUpdateProject}
                            onClose={() => setShowDependencies(false)}
                        />
                    )}
                </div>

                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-text-primary">Anexos</h3>
                        <button
                            onClick={() => setShowAttachments(!showAttachments)}
                            className="text-sm text-accent hover:text-accent-light"
                        >
                            {showAttachments ? 'Ocultar' : 'Gerenciar'}
                        </button>
                    </div>
                    {showAttachments && (
                        <AttachmentManager
                            task={task}
                            project={project}
                            onUpdateProject={onUpdateProject}
                            onClose={() => setShowAttachments(false)}
                        />
                    )}
                </div>

                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-text-primary">Estimativas</h3>
                        <button
                            onClick={() => setShowEstimation(!showEstimation)}
                            className="text-sm text-accent hover:text-accent-light"
                        >
                            {showEstimation ? 'Ocultar' : task.estimatedHours ? 'Editar' : 'Adicionar'}
                        </button>
                    </div>
                    {showEstimation && (
                        <EstimationInput
                            task={task}
                            onSave={(estimatedHours, actualHours) => {
                                const updatedTasks = project.tasks.map(t =>
                                    t.id === task.id
                                        ? { ...t, estimatedHours, actualHours }
                                        : t
                                );
                                onUpdateProject({ ...project, tasks: updatedTasks });
                                setShowEstimation(false);
                            }}
                            onCancel={() => setShowEstimation(false)}
                        />
                    )}
                    {!showEstimation && task.estimatedHours && (
                        <div className="p-3 bg-surface border border-surface-border rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-text-secondary">Estimado:</span>
                                <span className="font-semibold text-text-primary">{task.estimatedHours}h</span>
                            </div>
                            {task.actualHours && (
                                <>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-text-secondary">Real:</span>
                                        <span className={`font-semibold ${
                                            task.actualHours <= task.estimatedHours ? 'text-green-400' : 'text-orange-400'
                                        }`}>
                                            {task.actualHours}h
                                        </span>
                                    </div>
                                    <div className="mt-2 text-xs text-text-secondary">
                                        {task.actualHours <= task.estimatedHours
                                            ? `✅ Dentro do estimado (${task.estimatedHours - task.actualHours}h restantes)`
                                            : `⚠️ Acima do estimado (+${task.actualHours - task.estimatedHours}h)`
                                        }
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {task.checklist && task.checklist.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-text-primary mb-3">Checklist</h3>
                        <ChecklistView
                            checklist={task.checklist}
                            onToggleItem={(itemId) => {
                                const updatedChecklist = updateChecklistItem(
                                    task.checklist!,
                                    itemId,
                                    { checked: !task.checklist!.find(i => i.id === itemId)?.checked }
                                );
                                const updatedTasks = project.tasks.map(t =>
                                    t.id === task.id ? { ...t, checklist: updatedChecklist } : t
                                );
                                onUpdateProject({ ...project, tasks: updatedTasks });
                            }}
                        />
                    </div>
                )}
            </div>
        );
    };

    const renderCollaborationSection = () => {
        if (!onAddComment) {
            return <p className="text-sm text-text-secondary">Comentários indisponíveis para esta tarefa.</p>;
        }

        return (
            <div>
                <h3 className="text-lg font-semibold text-text-primary mb-3">Comentários</h3>
                <CommentSection
                    comments={task.comments || []}
                    onAddComment={(content) => onAddComment(content)}
                    onEditComment={(commentId, content) => onEditComment?.(commentId, content)}
                    onDeleteComment={(commentId) => onDeleteComment?.(commentId)}
                />
            </div>
        );
    };

    const renderSectionContent = () => {
        switch (activeSection) {
            case 'overview':
                return renderOverviewSection();
            case 'bdd':
                return renderBddSection();
            case 'tests':
                return renderTestsSection();
            case 'planning':
                return renderPlanningSection();
            case 'collaboration':
                return renderCollaborationSection();
            default:
                return null;
        }
    };

    return (
        <div className="relative" data-task-id={task.id}>
            <div style={indentationStyle} className="py-1">
                <div
                    className={`task-card-compact ${isSelected ? 'is-selected' : ''} ${
                        activeTaskId === task.id ? 'ring-1 ring-accent/40' : ''
                    }`}
                >
                    <div className="task-card-compact_line">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                            {onToggleSelect && (
                                <input
                                    type="checkbox"
                                    checked={isSelected || false}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        onToggleSelect();
                                    }}
                                    className="h-4 w-4 rounded border-surface-border text-accent focus:ring-accent"
                                />
                            )}
                            {hasChildren ? (
                                <button
                                    onClick={() => setIsChildrenOpen(!isChildrenOpen)}
                                    className={`${iconButtonClass} !w-6 !h-6`}
                                    aria-label="Alternar subtarefas"
                                >
                                    <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${isChildrenOpen ? 'rotate-180' : ''}`} />
                                </button>
                            ) : (
                                <span className="w-6" />
                            )}
                            <TaskStatusIcon status={task.status} />
                            <TaskTypeIcon type={task.type} />
                            <span className="task-card-compact_code">{task.id}</span>
                            {(() => {
                                const versions = getTaskVersions(task);
                                return versions.length > 0 && (
                                    <VersionBadges versions={versions} size="sm" />
                                );
                            })()}
                            <span className="task-card-compact_badge">{task.type}</span>
                            {task.severity && <span className="task-card-compact_badge">{task.severity}</span>}
                            {task.priority && <span className="task-card-compact_badge">{task.priority}</span>}
                            {taskPhase && (
                                <span className={`task-card-compact_badge ${phaseStyle.bg} ${phaseStyle.color} flex items-center gap-1`}>
                                    <span>{phaseStyle.icon}</span>
                                    {taskPhase}
                                </span>
                            )}
                        </div>
                        <div className="task-card-compact_actions" onClick={(e) => e.stopPropagation()}>
                            <div className="task-card-compact_status min-w-[120px]">
                                <select
                                    value={task.jiraStatus || task.status}
                                    title={task.jiraStatus || task.status}
                                    onChange={(e) => {
                                        const selectedValue = e.target.value;
                                        const jiraStatuses = project?.settings?.jiraStatuses || [];

                                        const mapStatus = (jiraStatus: string): 'To Do' | 'In Progress' | 'Done' => {
                                            const status = jiraStatus.toLowerCase();
                                            if (
                                                status.includes('done') ||
                                                status.includes('resolved') ||
                                                status.includes('closed') ||
                                                status.includes('concluído')
                                            ) {
                                                return 'Done';
                                            }
                                            if (status.includes('progress') || status.includes('andamento')) {
                                                return 'In Progress';
                                            }
                                            return 'To Do';
                                        };

                                        const isJiraStatus = jiraStatuses.some((status) =>
                                            typeof status === 'string' ? status === selectedValue : status.name === selectedValue
                                        );

                                        if (isJiraStatus) {
                                            const mappedStatus = mapStatus(selectedValue);
                                            onTaskStatusChange(mappedStatus);
                                            if (project && onUpdateProject) {
                                                const updatedTasks = project.tasks.map((t) =>
                                                    t.id === task.id ? { ...t, status: mappedStatus, jiraStatus: selectedValue } : t
                                                );
                                                onUpdateProject({ ...project, tasks: updatedTasks });
                                            }
                                        } else {
                                            onTaskStatusChange(selectedValue as 'To Do' | 'In Progress' | 'Done');
                                            if (project && onUpdateProject && task.jiraStatus) {
                                                const updatedTasks = project.tasks.map((t) =>
                                                    t.id === task.id ? { ...t, jiraStatus: undefined } : t
                                                );
                                                onUpdateProject({ ...project, tasks: updatedTasks });
                                            }
                                        }
                                    }}
                                    style={{
                                        backgroundColor: currentStatusColor,
                                        color: statusTextColor,
                                        borderColor: currentStatusColor ? `${currentStatusColor}66` : undefined,
                                        boxShadow: currentStatusColor ? `0 0 0 1px ${currentStatusColor}33` : undefined,
                                    }}
                                >
                                    {project?.settings?.jiraStatuses && project.settings.jiraStatuses.length > 0 ? (
                                        project.settings.jiraStatuses.map((status) => {
                                            const statusName = typeof status === 'string' ? status : status.name;
                                            return (
                                                <option key={statusName} value={statusName}>
                                                    {statusName}
                                                </option>
                                            );
                                        })
                                    ) : (
                                        <>
                                            <option value="To Do">A Fazer</option>
                                            <option value="In Progress">Em Andamento</option>
                                            <option value="Done">Concluído</option>
                                        </>
                                    )}
                                </select>
                            </div>
                            {task.type === 'Epic' && (
                                <button onClick={() => onAddSubtask(task.id)} className={iconButtonClass} aria-label="Adicionar subtarefa">
                                    <PlusIcon />
                                </button>
                            )}
                            <button onClick={() => onEdit(task)} className={iconButtonClass} aria-label="Editar tarefa">
                                <EditIcon />
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className={`${iconButtonClass} hover:!bg-red-500 hover:!text-white`}
                                aria-label="Excluir tarefa"
                            >
                                <TrashIcon />
                            </button>
                            <button className={iconButtonClass} onClick={handleToggleDetails} aria-label="Expandir detalhes">
                                <ChevronDownIcon className={`transition-transform ${isDetailsOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                    </div>
                    <div
                        className="task-card-compact_line cursor-pointer focus-visible:ring-1 focus-visible:ring-accent"
                        onClick={handleToggleDetails}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                handleToggleDetails();
                            }
                        }}
                    >
                        <p className="task-card-compact_title line-clamp-2 break-words">{task.title}</p>
                    </div>
                    <div className="task-card-compact_line task-card-compact_line--tight text-xs text-text-secondary">
                        {nextStep && (
                            <span className="task-card-compact_next">
                                Próximo: <span>{nextStep}</span>
                            </span>
                        )}
                        <span className="task-card-compact_meta">{task.testCases?.length || 0} casos</span>
                        {task.parentId && <span className="task-card-compact_meta">Depende de {task.parentId}</span>}
                        {task.owner && (
                            <span className="inline-flex items-center gap-1">
                                <span className="task-card-compact_meta">Owner</span>
                                <TeamRoleBadge role={task.owner} />
                            </span>
                        )}
                        {task.assignee && (
                            <span className="inline-flex items-center gap-1">
                                <span className="task-card-compact_meta">QA</span>
                                <TeamRoleBadge role={task.assignee} />
                            </span>
                        )}
                    </div>
                    {testExecutionSummary.total > 0 && (
                        <div className="task-card-compact_line task-card-compact_line--tight text-[11px] text-text-secondary flex flex-wrap gap-3">
                            <span className="inline-flex items-center gap-1 text-green-400 font-semibold">
                                <span className="w-2 h-2 rounded-full bg-green-400" />
                                {testExecutionSummary.passed} aprov.
                            </span>
                            <span className="inline-flex items-center gap-1 text-red-300 font-semibold">
                                <span className="w-2 h-2 rounded-full bg-red-400" />
                                {testExecutionSummary.failed} reprov.
                            </span>
                            {testExecutionSummary.pending > 0 && (
                                <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                                    <span className="w-2 h-2 rounded-full bg-amber-300" />
                                    {testExecutionSummary.pending} pend.
                                </span>
                            )}
                        </div>
                    )}
                    {task.type === 'Tarefa' && testTypeBadges.length > 0 && (
                        <div className="task-card-compact_line task-card-compact_line--tight flex flex-wrap gap-1">
                            {testTypeBadges.map(badge => {
                                const baseClass = 'px-2 py-0.5 rounded-full text-[11px] font-semibold border';
                                const colorClass = badge.status === 'failed'
                                    ? 'bg-red-500/10 text-red-200 border-red-400/40'
                                    : badge.status === 'done'
                                        ? 'bg-green-500/10 text-green-200 border-green-400/40'
                                        : badge.status === 'partial'
                                            ? 'bg-amber-500/10 text-amber-200 border-amber-400/40'
                                            : 'bg-surface border-surface-border text-text-secondary';
                                return (
                                    <span key={badge.type} className={`${baseClass} ${colorClass}`}>
                                        {badge.type} • {badge.label}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                    {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {task.tags.slice(0, 4).map((tag) => (
                                <span key={tag} className={`task-card-compact_tag chip--accent`} style={{ borderColor: getTagColor(tag) }}>
                                    {tag}
                                </span>
                            ))}
                            {task.tags.length > 4 && (
                                <span className="task-card-compact_tag tag-chip-muted">+{task.tags.length - 4}</span>
                            )}
                        </div>
                    )}
                    {isDetailsOpen && (
                        <div className="mt-3 rounded-2xl glass-surface p-3">
                            <div className="flex flex-wrap gap-2">
                                {sectionTabs.map((tab) => {
                                    const isActive = tab.id === activeSection;
                                    return (
                                        <button
                                            key={tab.id}
                                            className={`mini-tab ${isActive ? 'mini-tab--active' : ''}`}
                                            onClick={() => setActiveSection(tab.id)}
                                        >
                                            <span>{tab.label}</span>
                                            {typeof tab.badge === 'number' && tab.badge > 0 && (
                                                <span className="mini-tab__badge">
                                                    {tab.badge}
                                                </span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className="mt-4">{renderSectionContent()}</div>
                        </div>
                    )}
                </div>
            </div>
            {hasChildren && isChildrenOpen && <div className="ml-6 border-l border-surface-border/40 pl-3">{children}</div>}

            <ConfirmDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={() => {
                    onDelete(task.id);
                    setShowDeleteConfirm(false);
                }}
                title="Confirmar exclusão"
                message={`Tem certeza que deseja excluir a tarefa "${task.title}"?${hasChildren ? ` Esta tarefa tem ${task.children.length} subtarefa(s) que também serão excluídas.` : ''}${hasTests ? ` Esta tarefa tem ${task.testCases?.length || 0} caso(s) de teste associado(s).` : ''}`}
                variant="danger"
                confirmText="Excluir"
                cancelText="Cancelar"
            />

            <TestReportModal
                isOpen={showTestReport}
                onClose={() => setShowTestReport(false)}
                task={task}
            />
        </div>
    );
});
