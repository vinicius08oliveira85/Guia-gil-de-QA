import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  JiraTask,
  BddScenario,
  TestCaseDetailLevel,
  Project,
  TestCase,
  TaskTestStatus,
} from '../../types';
import { Spinner } from '../common/Spinner';
import {
  JiraIssueTypeIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  RefreshIcon,
} from '../common/Icons';
import { BddScenarioForm, BddScenarioItem } from './BddScenario';
import { TestCasesSection } from './TestCasesSection';
import {
  BarChart3,
  Sparkles,
  Wrench,
  Zap,
  Wand2,
  Loader2,
  MoreVertical,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Link,
  Paperclip,
  Timer,
  Star,
  Download,
} from 'lucide-react';
import { TestStrategyCard } from './TestStrategyCard';
import { ToolsSelector } from './ToolsSelector';
import { TestReportModal } from './TestReportModal';
import { CommentSection } from '../common/CommentSection';
import { TaskLinksView } from './TaskLinksView';
import { AttachmentManager } from '../common/AttachmentManager';
import { ChecklistView } from '../common/ChecklistView';
import { EstimationInput } from '../common/EstimationInput';
import { QuickActions } from '../common/QuickActions';
import { getTagColor, getTaskVersions } from '../../utils/tagService';
import { VersionBadges } from './VersionBadge';
import { updateChecklistItem } from '../../utils/checklistService';
import { getNextStepForTask } from '../../utils/taskPhaseHelper';
import { getDisplayStatusLabel } from '../../utils/taskHelpers';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { EmptyState } from '../common/EmptyState';
import {
  ensureJiraHexColor,
  getJiraStatusColor,
} from '../../utils/jiraStatusColors';
import { parseJiraDescriptionHTML } from '../../utils/jiraDescriptionParser';
import { getJiraConfig } from '../../services/jiraService';
import { fetchJiraAttachmentAsDataUrl } from '../../utils/jiraAttachmentFetch';
import { TestTypeBadge } from '../common/TestTypeBadge';
import { FileViewer } from '../common/FileViewer';
import { ImageModal } from '../common/ImageModal';
import { detectFileType } from '../../services/fileViewerService';
import { JiraAttachment } from './JiraAttachment';
import { JiraRichContent } from './JiraRichContent';
import {
  loadTaskTestStatus,
  saveTaskTestStatus,
  calculateTaskTestStatus,
  isStandaloneContainerIssue,
} from '../../services/taskTestStatusService';
import { logger } from '../../utils/logger';
import { cn } from '../../utils/cn';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useJiraAttachmentViewer } from '../../hooks/useJiraAttachmentViewer';
import { TestCasesFreshnessIndicator } from './TestCasesFreshnessIndicator';
import { TestCaseDetailLevelControl } from './TestCaseDetailLevelControl';
import { BddScenarioActionBar } from './BddScenarioActionBar';
import { TaskActionStrip } from './TaskActionStrip';
import {
  TASK_ACTION_SLOT_CLASSNAMES,
  taskCardBadgePillShape,
  taskCardBadgePillTypography,
  taskCardBadgeTechShape,
  taskCardBadgeTechTypography,
  taskCardIdTypography,
  taskCardMetadataStripTypography,
  taskCardTitleClass,
  taskCardSectionTitleClass,
  taskCardMutedClass,
  taskCardShellClass,
  taskCardSubtreeExpandSlotClass,
  taskModalSectionClass,
  taskUiTagSuccessClass,
  taskUiTagClass,
} from './taskActionLayout';
import { JiraStatusLozenge } from './JiraStatusLozenge';
import { TaskJiraStatusDropdown } from './TaskJiraStatusDropdown';
import { TaskCardQaInsights } from './TaskCardQaInsights';
import {
  getTaskQaRiskLevel,
  getTaskQaRiskSignals,
  getTaskIaAnalysisSnapshotHash,
} from '../../services/ai/generalAnalysisService';
import { isAnalysisOutdated } from '../../utils/analysisFreshness';
import { resolveTaskStoryPoints } from '../../utils/taskStoryPoints';
import { resolveTaskDisplaySprint } from '../../utils/taskSprintDisplay';
import { TaskSprintBadge } from './TaskSprintBadge';
import {
  getTaskTypeLeftBorderClass,
  getTaskRiskBadgeClass,
  getTaskQaCoverageAlerts,
} from '../../utils/taskCardQa';

/** Destaque da ação IA principal — halo via tokens Daisy (oklch) + animação existente. */
const gerarTudoDestaqueClass =
  'animate-ai-card-border glow-primary ring-2 ring-[color-mix(in_oklch,oklch(var(--p))_32%,transparent)] ring-offset-2 ring-offset-base-100 dark:ring-offset-base-200 hover:ring-[color-mix(in_oklch,oklch(var(--p))_45%,transparent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[oklch(var(--p))] transition-[color,box-shadow,filter,background-color]';

