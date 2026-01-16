import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { JiraTask, BddScenario, TestCaseDetailLevel, TeamRole, Project, TestCase } from '../../types';
import { Spinner } from '../common/Spinner';
import { TaskTypeIcon, TaskStatusIcon, StartTestIcon, CompleteTestIcon, ToDoTestIcon, PlusIcon, EditIcon, TrashIcon, ChevronDownIcon, RefreshIcon } from '../common/Icons';
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
import { getTagColor, getTaskVersions } from '../../utils/tagService';
import { VersionBadges } from './VersionBadge';
import { updateChecklistItem } from '../../utils/checklistService';
import { getTaskPhase, getPhaseBadgeStyle, getNextStepForTask } from '../../utils/taskPhaseHelper';
import { getDisplayStatus } from '../../utils/taskHelpers';
import { useBeginnerMode } from '../../hooks/useBeginnerMode';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { ensureJiraHexColor, getJiraStatusColor, getJiraStatusTextColor } from '../../utils/jiraStatusColors';
import { parseJiraDescriptionHTML } from '../../utils/jiraDescriptionParser';
import { getJiraConfig } from '../../services/jiraService';
import { TestTypeBadge } from '../common/TestTypeBadge';
import { FileViewer } from '../common/FileViewer';
import { canViewInBrowser, detectFileType } from '../../services/fileViewerService';

// Componente para renderizar descrição com formatação rica do Jira
const DescriptionRenderer: React.FC<{ 
    description: string | any;
    jiraAttachments?: Array<{ id: string; filename: string; size: number; created: string; author: string }>;
}> = ({ description, jiraAttachments }) => {
    // Garantir que description existe
    if (!description) {
        return <p className="text-base-content/70 italic">Sem descrição</p>;
    }
    
    // Obter configuração do Jira para processar imagens
    const jiraConfig = getJiraConfig();
    const jiraUrl = jiraConfig?.url;
    
    // Se description já é HTML (string com tags), usar diretamente
    // Caso contrário, converter usando parseJiraDescriptionHTML
    let htmlContent = '';
    
    if (typeof description === 'string') {
        // Se já contém HTML, usar diretamente (já foi processado)
        if (description.includes('<')) {
            htmlContent = description;
            // Se ainda tem nomes de arquivo e temos URL/anexos, reprocessar imagens
            if (jiraUrl && jiraAttachments && jiraAttachments.length > 0 && 
                /<img[^>]*src=["'][^"']*\.(png|jpg|jpeg|gif|webp)["']/i.test(htmlContent)) {
                // Verificar se há imagens com apenas nome de arquivo (não URL completa)
                const hasFileNames = /<img[^>]*src=["'](?!https?:\/\/|data:)([^"']+)["']/i.test(htmlContent);
                if (hasFileNames) {
                    htmlContent = parseJiraDescriptionHTML(description, jiraUrl, jiraAttachments);
                }
            }
        } else {
            // String simples, converter para HTML
            htmlContent = parseJiraDescriptionHTML(description, jiraUrl, jiraAttachments);
        }
    } else {
        // Objeto ADF ou outro formato, converter para HTML
        htmlContent = parseJiraDescriptionHTML(description, jiraUrl, jiraAttachments);
    }
    
    // Se não há conteúdo após processamento, mostrar mensagem
    if (!htmlContent || htmlContent.trim() === '') {
        return <p className="text-base-content/70 italic">Sem descrição</p>;
    }
    
    return (
        <div 
            className="jira-rich-content prose prose-sm max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
    );
};

export type TaskWithChildren = JiraTask & { children: TaskWithChildren[] };

type DetailSection = 'overview' | 'bdd' | 'tests' | 'planning' | 'collaboration';
type TestSubSection = 'strategy' | 'test-cases';

const normalizeStatusName = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toLowerCase();

