import React, { useState } from 'react';
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
}> = React.memo(({ task, onTestCaseStatusChange, onToggleTestCaseAutomated, onDelete, onGenerateTests, isGenerating, onAddSubtask, onEdit, onGenerateBddScenarios, isGeneratingBdd, onSaveBddScenario, onDeleteBddScenario, onTaskStatusChange, onAddTestCaseFromTemplate, onAddComment, onEditComment, onDeleteComment, project, onUpdateProject, isSelected, onToggleSelect, children, level }) => {
    const [isDetailsOpen, setIsDetailsOpen] = useState(false); // Colapsado por padrão para compactar
    const [isChildrenOpen, setIsChildrenOpen] = useState(false);
    const [editingBddScenario, setEditingBddScenario] = useState<BddScenario | null>(null);
    const [isCreatingBdd, setIsCreatingBdd] = useState(false);
    const [detailLevel, setDetailLevel] = useState<TestCaseDetailLevel>('Padrão');
    const [showDependencies, setShowDependencies] = useState(false);
    const [showAttachments, setShowAttachments] = useState(false);
    const [showEstimation, setShowEstimation] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const hasTests = task.testCases && task.testCases.length > 0;
    const hasChildren = task.children && task.children.length > 0;
    const metrics = project ? useProjectMetrics(project) : { newPhases: [] };
    const { isBeginnerMode } = useBeginnerMode();
    const taskPhase = project ? getTaskPhase(task, metrics.newPhases) : null;
    const phaseStyle = getPhaseBadgeStyle(taskPhase);
    const nextStep = getNextStepForTask(task);

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

    const iconButtonClass = "h-8 w-8 flex items-center justify-center rounded-full hover:bg-surface-hover hover:text-text-primary transition-colors active:scale-95 active:opacity-80";

    return (
        <div className="bg-surface">
            <div style={indentationStyle} className={`border-b border-surface-border`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 py-2 gap-2">
                    <div className="flex items-center gap-2 flex-grow min-w-0">
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
                            <button onClick={() => setIsChildrenOpen(!isChildrenOpen)} className={iconButtonClass}>
                                <ChevronDownIcon className={`w-4 h-4 transition-transform ${isChildrenOpen ? 'rotate-180' : ''}`} />
                            </button>
                        ) : (
                            <div className="w-6 h-6 flex-shrink-0"></div>
                        )}
                        <div className={`flex items-center gap-2 cursor-pointer flex-1 ${isSelected ? 'ring-2 ring-accent rounded' : ''}`} onClick={() => setIsDetailsOpen(!isDetailsOpen)}>
                            <TaskTypeIcon type={task.type} />
                             <div className="flex items-center gap-2 min-w-0 flex-1">
                                <TaskStatusIcon status={task.status} />
                                <div className="truncate flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-text-secondary text-xs truncate">{task.id}</span>
                                        {taskPhase && (
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${phaseStyle.bg} ${phaseStyle.color} flex items-center gap-1`}>
                                                <span>{phaseStyle.icon}</span>
                                                <span>{taskPhase}</span>
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-text-primary truncate">{task.title}</p>
                                    {isBeginnerMode && nextStep && (
                                        <p className="text-xs text-accent mt-1">💡 Próximo: {nextStep}</p>
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
                    
                    <div className="flex items-center gap-1.5 text-text-secondary self-end sm:self-center" onClick={e => e.stopPropagation()}>
                        {task.owner && task.assignee && (
                            <div className="hidden sm:flex items-center gap-1.5">
                                <TeamRoleBadge role={task.owner} />
                                <span className="text-slate-500 font-bold text-xs">&rarr;</span>
                                <TeamRoleBadge role={task.assignee} />
                            </div>
                        )}
                        <select
                            value={task.status}
                            onChange={(e) => {
                                onTaskStatusChange(e.target.value as 'To Do' | 'In Progress' | 'Done');
                            }}
                            className="!py-1 !px-2 text-xs h-8"
                        >
                            <option value="To Do">A Fazer</option>
                            <option value="In Progress">Em Andamento</option>
                            <option value="Done">Concluído</option>
                        </select>
                         {task.type === 'Epic' && (
                            <button onClick={() => onAddSubtask(task.id)} className={iconButtonClass} aria-label="Adicionar subtarefa"><PlusIcon /></button>
                         )}
                        <button onClick={() => onEdit(task)} className={iconButtonClass} aria-label="Editar tarefa"><EditIcon /></button>
                        <button onClick={() => setShowDeleteConfirm(true)} className={`${iconButtonClass} hover:!bg-red-500 hover:!text-white`} aria-label="Excluir tarefa"><TrashIcon /></button>
                        <button className={iconButtonClass} onClick={() => setIsDetailsOpen(!isDetailsOpen)}>
                          <ChevronDownIcon className={`transition-transform ${isDetailsOpen ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>
                {isDetailsOpen && (
                    <div className="p-3 border-t border-surface-border bg-surface-hover">
                        {/* Quick Actions */}
                        {project && onUpdateProject && (
                            <div className="mb-4">
                                <QuickActions
                                    task={task}
                                    project={project}
                                    onUpdateProject={onUpdateProject}
                                />
                            </div>
                        )}

                        <div className="text-text-secondary mb-4">
                            {task.description ? (
                                <DescriptionRenderer description={task.description} />
                            ) : (
                                <p className="text-text-secondary italic">Sem descrição</p>
                            )}
                        </div>
                        
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-text-primary">Cenários BDD (Gherkin)</h3>
                            <div className="space-y-3 mt-2">
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

                            <div className="flex flex-wrap items-center gap-2 mt-4">
                                <button onClick={() => onGenerateBddScenarios(task.id)} disabled={isGeneratingBdd || isCreatingBdd || !!editingBddScenario} className="btn btn-secondary !text-sm bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed">
                                    Gerar Cenários com IA
                                </button>
                                 <button onClick={() => setIsCreatingBdd(true)} disabled={isGeneratingBdd || isCreatingBdd || !!editingBddScenario} className="btn btn-secondary !text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                    Adicionar Cenário Manualmente
                                </button>
                            </div>
                            

                            <h3 className="text-lg font-semibold text-text-primary pt-4 mt-6 border-t border-surface-border">Estratégia de Teste</h3>
                            {isGenerating && <div className="flex justify-center py-2"><Spinner small /></div>}
                            {task.testStrategy && task.testStrategy.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            
                            <h3 className="text-lg font-semibold text-text-primary mt-6">Casos de Teste</h3>
                            {isGenerating ? (
                                <div className="space-y-3">
                                    <LoadingSkeleton variant="task" count={3} />
                                    <div className="flex flex-col items-center justify-center py-4">
                                        <Spinner small />
                                        <p className="text-sm text-text-secondary mt-2">Gerando casos de teste com IA...</p>
                                        <p className="text-xs text-text-secondary mt-1">⏱️ Isso pode levar 10-30 segundos</p>
                                    </div>
                                </div>
                            ) : (task.testCases || []).length > 0 ? (
                                <div className="space-y-3">
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
                            )}
                            
                            {!isGenerating && (
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 mt-4">
                                    <button onClick={() => onGenerateTests(task.id, detailLevel)} className="btn btn-primary">
                                        {hasTests ? <RefreshIcon /> : <PlusIcon />}
                                        <span>{hasTests ? 'Regerar com IA' : 'Gerar com IA'}</span>
                                    </button>
                                    <div className="relative flex-1">
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

                            {/* Dependências */}
                            {project && onUpdateProject && (
                                <div className="mt-6 pt-6 border-t border-surface-border">
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
                            )}

                            {/* Anexos */}
                            {project && onUpdateProject && (
                                <div className="mt-6 pt-6 border-t border-surface-border">
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
                            )}

                            {/* Estimativas */}
                            {project && onUpdateProject && (
                                <div className="mt-6 pt-6 border-t border-surface-border">
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
                            )}

                            {/* Checklist */}
                            {task.checklist && task.checklist.length > 0 && project && onUpdateProject && (
                                <div className="mt-6 pt-6 border-t border-surface-border">
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

                            {/* Comentários */}
                            {onAddComment && (
                                <div className="mt-6 pt-6 border-t border-surface-border">
                                    <CommentSection
                                        comments={task.comments || []}
                                        onAddComment={(content) => onAddComment(content)}
                                        onEditComment={(commentId, content) => onEditComment?.(commentId, content)}
                                        onDeleteComment={(commentId) => onDeleteComment?.(commentId)}
                                    />
                                </div>
                            )}
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
