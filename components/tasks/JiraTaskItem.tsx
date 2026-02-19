import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { JiraTask, BddScenario, TestCaseDetailLevel, TeamRole, Project, TestCase, TaskTestStatus } from '../../types';
import { Spinner } from '../common/Spinner';
import { TaskTypeIcon, TaskStatusIcon, StartTestIcon, CompleteTestIcon, ToDoTestIcon, PlusIcon, EditIcon, TrashIcon, RefreshIcon } from '../common/Icons';
import { BddScenarioForm, BddScenarioItem } from './BddScenario';
import { TestCaseItem } from './TestCaseItem';
import { Sparkles, Zap, Wand2, Loader2, MoreVertical, ChevronDown, ClipboardList } from 'lucide-react';
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
import { getDisplayStatus, getDisplayStatusLabel } from '../../utils/taskHelpers';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { ensureJiraHexColor, getJiraStatusColor, getJiraStatusTextColor } from '../../utils/jiraStatusColors';
import { parseJiraDescriptionHTML } from '../../utils/jiraDescriptionParser';
import { getJiraConfig } from '../../services/jiraService';
import { fetchJiraAttachmentAsDataUrl } from '../../utils/jiraAttachmentFetch';
import { TestTypeBadge } from '../common/TestTypeBadge';
import { FileViewer } from '../common/FileViewer';
import { ImageModal } from '../common/ImageModal';
import { canViewInBrowser, detectFileType } from '../../services/fileViewerService';
import { JiraAttachment } from './JiraAttachment';
import { JiraRichContent } from './JiraRichContent';
import { loadTaskTestStatus, saveTaskTestStatus, calculateTaskTestStatus } from '../../services/taskTestStatusService';
import { useProjectsStore } from '../../store/projectsStore';
import { logger } from '../../utils/logger';
import { Button } from '../common/Button';

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
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
    const statusDropdownRef = useRef<HTMLDivElement>(null);

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
                setIsStatusDropdownOpen(false);
            }
        };

        if (isStatusDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isStatusDropdownOpen]);
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
    const [loadingJiraAttachmentId, setLoadingJiraAttachmentId] = useState<string | null>(null);
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

    const taskTypeNorm = (task.type || '').toLowerCase();
    const borderL4Class = useMemo(() => {
        if (['tarefa', 'task'].includes(taskTypeNorm)) return 'border-l-4 border-blue-600';
        if (taskTypeNorm === 'bug') return 'border-l-4 border-error';
        if (['história', 'story'].includes(taskTypeNorm)) return 'border-l-4 border-success';
        if (taskTypeNorm === 'epic') return 'border-l-4 border-secondary';
        return 'border-l-4 border-base-300';
    }, [taskTypeNorm]);
    const typeBadgeClass = useMemo(() => {
        if (['tarefa', 'task'].includes(taskTypeNorm)) return 'bg-blue-600 text-white';
        if (taskTypeNorm === 'bug') return 'bg-error text-error-content';
        if (['história', 'story'].includes(taskTypeNorm)) return 'bg-success text-success-content';
        if (taskTypeNorm === 'epic') return 'bg-secondary text-secondary-content';
        return 'bg-base-300 text-base-content';
    }, [taskTypeNorm]);

    const jiraStatusPalette = project?.settings?.jiraStatuses;
    const currentStatusColor = useMemo(() => {
        const statusName = getDisplayStatusLabel(task, project);
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

    const handleGenerateAll = useCallback(async (e?: React.MouseEvent) => {
        e?.stopPropagation?.();
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
            testando: { label: 'Testando', color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-500/20 border-blue-500/30', icon: '🔄' },
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
        const isImage = detectFileType(attachment.filename, attachment.mimeType) === 'image';
        setLoadingJiraAttachmentId(attachment.id);
        try {
            // Fazer fetch do anexo através do proxy do Jira se necessário
            const jiraConfig = getJiraConfig();
            if (!jiraConfig) {
                if (isImage) {
                    setViewingJiraAttachment({ ...attachment });
                } else {
                    window.open(attachment.url, '_blank');
                }
                setLoadingJiraAttachmentId(null);
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
                    setLoadingJiraAttachmentId(null);
                };
                reader.readAsDataURL(blob);
            } else {
                if (isImage) {
                    setViewingJiraAttachment({ ...attachment });
                } else {
                    window.open(attachment.url, '_blank');
                }
                setLoadingJiraAttachmentId(null);
            }
        } catch (error) {
            if (isImage) {
                setViewingJiraAttachment({ ...attachment });
            } else {
                window.open(attachment.url, '_blank');
            }
            setLoadingJiraAttachmentId(null);
        }
    };
    
    const indentationStyle = { paddingLeft: `${level * 1.2}rem` };

    // Touch targets mínimos de 44x44px para acessibilidade (WCAG)
    const iconButtonClass = 'btn btn-ghost btn-circle btn-sm min-h-[44px] min-w-[44px] h-11 w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30';
    const iconButtonSmallClass = 'btn btn-ghost btn-circle btn-sm min-h-[44px] min-w-[44px] h-11 w-11 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30';

    const renderOverviewSection = () => (
        <div className="space-y-3">
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
                    <Button
                        variant="brandOutline"
                        size="panel"
                        onClick={() => setShowTestReport(true)}
                        aria-label="Gerar registro de testes"
                        className="hover:border-brand-orange/50"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Gerar Registro de Testes
                    </Button>
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
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-base-200 border border-base-300 mt-1.5">
                    <p className="text-sm font-medium flex-1">Ações de Teste:</p>
                    {taskTestStatus === 'testar' && (
                        <Button type="button" variant="brand" size="panelSm" onClick={handleStartTest}>
                            <span className="mr-1">▶</span> Iniciar Teste
                        </Button>
                    )}
                    {taskTestStatus === 'testando' && (
                        <button type="button" onClick={handleCompleteTest} className="btn btn-sm btn-success text-white shadow-sm rounded-xl">
                            <span className="mr-1">✓</span> Concluir Teste
                        </button>
                    )}
                </div>
            )}

            {(task.priority || task.severity || task.owner || task.assignee || nextStep) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {task.owner && (
                        <div className="p-2.5 bg-base-100 border border-base-300 rounded-xl">
                            <p className="text-[11px] uppercase text-base-content/60 tracking-wide">Owner</p>
                            <p className="text-sm font-semibold text-base-content">{task.owner}</p>
                        </div>
                    )}
                    {task.assignee && (
                        <div className="p-2.5 bg-base-100 border border-base-300 rounded-xl">
                            <p className="text-[11px] uppercase text-base-content/60 tracking-wide">Responsável</p>
                            <p className="text-sm font-semibold text-base-content">{task.assignee}</p>
                        </div>
                    )}
                    {task.priority && (
                        <div className="p-2.5 bg-base-100 border border-base-300 rounded-xl">
                            <p className="text-[11px] uppercase text-base-content/60 tracking-wide">Prioridade</p>
                            <p className="text-sm font-semibold text-base-content">{task.priority}</p>
                        </div>
                    )}
                    {task.severity && (
                        <div className="p-2.5 bg-base-100 border border-base-300 rounded-xl">
                            <p className="text-[11px] uppercase text-base-content/60 tracking-wide">Severidade</p>
                            <p className="text-sm font-semibold text-base-content">{task.severity}</p>
                        </div>
                    )}
                      {nextStep && (
                          <div className="p-2.5 bg-orange-50 dark:bg-orange-950/20 border border-brand-orange/30 rounded-xl">
                              <p className="text-[0.65rem] uppercase text-brand-orange tracking-wide">Próximo passo</p>
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
                                <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">Versão do Projeto</p>
                                <VersionBadges versions={versions} size="md" />
                            </div>
                        )}
                        {otherTags.length > 0 && (
                            <div>
                                {versions.length > 0 && (
                                    <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">Tags</p>
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
                    <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">Estratégias de Teste</p>
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
                    <div className="mt-4 space-y-3">
                        <h3 className="text-lg font-semibold text-base-content flex items-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Campos do Jira
                        </h3>
                        
                        {/* Informações Básicas */}
                        {(task.reporter || task.dueDate || task.environment) && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-base-content/70">📋 Informações Básicas</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {task.reporter && (
                                        <div className="p-2.5 bg-base-100 border border-base-300 rounded-xl">
                                            <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">Reporter</p>
                                            <p className="text-sm font-semibold text-base-content">{task.reporter.displayName}</p>
                                            {task.reporter.emailAddress && (
                                                <p className="text-xs text-base-content/70 mt-1">{task.reporter.emailAddress}</p>
                                            )}
                                        </div>
                                    )}
                                    {task.dueDate && (
                                        <div className="p-2.5 bg-base-100 border border-base-300 rounded-xl">
                                            <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">Due Date</p>
                                            <p className="text-sm font-semibold text-base-content">
                                                {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                                            </p>
                                        </div>
                                    )}
                                    {task.environment && (
                                        <div className="p-2.5 bg-base-100 border border-base-300 rounded-xl sm:col-span-2">
                                            <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">Environment</p>
                                            <p className="text-sm text-base-content">{task.environment}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Time Tracking */}
                        {task.timeTracking && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-base-content/70">⏱️ Time Tracking</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {task.timeTracking.originalEstimate && (
                                        <div className="p-2.5 bg-base-100 border border-base-300 rounded-xl">
                                            <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">Original Estimate</p>
                                            <p className="text-sm font-semibold text-base-content">{task.timeTracking.originalEstimate}</p>
                                        </div>
                                    )}
                                    {task.timeTracking.remainingEstimate && (
                                        <div className="p-2.5 bg-base-100 border border-base-300 rounded-xl">
                                            <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">Remaining Estimate</p>
                                            <p className="text-sm font-semibold text-base-content">{task.timeTracking.remainingEstimate}</p>
                                        </div>
                                    )}
                                    {task.timeTracking.timeSpent && (
                                        <div className="p-2.5 bg-base-100 border border-base-300 rounded-xl">
                                            <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">Time Spent</p>
                                            <p className="text-sm font-semibold text-base-content">{task.timeTracking.timeSpent}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Organização */}
                        {(task.components || task.fixVersions) && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-base-content/70">🧩 Organização</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {task.components && task.components.length > 0 && (
                                        <div className="p-2.5 bg-base-100 border border-base-300 rounded-xl">
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
                                        <div className="p-2.5 bg-base-100 border border-base-300 rounded-xl">
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
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-base-content/70">🔗 Relacionamentos</h4>
                                {task.issueLinks && task.issueLinks.length > 0 && (
                                    <div className="p-2.5 bg-base-100 border border-base-300 rounded-xl">
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
                                    <div className="p-2.5 bg-base-100 border border-base-300 rounded-xl">
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
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-base-content/70">📎 Anexos do Jira</h4>
                                <div className="p-2.5 bg-base-100 border border-base-300 rounded-xl">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
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
                                                    onView={handleViewJiraAttachment}
                                                    isLoading={loadingJiraAttachmentId === att.id}
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
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-base-content">Cenários BDD (Gherkin)</h3>
                <span className="text-xs text-base-content/70">{task.bddScenarios?.length || 0} cenário(s)</span>
            </div>
            <div className="space-y-2">
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
            <div className="space-y-3">
                {/* Sub-abas de Testes */}
                <div className="flex flex-wrap gap-1.5 p-1 bg-base-200 rounded-xl w-fit" role="tablist" aria-label="Sub-abas de testes">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTestSubSection === 'strategy'}
                        onClick={() => setActiveTestSubSection('strategy')}
                        className={`px-2 py-1 text-xs rounded-xl font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-sm ${activeTestSubSection === 'strategy' ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/20' : 'text-base-content/70 hover:text-base-content hover:bg-base-200'}`}
                    >
                        Estratégia
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTestSubSection === 'test-cases'}
                        onClick={() => setActiveTestSubSection('test-cases')}
                        className={`px-2 py-1 text-xs rounded-xl font-medium transition-colors flex items-center gap-1 sm:px-3 sm:py-1.5 sm:text-sm ${activeTestSubSection === 'test-cases' ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/20' : 'text-base-content/70 hover:text-base-content hover:bg-base-200'}`}
                    >
                        Casos de teste
                        {task.testCases?.length ? (
                            <span className={`ml-1 px-1.5 py-0.5 rounded-md text-xs font-medium ${activeTestSubSection === 'test-cases' ? 'bg-white/20' : 'bg-base-300 text-base-content'}`}>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
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
                            <div className="space-y-2 mt-3">
                                <LoadingSkeleton variant="task" count={3} />
                                <div className="flex flex-col items-center justify-center py-3">
                                    <Spinner small />
                                    <p className="mt-2 text-sm text-base-content/70">Gerando casos de teste com IA...</p>
                                    <p className="mt-1 text-xs text-base-content/70">⏱️ Isso pode levar 10-30 segundos</p>
                                </div>
                            </div>
                        ) : (task.testCases || []).length > 0 ? (
                            <div className="space-y-2 mt-3">
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
                            <div className="mt-3">
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
                    <div className="mt-3 p-2.5 bg-base-100 rounded-[var(--rounded-box)] border border-base-300">
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
            <div className="space-y-3">
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
                        <div className="p-2.5 bg-base-100 border border-base-300 rounded-xl">
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
            <div style={indentationStyle} className="py-0.5">
                <div
                    className={[
                        'flex flex-wrap items-center gap-x-2 gap-y-2 sm:gap-y-0 px-3 py-2 sm:px-4 sm:py-2.5 bg-base-100 dark:bg-base-200 border rounded-xl task-card-shadow transition-all duration-200',
                        isStatusDropdownOpen ? 'relative z-10' : '',
                        borderL4Class,
                        'border-base-300',
                        activeTaskId === task.id ? 'ring-2 ring-primary/40 shadow-lg' : '',
                        isSelected ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/30' : '',
                        onOpenModal ? 'cursor-pointer hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2' : '',
                    ].join(' ')}
                    onClick={onOpenModal ? handleCardClick : undefined}
                    onKeyDown={onOpenModal ? handleCardKeyDown : undefined}
                    role={onOpenModal ? 'button' : undefined}
                    tabIndex={onOpenModal ? 0 : undefined}
                    aria-label={onOpenModal ? `Abrir detalhes da tarefa ${task.id}: ${task.title}` : undefined}
                >
                    <div className="flex items-center gap-2 flex-1 min-w-0 order-1 w-full sm:w-auto">
                        {onToggleSelect && (
                            <input
                                type="radio"
                                checked={isSelected}
                                onChange={(e) => { e.stopPropagation(); onToggleSelect(); }}
                                className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-orange-500 rounded-full appearance-none checked:bg-orange-500 checked:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 cursor-pointer shrink-0"
                                style={{ backgroundImage: isSelected ? 'radial-gradient(circle, white 30%, transparent 30%)' : 'none' }}
                                aria-label={isSelected ? `Tarefa ${task.id} selecionada` : `Selecionar tarefa ${task.id}`}
                            />
                        )}
                        {hasChildren ? (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setIsChildrenOpen(!isChildrenOpen); }}
                                className="btn btn-ghost btn-xs flex items-center gap-1 px-1 shrink-0"
                                aria-label={isChildrenOpen ? `Colapsar ${task.children.length} subtarefas de ${task.id}` : `Expandir ${task.children.length} subtarefas de ${task.id}`}
                            >
                                <ChevronDown className={`w-4 h-4 transition-transform flex-shrink-0 ${isChildrenOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                                <span className="bg-base-300 text-[10px] px-1.5 py-0.5 rounded-full">{task.children.length}</span>
                            </button>
                        ) : null}
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded tracking-wider shrink-0 ${typeBadgeClass}`}>{task.type}</span>
                        <span className="text-xs font-medium text-base-content/60 shrink-0">{task.id}</span>
                        <span className="text-sm font-semibold text-base-content truncate min-w-0 flex-1">{task.title}</span>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap flex-shrink-0 w-full sm:w-auto sm:ml-auto order-2" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1" role="group" aria-label="Métricas de teste">
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-success flex items-center justify-center text-[9px] sm:text-[10px] text-white font-bold" title="Aprovados" aria-label={`${testExecutionSummary.passed} aprovados`}>{testExecutionSummary.passed}</div>
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-error flex items-center justify-center text-[9px] sm:text-[10px] text-white font-bold" title="Reprovados" aria-label={`${testExecutionSummary.failed} reprovados`}>{testExecutionSummary.failed}</div>
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-amber-500 flex items-center justify-center text-[9px] sm:text-[10px] text-white font-bold" title="Pendentes" aria-label={`${testExecutionSummary.pending} pendentes`}>{testExecutionSummary.pending}</div>
                        </div>
                        {['tarefa', 'bug', 'task'].includes(taskTypeNorm) && onGenerateAll && (
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleGenerateAll(e); }}
                                disabled={isGeneratingAll || isGenerating || isGeneratingBdd || isGeneratingTests}
                                className="rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-bold flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white transition-colors shrink-0"
                                title="Gerar Tudo (BDD e Testes)"
                                aria-label={isGenerating || isGeneratingAll ? 'Gerando tudo' : 'Gerar Tudo (BDD e Testes)'}
                            >
                                {isGenerating || isGeneratingAll ? <span className="loading loading-spinner loading-xs" /> : <Zap className="w-3.5 h-3.5" aria-hidden="true" />}
                                <span>{isGenerating || isGeneratingAll ? 'Gerando...' : 'Gerar Tudo'}</span>
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (taskTestStatus === 'testar') handleStartTest(e);
                                else if (taskTestStatus === 'testando') handleCompleteTest(e);
                                else if (taskTestStatus === 'teste_concluido') updateTestStatus('pendente');
                                else updateTestStatus('testar');
                            }}
                            className={`rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-bold border flex items-center gap-1.5 shrink-0 transition-colors ${
                                taskTestStatus === 'testando'
                                    ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/40'
                                    : taskTestStatus === 'teste_concluido'
                                    ? 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50 hover:bg-green-100 dark:hover:bg-green-900/40'
                                    : taskTestStatus === 'pendente'
                                    ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/40'
                                    : 'bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-900/50 hover:bg-orange-100 dark:hover:bg-orange-900/40'
                            }`}
                            aria-label={taskTestStatus === 'testar' ? 'Iniciar teste' : taskTestStatus === 'testando' ? 'Concluir teste' : taskTestStatus === 'pendente' ? 'Definir status para Testar' : 'Voltar para Pendente'}
                        >
                            <ClipboardList className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{taskTestStatus === 'testando' ? 'Testando' : taskTestStatus === 'teste_concluido' ? 'Teste Concluído' : taskTestStatus === 'pendente' ? 'Pendente' : 'Testar'}</span>
                        </button>
                        <div className="relative flex-shrink-0" ref={statusDropdownRef}>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setIsStatusDropdownOpen(!isStatusDropdownOpen); }}
                                className="rounded-full px-3 py-1 sm:px-4 sm:py-1.5 text-[10px] sm:text-xs font-bold min-w-0 sm:min-w-[120px] justify-between flex items-center gap-2 bg-emerald-600 dark:bg-emerald-700 text-white border-0 shrink-0"
                                style={currentStatusColor ? { backgroundColor: currentStatusColor, color: statusTextColor || '#fff' } : undefined}
                                aria-haspopup="true"
                                aria-expanded={isStatusDropdownOpen}
                                aria-label={`Status: ${getDisplayStatusLabel(task, project)}. Clique para mudar.`}
                            >
                                <span className="truncate max-w-[5rem] sm:max-w-none min-w-0">{getDisplayStatusLabel(task, project)}</span>
                                <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                            </button>
                                    {isStatusDropdownOpen && (
                                        <div className="absolute right-0 mt-1 z-50 w-40 sm:w-48 max-w-[calc(100vw-2rem)] bg-base-100 border border-base-300 rounded-xl shadow-lg overflow-hidden">
                                            {project?.settings?.jiraStatuses && project.settings.jiraStatuses.length > 0 ? (
                                                project.settings.jiraStatuses.map((status) => {
                                                    const statusName = typeof status === 'string' ? status : status.name;
                                                    const statusColor = typeof status === 'string' 
                                                        ? getJiraStatusColor(statusName)
                                                        : (status.color ? ensureJiraHexColor(status.color, status.name) : getJiraStatusColor(statusName));
                                                    const isSelected = getDisplayStatusLabel(task, project) === statusName;
                                                    return (
                                                        <button
                                                            key={statusName}
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleChangeStatus(statusName);
                                                                setIsStatusDropdownOpen(false);
                                                            }}
                                                            className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-base-200 transition-colors ${
                                                                isSelected ? 'bg-base-200 font-semibold' : ''
                                                            }`}
                                                            style={isSelected ? { 
                                                                borderLeft: `3px solid ${statusColor || '#6b7280'}` 
                                                            } : {}}
                                                        >
                                                            <div 
                                                                className="w-3 h-3 rounded-full flex-shrink-0"
                                                                style={{ backgroundColor: statusColor || '#6b7280' }}
                                                            />
                                                            <span>{statusName}</span>
                                                        </button>
                                                    );
                                                })
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleChangeStatus('To Do');
                                                            setIsStatusDropdownOpen(false);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-base-200 transition-colors"
                                                    >
                                                        <div className="w-3 h-3 rounded-full bg-gray-400" />
                                                        <span>A Fazer</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleChangeStatus('In Progress');
                                                            setIsStatusDropdownOpen(false);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-base-200 transition-colors"
                                                    >
                                                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                                                        <span>Em Andamento</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleChangeStatus('Done');
                                                            setIsStatusDropdownOpen(false);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-base-200 transition-colors"
                                                    >
                                                        <div className="w-3 h-3 rounded-full bg-green-500" />
                                                        <span>Concluído</span>
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                        <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenModal) {
                                onOpenModal(task);
                              } else {
                                handleToggleDetails();
                              }
                            }}
                            className="btn btn-ghost btn-sm btn-circle shrink-0 text-base-content/60 hover:text-base-content"
                            aria-label={onOpenModal ? `Abrir detalhes da tarefa ${task.id} em modal` : (isDetailsOpen ? `Colapsar detalhes da tarefa ${task.id}` : `Expandir detalhes da tarefa ${task.id}`)}
                            aria-expanded={onOpenModal ? undefined : isDetailsOpen}
                        >
                            <ChevronDown className={`w-4 h-4 transition-transform ${isDetailsOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                        </button>
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
                                className="overflow-visible border-t border-base-300 bg-base-100 rounded-b-2xl shadow-inner"
                            >
                                <div className="p-4 space-y-4">
                                    {/* Barra de Ações (movida para dentro do expandir) */}
                                    <div className="flex items-center gap-1.5 flex-wrap pb-3 border-b border-base-200">
                                        {/* Ação primária */}
                                        {(task.type === 'Tarefa' || task.type === 'Bug') && onGenerateAll && (
                                            <Button
                                                type="button"
                                                variant="brand"
                                                size="panel"
                                                onClick={handleGenerateAll}
                                                disabled={isGeneratingAll || isGenerating || isGeneratingBdd || isGeneratingTests}
                                                title="Gerar BDD, Estratégia e Testes com IA"
                                                aria-label="Gerar tudo com IA (BDD, estratégia e testes)"
                                            >
                                                {isGenerating || isGeneratingAll ? (
                                                    <span className="loading loading-spinner loading-xs" aria-hidden="true"></span>
                                                ) : (
                                                    <Zap className="w-4 h-4" aria-hidden="true" />
                                                )}
                                                <span className="hidden sm:inline">{isGenerating || isGeneratingAll ? 'Gerando...' : 'Gerar Tudo'}</span>
                                                <span className="sm:hidden">{isGenerating || isGeneratingAll ? 'Gerando...' : 'Gerar'}</span>
                                            </Button>
                                        )}

                                        {/* Desktop: ações comuns visíveis */}
                                        {task.type === 'Epic' && (
                                            <button
                                                type="button"
                                                onClick={() => onAddSubtask(task.id)}
                                                className="btn btn-ghost btn-sm gap-2 hidden md:inline-flex rounded-xl"
                                                aria-label="Adicionar subtarefa"
                                            >
                                                <PlusIcon className="w-4 h-4" aria-hidden="true" />
                                                Adicionar Subtarefa
                                            </button>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => onEdit(task)}
                                            className="btn btn-ghost btn-sm gap-2 hidden md:inline-flex rounded-xl"
                                            aria-label="Editar tarefa"
                                        >
                                            <EditIcon className="w-4 h-4" aria-hidden="true" />
                                            Editar
                                        </button>

                                        {onSyncToJira && /^[A-Z]+-\d+$/.test(task.id) && (
                                            <button
                                                type="button"
                                                onClick={() => onSyncToJira(task.id)}
                                                disabled={isSyncing}
                                                className="btn btn-ghost btn-sm gap-2 hidden md:inline-flex rounded-xl"
                                                aria-label="Sincronizar tarefa com o Jira"
                                            >
                                                {isSyncing ? (
                                                    <Spinner small />
                                                ) : (
                                                    <RefreshIcon className="w-4 h-4" aria-hidden="true" />
                                                )}
                                                Sincronizar
                                            </button>
                                        )}

                                        {/* Menu overflow: ações secundárias + destrutiva (abre à direita do botão) */}
                                        <div className="dropdown dropdown-start">
                                            <button
                                                type="button"
                                                tabIndex={0}
                                                className="btn btn-ghost btn-sm btn-square rounded-xl"
                                                aria-label="Mais ações"
                                                aria-haspopup="true"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <MoreVertical className="w-4 h-4" aria-hidden="true" />
                                            </button>
                                            <ul
                                                tabIndex={0}
                                                className="dropdown-content menu bg-base-100 rounded-xl z-50 w-56 max-h-[min(70vh,24rem)] overflow-y-auto p-2 shadow-lg border border-base-300"
                                                role="menu"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {/* Mobile: ações comuns também ficam no menu */}
                                                {task.type === 'Epic' && (
                                                    <li className="md:hidden" role="none">
                                                        <button
                                                            type="button"
                                                            role="menuitem"
                                                            className="gap-2"
                                                            onClick={() => onAddSubtask(task.id)}
                                                        >
                                                            <PlusIcon className="w-4 h-4" aria-hidden="true" />
                                                            Adicionar Subtarefa
                                                        </button>
                                                    </li>
                                                )}
                                                <li className="md:hidden" role="none">
                                                    <button
                                                        type="button"
                                                        role="menuitem"
                                                        className="gap-2"
                                                        onClick={() => onEdit(task)}
                                                    >
                                                        <EditIcon className="w-4 h-4" aria-hidden="true" />
                                                        Editar
                                                    </button>
                                                </li>
                                                {onSyncToJira && /^[A-Z]+-\d+$/.test(task.id) && (
                                                    <li className="md:hidden" role="none">
                                                        <button
                                                            type="button"
                                                            role="menuitem"
                                                            className="gap-2"
                                                            onClick={() => onSyncToJira(task.id)}
                                                            disabled={isSyncing}
                                                        >
                                                            {isSyncing ? <Spinner small /> : <RefreshIcon className="w-4 h-4" aria-hidden="true" />}
                                                            Sincronizar
                                                        </button>
                                                    </li>
                                                )}
                                                {(task.type === 'Epic' || onSyncToJira) && (
                                                    <li className="md:hidden" role="none">
                                                        <div className="divider my-0" />
                                                    </li>
                                                )}

                                                {(task.type === 'Tarefa' || task.type === 'Bug') && (
                                                    <>
                                                        <li role="none">
                                                            <button
                                                                type="button"
                                                                role="menuitem"
                                                                className="gap-2"
                                                                onClick={() => onGenerateBddScenarios(task.id)}
                                                                disabled={isGeneratingBdd || isGeneratingAll || isGenerating}
                                                                title="Gerar apenas cenários BDD"
                                                                aria-label="Gerar apenas cenários BDD"
                                                            >
                                                                {isGeneratingBdd ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                                                ) : (
                                                                    <Sparkles className="w-4 h-4" aria-hidden="true" />
                                                                )}
                                                                BDD
                                                            </button>
                                                        </li>
                                                        <li role="none">
                                                            <button
                                                                type="button"
                                                                role="menuitem"
                                                                className="gap-2"
                                                                onClick={() => onGenerateTests(task.id, detailLevel)}
                                                                disabled={isGeneratingTests || isGeneratingAll || isGenerating}
                                                                title="Gerar apenas casos de teste"
                                                                aria-label="Gerar apenas casos de teste"
                                                            >
                                                                {isGeneratingTests ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                                                                ) : (
                                                                    <Wand2 className="w-4 h-4" aria-hidden="true" />
                                                                )}
                                                                Testes
                                                            </button>
                                                        </li>
                                                        <li role="none">
                                                            <div className="divider my-0" />
                                                        </li>
                                                    </>
                                                )}

                                                <li role="none">
                                                    <button
                                                        type="button"
                                                        role="menuitem"
                                                        onClick={() => setShowDeleteConfirm(true)}
                                                        className="gap-2 text-error hover:bg-error hover:text-error-content"
                                                        aria-label="Excluir tarefa"
                                                    >
                                                        <TrashIcon className="w-4 h-4" aria-hidden="true" />
                                                        Excluir
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:justify-between">
                                        <div className="flex flex-wrap gap-1.5 p-1 bg-base-200 rounded-xl w-full md:w-fit overflow-x-auto" role="tablist" aria-label="Seções da tarefa">
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
                                                        className={`px-2 py-1 text-xs rounded-xl font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-sm ${isActive ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/20' : 'text-base-content/70 hover:text-base-content hover:bg-base-200'}`}
                                                        onClick={() => setActiveSection(tab.id)}
                                                    >
                                                        <span>{tab.label}</span>
                                                        {typeof tab.badge === 'number' && tab.badge > 0 ? (
                                                            <span className={`ml-2 px-1.5 py-0.5 rounded-md text-xs font-medium ${isActive ? 'bg-white/20' : 'bg-base-300 text-base-content'}`}>
                                                                {tab.badge}
                                                            </span>
                                                        ) : null}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div
                                        id={`task-${safeDomId}-panel-${activeSection}`}
                                        role="tabpanel"
                                        aria-labelledby={`task-${safeDomId}-tab-${activeSection}`}
                                        className="mt-3"
                                    >
                                        {renderSectionContent()}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
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
            {viewingJiraAttachment && !viewingJiraAttachment.content && detectFileType(viewingJiraAttachment.filename, viewingJiraAttachment.mimeType) === 'image' && (
                <ImageModal
                    url={viewingJiraAttachment.url}
                    fileName={viewingJiraAttachment.filename}
                    onClose={() => setViewingJiraAttachment(null)}
                    fetchImage={() => fetchJiraAttachmentAsDataUrl(viewingJiraAttachment)}
                />
            )}
        </div>
    );
});