const TeamRoleBadge: React.FC<{ role: TeamRole }> = ({ role }) => {
    const roleStyles: Record<TeamRole, string> = {
        Product: 'badge-secondary badge-outline',
        QA: 'badge-primary badge-outline',
        Dev: 'badge-info badge-outline',
    };
    const styles = roleStyles[role] ?? 'badge-ghost badge-outline';

    return (
        <span className={`badge badge-sm ${styles}`}>
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
    onGenerateAll?: (taskId: string, detailLevel?: TestCaseDetailLevel) => Promise<void>;
    isGeneratingAll?: boolean;
    onSyncToJira?: (taskId: string) => Promise<void>;
    isSyncing?: boolean;
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
    onOpenModal?: (task: JiraTask) => void;
}> = React.memo(({ task, onTestCaseStatusChange, onToggleTestCaseAutomated, onExecutedStrategyChange, onTaskToolsChange, onTestCaseToolsChange, onStrategyExecutedChange, onStrategyToolsChange, onDelete, onGenerateTests, isGenerating, onAddSubtask, onEdit, onGenerateBddScenarios, isGeneratingBdd, onGenerateAll, isGeneratingAll, onSyncToJira, isSyncing, onSaveBddScenario, onDeleteBddScenario, onTaskStatusChange, onAddTestCaseFromTemplate, onAddComment, onEditComment, onDeleteComment, onEditTestCase, onDeleteTestCase, project, onUpdateProject, isSelected, onToggleSelect, children, level, activeTaskId, onFocusTask, onOpenModal }) => {
    const reduceMotion = useReducedMotion();
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
    const [viewingJiraAttachment, setViewingJiraAttachment] = useState<{ id: string; filename: string; url: string; mimeType: string; content?: string } | null>(null);
    const [loadingJiraAttachment, setLoadingJiraAttachment] = useState(false);
    const [activeSection, setActiveSection] = useState<DetailSection>('overview');
    const [activeTestSubSection, setActiveTestSubSection] = useState<TestSubSection>('strategy');
    const hasTests = task.testCases && task.testCases.length > 0;
    const hasChildren = task.children && task.children.length > 0;
    const { isBeginnerMode } = useBeginnerMode();
    const taskPhase = getTaskPhase(task);
    const phaseStyle = getPhaseBadgeStyle(taskPhase);
    const nextStep = getNextStepForTask(task);
    const safeDomId = useMemo(() => task.id.replace(/[^a-zA-Z0-9_-]/g, '_'), [task.id]);
    const detailsRegionId = `task-details-${safeDomId}`;
    const childrenRegionId = `task-children-${safeDomId}`;
    // Cores customizadas para tipos de tarefa
    const taskTypeColors = {
        Epic: '#451e44',
        História: '#009764',
        Bug: '#e50006',
        Tarefa: '#193ab7',
    };

    const typeAccent = useMemo(() => {
        const color = taskTypeColors[task.type as keyof typeof taskTypeColors];
        if (color) {
            return { backgroundColor: color };
        }
        return { backgroundColor: '#6b7280' }; // cinza padrão
    }, [task.type]);

    const typeBadgeStyle = useMemo(() => {
        const color = taskTypeColors[task.type as keyof typeof taskTypeColors];
        if (color) {
            return { backgroundColor: color, color: '#ffffff', borderColor: color };
        }
        return {};
    }, [task.type]);
    const jiraStatusPalette = project?.settings?.jiraStatuses;
    const currentStatusColor = useMemo(() => {
        const statusName = getDisplayStatus(task);
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
            const fallbackType = (task.testStrategy ?? [])[0]?.testType || 'Testes Gerais';
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
            { id: 'overview', label: 'Resumo' }
        ];

        // Adicionar aba "Cenários BDD" para tipos "Tarefa" e "Bug"
        if (task.type === 'Tarefa' || task.type === 'Bug') {
            tabs.push({ id: 'bdd', label: 'Cenários BDD', badge: task.bddScenarios?.length || 0 });
        }

        // Adicionar aba "Testes" para tipos "Tarefa" e "Bug"
        if (task.type === 'Tarefa' || task.type === 'Bug') {
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
        // Se estiver na aba "tests" ou "bdd" e não for tipo "Tarefa" ou "Bug", redirecionar para "overview"
        if ((activeSection === 'tests' || activeSection === 'bdd') && task.type !== 'Tarefa' && task.type !== 'Bug') {
            setActiveSection('overview');
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

    const handleViewJiraAttachment = async (attachment: { id: string; filename: string; url: string; mimeType: string }) => {
        setLoadingJiraAttachment(true);
        try {
            // Fazer fetch do anexo através do proxy do Jira se necessário
            const jiraConfig = getJiraConfig();
            if (!jiraConfig) {
                // Se não há config, tentar abrir diretamente
                window.open(attachment.url, '_blank');
                return;
            }

            // Tentar fazer fetch do anexo
            const endpoint = `/secure/attachment/${attachment.id}/${encodeURIComponent(attachment.filename)}`;
            const response = await fetch('/api/jira-proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: jiraConfig.url,
                    email: jiraConfig.email,
                    apiToken: jiraConfig.apiToken,
                    endpoint,
                    method: 'GET',
                }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                    setViewingJiraAttachment({
                        ...attachment,
                        content: reader.result as string
                    });
                    setLoadingJiraAttachment(false);
                };
                reader.readAsDataURL(blob);
            } else {
                // Se falhar, abrir em nova aba
                window.open(attachment.url, '_blank');
                setLoadingJiraAttachment(false);
            }
        } catch (error) {
            // Em caso de erro, abrir em nova aba como fallback
            window.open(attachment.url, '_blank');
            setLoadingJiraAttachment(false);
        }
    };
    
    const indentationStyle = { paddingLeft: `${level * 1.2}rem` };

    // Touch targets mínimos de 44x44px para acessibilidade (WCAG)
    const iconButtonClass = 'btn btn-ghost btn-circle btn-sm min-h-[44px] min-w-[44px] h-11 w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30';
    const iconButtonSmallClass = 'btn btn-ghost btn-circle btn-sm min-h-[44px] min-w-[44px] h-11 w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30';

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
            
            {/* Botão para Gerar Registro de Testes - para tipos "Tarefa" e "Bug" */}
            {(task.type === 'Tarefa' || task.type === 'Bug') && (task.testCases?.length > 0 || (task.testStrategy?.length ?? 0) > 0) && (
                <div className="flex justify-end">
                    <button
                        onClick={() => setShowTestReport(true)}
                        className="btn btn-outline btn-sm flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>Gerar Registro de Testes</span>
                    </button>
                </div>
            )}
            <div className="text-base-content/80">
                {task.description ? (
                    <DescriptionRenderer 
                        description={task.description} 
                        jiraAttachments={task.jiraAttachments}
                    />
                ) : (
                    <p className="text-base-content/70 italic">Sem descrição</p>
                )}
            </div>
            {(task.priority || task.severity || task.owner || task.assignee || nextStep) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {task.owner && (
                        <div className="p-3 bg-base-100 border border-base-300 rounded-lg">
                            <p className="text-[11px] uppercase text-base-content/60 tracking-wide">Owner</p>
                            <p className="text-sm font-semibold text-base-content">{task.owner}</p>
                        </div>
                    )}
                    {task.assignee && (
                        <div className="p-3 bg-base-100 border border-base-300 rounded-lg">
                            <p className="text-[11px] uppercase text-base-content/60 tracking-wide">Responsável</p>
                            <p className="text-sm font-semibold text-base-content">{task.assignee}</p>
                        </div>
                    )}
                    {task.priority && (
                        <div className="p-3 bg-base-100 border border-base-300 rounded-lg">
                            <p className="text-[11px] uppercase text-base-content/60 tracking-wide">Prioridade</p>
                            <p className="text-sm font-semibold text-base-content">{task.priority}</p>
                        </div>
                    )}
                    {task.severity && (
                        <div className="p-3 bg-base-100 border border-base-300 rounded-lg">
                            <p className="text-[11px] uppercase text-base-content/60 tracking-wide">Severidade</p>
                            <p className="text-sm font-semibold text-base-content">{task.severity}</p>
                        </div>
                    )}
                      {nextStep && (
                          <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                              <p className="text-[0.65rem] uppercase text-primary tracking-wide">Próximo passo</p>
                              <p className="text-[0.82rem] font-semibold text-base-content line-clamp-2">{nextStep}</p>
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
                                <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1.5">Versão do Projeto</p>
                                <VersionBadges versions={versions} size="md" />
                            </div>
                        )}
                        {otherTags.length > 0 && (
                            <div>
                                {versions.length > 0 && (
                                    <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1.5">Tags</p>
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
            
            {/* Seção de Campos do Jira */}
            {(() => {
                const hasJiraFields = task.dueDate || task.timeTracking || task.components || task.fixVersions || 
                    task.environment || task.reporter || task.watchers || task.issueLinks || 
                    task.jiraAttachments;
                
                if (!hasJiraFields || !/^[A-Z]+-\d+$/.test(task.id)) {
                    return null;
                }

                return (
                    <div className="mt-6 space-y-4">
                        <h3 className="text-lg font-semibold text-base-content flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Campos do Jira
                        </h3>
                        
                        {/* Informações Básicas */}
                        {(task.reporter || task.dueDate || task.environment) && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-base-content/70">📋 Informações Básicas</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {task.reporter && (
                                        <div className="p-3 bg-base-100 border border-base-300 rounded-lg">
                                            <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">Reporter</p>
                                            <p className="text-sm font-semibold text-base-content">{task.reporter.displayName}</p>
                                            {task.reporter.emailAddress && (
                                                <p className="text-xs text-base-content/70 mt-1">{task.reporter.emailAddress}</p>
                                            )}
                                        </div>
                                    )}
                                    {task.dueDate && (
                                        <div className="p-3 bg-base-100 border border-base-300 rounded-lg">
                                            <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">Due Date</p>
                                            <p className="text-sm font-semibold text-base-content">
                                                {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    )}
                                    {task.environment && (
                                        <div className="p-3 bg-base-100 border border-base-300 rounded-lg sm:col-span-2">
                                            <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">Environment</p>
                                            <p className="text-sm text-base-content">{task.environment}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Time Tracking */}
                        {task.timeTracking && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-base-content/70">⏱️ Time Tracking</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {task.timeTracking.originalEstimate && (
                                        <div className="p-3 bg-base-100 border border-base-300 rounded-lg">
                                            <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">Original Estimate</p>
                                            <p className="text-sm font-semibold text-base-content">{task.timeTracking.originalEstimate}</p>
                                        </div>
                                    )}
                                    {task.timeTracking.remainingEstimate && (
                                        <div className="p-3 bg-base-100 border border-base-300 rounded-lg">
                                            <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">Remaining Estimate</p>
                                            <p className="text-sm font-semibold text-base-content">{task.timeTracking.remainingEstimate}</p>
                                        </div>
                                    )}
                                    {task.timeTracking.timeSpent && (
                                        <div className="p-3 bg-base-100 border border-base-300 rounded-lg">
                                            <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">Time Spent</p>
                                            <p className="text-sm font-semibold text-base-content">{task.timeTracking.timeSpent}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Organização */}
                        {(task.components || task.fixVersions) && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-base-content/70">🧩 Organização</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {task.components && task.components.length > 0 && (
                                        <div className="p-3 bg-base-100 border border-base-300 rounded-lg">
                                            <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-2">Components</p>
                                            <div className="flex flex-wrap gap-2">
                                                {task.components.map((comp) => (
                                                    <span key={comp.id} className="text-xs px-2 py-1 bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded">
                                                        {comp.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {task.fixVersions && task.fixVersions.length > 0 && (
                                        <div className="p-3 bg-base-100 border border-base-300 rounded-lg">
                                            <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-2">Fix Versions</p>
                                            <div className="flex flex-wrap gap-2">
                                                {task.fixVersions.map((version) => (
                                                    <span key={version.id} className="text-xs px-2 py-1 bg-green-500/20 text-green-700 dark:text-green-400 rounded">
                                                        {version.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Relacionamentos */}
                        {(task.issueLinks || task.watchers) && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-base-content/70">🔗 Relacionamentos</h4>
                                {task.issueLinks && task.issueLinks.length > 0 && (
                                    <div className="p-3 bg-base-100 border border-base-300 rounded-lg">
                                        <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-2">Issue Links</p>
                                        <div className="space-y-1">
                                            {task.issueLinks.map((link) => (
                                                <div key={link.id} className="text-sm text-base-content">
                                                    <span className="text-base-content/70">{link.type}</span> {link.relatedKey}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {task.watchers && (
                                    <div className="p-3 bg-base-100 border border-base-300 rounded-lg">
                                        <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">Watchers</p>
                                        <p className="text-sm font-semibold text-base-content">
                                            {task.watchers.watchCount} observador(es)
                                            {task.watchers.isWatching && ' • Você está observando'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Anexos do Jira */}
                        {task.jiraAttachments && task.jiraAttachments.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-base-content/70">📎 Anexos do Jira</h4>
                                <div className="p-3 bg-base-100 border border-base-300 rounded-lg">
                                    <div className="space-y-2">
                                        {task.jiraAttachments.map((att) => {
                                            const jiraConfig = getJiraConfig();
                                            const jiraUrl = jiraConfig?.url;
                                            const attachmentUrl = jiraUrl ? `${jiraUrl}/secure/attachment/${att.id}/${encodeURIComponent(att.filename)}` : null;
                                            const fileType = detectFileType(att.filename, '');
                                            const canView = attachmentUrl && canViewInBrowser(fileType);
                                            
                                            return (
                                                <div key={att.id} className="flex items-center justify-between text-sm p-2 hover:bg-base-200 rounded">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <span className="text-base-content truncate">{att.filename}</span>
                                                        <span className="text-base-content/70 text-xs whitespace-nowrap">
                                                            {(att.size / 1024).toFixed(2)} KB
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {canView && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (attachmentUrl) {
                                                                        handleViewJiraAttachment({
                                                                            id: att.id,
                                                                            filename: att.filename,
                                                                            url: attachmentUrl,
                                                                            mimeType: fileType === 'pdf' ? 'application/pdf' : 
                                                                                     fileType === 'image' ? 'image/*' : 
                                                                                     fileType === 'text' ? 'text/plain' :
                                                                                     fileType === 'json' ? 'application/json' :
                                                                                     fileType === 'csv' ? 'text/csv' : 'application/octet-stream'
                                                                        });
                                                                    }
                                                                }}
                                                                disabled={loadingJiraAttachment}
                                                                className="btn btn-outline btn-xs rounded-full disabled:opacity-50"
                                                                title="Visualizar"
                                                            >
                                                                {loadingJiraAttachment ? '⏳' : '👁️ Ver'}
                                                            </button>
                                                        )}
                                                        {attachmentUrl && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (attachmentUrl) {
                                                                        window.open(attachmentUrl, '_blank');
                                                                    }
                                                                }}
                                                                className="btn btn-outline btn-xs rounded-full"
                                                                title="Download"
                                                            >
                                                                ⬇️
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );

    const renderBddSection = () => {
        // Retornar null se não for tipo "Tarefa" ou "Bug" - não deve ser acessado, mas por segurança
        if (task.type !== 'Tarefa' && task.type !== 'Bug') {
            return null;
        }

        return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-base-content">Cenários BDD (Gherkin)</h3>
                <span className="text-xs text-base-content/70">{task.bddScenarios?.length || 0} cenário(s)</span>
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
    };

    const renderTestsSection = () => {
        // Retornar null se não for tipo "Tarefa" ou "Bug" - não deve ser acessado, mas por segurança
        if (task.type !== 'Tarefa' && task.type !== 'Bug') {
            return null;
        }

        const canHaveTestCases = task.type === 'Tarefa' || task.type === 'Bug';
        
        return (
            <div className="space-y-4">
                {/* Sub-abas de Testes */}
                <div className="tabs tabs-boxed bg-base-200 w-fit" role="tablist" aria-label="Sub-abas de testes">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTestSubSection === 'strategy'}
                        onClick={() => setActiveTestSubSection('strategy')}
                        className={`tab ${activeTestSubSection === 'strategy' ? 'tab-active' : ''}`}
                    >
                        Estratégia
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTestSubSection === 'test-cases'}
                        onClick={() => setActiveTestSubSection('test-cases')}
                        className={`tab ${activeTestSubSection === 'test-cases' ? 'tab-active' : ''}`}
                    >
                        Casos de teste
                        {task.testCases?.length ? (
                            <span className="badge badge-primary badge-sm ml-2">
                                {task.testCases.length}
                            </span>
                        ) : null}
                    </button>
                </div>

                {/* Conteúdo da sub-aba "Estratégia de Teste" */}
                {activeTestSubSection === 'strategy' && (
                    <div>
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-lg font-semibold text-base-content">Estratégia de Teste</h3>
                            <span className="text-xs text-base-content/70">{task.testStrategy?.length || 0} item(ns)</span>
                        </div>
                        {isGenerating && <div className="flex justify-center py-2"><Spinner small /></div>}
                        {(task.testStrategy?.length ?? 0) > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                {(task.testStrategy ?? []).map((strategy, i) => {
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
                )}

                {/* Conteúdo da sub-aba "Casos de Teste" */}
                {activeTestSubSection === 'test-cases' && canHaveTestCases && (
                    <div>
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-lg font-semibold text-base-content">Casos de Teste</h3>
                            <span className="text-xs text-base-content/70">{task.testCases?.length || 0} caso(s)</span>
                        </div>
                        {isGenerating ? (
                            <div className="space-y-3 mt-4">
                                <LoadingSkeleton variant="task" count={3} />
                                <div className="flex flex-col items-center justify-center py-4">
                                    <Spinner small />
                                    <p className="mt-2 text-sm text-base-content/70">Gerando casos de teste com IA...</p>
                                    <p className="mt-1 text-xs text-base-content/70">⏱️ Isso pode levar 10-30 segundos</p>
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
                )}

                {/* Ferramentas Utilizadas na Task */}
                {onTaskToolsChange && (
                    <div className="mt-4 p-3 bg-base-100 rounded-[var(--rounded-box)] border border-base-300">
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
                        <button onClick={() => onGenerateTests(task.id, detailLevel)} className="btn btn-primary btn-sm">
                            {hasTests ? <RefreshIcon /> : <PlusIcon />}
                            <span>{hasTests ? 'Regerar com IA' : 'Gerar com IA'}</span>
                        </button>
                        <div className="flex-1">
                            <label htmlFor={`detail-level-${task.id}`} className="block text-sm text-base-content/70 mb-1">Nível de Detalhe</label>
                            <select
                                id={`detail-level-${task.id}`}
                                value={detailLevel}
                                onChange={(e) => setDetailLevel(e.target.value as TestCaseDetailLevel)}
                                className="select select-bordered select-sm w-full"
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
                <p className="text-sm text-base-content/70">Conecte um projeto para gerenciar dependências e planejamento.</p>
            );
        }

        return (
            <div className="space-y-4">
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-base-content">Dependências</h3>
                        <button
                            onClick={() => setShowDependencies(!showDependencies)}
                            className="text-sm text-primary hover:opacity-80"
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
                        <h3 className="text-lg font-semibold text-base-content">Anexos</h3>
                        <button
                            onClick={() => setShowAttachments(!showAttachments)}
                            className="text-sm text-primary hover:opacity-80"
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
                        <h3 className="text-lg font-semibold text-base-content">Estimativas</h3>
                        <button
                            onClick={() => setShowEstimation(!showEstimation)}
                            className="text-sm text-primary hover:opacity-80"
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
                        <div className="p-3 bg-base-100 border border-base-300 rounded-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-base-content/70">Estimado:</span>
                                <span className="font-semibold text-base-content">{task.estimatedHours}h</span>
                            </div>
                            {task.actualHours && (
                                <>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-base-content/70">Real:</span>
                                        <span className={`font-semibold ${
                                            task.actualHours <= task.estimatedHours ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'
                                        }`}>
                                            {task.actualHours}h
                                        </span>
                                    </div>
                                    <div className="mt-2 text-xs text-base-content/70">
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
                        <h3 className="text-lg font-semibold text-base-content mb-3">Checklist</h3>
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
            return <p className="text-sm text-base-content/70">Comentários indisponíveis para esta tarefa.</p>;
        }

        return (
            <div>
                <h3 className="text-lg font-semibold text-base-content mb-3">Comentários</h3>
                <CommentSection
                    comments={task.comments || []}
                    onAddComment={(content) => onAddComment(content)}
                    onEditComment={onEditComment}
                    onDeleteComment={onDeleteComment}
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

    const handleCardClick = (e: React.MouseEvent) => {
        // Não abrir modal se clicar em botões, inputs ou links
        const target = e.target as HTMLElement;
        if (
            target.closest('button') ||
            target.closest('input') ||
            target.closest('select') ||
            target.closest('a') ||
            target.closest('[role="button"]')
        ) {
            return;
        }
        
        if (onOpenModal) {
            onOpenModal(task);
        }
    };

    const handleCardKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (onOpenModal) {
                onOpenModal(task);
            }
        }
    };

    return (
        <div className="relative" data-task-id={task.id}>
            <div style={indentationStyle} className="py-1">
                <div
                    className={[
                        'relative overflow-hidden rounded-[var(--rounded-box)] border border-base-300 bg-base-100',
                        'transition-all duration-200 ease-in-out',
                        activeTaskId === task.id ? 'ring-2 ring-primary/40 shadow-lg' : '',
                        isSelected ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/30' : '',
                        onOpenModal ? 'cursor-pointer hover:bg-base-200/80 hover:shadow-lg hover:scale-[1.01] hover:border-primary/60 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2' : '',
                    ].join(' ')}
                    onClick={onOpenModal ? handleCardClick : undefined}
                    onKeyDown={onOpenModal ? handleCardKeyDown : undefined}
                    role={onOpenModal ? 'button' : undefined}
                    tabIndex={onOpenModal ? 0 : undefined}
                    aria-label={onOpenModal ? `Abrir detalhes da tarefa ${task.id}: ${task.title}` : undefined}
                >
                    <div aria-hidden="true" className="absolute left-0 top-0 h-full w-1" style={typeAccent} />

                    <div className="p-3 md:p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
                            {/* Seleção + ícones */}
                            <div className="flex items-start gap-3 md:items-center">
                                {onToggleSelect && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleSelect();
                                        }}
                                        className={`
                                            relative flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all duration-300
                                            ${isSelected 
                                                ? 'border-green-500 bg-green-500 shadow-lg shadow-green-500/50' 
                                                : 'border-base-content/30 bg-base-100/50 hover:border-base-content/50 hover:bg-base-100/80'
                                            }
                                        `}
                                        aria-label={`Selecionar tarefa ${task.id}`}
                                        aria-pressed={isSelected || false}
                                    >
                                        {/* Checkmark animation */}
                                        <svg
                                            className={`
                                                h-3 w-3 text-white transition-all duration-300
                                                ${isSelected ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}
                                            `}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                            strokeWidth={3}
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>

                                        {/* Ripple effect on check */}
                                        {isSelected && (
                                            <span className="absolute inset-0 animate-ping rounded border-2 border-green-500 opacity-75" />
                                        )}
                                    </button>
                                )}

                                {hasChildren ? (
                                    <div className="relative shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => setIsChildrenOpen(!isChildrenOpen)}
                                            className={`
                                                flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-base-300/50 bg-base-100/50 
                                                transition-all duration-300 hover:bg-base-100/80 hover:border-base-300
                                                ${isChildrenOpen ? 'bg-base-100/80' : ''}
                                            `}
                                            aria-label={isChildrenOpen ? 'Recolher subtarefas' : 'Expandir subtarefas'}
                                            aria-expanded={isChildrenOpen}
                                            aria-controls={childrenRegionId}
                                        >
                                            <ChevronDownIcon
                                                className={`
                                                    h-4 w-4 text-base-content/70 transition-transform duration-300
                                                    ${isChildrenOpen ? 'rotate-180' : ''}
                                                `}
                                            />
                                        </button>
                                        {/* Badge de contagem moderno */}
                                        <div className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-orange-500 px-1.5 shadow-lg shadow-orange-500/50 ring-2 ring-base-100">
                                            <span className="text-[10px] font-bold text-white">{task.children.length}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="w-8" aria-hidden="true" />
                                )}

                                <div className="flex items-center gap-2">
                                    {task.status === 'In Progress' ? (
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-warning/20 bg-warning/10 backdrop-blur-sm transition-all duration-300 hover:bg-warning/20">
                                            <StartTestIcon />
                                        </div>
                                    ) : task.status === 'Done' ? (
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-success/20 bg-success/10 backdrop-blur-sm transition-all duration-300 hover:bg-success/20">
                                            <CompleteTestIcon />
                                        </div>
                                    ) : task.status === 'To Do' ? (
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-error/20 bg-error/10 backdrop-blur-sm transition-all duration-300 hover:bg-error/20">
                                            <ToDoTestIcon />
                                        </div>
                                    ) : (
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-base-300/50 bg-base-100/50 backdrop-blur-sm transition-all duration-300 hover:bg-base-100/80">
                                            <TaskStatusIcon status={task.status} />
                                        </div>
                                    )}
                                    <TaskTypeIcon type={task.type} />
                                </div>
                            </div>

                            {/* Conteúdo */}
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="font-mono text-xs text-base-content/60">{task.id}</span>
                                    {(() => {
                                        const versions = getTaskVersions(task);
                                        return versions.length > 0 ? (
                                            <VersionBadges versions={versions} size="sm" />
                                        ) : null;
                                    })()}
                                    <span className="badge badge-sm text-white border-0" style={typeBadgeStyle}>{task.type}</span>
                                    {task.severity && <span className="badge badge-sm badge-outline">{task.severity}</span>}
                                    {task.priority && <span className="badge badge-sm badge-outline">{task.priority}</span>}
                                    {taskPhase && (
                                        <span className={`badge badge-sm ${phaseStyle.bg} ${phaseStyle.color} flex items-center gap-1`}>
                                            <span aria-hidden="true">{phaseStyle.icon}</span>
                                            {taskPhase}
                                        </span>
                                    )}
                                </div>

                                {onOpenModal ? (
                                    <div className="mt-2 group-hover:text-primary transition-colors">
                                        <p className="text-sm md:text-base font-semibold leading-snug text-base-content line-clamp-2 break-words">
                                            {task.title}
                                        </p>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={handleToggleDetails}
                                        className="mt-2 w-full text-left rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                                        aria-expanded={isDetailsOpen}
                                        aria-controls={detailsRegionId}
                                    >
                                        <p className="text-sm md:text-base font-semibold leading-snug text-base-content line-clamp-2 break-words">
                                            {task.title}
                                        </p>
                                    </button>
                                )}

                                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-base-content/70">
                                    {nextStep && (
                                        <span className="inline-flex items-center gap-1">
                                            <span className="text-base-content/50">Próximo:</span>
                                            <span className="font-medium text-base-content line-clamp-1">{nextStep}</span>
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1">
                                        <span className="text-base-content/50">Casos:</span>
                                        <span className="font-medium text-base-content">{task.testCases?.length || 0}</span>
                                    </span>
                                    {task.parentId && (
                                        <span className="inline-flex items-center gap-1">
                                            <span className="text-base-content/50">Depende de</span>
                                            <span className="font-medium text-base-content">{task.parentId}</span>
                                        </span>
                                    )}
                                    {task.owner && (
                                        <span className="inline-flex items-center gap-2">
                                            <span className="text-base-content/50">Owner</span>
                                            <TeamRoleBadge role={task.owner} />
                                        </span>
                                    )}
                                    {task.assignee && (
                                        <span className="inline-flex items-center gap-2">
                                            <span className="text-base-content/50">QA</span>
                                            <TeamRoleBadge role={task.assignee} />
                                        </span>
                                    )}
                                </div>

                                {testExecutionSummary.total > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-3 text-xs">
                                        <span className="inline-flex items-center gap-1 font-semibold text-success">
                                            <span className="w-2 h-2 rounded-full bg-success" aria-hidden="true" />
                                            {testExecutionSummary.passed} aprov.
                                        </span>
                                        <span className="inline-flex items-center gap-1 font-semibold text-error">
                                            <span className="w-2 h-2 rounded-full bg-error" aria-hidden="true" />
                                            {testExecutionSummary.failed} reprov.
                                        </span>
                                        {testExecutionSummary.pending > 0 && (
                                            <span className="inline-flex items-center gap-1 font-semibold text-yellow-700 dark:text-yellow-500">
                                                <span className="w-2 h-2 rounded-full bg-yellow-600 dark:bg-yellow-500" aria-hidden="true" />
                                                {testExecutionSummary.pending} pend.
                                            </span>
                                        )}
                                    </div>
                                )}

                                {(task.type === 'Tarefa' || task.type === 'Bug') && testTypeBadges.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                        {testTypeBadges.map(badge => (
                                            <TestTypeBadge 
                                                key={badge.type} 
                                                testType={badge.type} 
                                                status={badge.status}
                                                label={badge.label}
                                                size="sm"
                                            />
                                        ))}
                                    </div>
                                )}

                                {task.tags && task.tags.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        {task.tags.slice(0, 4).map((tag) => (
                                            <span
                                                key={tag}
                                                className="badge badge-sm text-white border-none"
                                                style={{ backgroundColor: getTagColor(tag) }}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                        {task.tags.length > 4 && (
                                            <span className="badge badge-sm badge-ghost">
                                                +{task.tags.length - 4}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Status + ações */}
                            <div className="flex flex-col gap-2 md:items-end">
                                <div className="w-full md:w-auto" onClick={(e) => e.stopPropagation()}>
                                    <select
                                        className="select select-bordered select-sm w-full md:w-48"
                                        aria-label={`Alterar status da tarefa ${task.id}`}
                                        value={getDisplayStatus(task)}
                                        title={getDisplayStatus(task)}
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

                                <div className="flex flex-wrap gap-2 md:flex-nowrap md:gap-1" onClick={(e) => e.stopPropagation()}>
                                    {task.type === 'Epic' && (
                                        <button
                                            type="button"
                                            onClick={() => onAddSubtask(task.id)}
                                            className={iconButtonClass}
                                            aria-label="Adicionar subtarefa"
                                            title="Adicionar subtarefa"
                                        >
                                            <PlusIcon />
                                        </button>
                                    )}
                                    {onSyncToJira && /^[A-Z]+-\d+$/.test(task.id) && (
                                        <button
                                            type="button"
                                            onClick={() => onSyncToJira(task.id)}
                                            disabled={isSyncing}
                                            className={`${iconButtonClass} ${isSyncing ? 'opacity-50 cursor-not-allowed' : 'hover:!bg-blue-500 hover:!text-white'}`}
                                            aria-label="Sincronizar com Jira"
                                            title="Sincronizar com Jira"
                                        >
                                            {isSyncing ? <Spinner small /> : <RefreshIcon />}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => onEdit(task)}
                                        className={iconButtonClass}
                                        aria-label="Editar tarefa"
                                        title="Editar"
                                    >
                                        <EditIcon />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className={`${iconButtonClass} hover:!bg-red-500 hover:!text-white`}
                                        aria-label="Excluir tarefa"
                                        title="Excluir"
                                    >
                                        <TrashIcon />
                                    </button>
                                    <button
                                        type="button"
                                        className={iconButtonClass}
                                        onClick={handleToggleDetails}
                                        aria-label={isDetailsOpen ? 'Recolher detalhes' : 'Expandir detalhes'}
                                        aria-expanded={isDetailsOpen}
                                        aria-controls={detailsRegionId}
                                        title={isDetailsOpen ? 'Recolher detalhes' : 'Expandir detalhes'}
                                    >
                                        <ChevronDownIcon className={`transition-transform ${isDetailsOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <AnimatePresence initial={false}>
                        {isDetailsOpen && (
                            <motion.div
                                id={detailsRegionId}
                                role="region"
                                aria-label={`Detalhes da tarefa ${task.id}`}
                                initial={reduceMotion ? false : { opacity: 0, height: 0 }}
                                animate={reduceMotion ? { opacity: 1 } : { opacity: 1, height: 'auto' }}
                                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                                transition={{ duration: reduceMotion ? 0 : 0.2 }}
                                className="overflow-hidden border-t border-base-300"
                            >
                                <div className="p-3 md:p-4 bg-base-100">
                                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                        <div className="tabs tabs-boxed bg-base-200 p-1 w-full md:w-fit overflow-x-auto" role="tablist" aria-label="Seções da tarefa">
                                            {sectionTabs.map((tab) => {
                                                const isActive = tab.id === activeSection;
                                                const tabId = `task-${safeDomId}-tab-${tab.id}`;
                                                const panelId = `task-${safeDomId}-panel-${tab.id}`;
                                                return (
                                                    <button
                                                        key={tab.id}
                                                        type="button"
                                                        id={tabId}
                                                        role="tab"
                                                        aria-selected={isActive}
                                                        aria-controls={panelId}
                                                        className={`tab ${isActive ? 'tab-active' : ''}`}
                                                        onClick={() => setActiveSection(tab.id)}
                                                    >
                                                        <span>{tab.label}</span>
                                                        {typeof tab.badge === 'number' && tab.badge > 0 ? (
                                                            <span className="badge badge-primary badge-sm ml-2">
                                                                {tab.badge}
                                                            </span>
                                                        ) : null}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {(task.type === 'Tarefa' || task.type === 'Bug') && onGenerateAll && (
                                            <button
                                                type="button"
                                                onClick={() => onGenerateAll(task.id)}
                                                disabled={isGeneratingAll || isGenerating || isGeneratingBdd}
                                                className="btn btn-primary btn-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isGeneratingAll ? (
                                                    <>
                                                        <Spinner small />
                                                        <span>Gerando...</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                        <span>Gerar Tudo</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    <div
                                        id={`task-${safeDomId}-panel-${activeSection}`}
                                        role="tabpanel"
                                        aria-labelledby={`task-${safeDomId}-tab-${activeSection}`}
                                        className="mt-4"
                                    >
                                        {renderSectionContent()}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {hasChildren && isChildrenOpen && (
                <div id={childrenRegionId} className="ml-6 border-l border-base-300/60 pl-3 mt-1">
                    {children}
                </div>
            )}

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

            {/* Modal de Visualização de Anexo do Jira */}
            {viewingJiraAttachment && viewingJiraAttachment.content && (
                <FileViewer
                    content={viewingJiraAttachment.content}
                    fileName={viewingJiraAttachment.filename}
                    mimeType={viewingJiraAttachment.mimeType}
                    onClose={() => setViewingJiraAttachment(null)}
                    showDownload={true}
                    showViewInNewTab={true}
                />
            )}
        </div>
    );
});

