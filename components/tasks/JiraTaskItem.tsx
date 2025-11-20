import React, { useEffect, useMemo, useState } from 'react';
import { JiraTask, BddScenario, TestCaseDetailLevel, TeamRole, Project } from '../../types';
import { Spinner } from '../common/Spinner';
import { TaskTypeIcon, TaskStatusIcon, PlusIcon, EditIcon, TrashIcon, ChevronDownIcon, RefreshIcon } from '../common/Icons';
import { BddScenarioForm, BddScenarioItem } from './BddScenario';
import { TestCaseItem } from './TestCaseItem';
import { TestStrategyCard } from './TestStrategyCard';
import { CommentSection } from '../common/CommentSection';
import { DependencyManager } from '../common/DependencyManager';
import { AttachmentManager } from '../common/AttachmentManager';
import { ChecklistView } from '../common/ChecklistView';
import { EstimationInput } from '../common/EstimationInput';
import { QuickActions } from '../common/QuickActions';
import { TimeTracker } from '../common/TimeTracker';
import { getTagColor } from '../../utils/tagService';
import { updateChecklistItem } from '../../utils/checklistService';
import { getTaskPhase, getPhaseBadgeStyle, getNextStepForTask } from '../../utils/taskPhaseHelper';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { useBeginnerMode } from '../../hooks/useBeginnerMode';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { ensureJiraHexColor, getJiraStatusColor, getJiraStatusTextColor } from '../../utils/jiraStatusColors';

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
    onAddTestCaseFromTemplate?: (templateId: string) => void;
    onAddComment?: (content: string) => void;
    onEditComment?: (commentId: string, content: string) => void;
    onDeleteComment?: (commentId: string) => void;
    project?: Project;
    onUpdateProject?: (project: Project) => void;
    isSelected?: boolean;
    onToggleSelect?: () => void;
    children?: React.ReactNode;
    level: number;
    activeTaskId?: string | null;
    onFocusTask?: (taskId: string | null) => void;
}> = React.memo(({ task, onTestCaseStatusChange, onToggleTestCaseAutomated, onDelete, onGenerateTests, isGenerating, onAddSubtask, onEdit, onGenerateBddScenarios, isGeneratingBdd, onSaveBddScenario, onDeleteBddScenario, onTaskStatusChange, onAddTestCaseFromTemplate, onAddComment, onEditComment, onDeleteComment, project, onUpdateProject, isSelected, onToggleSelect, children, level, activeTaskId, onFocusTask }) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false); // Colapsado por padrão para compactar
    const [isChildrenOpen, setIsChildrenOpen] = useState(false);
    const [editingBddScenario, setEditingBddScenario] = useState<BddScenario | null>(null);
    const [isCreatingBdd, setIsCreatingBdd] = useState(false);
    const [detailLevel, setDetailLevel] = useState<TestCaseDetailLevel>('Padrão');
    const [showDependencies, setShowDependencies] = useState(false);
    const [showAttachments, setShowAttachments] = useState(false);
    const [showEstimation, setShowEstimation] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [activeSection, setActiveSection] = useState<DetailSection>('overview');
    const hasTests = task.testCases && task.testCases.length > 0;
    const hasChildren = task.children && task.children.length > 0;
    const metrics = project ? useProjectMetrics(project) : { newPhases: [] };
    const { isBeginnerMode } = useBeginnerMode();
    const taskPhase = project ? getTaskPhase(task, metrics.newPhases) : null;
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

    const sectionTabs = useMemo(() => {
        const tabs: { id: DetailSection; label: string; badge?: number }[] = [
            { id: 'overview', label: 'Resumo' },
            { id: 'bdd', label: 'Cenários BDD', badge: task.bddScenarios?.length || 0 },
            { id: 'tests', label: 'Testes', badge: task.testCases?.length || 0 }
        ];

        if (project && onUpdateProject) {
            const planningBadge = (task.dependencies?.length || 0) + (task.attachments?.length || 0) + (task.checklist?.length || 0) + (task.estimatedHours ? 1 : 0);
            tabs.push({ id: 'planning', label: 'Planejamento', badge: planningBadge });
        }

        if (onAddComment) {
            tabs.push({ id: 'collaboration', label: 'Colaboração', badge: task.comments?.length || 0 });
        }

        return tabs;
    }, [
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
    }, [isDetailsOpen, sectionTabs, activeSection]);

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
    
    const indentationStyle = { paddingLeft: `${level * 1.5}rem` };

    const iconButtonClass = "h-8 w-8 sm:h-9 sm:w-9 flex items-center justify-center rounded-full hover:bg-surface-hover hover:text-text-primary transition-colors active:scale-95 active:opacity-80";

    const renderOverviewSection = () => (
        <div className="space-y-4">
            {project && onUpdateProject && (
                <div>
                    <QuickActions
                        task={task}
                        project={project}
                        onUpdateProject={onUpdateProject}
                    />
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
                            <p className="text-[11px] uppercase text-accent tracking-wide">Próximo passo sugerido</p>
                            <p className="text-sm font-semibold text-text-primary">{nextStep}</p>
                        </div>
                    )}
                </div>
            )}
            {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {task.tags.map(tag => (
                        <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded-full text-white"
                            style={{ backgroundColor: getTagColor(tag) }}
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );

    const renderBddSection = () => (
        <div className="space-y-4">
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

    const renderTestsSection = () => (
        <div className="space-y-6">
            <div>
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-semibold text-text-primary">Estratégia de Teste</h3>
                    <span className="text-xs text-text-secondary">{task.testStrategy?.length || 0} item(ns)</span>
                </div>
                {isGenerating && <div className="flex justify-center py-2"><Spinner small /></div>}
                {task.testStrategy && task.testStrategy.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {task.testStrategy.map((strategy, i) => <TestStrategyCard key={i} strategy={strategy} />)}
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
                                onClick: () => onAddTestCaseFromTemplate('')
                            } : undefined}
                        />
                    </div>
                )}
            </div>

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

    const renderPlanningSection = () => {
        if (!project || !onUpdateProject) {
            return (
                <p className="text-sm text-text-secondary">Conecte um projeto para gerenciar dependências e planejamento.</p>
            );
        }

        return (
            <div className="space-y-6">
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
        <div className="bg-surface">
            <div style={indentationStyle} className="border-b border-surface-border">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 sm:px-4 py-2 gap-2 w-full">
                    <div className="flex items-center gap-2 sm:gap-3 flex-grow min-w-0 w-full">
                        {onToggleSelect && (
                            <input
                                type="checkbox"
                                checked={isSelected || false}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    onToggleSelect();
                                }}
                                className="w-4 h-4 rounded border-surface-border text-accent focus:ring-accent"
                            />
                        )}
                        {hasChildren ? (
                            <button onClick={() => setIsChildrenOpen(!isChildrenOpen)} className={`${iconButtonClass} flex-shrink-0`}>
                                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isChildrenOpen ? 'rotate-180' : ''}`} />
                            </button>
                        ) : (
                            <div className="w-6 h-6 flex-shrink-0"></div>
                        )}
                          <div className={`flex items-center gap-2 cursor-pointer flex-1 min-w-0 ${isSelected ? 'ring-2 ring-accent rounded' : ''}`} onClick={handleToggleDetails}>
                            <div className="flex-shrink-0">
                                <TaskTypeIcon type={task.type} />
                            </div>
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="flex-shrink-0">
                                    <TaskStatusIcon status={task.status} />
                                </div>
                                <div className="flex-1 min-w-0 space-y-0.5">
                                    <div className="flex items-center gap-2 flex-wrap text-xs text-text-secondary">
                                        <span className="font-semibold truncate">{task.id}</span>
                                        {taskPhase && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${phaseStyle.bg} ${phaseStyle.color} flex items-center gap-1`}>
                                                <span>{phaseStyle.icon}</span>
                                                <span>{taskPhase}</span>
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm sm:text-base text-text-primary font-semibold line-clamp-2 break-words">{task.title}</p>
                                    {isBeginnerMode && nextStep && (
                                        <p className="text-[11px] text-accent/80 mt-1 leading-snug break-words max-w-full">
                                            💡 Próximo: {nextStep}
                                        </p>
                                    )}
                                    {task.tags && task.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {task.tags.slice(0, 3).map(tag => (
                                                <span
                                                    key={tag}
                                                    className="text-xs px-1.5 py-0.5 rounded text-white"
                                                    style={{ backgroundColor: getTagColor(tag) }}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                            {task.tags.length > 3 && (
                                                <span className="text-xs px-1.5 py-0.5 rounded bg-surface text-text-secondary">
                                                    +{task.tags.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1 text-text-secondary self-stretch sm:self-center flex-shrink-0 flex-nowrap justify-end sm:justify-start w-full sm:w-auto" onClick={e => e.stopPropagation()}>
                        {task.owner && task.assignee && (
                            <div className="hidden sm:flex items-center gap-1.5">
                                <TeamRoleBadge role={task.owner} />
                                <span className="text-slate-500 font-bold text-xs">&rarr;</span>
                                <TeamRoleBadge role={task.assignee} />
                            </div>
                        )}
                        <div className="flex items-center gap-1">
                            {currentStatusColor && (
                                <span
                                    className="w-3 h-3 rounded-full border border-white/30 shadow-sm flex-shrink-0"
                                    style={{ backgroundColor: currentStatusColor }}
                                    aria-hidden="true"
                                    title={task.jiraStatus || task.status}
                                ></span>
                            )}
                            <select
                                value={task.jiraStatus || task.status}
                                title={task.jiraStatus || task.status}
                                onChange={(e) => {
                                    const selectedValue = e.target.value;
                                    const jiraStatuses = project?.settings?.jiraStatuses || [];
                                    
                                    // Função auxiliar para mapear status do Jira para status do app
                                    const mapStatus = (jiraStatus: string): 'To Do' | 'In Progress' | 'Done' => {
                                        const status = jiraStatus.toLowerCase();
                                        if (status.includes('done') || status.includes('resolved') || status.includes('closed') || status.includes('concluído')) {
                                            return 'Done';
                                        }
                                        if (status.includes('progress') || status.includes('in progress') || status.includes('andamento')) {
                                            return 'In Progress';
                                        }
                                        return 'To Do';
                                    };
                                    
                                    // Verificar se é um status do Jira (pode ser string ou objeto)
                                    const isJiraStatus = jiraStatuses.some(s => 
                                        typeof s === 'string' ? s === selectedValue : s.name === selectedValue
                                    );
                                    
                                    if (isJiraStatus) {
                                        // É um status do Jira, mapear para status do app
                                        const mappedStatus = mapStatus(selectedValue);
                                        onTaskStatusChange(mappedStatus);
                                        // Atualizar também o jiraStatus se o projeto tiver essa informação
                                        if (project && onUpdateProject) {
                                            const updatedTasks = project.tasks.map(t =>
                                                t.id === task.id
                                                    ? { ...t, status: mappedStatus, jiraStatus: selectedValue }
                                                    : t
                                            );
                                            onUpdateProject({ ...project, tasks: updatedTasks });
                                        }
                                    } else {
                                        // É um status padrão do app
                                        onTaskStatusChange(selectedValue as 'To Do' | 'In Progress' | 'Done');
                                        // Limpar jiraStatus se mudou para status padrão
                                        if (project && onUpdateProject && task.jiraStatus) {
                                            const updatedTasks = project.tasks.map(t =>
                                                t.id === task.id
                                                    ? { ...t, jiraStatus: undefined }
                                                    : t
                                            );
                                            onUpdateProject({ ...project, tasks: updatedTasks });
                                        }
                                    }
                                }}
                                className="!py-1 !px-2 text-[11px] leading-tight h-8 rounded-md border border-surface-border bg-transparent max-w-[150px]"
                                style={{
                                    backgroundColor: currentStatusColor,
                                    color: statusTextColor,
                                    borderColor: currentStatusColor ? `${currentStatusColor}66` : undefined,
                                    boxShadow: currentStatusColor ? `0 0 0 1px ${currentStatusColor}33` : undefined
                                }}
                            >
                                {project?.settings?.jiraStatuses && project.settings.jiraStatuses.length > 0 ? (
                                    // Mostrar status do Jira se disponível
                                    project.settings.jiraStatuses.map(status => {
                                        const statusName = typeof status === 'string' ? status : status.name;
                                        return (
                                            <option key={statusName} value={statusName}>{statusName}</option>
                                        );
                                    })
                                ) : (
                                    // Fallback para status padrão
                                    <>
                                        <option value="To Do">A Fazer</option>
                                        <option value="In Progress">Em Andamento</option>
                                        <option value="Done">Concluído</option>
                                    </>
                                )}
                            </select>
                        </div>
                         {task.type === 'Epic' && (
                            <button onClick={() => onAddSubtask(task.id)} className={iconButtonClass} aria-label="Adicionar subtarefa"><PlusIcon /></button>
                         )}
                        <button onClick={() => onEdit(task)} className={iconButtonClass} aria-label="Editar tarefa"><EditIcon /></button>
                        <button onClick={() => setShowDeleteConfirm(true)} className={`${iconButtonClass} hover:!bg-red-500 hover:!text-white`} aria-label="Excluir tarefa"><TrashIcon /></button>
                          <button className={iconButtonClass} onClick={handleToggleDetails}>
                          <ChevronDownIcon className={`transition-transform ${isDetailsOpen ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>
                {isDetailsOpen && (
                    <div className="p-3 border-t border-surface-border bg-surface-hover">
                        <div className="flex flex-wrap gap-2 mb-4">
                            {sectionTabs.map(tab => {
                                const isActive = tab.id === activeSection;
                                return (
                                    <button
                                        key={tab.id}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium border flex items-center gap-2 transition-colors ${
                                            isActive ? 'bg-accent/20 border-accent text-text-primary' : 'bg-surface border-surface-border text-text-secondary hover:text-text-primary'
                                        }`}
                                        onClick={() => setActiveSection(tab.id)}
                                    >
                                        <span>{tab.label}</span>
                                        {typeof tab.badge === 'number' && tab.badge > 0 && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-accent text-white' : 'bg-surface-hover text-text-secondary'}`}>
                                                {tab.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-4">
                            {renderSectionContent()}
                        </div>
                    </div>
                )}
            </div>
            {hasChildren && isChildrenOpen && children}
            
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
        </div>
    );
});