// Componente para renderizar descrição com formatação rica do Jira
const DescriptionRenderer: React.FC<{
  description: unknown;
  jiraAttachments?: Array<{
    id: string;
    filename: string;
    size: number;
    created: string;
    author: string;
  }>;
}> = ({ description, jiraAttachments }) => {
  // Garantir que description existe
  if (!description) {
    return <p className="text-base-content/70 italic">Sem descrição</p>;
  }

  // Obter configuração do Jira para processar imagens
  const jiraConfig = getJiraConfig();
  const jiraUrl = jiraConfig?.url;

  // Sempre usar o parser central para aplicar limites defensivos antes do render rico.
  const htmlContent = parseJiraDescriptionHTML(description, jiraUrl, jiraAttachments);

  // Se não há conteúdo após processamento, mostrar mensagem
  if (!htmlContent || htmlContent.trim() === '') {
    return <p className="text-base-content/70 italic">Sem descrição</p>;
  }

  return <JiraRichContent html={htmlContent} className="" />;
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

export const JiraTaskItem: React.FC<{
  task: TaskWithChildren;
  onTestCaseStatusChange: (testCaseId: string, status: TestCase['status']) => void;
  onTestCaseObservedResultChange?: (testCaseId: string, value: string) => void;
  onTestCaseExecutionKindChange?: (testCaseId: string, kind: TestCase['executionKind']) => void;
  onTaskToolsChange?: (tools: string[]) => void;
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
  onUpdateFromJira?: (taskId: string) => Promise<void>;
  isUpdatingFromJira?: boolean;
  onSaveBddScenario: (
    taskId: string,
    scenario: Omit<BddScenario, 'id'>,
    scenarioId?: string
  ) => void;
  onDeleteBddScenario: (taskId: string, scenarioId: string) => void;
  onTaskStatusChange: (status: 'To Do' | 'In Progress' | 'Done') => void;
  /** Propaga mudança de status Jira para a API (com rollback em caso de erro). */
  onJiraStatusChange?: (
    jiraStatusName: string,
    rollback: { status: JiraTask['status']; jiraStatus?: string }
  ) => void | Promise<void>;
  isTransitioningJiraStatus?: boolean;
  onAddTestCaseFromTemplate?: (taskId: string) => void;
  onAddComment?: (content: string) => void;
  onEditComment?: (commentId: string, content: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onEditTestCase?: (taskId: string, testCase: TestCase) => void;
  onDeleteTestCase?: (taskId: string, testCaseId: string) => void;
  onDuplicateTestCase?: (taskId: string, testCase: TestCase) => void;
  project?: Project;
  onUpdateProject?: (project: Project) => void;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  children?: React.ReactNode;
  level: number;
  activeTaskId?: string | null;
  onFocusTask?: (taskId: string | null) => void;
  onOpenModal?: (task: JiraTask) => void;
  onToggleFavorite?: () => void;
  /** Detalhes inline abertos/fechados — breadcrumb no projeto. */
  onDetailsOpenChange?: (taskId: string, isOpen: boolean) => void;
}> = React.memo(
  ({
    task,
    onTestCaseStatusChange,
    onTestCaseObservedResultChange,
    onTestCaseExecutionKindChange,
    onTaskToolsChange,
    onStrategyExecutedChange,
    onStrategyToolsChange,
    onDelete,
    onGenerateTests,
    isGenerating: isGeneratingTests,
    onAddSubtask,
    onEdit,
    onGenerateBddScenarios,
    isGeneratingBdd,
    onGenerateAll,
    isGeneratingAll,
    onSyncToJira,
    isSyncing,
    onUpdateFromJira,
    isUpdatingFromJira,
    onSaveBddScenario,
    onDeleteBddScenario,
    onTaskStatusChange,
    onJiraStatusChange,
    isTransitioningJiraStatus = false,
    onAddTestCaseFromTemplate,
    onAddComment,
    onEditComment,
    onDeleteComment,
    onEditTestCase,
    onDeleteTestCase,
    onDuplicateTestCase,
    project,
    onUpdateProject,
    isSelected,
    onToggleSelect,
    children,
    level,
    activeTaskId,
    onFocusTask,
    onOpenModal,
    onToggleFavorite,
    onDetailsOpenChange,
  }) => {
    const reduceMotion = useReducedMotion();
    const [isDetailsOpen, setIsDetailsOpen] = useState(false); // Colapsado por padrão para compactar
    const [isChildrenOpen, setIsChildrenOpen] = useState(false);
    const [editingBddScenario, setEditingBddScenario] = useState<BddScenario | null>(null);
    const [isCreatingBdd, setIsCreatingBdd] = useState(false);
    const [detailLevel, setDetailLevel] = useState<TestCaseDetailLevel>('Estruturado');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showTestReport, setShowTestReport] = useState(false);
    const {
      viewingJiraAttachment,
      setViewingJiraAttachment,
      loadingJiraAttachmentId,
      handleViewJiraAttachment,
    } = useJiraAttachmentViewer();
    const [activeSection, setActiveSection] = useState<DetailSection>('overview');
    const [activeTestSubSection, setActiveTestSubSection] = useState<TestSubSection>('strategy');
    const [taskTestStatus, setTaskTestStatus] = useState<TaskTestStatus | null>(
      task.testStatus || null
    );
    const hasTests = task.testCases && task.testCases.length > 0;
    const hasChildren = task.children && task.children.length > 0;
    const nextStep = getNextStepForTask(task);
    const safeDomId = useMemo(() => task.id.replace(/[^a-zA-Z0-9_-]/g, '_'), [task.id]);
    const detailsRegionId = `task-details-${safeDomId}`;
    const childrenRegionId = `task-children-${safeDomId}`;
    const taskTypeNorm = (task.type || '').toLowerCase();
    const showTestExecutionSummary = task.type === 'Tarefa' || task.type === 'Bug';
    const showGenerateAllAction = ['tarefa', 'bug', 'task'].includes(taskTypeNorm) && !!onGenerateAll;
    const standaloneContainerIssue = useMemo(
      () => isStandaloneContainerIssue(task, project?.tasks ?? []),
      [task, project?.tasks]
    );
    const containerTestStatusLabel = useMemo(() => {
      if (!standaloneContainerIssue) return undefined;
      return taskTestStatus === 'teste_concluido' ? 'Reabrir' : 'Concluir';
    }, [standaloneContainerIssue, taskTestStatus]);

    /** Título do card: apenas o título da própria tarefa (sem prefixo Epic/História). */
    const displayTitle = task.title;

    const taskRiskLevel = useMemo(() => getTaskQaRiskLevel(task), [task]);
    const taskRiskSignals = useMemo(() => getTaskQaRiskSignals(task), [task]);
    const taskRiskTooltip = useMemo(() => {
      const base = `Risco ${taskRiskLevel}`;
      if (!taskRiskSignals.length) return base;
      return `${base}: ${taskRiskSignals.join(' · ')}`;
    }, [taskRiskLevel, taskRiskSignals]);
    const storyPointsDisplay = useMemo(() => resolveTaskStoryPoints(task), [task]);
    const displaySprint = useMemo(() => resolveTaskDisplaySprint(task), [task]);

    const iaAnalysisStale = useMemo(() => {
      if (!task.iaAnalysis) return false;
      return isAnalysisOutdated(task.iaAnalysis, getTaskIaAnalysisSnapshotHash(task));
    }, [task]);

    const taskQaAlerts = useMemo(
      () => getTaskQaCoverageAlerts(task, taskTypeNorm),
      [task, taskTypeNorm]
    );

    const showTaskQaInsights = showTestExecutionSummary || taskQaAlerts.length > 0 || iaAnalysisStale;

    /**
     * Acento lateral: favorito (âmbar) ou cor por tipo de issue.
     */
    const taskCardLeftAccentClass = useMemo(() => {
      if (task.isFavorite) return 'border-l-4 border-l-amber-500';
      return getTaskTypeLeftBorderClass(task.type);
    }, [task.isFavorite, task.type]);
    const typeBadgeVariant = useMemo((): React.ComponentProps<typeof Badge>['variant'] => {
      if (['tarefa', 'task'].includes(taskTypeNorm)) return 'info';
      if (taskTypeNorm === 'bug') return 'error';
      if (['história', 'story'].includes(taskTypeNorm)) return 'success';
      if (taskTypeNorm === 'epic') return 'primary';
      return 'neutral';
    }, [taskTypeNorm]);

    const currentDisplayStatusLabel = getDisplayStatusLabel(task, project);
    const jiraStatusPalette = project?.settings?.jiraStatuses;
    const currentStatusColor = useMemo(() => {
      const statusName = currentDisplayStatusLabel;
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
    }, [currentDisplayStatusLabel, jiraStatusPalette]);

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
        pending: Math.max(total - executed, 0),
      };
    }, [task.testCases]);

    // Carregar status de teste do Supabase ao montar
    useEffect(() => {
      const loadTestStatus = async () => {
        if (!task.id || taskTestStatus !== null) return; // Já carregado ou não tem ID válido

        const normalizeContainerStatus = (status: TaskTestStatus): TaskTestStatus => {
          if (
            isStandaloneContainerIssue(task, project?.tasks ?? []) &&
            status === 'pendente'
          ) {
            return 'testar';
          }
          return status;
        };

        try {
          const status = await loadTaskTestStatus(task.id);
          if (status !== null) {
            const normalized = normalizeContainerStatus(status);
            setTaskTestStatus(normalized);
            if (project && onUpdateProject && task.testStatus !== normalized) {
              const updatedTasks = project.tasks.map(t =>
                t.id === task.id ? { ...t, testStatus: normalized } : t
              );
              onUpdateProject({ ...project, tasks: updatedTasks });
            }
          } else {
            const calculatedStatus = normalizeContainerStatus(
              calculateTaskTestStatus(task, project?.tasks || [])
            );
            setTaskTestStatus(calculatedStatus);
          }
        } catch (error) {
          logger.warn('Erro ao carregar status de teste do Supabase', 'JiraTaskItem', error);
          const calculatedStatus = normalizeContainerStatus(
            calculateTaskTestStatus(task, project?.tasks || [])
          );
          setTaskTestStatus(calculatedStatus);
        } finally {
          // sem estado local de loading: o card já reflete a atualização via status calculado/sincronizado
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
        calculatedStatus !== taskTestStatus &&
        (taskTestStatus === null ||
          calculatedStatus === 'teste_concluido' ||
          calculatedStatus === 'pendente' ||
          taskTestStatus === 'testar');

      if (
        standaloneContainerIssue &&
        taskTestStatus === 'teste_concluido' &&
        calculatedStatus !== 'teste_concluido'
      ) {
        return;
      }

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
    }, [task.testCases, task.id, project?.tasks, standaloneContainerIssue, taskTestStatus]);

    // Função para atualizar e salvar status
    const updateTestStatus = useCallback(
      async (newStatus: TaskTestStatus) => {
        setTaskTestStatus(newStatus);

        if (task.id) {
          try {
            await saveTaskTestStatus(task.id, newStatus);
            logger.debug(
              `Status de teste atualizado para ${task.id}: ${newStatus}`,
              'JiraTaskItem'
            );
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
      },
      [task.id, project, onUpdateProject]
    );

    // Função para iniciar teste
    const handleStartTest = useCallback(
      async (e: React.MouseEvent) => {
        e.stopPropagation();
        await updateTestStatus('testando');
      },
      [updateTestStatus]
    );

    // Função para concluir teste
    const handleCompleteTest = useCallback(
      async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
          const calculatedStatus = calculateTaskTestStatus(task, project?.tasks || []);
          // Se todos os testes passaram, marcar como concluído, senão pendente
          const finalStatus =
            calculatedStatus === 'teste_concluido' ? 'teste_concluido' : 'pendente';
          await updateTestStatus(finalStatus);
        } catch (error) {
          logger.error('Erro ao concluir teste', 'JiraTaskItem', error);
        }
      },
      [task, project, onUpdateProject]
    );

    const handleTestStatusBadgeClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        if (standaloneContainerIssue) {
          if (taskTestStatus === 'teste_concluido') {
            void updateTestStatus('testar');
          } else {
            void updateTestStatus('teste_concluido');
          }
          return;
        }
        if (taskTestStatus === 'testar') void handleStartTest(e);
        else if (taskTestStatus === 'testando') void handleCompleteTest(e);
        else if (taskTestStatus === 'teste_concluido') void updateTestStatus('pendente');
        else void updateTestStatus('testar');
      },
      [
        standaloneContainerIssue,
        taskTestStatus,
        updateTestStatus,
        handleStartTest,
        handleCompleteTest,
      ]
    );

    const handleGenerateAll = useCallback(
      async (e?: React.MouseEvent) => {
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
      },
      [onGenerateAll, task.id, detailLevel]
    );

    const testTypeBadges = useMemo(() => {
      const typeMap = new Map<
        string,
        {
          total: number;
          executed: number;
          failed: number;
          hasStrategy: boolean;
          strategyExecuted: boolean;
        }
      >();
      const ensureType = (type: string) => {
        if (!typeMap.has(type)) {
          typeMap.set(type, {
            total: 0,
            executed: 0,
            failed: 0,
            hasStrategy: false,
            strategyExecuted: false,
          });
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

      const aggregateType =
        (task.testStrategy || []).find(s => s.testType)?.testType || 'Testes Gerais';

      (task.testCases || []).forEach(testCase => {
        const entry = ensureType(aggregateType);
        entry.total += 1;
        if (testCase.status !== 'Not Run') {
          entry.executed += 1;
        }
        if (testCase.status === 'Failed') {
          entry.failed += 1;
        }
      });

      return Array.from(typeMap.entries())
        .map(([type, data]) => {
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

          const label =
            data.total > 0
              ? `${data.executed}/${data.total}`
              : data.hasStrategy
                ? 'Planejado'
                : '—';

          return { type, status, label };
        })
        .sort((a, b) => a.type.localeCompare(b.type));
    }, [task.testCases, task.testStrategy, task.executedStrategies]);

    const sectionTabs = useMemo(() => {
      const tabs: { id: DetailSection; label: string; badge?: number }[] = [
        { id: 'overview', label: 'Resumo' },
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
        const planningBadge =
          (task.dependencies?.length || 0) +
          (task.attachments?.length || 0) +
          (task.checklist?.length || 0) +
          (task.estimatedHours ? 1 : 0);
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
      onAddComment,
    ]);

    const prevActiveSectionRef = useRef<DetailSection>(activeSection);
    const [sectionEnterDirection, setSectionEnterDirection] = useState<1 | -1>(1);

    useEffect(() => {
      const prev = prevActiveSectionRef.current;
      if (prev !== activeSection) {
        const oldIdx = sectionTabs.findIndex(t => t.id === prev);
        const newIdx = sectionTabs.findIndex(t => t.id === activeSection);
        if (oldIdx >= 0 && newIdx >= 0 && oldIdx !== newIdx) {
          setSectionEnterDirection(newIdx > oldIdx ? 1 : -1);
        }
        prevActiveSectionRef.current = activeSection;
      }
    }, [activeSection, sectionTabs]);

    useEffect(() => {
      onDetailsOpenChange?.(task.id, isDetailsOpen);
    }, [task.id, isDetailsOpen, onDetailsOpenChange]);

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
      if (
        (activeSection === 'tests' || activeSection === 'bdd') &&
        task.type !== 'Tarefa' &&
        task.type !== 'Bug'
      ) {
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

    const handleOpenTaskDetails = (e: React.SyntheticEvent) => {
      e.stopPropagation();
      if (onOpenModal) {
        onOpenModal(task);
      } else {
        handleToggleDetails();
      }
    };

    const taskDetailsTriggerLabel = onOpenModal
      ? `Abrir detalhes da tarefa ${task.id}`
      : isDetailsOpen
        ? `Colapsar detalhes da tarefa ${task.id}`
        : `Expandir detalhes da tarefa ${task.id}`;

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

    /** Ícones compactos no desktop; área tocável ≥44px no mobile (WCAG) */
    const iconTouchTargetClass =
      'win-icon-button sm:!min-h-8 sm:!min-w-8 sm:!h-8 sm:!w-8 p-0 [&_svg]:size-[18px] sm:[&_svg]:size-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_oklch,oklch(var(--p))_35%,transparent)]';

    const renderOverviewSection = () => (
      <div className="space-y-3">
        {project && onUpdateProject && (
          <div>
            <QuickActions task={task} project={project} onUpdateProject={onUpdateProject} />
          </div>
        )}

        {/* Botão para Gerar Registro de Testes - para tipos "Tarefa" e "Bug" */}
        {(task.type === 'Tarefa' || task.type === 'Bug') &&
          (task.testCases?.length > 0 || (task.testStrategy?.length ?? 0) > 0) && (
            <div className="flex justify-end">
              <Button
                variant="brandOutline"
                size="panel"
                onClick={() => setShowTestReport(true)}
                aria-label="Gerar registro de testes"
                className="hover:border-primary/40"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
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
          <div className="mt-1.5 flex items-center gap-2 rounded-[var(--radius)] border border-[var(--brand-surface-border)] bg-[var(--brand-chip)] p-2.5">
            <p className="text-sm font-medium flex-1">Ações de Teste:</p>
            {taskTestStatus === 'testar' && (
              <button
                type="button"
                className="btn btn-sm btn-info rounded-[var(--radius)] soft-shadow"
                onClick={handleStartTest}
              >
                <span className="mr-1">▶</span> Iniciar Teste
              </button>
            )}
            {taskTestStatus === 'testando' && (
              <button
                type="button"
                onClick={handleCompleteTest}
                className="btn btn-sm btn-success rounded-[var(--radius)] soft-shadow"
              >
                <span className="mr-1">✓</span> Concluir Teste
              </button>
            )}
          </div>
        )}

        {(task.priority ||
          task.severity ||
          task.owner ||
          task.assignee ||
          task.jiraAssignee?.displayName ||
          nextStep) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {task.owner && (
              <div className={cn(taskModalSectionClass, 'p-2.5')}>
                <p className="text-[11px] uppercase text-base-content/60 tracking-wide">Owner</p>
                <p className="text-sm font-semibold text-base-content">{task.owner}</p>
              </div>
            )}
            {(task.jiraAssignee?.displayName ?? task.assignee) && (
              <div className={cn(taskModalSectionClass, 'p-2.5')}>
                <p className="text-[11px] uppercase text-base-content/60 tracking-wide">
                  Responsável
                </p>
                <p className="text-sm font-semibold text-base-content">
                  {task.jiraAssignee?.displayName ?? task.assignee}
                </p>
              </div>
            )}
            {task.priority && (
              <div className={cn(taskModalSectionClass, 'p-2.5')}>
                <p className="text-[11px] uppercase text-base-content/60 tracking-wide">
                  Prioridade
                </p>
                <p className="text-sm font-semibold text-base-content">{task.priority}</p>
              </div>
            )}
            {task.severity && (
              <div className={cn(taskModalSectionClass, 'p-2.5')}>
                <p className="text-[11px] uppercase text-base-content/60 tracking-wide">
                  Severidade
                </p>
                <p className="text-sm font-semibold text-base-content">{task.severity}</p>
              </div>
            )}
            {nextStep && (
              <div className="rounded-[var(--radius)] border border-primary/30 bg-primary/5 p-2.5">
                <p className="text-[0.65rem] uppercase tracking-wide text-primary">Próximo passo</p>
                <p className="text-[0.82rem] font-semibold text-base-content line-clamp-2">
                  {nextStep}
                </p>
              </div>
            )}
          </div>
        )}
        {(() => {
          const versions = getTaskVersions(task);
          const otherTags = task.tags?.filter(tag => !/^V\d+/i.test(tag.trim())) || [];

          return (
            (versions.length > 0 || otherTags.length > 0) && (
              <div className="space-y-2">
                {versions.length > 0 && (
                  <div>
                    <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">
                      Versão do Projeto
                    </p>
                    <VersionBadges versions={versions} size="md" />
                  </div>
                )}
                {otherTags.length > 0 && (
                  <div>
                    {versions.length > 0 && (
                      <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">
                        Tags
                      </p>
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
            )
          );
        })()}

        {(task.type === 'Tarefa' || task.type === 'Bug') && testTypeBadges.length > 0 && (
          <div>
            <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">
              Estratégias de Teste
            </p>
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

        {/* Seção de Campos do Jira - exibe quando houver qualquer dado vindo do Jira */}
        {(() => {
          const hasJiraFields =
            task.dueDate ||
            task.timeTracking ||
            task.components ||
            task.fixVersions ||
            task.environment ||
            task.reporter ||
            task.watchers ||
            task.issueLinks ||
            task.jiraAttachments;

          if (!hasJiraFields) {
            return null;
          }

          return (
            <div className="mt-4 space-y-3">
              <h3 className="text-lg font-semibold text-base-content flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                Campos do Jira
              </h3>

              {/* Informações Básicas */}
              {(task.reporter || task.dueDate || task.environment) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-base-content/70">
                    📋 Informações Básicas
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {task.reporter && (
                      <div className={cn(taskModalSectionClass, 'p-2.5')}>
                        <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">
                          Reporter
                        </p>
                        <p className="text-sm font-semibold text-base-content">
                          {task.reporter.displayName}
                        </p>
                        {task.reporter.emailAddress && (
                          <p className="text-xs text-base-content/70 mt-1">
                            {task.reporter.emailAddress}
                          </p>
                        )}
                      </div>
                    )}
                    {task.dueDate && (
                      <div className={cn(taskModalSectionClass, 'p-2.5')}>
                        <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">
                          Due Date
                        </p>
                        <p className="text-sm font-semibold text-base-content">
                          {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    )}
                    {task.environment && (
                      <div className="p-2.5 bg-base-100 border border-base-300 rounded-[var(--radius)] md:col-span-2">
                        <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">
                          Environment
                        </p>
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {task.timeTracking.originalEstimate && (
                      <div className={cn(taskModalSectionClass, 'p-2.5')}>
                        <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">
                          Original Estimate
                        </p>
                        <p className="text-sm font-semibold text-base-content">
                          {task.timeTracking.originalEstimate}
                        </p>
                      </div>
                    )}
                    {task.timeTracking.remainingEstimate && (
                      <div className={cn(taskModalSectionClass, 'p-2.5')}>
                        <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">
                          Remaining Estimate
                        </p>
                        <p className="text-sm font-semibold text-base-content">
                          {task.timeTracking.remainingEstimate}
                        </p>
                      </div>
                    )}
                    {task.timeTracking.timeSpent && (
                      <div className={cn(taskModalSectionClass, 'p-2.5')}>
                        <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">
                          Time Spent
                        </p>
                        <p className="text-sm font-semibold text-base-content">
                          {task.timeTracking.timeSpent}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Organização */}
              {(task.components || task.fixVersions) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-base-content/70">🧩 Organização</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {task.components && task.components.length > 0 && (
                      <div className={cn(taskModalSectionClass, 'p-2.5')}>
                        <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-2">
                          Components
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {task.components.map(comp => (
                            <span
                              key={comp.id}
                              className="badge badge-info badge-outline badge-sm font-normal"
                            >
                              {comp.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {task.fixVersions && task.fixVersions.length > 0 && (
                      <div className={cn(taskModalSectionClass, 'p-2.5')}>
                        <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-2">
                          Fix Versions
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {task.fixVersions.map(version => (
                            <span
                              key={version.id}
                              className={cn(taskUiTagClass, taskUiTagSuccessClass, 'px-2 py-1')}
                            >
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
                    <div className={cn(taskModalSectionClass, 'p-2.5')}>
                      <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-2">
                        Issue Links
                      </p>
                      <div className="space-y-1">
                        {task.issueLinks.map(link => (
                          <div key={link.id} className="text-sm text-base-content">
                            <span className="text-base-content/70">{link.type}</span>{' '}
                            {link.relatedKey}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {task.watchers && (
                    <div className={cn(taskModalSectionClass, 'p-2.5')}>
                      <p className="text-[11px] uppercase text-base-content/60 tracking-wide mb-1">
                        Watchers
                      </p>
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
                  <div className={cn(taskModalSectionClass, 'p-2.5')}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                      {task.jiraAttachments.map(att => {
                        const jiraConfig = getJiraConfig();
                        const jiraUrl = jiraConfig?.url;
                        const attachmentUrl = jiraUrl
                          ? `${jiraUrl}/secure/attachment/${att.id}/${encodeURIComponent(att.filename)}`
                          : '';
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
      if (task.type !== 'Tarefa' && task.type !== 'Bug') {
        return null;
      }

      const bddCount = task.bddScenarios?.length || 0;
      const actionsDisabled = isGeneratingBdd || isCreatingBdd || !!editingBddScenario;

      return (
        <div className="space-y-4">
          <header className="mb-4">
            <h2 className="text-xl font-bold text-base-content">Cenários de Teste BDD</h2>
            <p className="text-sm text-base-content/70 mt-1">
              Gerencie e visualize seus critérios de aceite em formato Gherkin.
            </p>
            <span className="text-xs text-base-content/60 mt-1 block">{bddCount} cenário(s)</span>
          </header>

          <div className="space-y-4">
            {(task.bddScenarios || []).map(sc =>
              editingBddScenario?.id === sc.id ? (
                <BddScenarioForm
                  key={sc.id}
                  existingScenario={sc}
                  onSave={handleSaveScenario}
                  onCancel={handleCancelBddForm}
                />
              ) : (
                <BddScenarioItem
                  key={sc.id}
                  scenario={sc}
                  onEdit={() => setEditingBddScenario(sc)}
                  onDelete={() => onDeleteBddScenario(task.id, sc.id)}
                />
              )
            )}
          </div>
          {isCreatingBdd && !editingBddScenario && (
            <BddScenarioForm onSave={handleSaveScenario} onCancel={handleCancelBddForm} />
          )}
          {isGeneratingBdd && (
            <div className="flex justify-center py-2">
              <Spinner small />
            </div>
          )}

          <BddScenarioActionBar
            onGenerate={() => onGenerateBddScenarios(task.id)}
            onAddManual={() => setIsCreatingBdd(true)}
            disabled={actionsDisabled}
            className="mx-auto w-fit"
          />
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
          <div
            className="flex w-full flex-wrap gap-1 overflow-x-auto rounded-[var(--radius)] border border-base-300 bg-base-200/60 p-1 md:w-fit"
            role="tablist"
            aria-label="Sub-abas de testes"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTestSubSection === 'strategy'}
              onClick={() => setActiveTestSubSection('strategy')}
              className={`min-h-[44px] sm:min-h-0 inline-flex items-center rounded-[var(--radius)] px-3 py-2 font-heading text-xs font-medium transition-colors duration-200 sm:px-4 sm:py-2 sm:text-sm ${activeTestSubSection === 'strategy' ? 'bg-primary text-primary-content soft-shadow hover:bg-primary/90' : 'text-base-content/75 hover:bg-base-300/70 hover:text-base-content'}`}
            >
              Estratégia
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTestSubSection === 'test-cases'}
              onClick={() => setActiveTestSubSection('test-cases')}
              className={`min-h-[44px] sm:min-h-0 inline-flex items-center gap-1 rounded-[var(--radius)] px-3 py-2 font-heading text-xs font-medium transition-colors duration-200 sm:px-4 sm:py-2 sm:text-sm ${activeTestSubSection === 'test-cases' ? 'bg-primary text-primary-content soft-shadow hover:bg-primary/90' : 'text-base-content/75 hover:bg-base-300/70 hover:text-base-content'}`}
            >
              Casos de teste
              {task.testCases?.length ? (
                <span
                  className={`ml-1 rounded-[0.65rem] px-1.5 py-0.5 font-body text-xs font-medium ${activeTestSubSection === 'test-cases' ? 'bg-primary-content/20 text-primary-content' : 'bg-base-300 text-base-content'}`}
                >
                  {task.testCases.length}
                </span>
              ) : null}
            </button>
          </div>

          {/* Conteúdo da sub-aba "Estratégia de Teste" */}
          {activeTestSubSection === 'strategy' && (
            <div>
              <header className="flex items-center gap-3 mb-4">
                <div className="rounded-[var(--radius)] bg-primary/10 p-1.5">
                  <BarChart3 className="w-5 h-5 text-primary" aria-hidden />
                </div>
                <h2 className="text-lg font-bold text-base-content text-balance">
                  Estratégia de Teste
                </h2>
                <span className="text-xs font-medium text-base-content/70 bg-base-200 px-3 py-1 rounded-full">
                  {task.testStrategy?.length || 0} item(ns)
                </span>
              </header>
              {isGeneratingTests && (
                <div className="flex justify-center py-2">
                  <Spinner small />
                </div>
              )}
              {(task.testStrategy?.length ?? 0) > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
                  {(task.testStrategy ?? []).map((strategy, i) => {
                    if (!strategy) return null;
                    return (
                      <TestStrategyCard
                        key={i}
                        strategy={strategy}
                        strategyIndex={i}
                        isExecuted={
                          (task.executedStrategies && task.executedStrategies.includes(i)) || false
                        }
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
                      label: 'Gerar Estratégia com IA',
                      onClick: () => onGenerateTests(task.id, detailLevel),
                    }}
                    tip="A estratégia de teste ajuda a definir quais tipos de teste são necessários para validar esta funcionalidade."
                  />
                )
              )}
            </div>
          )}

          {/* Conteúdo da sub-aba "Casos de Teste" */}
          {activeTestSubSection === 'test-cases' && canHaveTestCases && (
            <TestCasesSection
              task={task}
              isGenerating={isGeneratingTests}
              onGenerateTests={onGenerateTests}
              detailLevel={detailLevel}
              onTestCaseStatusChange={onTestCaseStatusChange}
              onObservedResultChange={onTestCaseObservedResultChange}
              onTestCaseExecutionKindChange={onTestCaseExecutionKindChange}
              onEditTestCase={onEditTestCase}
              onDeleteTestCase={onDeleteTestCase}
              onDuplicateTestCase={onDuplicateTestCase}
              onAddTestCaseFromTemplate={onAddTestCaseFromTemplate}
            />
          )}

          {/* Ferramentas (Geral) + Nível de Detalhe + Regerar com IA */}
          <section className="mt-6 mica overflow-hidden rounded-[var(--rounded-box)] border border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] soft-shadow">
            <div className="flex flex-col gap-4 p-4 font-sans tracking-[var(--letter-spacing)] text-base-content lg:flex-row lg:items-center lg:gap-5">
              <div className="flex-grow">
                {onTaskToolsChange && (
                  <>
                    <h3 className="text-xs font-bold text-base-content mb-3 flex items-center gap-2">
                      <Wrench className="w-5 h-5 text-primary" aria-hidden />
                      Ferramentas Utilizadas (Geral)
                    </h3>
                    <ToolsSelector
                      selectedTools={task.toolsUsed || []}
                      onToolsChange={onTaskToolsChange}
                      label=""
                      compact={false}
                    />
                  </>
                )}
                {!onTaskToolsChange && <div className="h-0" />}
              </div>
              <div className="lg:w-80 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-base-200 pt-5 lg:pt-0 lg:pl-6">
                <TestCaseDetailLevelControl
                  idPrefix={task.id}
                  value={detailLevel}
                  onChange={setDetailLevel}
                  disabled={isGeneratingTests}
                />
                {!isGeneratingTests && (
                  <button
                    type="button"
                    onClick={() => onGenerateTests(task.id, detailLevel)}
                    className="btn btn-primary btn-sm min-h-[44px] w-full rounded-[var(--radius)] sm:min-h-0 flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" aria-hidden />
                    {(task.testCases?.length ?? 0) > 0 ? 'Regerar com IA' : 'Gerar com IA'}
                  </button>
                )}
                {isGeneratingTests && (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <Spinner small />
                    <span className="text-sm text-base-content/70">Gerando...</span>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      );
    };

    const renderPlanningSection = () => {
      if (!project || !onUpdateProject) {
        return (
          <p className="text-sm text-base-content/70">
            Conecte um projeto para gerenciar dependências e planejamento.
          </p>
        );
      }

      const cardTitleClass = taskCardSectionTitleClass;

      return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
          <div className="lg:col-span-7 space-y-3 sm:space-y-4 min-w-0">
            <section className={cn(taskModalSectionClass, 'task-card-shadow p-3 sm:p-4')}>
              <h2 className={cardTitleClass + ' mb-3'}>
                <Link className="w-4 h-4 sm:w-5 sm:h-5 text-primary/70 shrink-0" aria-hidden />
                Dependências
              </h2>
              <TaskLinksView task={task} project={project} onUpdateProject={onUpdateProject} />
            </section>

            <section className={cn(taskModalSectionClass, 'task-card-shadow p-3 sm:p-4')}>
              <h2 className={cardTitleClass + ' mb-3'}>
                <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-primary/70 shrink-0" aria-hidden />
                Anexos
                <span className="bg-base-200 text-base-content/70 text-xs px-2 py-0.5 rounded-full font-normal">
                  {task.attachments?.length ?? 0}
                </span>
              </h2>
              <AttachmentManager
                task={task}
                project={project}
                onUpdateProject={onUpdateProject}
                compact
              />
            </section>

            {task.checklist && task.checklist.length > 0 && (
              <section className={cn(taskModalSectionClass, 'task-card-shadow p-3 sm:p-4')}>
                <h2 className={cardTitleClass + ' mb-3'}>Checklist</h2>
                <ChecklistView
                  checklist={task.checklist}
                  onToggleItem={itemId => {
                    const updatedChecklist = updateChecklistItem(task.checklist!, itemId, {
                      checked: !task.checklist!.find(i => i.id === itemId)?.checked,
                    });
                    const updatedTasks = project.tasks.map(t =>
                      t.id === task.id ? { ...t, checklist: updatedChecklist } : t
                    );
                    onUpdateProject({ ...project, tasks: updatedTasks });
                  }}
                />
              </section>
            )}
          </div>

          <div className="lg:col-span-5 min-w-0 self-start">
            <section className={cn(taskModalSectionClass, 'task-card-shadow sticky top-20 p-3 sm:p-4 lg:top-24')}>
              <h2 className={cardTitleClass + ' mb-3'}>
                <Timer className="w-4 h-4 sm:w-5 sm:h-5 text-primary/70 shrink-0" aria-hidden />
                Estimativas
              </h2>
              <EstimationInput
                task={task}
                onSave={(estimatedHours, actualHours) => {
                  const updatedTasks = project.tasks.map(t =>
                    t.id === task.id ? { ...t, estimatedHours, actualHours } : t
                  );
                  onUpdateProject({ ...project, tasks: updatedTasks });
                }}
              />
            </section>
          </div>
        </div>
      );
    };

    const renderCollaborationSection = () => {
      if (!onAddComment) {
        return (
          <p className="text-sm text-base-content/70">
            Comentários indisponíveis para esta tarefa.
          </p>
        );
      }

      return (
        <div>
          <h3 className="text-lg font-semibold text-base-content mb-3">Comentários</h3>
          <CommentSection
            comments={task.comments || []}
            onAddComment={content => onAddComment(content)}
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

    // Sugestão de rodapé de navegação para o Agent implementar
    const renderNavigationFooter = () => {
      const currentIndex = sectionTabs.findIndex(tab => tab.id === activeSection);
      const prevTab = sectionTabs[currentIndex - 1];
      const nextTab = sectionTabs[currentIndex + 1];

      return (
        <nav
          className="flex justify-between items-center gap-2 mt-5 pt-3 border-t border-base-200"
          aria-label="Navegação entre seções da tarefa"
        >
          {prevTab ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => setActiveSection(prevTab.id)}
              aria-label={`Anterior: ${prevTab.label}`}
            >
              <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden />
              Anterior
            </Button>
          ) : (
            <span className="inline-flex min-w-[5rem]" aria-hidden />
          )}

          {nextTab ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => setActiveSection(nextTab.id)}
              aria-label={`Próximo: ${nextTab.label}`}
            >
              Próximo
              <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
            </Button>
          ) : (
            <span className="inline-flex min-w-[5rem]" aria-hidden />
          )}
        </nav>
      );
    };

    const handleChangeStatus = (newStatusValue: 'To Do' | 'In Progress' | 'Done' | string) => {
      const jiraStatuses = project?.settings?.jiraStatuses || [];

      const mapStatus = (jiraStatus: string): 'To Do' | 'In Progress' | 'Done' => {
        const status = (jiraStatus || '').toLowerCase();
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

      const isJiraStatus = jiraStatuses.some(status =>
        typeof status === 'string' ? status === newStatusValue : status.name === newStatusValue
      );

      if (isJiraStatus) {
        const mappedStatus = mapStatus(newStatusValue);
        const rollback = { status: task.status, jiraStatus: task.jiraStatus };
        onTaskStatusChange(mappedStatus);
        if (project && onUpdateProject) {
          const updatedTasks = project.tasks.map(t =>
            t.id === task.id ? { ...t, status: mappedStatus, jiraStatus: newStatusValue } : t
          );
          onUpdateProject({ ...project, tasks: updatedTasks });
        }
        if (onJiraStatusChange) {
          void Promise.resolve(onJiraStatusChange(newStatusValue, rollback));
        }
      } else {
        onTaskStatusChange(newStatusValue as 'To Do' | 'In Progress' | 'Done');
        if (project && onUpdateProject && task.jiraStatus) {
          const updatedTasks = project.tasks.map(t =>
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
        target.closest('[role="button"]') ||
        target.closest('.dropdown')
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

    const isAiProcessing = isGeneratingTests || isGeneratingBdd || isGeneratingAll || isGenerating;
    /** Destaque forte só para “Gerar tudo” / geração local do item (pedido UX). */
    const showBulkGenerateFeedback = isGenerating || isGeneratingAll;

    const aiPhaseMessage = useMemo(() => {
      if (!isAiProcessing) return '';
      if (isGenerating || isGeneratingAll) return 'Gerando BDD, estratégia e casos de teste…';
      if (isGeneratingBdd && isGeneratingTests) return 'Gerando BDD e casos de teste…';
      if (isGeneratingBdd) return 'Gerando cenários BDD…';
      if (isGeneratingTests) return 'Gerando casos de teste…';
      return 'Processando com IA…';
    }, [isAiProcessing, isGenerating, isGeneratingAll, isGeneratingBdd, isGeneratingTests]);

    const generateAllTitle =
      isGenerating || isGeneratingAll ? aiPhaseMessage || 'Gerando…' : 'Gerar Tudo (BDD e Testes)';
    const generateAllAriaLabel =
      isGenerating || isGeneratingAll ? aiPhaseMessage || 'Gerando' : 'Gerar Tudo (BDD e Testes)';

    return (
      <div
        className="relative max-md:focus-within:z-[300]"
        data-task-id={task.id}
      >
        <div style={indentationStyle} className="py-0.5">
          <div
            className={[
              taskCardShellClass,
              'flex min-w-0 flex-row items-start gap-2 overflow-visible sm:items-center sm:gap-3',
              'hover:border-[color-mix(in_srgb,var(--brand-cta)_20%,var(--brand-surface-border))] hover:bg-[var(--brand-surface-strong)]',
              level > 0
                ? 'bg-[color-mix(in_srgb,var(--brand-surface-strong)_88%,transparent)]'
                : '',
              activeTaskId === task.id ? 'ring-2 ring-primary/40' : '',
              isSelected
                ? 'border-[color-mix(in_srgb,var(--brand-cta)_35%,var(--brand-surface-border))] bg-[color-mix(in_srgb,var(--brand-cta)_6%,var(--brand-surface))] ring-1 ring-primary/30'
                : '',
              task.isFavorite ? 'ring-1 ring-amber-500/35' : '',
              taskCardLeftAccentClass,
              showBulkGenerateFeedback ? 'ring-2 ring-primary/50 animate-pulse' : '',
              isAiProcessing ? 'animate-ai-card-border' : '',
              onOpenModal
                ? 'cursor-pointer hover:translate-x-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2'
                : '',
            ].join(' ')}
            onClick={onOpenModal ? handleCardClick : undefined}
            onKeyDown={onOpenModal ? handleCardKeyDown : undefined}
            role={onOpenModal ? 'button' : undefined}
            tabIndex={onOpenModal ? 0 : undefined}
            aria-label={
              onOpenModal ? `Abrir detalhes da tarefa ${task.id}: ${task.title}` : undefined
            }
            aria-busy={isAiProcessing}
            title={isAiProcessing && aiPhaseMessage ? aiPhaseMessage : undefined}
          >
            <div className="flex shrink-0 flex-nowrap items-center gap-1.5 md:gap-2">
                {onToggleSelect && (
                  <input
                    type="checkbox"
                    checked={!!isSelected}
                    onChange={e => {
                      e.stopPropagation();
                      onToggleSelect();
                    }}
                    onClick={e => e.stopPropagation()}
                    className="checkbox checkbox-sm checkbox-highlight shrink-0"
                    aria-label={
                      isSelected
                        ? `Tarefa ${task.id} selecionada (clique para desselecionar)`
                        : `Selecionar tarefa ${task.id}`
                    }
                  />
                )}
                {onToggleFavorite && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      onToggleFavorite();
                    }}
                    className={`${iconTouchTargetClass} shrink-0 hover:bg-base-300/80`}
                    aria-label={task.isFavorite ? 'Desmarcar favorito' : 'Marcar como favorito'}
                  >
                    {task.isFavorite ? (
                      <Star
                        className="fill-warning text-warning drop-shadow-[0_0_6px_color-mix(in_oklch,oklch(var(--wa))_45%,transparent)]"
                        aria-hidden
                      />
                    ) : (
                      <Star className="text-[var(--brand-text-muted)]" aria-hidden />
                    )}
                  </button>
                )}
                <div
                  className={taskCardSubtreeExpandSlotClass}
                  aria-hidden={!hasChildren}
                >
                  {hasChildren ? (
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        setIsChildrenOpen(!isChildrenOpen);
                      }}
                      className="btn btn-ghost btn-xs flex h-full min-h-0 w-full min-w-0 items-center justify-center gap-0.5 rounded-[inherit] border-0 bg-transparent px-0 py-0 shadow-none hover:bg-base-300/80 [&_svg:first-child]:size-[18px] sm:[&_svg:first-child]:size-4"
                      aria-label={
                        isChildrenOpen
                          ? `Colapsar ${task.children.length} subtarefas de ${task.id}`
                          : `Expandir ${task.children.length} subtarefas de ${task.id}`
                      }
                    >
                      <ChevronDown
                        className={cn(
                          'shrink-0 transition-transform',
                          isChildrenOpen && 'rotate-180'
                        )}
                        aria-hidden="true"
                      />
                      <span className="rounded-full bg-[var(--brand-chip)] px-1.5 py-0.5 text-[10px] tabular-nums text-[var(--brand-text-muted)]">
                        {task.children.length}
                      </span>
                    </button>
                  ) : (
                    <span className="pointer-events-none flex items-center gap-0.5 opacity-0 select-none">
                      <ChevronDown
                        className="size-[18px] shrink-0 sm:size-4"
                        aria-hidden="true"
                      />
                      <span className="min-w-[1.25rem] rounded-full bg-[var(--brand-chip)] px-1.5 py-0.5 text-[10px] tabular-nums">
                        0
                      </span>
                    </span>
                  )}
                </div>
            </div>
            <div
              className={cn(
                'flex min-w-0 flex-1 flex-col gap-1 overflow-hidden max-md:min-w-full md:flex-row md:items-center md:gap-2'
              )}
            >
            <div
              className={cn(
                'inline-flex w-fit max-w-full shrink-0 flex-nowrap items-center gap-x-1.5 overflow-x-auto overflow-y-visible rounded-md border border-[var(--brand-surface-border)] bg-[color-mix(in_srgb,var(--brand-surface-strong)_70%,transparent)] px-1.5 py-0.5 text-[var(--brand-text-muted)] [scrollbar-width:thin] md:max-w-[min(100%,42rem)]',
                taskCardMetadataStripTypography
              )}
              role="group"
              aria-label="Metadados da tarefa"
            >
              <JiraIssueTypeIcon
                type={task.type}
                iconUrl={task.jiraIssueTypeIconUrl}
                size={14}
                className="shrink-0"
              />
              <button
                type="button"
                onClick={handleOpenTaskDetails}
                className={cn(
                  'shrink-0 cursor-pointer rounded-sm text-[color:var(--color-primary-deep)] underline-offset-2 transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
                  taskCardIdTypography
                )}
                aria-label={taskDetailsTriggerLabel}
                aria-expanded={onOpenModal ? undefined : isDetailsOpen}
              >
                {task.id}
              </button>
              <span className="shrink-0 opacity-60" aria-hidden>
                ·
              </span>
              <Badge
                appearance="pill"
                variant={typeBadgeVariant}
                size="xs"
                className={cn(
                  'badge-task-format app-nav-pill shrink-0 !px-1.5 !py-0 !text-[9px] !font-bold !leading-none',
                  taskCardBadgePillShape,
                  taskCardBadgePillTypography,
                  task.type === 'Epic' && 'jira-task-epic-type-pill'
                )}
              >
                {task.type}
              </Badge>
              <span className="shrink-0 opacity-60" aria-hidden>
                ·
              </span>
              {project?.settings?.jiraStatuses && project.settings.jiraStatuses.length > 0 ? (
                <TaskJiraStatusDropdown
                  variant="lozenge"
                  currentLabel={currentDisplayStatusLabel}
                  currentStatusColor={currentStatusColor}
                  jiraStatuses={project.settings.jiraStatuses}
                  onSelectStatus={handleChangeStatus}
                  disabled={isTransitioningJiraStatus}
                  className="shrink-0"
                />
              ) : (
                <JiraStatusLozenge
                  label={currentDisplayStatusLabel}
                  statusColor={currentStatusColor}
                  className="shrink-0"
                />
              )}
              {storyPointsDisplay > 0 ? (
                <>
                  <span className="shrink-0 opacity-60" aria-hidden>
                    ·
                  </span>
                  <span
                    className={cn('shrink-0 text-[var(--brand-text-muted)]', taskCardBadgeTechShape, taskCardBadgeTechTypography)}
                    title="Story Points"
                  >
                    {storyPointsDisplay} SP
                  </span>
                </>
              ) : null}
              {displaySprint ? (
                <>
                  <span className="shrink-0 opacity-60" aria-hidden>
                    ·
                  </span>
                  <TaskSprintBadge sprint={displaySprint} />
                </>
              ) : null}
              {showTestExecutionSummary ? (
                <span className={getTaskRiskBadgeClass(taskRiskLevel)} title={taskRiskTooltip}>
                  {taskRiskLevel}
                </span>
              ) : null}
            </div>
            <div
              className={cn(
                'flex min-w-0 flex-1 flex-col gap-1 overflow-hidden max-md:w-full sm:flex-row sm:items-center sm:gap-2'
              )}
            >
              <span
                className={cn(
                  'min-w-0 flex-1 break-words line-clamp-2 sm:line-clamp-1',
                  taskCardTitleClass
                )}
                title={displayTitle}
              >
                {displayTitle}
              </span>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5 max-md:w-full sm:flex-nowrap">
                {(task.type === 'Tarefa' || task.type === 'Bug') && (
                  <TestCasesFreshnessIndicator
                    task={task}
                    variant="compact"
                    isGenerating={isGeneratingTests || !!isGeneratingAll || isGenerating}
                    className="inline-flex shrink-0"
                  />
                )}
                {showTaskQaInsights ? (
                  <TaskCardQaInsights
                    variant="inline"
                    counts={{
                      total: testExecutionSummary.total,
                      passed: testExecutionSummary.passed,
                      failed: testExecutionSummary.failed,
                      pending: testExecutionSummary.pending,
                    }}
                    qaAlerts={taskQaAlerts}
                    iaAnalysisStale={iaAnalysisStale}
                    className="shrink-0"
                  />
                ) : null}
              </div>
            </div>
            </div>

            <div
              className={cn(
                'flex shrink-0 flex-nowrap items-center justify-end gap-2',
                'z-20 min-w-0 overflow-visible'
              )}
              onClick={e => e.stopPropagation()}
            >
              <TaskActionStrip
                aiPhaseMessage={aiPhaseMessage}
                isAiProcessing={isAiProcessing}
                showMetrics={false}
                metrics={testExecutionSummary}
                showGenerateAll={showGenerateAllAction}
                onGenerateAll={e => {
                  e.stopPropagation();
                  handleGenerateAll(e);
                }}
                isGenerateAllBusy={isGenerating || isGeneratingAll}
                isGenerateAllDisabled={
                  isGeneratingAll || isGenerating || isGeneratingBdd || isGeneratingTests
                }
                generateAllTitle={generateAllTitle}
                generateAllAriaLabel={generateAllAriaLabel}
                testStatus={taskTestStatus ?? 'testar'}
                testStatusLabelOverride={containerTestStatusLabel}
                onTestStatusClick={handleTestStatusBadgeClick}
              />

              <div
                className="dropdown dropdown-end md:hidden relative z-30 shrink-0 overflow-visible"
                onClick={e => e.stopPropagation()}
              >
                <button
                  type="button"
                  tabIndex={0}
                  className="win-icon-button sm:!min-h-9 sm:!min-w-9"
                  aria-label="Ações da tarefa"
                  aria-haspopup="true"
                >
                  <MoreVertical className="h-5 w-5" aria-hidden />
                </button>
                <ul
                  tabIndex={0}
                  className="dropdown-content menu mica z-50 mt-1 w-64 max-w-[min(100vw-2rem,18rem)] !rounded-[var(--rounded-box)] border border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] p-2"
                  onClick={e => e.stopPropagation()}
                >
                  {isAiProcessing && aiPhaseMessage ? (
                    <li className="menu-title">
                      <span className="flex items-center gap-2 text-xs font-normal text-primary">
                        <span className="loading loading-spinner loading-xs text-primary" />
                        <span className="truncate">{aiPhaseMessage}</span>
                      </span>
                    </li>
                  ) : null}
                  {(task.type === 'Tarefa' || task.type === 'Bug') && (
                    <li className="menu-title">
                      <span className="font-body text-xs font-normal text-muted">
                        Métricas: ✓ {testExecutionSummary.passed} · ✗ {testExecutionSummary.failed} · pend.{' '}
                        {testExecutionSummary.pending}
                      </span>
                    </li>
                  )}
                  {['tarefa', 'bug', 'task'].includes(taskTypeNorm) && onGenerateAll ? (
                    <li>
                      <button
                        type="button"
                        className="font-body gap-2"
                        disabled={
                          isGeneratingAll || isGenerating || isGeneratingBdd || isGeneratingTests
                        }
                        onClick={e => {
                          e.stopPropagation();
                          handleGenerateAll(e);
                        }}
                      >
                        <Zap className="h-4 w-4 shrink-0" aria-hidden />
                        {isGenerating || isGeneratingAll ? 'Gerando…' : 'Gerar Tudo'}
                      </button>
                    </li>
                  ) : null}
                  <li>
                    <button
                      type="button"
                      className="font-body gap-2"
                      onClick={handleTestStatusBadgeClick}
                    >
                      <ClipboardList className="h-4 w-4 shrink-0" aria-hidden />
                      {standaloneContainerIssue
                        ? taskTestStatus === 'teste_concluido'
                          ? 'Reabrir'
                          : 'Concluir'
                        : taskTestStatus === 'testando'
                          ? 'Testando — concluir'
                          : taskTestStatus === 'teste_concluido'
                            ? 'Marcar pendente'
                            : taskTestStatus === 'pendente'
                              ? 'Pronto para testar'
                              : 'Iniciar teste'}
                    </button>
                  </li>
                  <li className="menu-title mt-1">
                    <span className="font-body text-xs font-normal text-muted">Status Jira</span>
                  </li>
                  {project?.settings?.jiraStatuses && project.settings.jiraStatuses.length > 0
                    ? project.settings.jiraStatuses.map(status => {
                        const statusName = typeof status === 'string' ? status : status.name;
                        const statusColor =
                          typeof status === 'string'
                            ? getJiraStatusColor(statusName)
                            : status.color
                              ? ensureJiraHexColor(status.color, status.name)
                              : getJiraStatusColor(statusName);
                        const isSelected = currentDisplayStatusLabel === statusName;
                        return (
                          <li key={`mob-toolbar-${task.id}-${statusName}`}>
                            <button
                              type="button"
                              className={cn('font-body gap-2', isSelected && 'active')}
                              onClick={e => {
                                e.stopPropagation();
                                handleChangeStatus(statusName);
                              }}
                            >
                              <span
                                className="h-3 w-3 shrink-0 rounded-full"
                                style={{
                                  backgroundColor: statusColor || 'oklch(var(--b3))',
                                }}
                                aria-hidden
                              />
                              {statusName}
                            </button>
                          </li>
                        );
                      })
                    : (
                      <>
                        <li>
                          <button
                            type="button"
                            className="font-body"
                            onClick={e => {
                              e.stopPropagation();
                              handleChangeStatus('To Do');
                            }}
                          >
                            A Fazer
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            className="font-body"
                            onClick={e => {
                              e.stopPropagation();
                              handleChangeStatus('In Progress');
                            }}
                          >
                            Em Andamento
                          </button>
                        </li>
                        <li>
                          <button
                            type="button"
                            className="font-body"
                            onClick={e => {
                              e.stopPropagation();
                              handleChangeStatus('Done');
                            }}
                          >
                            Concluído
                          </button>
                        </li>
                      </>
                    )}
                </ul>
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
                className="overflow-visible rounded-b-[var(--rounded-box)] border-t border-[var(--brand-surface-border)] bg-[var(--brand-surface-strong)] shadow-inner"
              >
                <div className="p-4 space-y-4">
                  {/* Barra de Ações (movida para dentro do expandir) */}
                  <div className="flex items-center gap-1.5 flex-wrap pb-3 border-b border-base-200">
                    {/* Ação primária */}
                    {(task.type === 'Tarefa' || task.type === 'Bug') && onGenerateAll && (
                      <Button
                        type="button"
                        variant="default"
                        size="panel"
                        className={gerarTudoDestaqueClass}
                        onClick={handleGenerateAll}
                        disabled={
                          isGeneratingAll || isGenerating || isGeneratingBdd || isGeneratingTests
                        }
                        title={
                          isGenerating || isGeneratingAll
                            ? aiPhaseMessage || 'Gerando com IA…'
                            : 'Gerar BDD, Estratégia e Testes com IA'
                        }
                        aria-label={
                          isGenerating || isGeneratingAll
                            ? aiPhaseMessage || 'Gerando com IA'
                            : 'Gerar tudo com IA (BDD, estratégia e testes)'
                        }
                      >
                        {isGenerating || isGeneratingAll ? (
                          <span
                            className="loading loading-spinner loading-xs"
                            aria-hidden="true"
                          ></span>
                        ) : (
                          <Zap className="w-4 h-4" aria-hidden="true" />
                        )}
                        <span className="hidden sm:inline">
                          {isGenerating || isGeneratingAll ? 'Gerando…' : 'Gerar Tudo'}
                        </span>
                        <span className="sm:hidden">
                          {isGenerating || isGeneratingAll ? 'Gerando…' : 'Gerar'}
                        </span>
                      </Button>
                    )}

                    {/* Desktop: ações comuns visíveis */}
                    {task.type === 'Epic' && (
                      <button
                        type="button"
                        onClick={() => onAddSubtask(task.id)}
                        className="btn btn-ghost btn-sm gap-2 hidden md:inline-flex rounded-[var(--radius)]"
                        aria-label="Adicionar subtarefa"
                      >
                        <PlusIcon className="w-4 h-4" aria-hidden="true" />
                        Adicionar Subtarefa
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onEdit(task)}
                      className="btn btn-ghost btn-sm gap-2 hidden md:inline-flex rounded-[var(--radius)]"
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
                        className="btn btn-ghost btn-sm gap-2 hidden md:inline-flex rounded-[var(--radius)]"
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
                    {onUpdateFromJira && /^[A-Z]+-\d+$/.test(task.id) && (
                      <button
                        type="button"
                        onClick={() => onUpdateFromJira(task.id)}
                        disabled={isUpdatingFromJira}
                        className="btn btn-ghost btn-sm gap-2 hidden md:inline-flex rounded-[var(--radius)]"
                        aria-label="Atualizar tarefa do Jira"
                        title="Trazer alterações do Jira (somente esta tarefa)"
                      >
                        {isUpdatingFromJira ? (
                          <Spinner small />
                        ) : (
                          <Download className="w-4 h-4" aria-hidden="true" />
                        )}
                        Atualizar do Jira
                      </button>
                    )}

                    {/* Menu overflow: ações secundárias + destrutiva (abre à direita do botão) */}
                    <div className="dropdown dropdown-start">
                      <button
                        type="button"
                        tabIndex={0}
                        className="win-icon-button sm:!min-h-8 sm:!min-w-8"
                        aria-label="Mais ações"
                        aria-haspopup="true"
                        onClick={e => e.stopPropagation()}
                      >
                        <MoreVertical aria-hidden="true" />
                      </button>
                      <ul
                        tabIndex={0}
                        className="dropdown-content menu mica z-50 w-56 max-h-[min(70vh,24rem)] overflow-y-auto !rounded-[var(--rounded-box)] border border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] p-2 custom-scrollbar"
                        role="menu"
                        onClick={e => e.stopPropagation()}
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
                              {isSyncing ? (
                                <Spinner small />
                              ) : (
                                <RefreshIcon className="w-4 h-4" aria-hidden="true" />
                              )}
                              Sincronizar
                            </button>
                          </li>
                        )}
                        {onUpdateFromJira && /^[A-Z]+-\d+$/.test(task.id) && (
                          <li className="md:hidden" role="none">
                            <button
                              type="button"
                              role="menuitem"
                              className="gap-2"
                              onClick={() => onUpdateFromJira(task.id)}
                              disabled={isUpdatingFromJira}
                            >
                              {isUpdatingFromJira ? (
                                <Spinner small />
                              ) : (
                                <Download className="w-4 h-4" aria-hidden="true" />
                              )}
                              Atualizar do Jira
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
                    <div
                      className="flex w-full flex-wrap gap-1 overflow-x-auto rounded-[var(--radius)] border border-base-300 bg-base-200/60 p-1 md:w-fit"
                      role="tablist"
                      aria-label="Seções da tarefa"
                    >
                      {sectionTabs.map(tab => {
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
                            className={`inline-flex min-h-[44px] items-center rounded-[var(--radius)] px-3 py-2 font-heading text-xs font-medium transition-colors duration-200 sm:min-h-0 sm:px-4 sm:py-2 sm:text-sm ${isActive ? 'bg-primary text-primary-content soft-shadow hover:bg-primary/90' : 'text-base-content/75 hover:bg-base-300/70 hover:text-base-content'}`}
                            onClick={() => setActiveSection(tab.id)}
                          >
                            <span>{tab.label}</span>
                            {typeof tab.badge === 'number' && tab.badge > 0 ? (
                              <span
                                className={`ml-2 rounded-[0.65rem] px-1.5 py-0.5 font-body text-xs font-medium ${isActive ? 'bg-primary-content/20 text-primary-content' : 'bg-base-300 text-base-content'}`}
                              >
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
                    className="mt-3 overflow-x-hidden"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={activeSection}
                        initial={
                          reduceMotion ? false : { opacity: 0, x: sectionEnterDirection * 28 }
                        }
                        animate={{ opacity: 1, x: 0 }}
                        exit={
                          reduceMotion ? undefined : { opacity: 0, x: sectionEnterDirection * -28 }
                        }
                        transition={{
                          duration: reduceMotion ? 0 : 0.22,
                          ease: [0.25, 1, 0.5, 1],
                        }}
                      >
                        {renderSectionContent()}
                        {renderNavigationFooter()}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {hasChildren && isChildrenOpen && (
          <div
            id={childrenRegionId}
            className="ml-6 border-l-2 border-base-300/70 pl-3 mt-1 max-md:bg-base-200/30 max-md:rounded-r-lg max-md:pr-2"
          >
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
        {viewingJiraAttachment &&
          !viewingJiraAttachment.content &&
          detectFileType(viewingJiraAttachment.filename, viewingJiraAttachment.mimeType) ===
            'image' && (
            <ImageModal
              url={viewingJiraAttachment.url}
              fileName={viewingJiraAttachment.filename}
              onClose={() => setViewingJiraAttachment(null)}
              fetchImage={() => fetchJiraAttachmentAsDataUrl(viewingJiraAttachment)}
            />
          )}
      </div>
    );
  }
);
