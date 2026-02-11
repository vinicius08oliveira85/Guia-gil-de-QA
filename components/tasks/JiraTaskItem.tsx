import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { JiraTask, BddScenario, TestCaseDetailLevel, TeamRole, Project, TestCase, TaskTestStatus } from '../../types';
import { Spinner } from '../common/Spinner';
import { TaskTypeIcon, TaskStatusIcon, StartTestIcon, CompleteTestIcon, ToDoTestIcon, PlusIcon, EditIcon, TrashIcon, ChevronDownIcon, RefreshIcon } from '../common/Icons';
import { BddScenarioForm, BddScenarioItem } from './BddScenario';
import { TestCaseItem } from './TestCaseItem';
import { Sparkles, Zap, Wand2, Loader2 } from 'lucide-react';
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
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { ensureJiraHexColor, getJiraStatusColor, getJiraStatusTextColor } from '../../utils/jiraStatusColors';
import { parseJiraDescriptionHTML } from '../../utils/jiraDescriptionParser';
import { getJiraConfig } from '../../services/jiraService';
import { TestTypeBadge } from '../common/TestTypeBadge';
import { FileViewer } from '../common/FileViewer';
import { canViewInBrowser, detectFileType } from '../../services/fileViewerService';
import { JiraAttachment } from './JiraAttachment';
import { JiraRichContent } from './JiraRichContent';
import { loadTaskTestStatus, saveTaskTestStatus, calculateTaskTestStatus } from '../../services/taskTestStatusService';
import { useProjectsStore } from '../../store/projectsStore';
import { logger } from '../../utils/logger';
import { TaskSectionMenubar } from './TaskSectionMenubar';

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
        <JiraRichContent 
            html={htmlContent}
            className=""
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
}> = React.memo(({ task, onTestCaseStatusChange, onToggleTestCaseAutomated, onExecutedStrategyChange, onTaskToolsChange, onTestCaseToolsChange, onStrategyExecutedChange, onStrategyToolsChange, onDelete, onGenerateTests, isGenerating: isGeneratingTests, onAddSubtask, onEdit, onGenerateBddScenarios, isGeneratingBdd, onGenerateAll, isGeneratingAll, onSyncToJira, isSyncing, onSaveBddScenario, onDeleteBddScenario, onTaskStatusChange, onAddTestCaseFromTemplate, onAddComment, onEditComment, onDeleteComment, onEditTestCase, onDeleteTestCase, project, onUpdateProject, isSelected, onToggleSelect, children, level, activeTaskId, onFocusTask, onOpenModal }) => {
    const reduceMotion = useReducedMotion();
    const [isDetailsOpen, setIsDetailsOpen] = useState(false); // Colapsado por padrão para compactar
    const [isChildrenOpen, setIsChildrenOpen] = useState(false);
    const [editingBddScenario, setEditingBddScenario] = useState<BddScenario | null>(null);
    const [isCreatingBdd, setIsCreatingBdd] = useState(false);
    const [detailLevel, setDetailLevel] = useState<TestCaseDetailLevel>('Padrão');
    const [showDependencies, setShowDependencies] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showAttachments, setShowAttachments] = useState(false);
    const [showEstimation, setShowEstimation] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showTestReport, setShowTestReport] = useState(false);
    const [viewingJiraAttachment, setViewingJiraAttachment] = useState<{ id: string; filename: string; url: string; mimeType: string; content?: string } | null>(null);
    const [loadingJiraAttachment, setLoadingJiraAttachment] = useState(false);
    const [activeSection, setActiveSection] = useState<DetailSection>('overview');
    const [activeTestSubSection, setActiveTestSubSection] = useState<TestSubSection>('strategy');
    const [taskTestStatus, setTaskTestStatus] = useState<TaskTestStatus | null>(task.testStatus || null);
    const [isLoadingTestStatus, setIsLoadingTestStatus] = useState(false);
    const hasTests = task.testCases && task.testCases.length > 0;
    const hasChildren = task.children && task.children.length > 0;
    const { updateProject } = useProjectsStore();
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

    // Carregar status de teste do Supabase ao montar
    useEffect(() => {
        const loadTestStatus = async () => {
            if (!task.id || taskTestStatus !== null) return; // Já carregado ou não tem ID válido
            
            setIsLoadingTestStatus(true);
            try {
                const status = await loadTaskTestStatus(task.id);
                if (status !== null) {
                    setTaskTestStatus(status);
                    // Atualizar task no projeto se necessário
                    if (project && onUpdateProject && task.testStatus !== status) {
                        const updatedTasks = project.tasks.map(t =>
                            t.id === task.id ? { ...t, testStatus: status } : t
                        );
                        onUpdateProject({ ...project, tasks: updatedTasks });
                    }
                } else {
                    // Se não há status salvo, calcular baseado nos testCases ou subtarefas
                    const calculatedStatus = calculateTaskTestStatus(task, project?.tasks || []);
                    setTaskTestStatus(calculatedStatus);
                }
            } catch (error) {
                logger.warn('Erro ao carregar status de teste do Supabase', 'JiraTaskItem', error);
                // Em caso de erro, calcular baseado nos testCases ou subtarefas
                const calculatedStatus = calculateTaskTestStatus(task, project?.tasks || []);
                setTaskTestStatus(calculatedStatus);
            } finally {
                setIsLoadingTestStatus(false);
            }
        };
        
        loadTestStatus();
    }, [task.id]); // Apenas ao montar ou quando task.id mudar

    // Recalcular status automaticamente quando testCases mudam
    useEffect(() => {
        // Recalcular status quando testCases mudarem
        const calculatedStatus = calculateTaskTestStatus(task, project?.tasks || []);
        
        // Atualizar se:
        // 1. Status calculado é diferente do atual
        // 2. Status atual é null (primeira vez)
        // 3. Status calculado é 'teste_concluido' (todos os testes executados) - sempre atualizar
        // 4. Status calculado é 'pendente' (teste falhou) - sempre atualizar
        // 5. Status atual é 'testar' - atualizar para qualquer status calculado
        const shouldUpdate = 
            calculatedStatus !== taskTestStatus && (
                taskTestStatus === null || 
                calculatedStatus === 'teste_concluido' ||
                calculatedStatus === 'pendente' ||
                taskTestStatus === 'testar' ||
                (taskTestStatus === 'testando' && calculatedStatus === 'teste_concluido')
            );
        
        if (shouldUpdate) {
            setTaskTestStatus(calculatedStatus);
            // Salvar no Supabase em background
            if (task.id) {
                saveTaskTestStatus(task.id, calculatedStatus).catch(error => {
                    logger.warn('Erro ao salvar status de teste no Supabase', 'JiraTaskItem', error);
                });
            }
            // Atualizar task no projeto
            if (project && onUpdateProject) {
                const updatedTasks = project.tasks.map(t =>
                    t.id === task.id ? { ...t, testStatus: calculatedStatus } : t
                );
                onUpdateProject({ ...project, tasks: updatedTasks });
            }
        }
    }, [task.testCases, task.id, project?.tasks]); // Recalcular quando testCases ou tasks do projeto mudarem (sem incluir taskTestStatus para evitar loop)

    // Função para atualizar e salvar status
    const updateTestStatus = useCallback(async (newStatus: TaskTestStatus) => {
        setTaskTestStatus(newStatus);
        
        if (task.id) {
            try {
                await saveTaskTestStatus(task.id, newStatus);
                logger.debug(`Status de teste atualizado para ${task.id}: ${newStatus}`, 'JiraTaskItem');
            } catch (error) {
                logger.warn('Erro ao salvar status de teste no Supabase', 'JiraTaskItem', error);
            }
        }
        
        // Atualizar task no projeto
        if (project && onUpdateProject) {
            const updatedTasks = project.tasks.map(t =>
                t.id === task.id ? { ...t, testStatus: newStatus } : t
            );
            onUpdateProject({ ...project, tasks: updatedTasks });
        }
    }, [task.id, project, onUpdateProject]);

    // Função para iniciar teste
    const handleStartTest = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        await updateTestStatus('testando');
    }, [updateTestStatus]);

    // Função para concluir teste
    const handleCompleteTest = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const calculatedStatus = calculateTaskTestStatus(task, project?.tasks || []);
            // Se todos os testes passaram, marcar como concluído, senão pendente
            const finalStatus = calculatedStatus === 'teste_concluido' ? 'teste_concluido' : 'pendente';
            await updateTestStatus(finalStatus);
        } catch (error) {
            logger.error('Erro ao concluir teste', 'JiraTaskItem', error);
        }
    }, [task, project, onUpdateProject]);

    const handleGenerateAll = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onGenerateAll) return;

        setIsGenerating(true);
        try {
            await onGenerateAll(task.id, detailLevel);
        } catch (error) {
            logger.error('Erro ao gerar tudo', 'JiraTaskItem', error);
        } finally {
            setIsGenerating(false);
        }
    }, [onGenerateAll, task.id, detailLevel]);

    // Cores e estilos para status de teste
    const testStatusConfig = useMemo(() => {
        const status = taskTestStatus || calculateTaskTestStatus(task, project?.tasks || []);
        const configs: Record<TaskTestStatus, { label: string; color: string; bgColor: string; icon: string }> = {
            testar: { label: 'Testar', color: 'text-orange-700 dark:text-orange-400', bgColor: 'bg-orange-500/20 border-orange-500/30', icon: '📋' },
            testando: { label: 'Testando', color: 'text-yellow-700 dark:text-yellow-400', bgColor: 'bg-yellow-500/20 border-yellow-500/30', icon: '🔄' },
            pendente: { label: 'Pendente', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-500/20 border-red-500/30', icon: '⚠️' },
            teste_concluido: { label: 'Teste Concluído', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-500/20 border-green-500/30', icon: '✅' }
        };
        return configs[status];
    }, [taskTestStatus, task, project?.tasks]);

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

            {/* Ações de Teste */}
            {taskTestStatus && (taskTestStatus === 'testar' || taskTestStatus === 'testando') && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-base-200 mt-2">
                    <p className="text-sm font-medium flex-1">Ações de Teste:</p>
                    {taskTestStatus === 'testar' && (
                        <button type="button" onClick={handleStartTest} className="btn btn-sm btn-primary shadow-sm">
                            <span className="mr-1">▶</span> Iniciar Teste
                        </button>
                    )}
                    {taskTestStatus === 'testando' && (
                        <button type="button" onClick={handleCompleteTest} className="btn btn-sm btn-success text-white shadow-sm">
                            <span className="mr-1">✓</span> Concluir Teste
                        </button>
                    )}
                </div>
            )}

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
            
            {(task.type === 'Tarefa' || task.type === 'Bug') && testTypeBadges.length > 0 && (
                <div>
                    <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1.5">Estratégias de Teste</p>
                    <div className="flex flex-wrap gap-1">
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
                </div>
            )}

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
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                        {task.jiraAttachments.map((att) => {
                                            const jiraConfig = getJiraConfig();
                                            const jiraUrl = jiraConfig?.url;
                                            const attachmentUrl = jiraUrl ? `${jiraUrl}/secure/attachment/${att.id}/${encodeURIComponent(att.filename)}` : '';
                                            const fileType = detectFileType(att.filename, '');
                                            
                                            // Determinar mimeType baseado no tipo de arquivo
                                            let mimeType: string | undefined;
                                            if (fileType === 'pdf') mimeType = 'application/pdf';
                                            else if (fileType === 'image') {
                                                const ext = att.filename.toLowerCase().split('.').pop();
                                                if (ext === 'png') mimeType = 'image/png';
                                                else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
                                                else if (ext === 'gif') mimeType = 'image/gif';
                                                else if (ext === 'webp') mimeType = 'image/webp';
                                                else mimeType = 'image/*';
                                            } else if (fileType === 'text') mimeType = 'text/plain';
                                            else if (fileType === 'json') mimeType = 'application/json';
                                            else if (fileType === 'csv') mimeType = 'text/csv';
                                            
                                            return (
                                                <JiraAttachment
                                                    key={att.id}
                                                    id={att.id}
                                                    url={attachmentUrl}
                                                    filename={att.filename}
                                                    mimeType={mimeType}
                                                    size={att.size}
                                                />
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
                        {isGeneratingTests && <div className="flex justify-center py-2"><Spinner small /></div>}
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
                            !isGeneratingTests && (
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
                        {isGeneratingTests ? (
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

    const handleChangeStatus = (newStatusValue: 'To Do' | 'In Progress' | 'Done' | string) => {
        const jiraStatuses = project?.settings?.jiraStatuses || [];

        const mapStatus = (jiraStatus: string): 'To Do' | 'In Progress' | 'Done' => {
            const status = jiraStatus.toLowerCase();
            // Verificar status concluído (inglês e português)
            if (
                status.includes('done') ||
                status.includes('resolved') ||
                status.includes('closed') ||
                status.includes('concluído') ||
                status.includes('concluido') ||
                status.includes('finalizado') ||
                status.includes('resolvido') ||
                status.includes('fechado')
            ) {
                return 'Done';
            }
            // Verificar status em andamento (inglês e português)
            if (
                status.includes('progress') ||
                status.includes('in progress') ||
                status.includes('em andamento') ||
                status.includes('andamento') ||
                status.includes('em desenvolvimento') ||
                status.includes('desenvolvimento')
            ) {
                return 'In Progress';
            }
            return 'To Do';
        };

        const isJiraStatus = jiraStatuses.some((status) =>
            typeof status === 'string' ? status === newStatusValue : status.name === newStatusValue
        );

        if (isJiraStatus) {
            const mappedStatus = mapStatus(newStatusValue);
            onTaskStatusChange(mappedStatus);
            if (project && onUpdateProject) {
                const updatedTasks = project.tasks.map((t) =>
                    t.id === task.id ? { ...t, status: mappedStatus, jiraStatus: newStatusValue } : t
                );
                onUpdateProject({ ...project, tasks: updatedTasks });
            }
        } else {
            onTaskStatusChange(newStatusValue as 'To Do' | 'In Progress' | 'Done');
            if (project && onUpdateProject && task.jiraStatus) {
                const updatedTasks = project.tasks.map((t) =>
                    t.id === task.id ? { ...t, jiraStatus: undefined } : t
                );
                onUpdateProject({ ...project, tasks: updatedTasks });
            }
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
                        'relative overflow-hidden rounded-[var(--rounded-box)] border bg-base-100',
                        task.type === 'Bug' && !isSelected ? 'border-error/60 shadow-sm shadow-error/5' : 'border-base-300',
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
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                            {/* Coluna 1: Controles e Título (ocupa espaço flexível) */}
                            <div className="flex items-center gap-2 flex-1 min-w-[250px]">
                                {onToggleSelect && (
                                    <input 
                                        type="checkbox" 
                                        checked={isSelected} 
                                        onChange={(e) => { e.stopPropagation(); onToggleSelect(); }}
                                        className="checkbox checkbox-xs sm:checkbox-sm checkbox-primary"
                                    />
                                )}
                                {hasChildren ? (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); setIsChildrenOpen(!isChildrenOpen); }}
                                        className="btn btn-ghost btn-xs flex items-center gap-1 px-1"
                                    >
                                        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isChildrenOpen ? 'rotate-180' : ''}`} />
                                        <span className="bg-base-300 text-xs px-1.5 py-0.5 rounded-full">
                                            {task.children.length}
                                        </span>
                                    </button>
                                ) : <div className="w-6" />}
                                
                                <div className="flex-1 min-w-0">
                                    <button
                                        type="button"
                                        onClick={handleToggleDetails}
                                        className="w-full text-left rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 group"
                                        aria-expanded={isDetailsOpen}
                                        aria-controls={detailsRegionId}
                                    >
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                            <span className="badge badge-sm text-white border-0 px-2 min-h-0 h-5 text-[10px] shrink-0" style={typeBadgeStyle}>{task.type}</span>
                                            <span className="font-mono text-xs text-base-content/60 group-hover:text-primary transition-colors shrink-0">{task.id}</span>
                                            <span className="text-sm font-bold text-base-content leading-tight group-hover:text-primary transition-colors line-clamp-2 break-words">{task.title}</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Coluna 2: Badges e Métricas (flex-shrink para não quebrar) */}
                            <div className="flex items-center gap-4 flex-shrink-0">
                                {testExecutionSummary.total > 0 && (
                                    <div className="flex items-center gap-2 text-xs font-medium bg-base-200/50 px-2 py-1 rounded-lg">
                                        <span className="flex items-center gap-1 text-success" title="Aprovados"><span className="w-2 h-2 rounded-full bg-success"></span>{testExecutionSummary.passed}</span>
                                        <span className="flex items-center gap-1 text-error" title="Reprovados"><span className="w-2 h-2 rounded-full bg-error"></span>{testExecutionSummary.failed}</span>
                                        <span className="flex items-center gap-1 text-base-content/60" title="Pendentes"><span className="w-2 h-2 rounded-full bg-base-300"></span>{testExecutionSummary.pending}</span>
                                    </div>
                                )}
                            </div>

                            {/* Coluna 3: Status e Ações (flex-shrink para não quebrar) */}
                            <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
                                {/* Ações Rápidas de IA */}
                                {['tarefa', 'bug', 'task'].includes(task.type.toLowerCase()) && onGenerateAll && (
                                    <div className="flex items-center gap-1 mr-1">
                                        <button
                                            type="button"
                                            onClick={handleGenerateAll}
                                            disabled={isGeneratingAll || isGenerating || isGeneratingBdd || isGeneratingTests}
                                            className="btn btn-sm btn-ghost text-primary gap-2 hover:bg-primary/10"
                                            title="Gerar Tudo (BDD e Testes)"
                                        >
                                            {isGenerating || isGeneratingAll ? <span className="loading loading-spinner loading-xs"></span> : <Zap className="w-4 h-4" />}
                                            {isGenerating || isGeneratingAll ? 'Gerando...' : 'Gerar Tudo'}
                                        </button>
                                    </div>
                                )}
                                {taskTestStatus && (
                                    <span className={`badge badge-sm ${testStatusConfig.bgColor} ${testStatusConfig.color} border gap-1`}>
                                        <span aria-hidden="true" className="text-xs">{testStatusConfig.icon}</span>
                                        <span className="font-medium">{testStatusConfig.label}</span>
                                    </span>
                                )}
                                <select
                                    className="select select-bordered select-xs w-full sm:w-auto max-w-[140px] h-7 min-h-0"
                                    value={getDisplayStatus(task)}
                                    onChange={(e) => handleChangeStatus(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ backgroundColor: currentStatusColor, color: statusTextColor, borderColor: currentStatusColor ? `${currentStatusColor}66` : undefined }}
                                >
                                    {project?.settings?.jiraStatuses && project.settings.jiraStatuses.length > 0 ? (
                                        project.settings.jiraStatuses.map((status) => {
                                            const statusName = typeof status === 'string' ? status : status.name;
                                            return <option key={statusName} value={statusName}>{statusName}</option>;
                                        })
                                    ) : (
                                        <>
                                            <option value="To Do">A Fazer</option>
                                            <option value="In Progress">Em Andamento</option>
                                            <option value="Done">Concluído</option>
                                        </>
                                    )}
                                </select>
                                <button type="button" onClick={(e) => { e.stopPropagation(); handleToggleDetails(); }} className="btn btn-ghost btn-xs btn-circle shrink-0">
                                    <ChevronDownIcon className={`w-4 h-4 transition-transform ${isDetailsOpen ? 'rotate-180' : ''}`} />
                                </button>
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
                                className="overflow-hidden border-t border-base-300 bg-base-50/50"
                            >
                                <div className="p-4 space-y-4">
                                    {/* Barra de Ações (movida para dentro do expandir) */}
                                    <div className="flex flex-wrap gap-2 pb-4 border-b border-base-200">
                                        {(task.type === 'Tarefa' || task.type === 'Bug') && (
                                            <>
                                                {onGenerateAll && (
                                                    <button
                                                        onClick={handleGenerateAll}
                                                        disabled={isGeneratingAll || isGenerating || isGeneratingBdd || isGeneratingTests}
                                                        className="btn btn-sm btn-ghost text-primary gap-2 hover:bg-primary/10"
                                                        title="Gerar BDD, Estratégia e Testes com IA"
                                                    >
                                                        {isGenerating || isGeneratingAll ? <span className="loading loading-spinner loading-xs"></span> : <Zap className="w-4 h-4" />}
                                                        {isGenerating || isGeneratingAll ? 'Gerando...' : 'Gerar Tudo'}
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => onGenerateBddScenarios(task.id)}
                                                    disabled={isGeneratingBdd || isGeneratingAll || isGenerating}
                                                    className="btn btn-sm btn-ghost gap-2"
                                                    title="Gerar apenas cenários BDD"
                                                >
                                                    {isGeneratingBdd ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                                    BDD
                                                </button>
                                                <button
                                                    onClick={() => onGenerateTests(task.id, detailLevel)}
                                                    disabled={isGeneratingTests || isGeneratingAll || isGenerating}
                                                    className="btn btn-sm btn-ghost gap-2"
                                                    title="Gerar apenas casos de teste"
                                                >
                                                    {isGeneratingTests ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                                                    Testes
                                                </button>
                                                <div className="divider divider-horizontal mx-0 my-1 w-px h-6 bg-base-300 self-center hidden sm:flex"></div>
                                            </>
                                        )}
                                        {task.type === 'Epic' && (
                                            <button onClick={() => onAddSubtask(task.id)} className="btn btn-sm btn-ghost gap-2">
                                                <PlusIcon className="w-4 h-4" /> Adicionar Subtarefa
                                            </button>
                                        )}
                                        <button onClick={() => onEdit(task)} className="btn btn-sm btn-ghost gap-2">
                                            <EditIcon className="w-4 h-4" /> Editar
                                        </button>
                                        {onSyncToJira && /^[A-Z]+-\d+$/.test(task.id) && (
                                            <button onClick={() => onSyncToJira(task.id)} disabled={isSyncing} className="btn btn-sm btn-ghost gap-2">
                                                {isSyncing ? <Spinner small /> : <RefreshIcon className="w-4 h-4" />} Sincronizar
                                            </button>
                                        )}
                                        <button onClick={() => setShowDeleteConfirm(true)} className="btn btn-sm btn-ghost text-error gap-2 ml-auto">
                                            <TrashIcon className="w-4 h-4" /> Excluir
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                        <TaskSectionMenubar
                                            tabs={sectionTabs}
                                            activeTab={activeSection}
                                            onTabChange={setActiveSection}
                                            safeDomId={safeDomId}
                                        />
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
