import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { JiraTask, BddScenario, TestCaseDetailLevel, Project, TestCase } from '../../types';
import { TestCasesFreshnessIndicator } from './TestCasesFreshnessIndicator';
import { TestCaseDetailLevelControl } from './TestCaseDetailLevelControl';
import { BddScenarioActionBar } from './BddScenarioActionBar';
import { Modal } from '../common/Modal';
import { Spinner } from '../common/Spinner';
import { RefreshIcon } from '../common/Icons';
import { BddScenarioForm, BddScenarioItem } from './BddScenario';
import { TestCasesSection } from './TestCasesSection';
import { TestStrategyCard } from './TestStrategyCard';
import { ToolsSelector } from './ToolsSelector';
import { TestReportModal } from './TestReportModal';
import { AttachmentManager } from '../common/AttachmentManager';
import { ChecklistView } from '../common/ChecklistView';
import { EstimationInput } from '../common/EstimationInput';
import { QuickActions } from '../common/QuickActions';
import { getTagColor, getTaskVersions } from '../../utils/tagService';
import { getDisplayPriorityLabel } from '../../utils/taskHelpers';
import { VersionBadges } from './VersionBadge';
import { updateChecklistItem } from '../../utils/checklistService';
import { getNextStepForTask } from '../../utils/taskPhaseHelper';
import { EmptyState } from '../common/EmptyState';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { parseJiraDescriptionHTML } from '../../utils/jiraDescriptionParser';
import { getJiraConfig } from '../../services/jiraService';
import { fetchJiraAttachmentAsDataUrl } from '../../utils/jiraAttachmentFetch';
import { TaskWithChildren } from './JiraTaskItem';
import { JiraTaskSlaSummary } from './JiraTaskSlaSummary';
import {
  TaskSummaryCommentsSection,
  JiraFilasExtraFieldsGrid,
} from './JiraFilasSummarySections';
import { TaskLinksView } from './TaskLinksView';
import { getTaskDependents } from '../../utils/dependencyService';
import { cn } from '../../utils/cn';
import { TaskBusinessRulesLinker } from './TaskBusinessRulesLinker';
import { FileViewer } from '../common/FileViewer';
import { ImageModal } from '../common/ImageModal';
import { canViewInBrowser, detectFileType } from '../../services/fileViewerService';
import { JiraAttachment } from './JiraAttachment';
import { JiraRichContent } from './JiraRichContent';
import { Button } from '../common/Button';
import {
  taskCardTypography,
  taskTextStrongClass,
  taskUiTagClass,
  taskUiTagInfoClass,
  taskUiTagSuccessClass,
} from './taskActionLayout';
import {
  leveSettingsSectionIconWrapClass,
  leveTaskModalAvatarClass,
  leveTaskModalFieldLabelClass,
  leveTaskModalMutedClass,
  leveTaskModalMutedXsClass,
  leveTaskModalNavFooterClass,
  leveTaskModalPageTitleClass,
  leveTaskModalSectionAccentClass,
  leveTaskModalSectionHeaderClass,
  leveTaskModalSectionTitleClass,
  leveTaskModalStrongClass,
  leveTaskModalTabBadgeActiveClass,
  leveTaskModalTabBadgeIdleClass,
} from '../common/projectCardUi';
import {
  taskDetailsModalBodyClass,
  taskDetailsModalDescriptionClass,
  taskDetailsModalGhostBtnClass,
  taskDetailsModalJiraBtnClass,
  taskDetailsModalPanelShellClass,
  taskDetailsModalSectionClass,
  taskDetailsModalShellClass,
  taskDetailsModalTabClass,
  taskDetailsModalTabsScrollWrapClass,
  taskDetailsModalTabsTrackClass,
  taskDetailsModalTitleClass,
  taskDetailsModalHeaderSectionClass,
  taskDetailsModalWatchersClass,
  taskDetailsModalPrimaryCtaClass,
} from './taskDetailsNeuUi';
import { testReportGenerateRecordBtnClass } from './testReportNeuUi';
import { BackButton } from '../common/BackButton';
import { useJiraAttachmentViewer } from '../../hooks/useJiraAttachmentViewer';
import {
  BarChart3,
  ClipboardList,
  Sparkles,
  Wrench,
  Link,
  Paperclip,
  Timer,
  Download,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

type DetailSection = 'overview' | 'bdd' | 'tests' | 'businessRules' | 'planning';
type TestSubSection = 'strategy' | 'test-cases';

const CARD_TITLE_CLASS = cn(
  leveTaskModalFieldLabelClass,
  'mb-3 flex items-center gap-2 !border-b-0 !pb-0 normal-case tracking-normal'
);

/** Resolve o MIME type de um anexo pelo nome do arquivo */
function resolveMimeType(filename: string): string | undefined {
  const ext = filename.toLowerCase().split('.').pop();
  const map: Record<string, string> = {
    pdf: 'application/pdf',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    txt: 'text/plain',
    json: 'application/json',
    csv: 'text/csv',
  };
  return ext ? map[ext] : undefined;
}

// Componente para renderizar descrição com formatação rica do Jira
const DescriptionRenderer: React.FC<{
  description: string | any;
  jiraAttachments?: Array<{
    id: string;
    filename: string;
    size: number;
    created: string;
    author: string;
  }>;
}> = ({ description, jiraAttachments }) => {
  if (!description) {
    return <p className={cn(leveTaskModalMutedClass, 'italic')}>Sem descrição</p>;
  }

  const jiraConfig = getJiraConfig();
  const jiraUrl = jiraConfig?.url;

  // Sempre passar pelo parser/sanitizador central para aplicar limites defensivos
  // antes de renderizar HTML rico nesta tela de detalhe.
  const htmlContent = parseJiraDescriptionHTML(description, jiraUrl, jiraAttachments);

  if (!htmlContent || htmlContent.trim() === '') {
    return <p className={cn(leveTaskModalMutedClass, 'italic')}>Sem descrição</p>;
  }

  return <JiraRichContent html={htmlContent} className="" />;
};

interface TaskDetailsViewProps {
  task: TaskWithChildren;
  presentation?: 'modal' | 'workspace';
  /** Obrigatório em `modal`; usado pelo botão voltar em ambos os modos. */
  onClose: () => void;
  onTestCaseStatusChange: (testCaseId: string, status: TestCase['status']) => void;
  onTestCaseObservedResultChange?: (testCaseId: string, value: string) => void;
  onTestCaseExecutionKindChange?: (testCaseId: string, kind: TestCase['executionKind']) => void;
  onTaskToolsChange?: (tools: string[]) => void;
  onStrategyExecutedChange?: (strategyIndex: number, executed: boolean) => void;
  onStrategyToolsChange?: (strategyIndex: number, tools: string[]) => void;
  onGenerateTests: (taskId: string, detailLevel: TestCaseDetailLevel) => Promise<void>;
  isGenerating: boolean;
  onGenerateBddScenarios: (taskId: string) => Promise<void>;
  isGeneratingBdd: boolean;
  onGenerateAll?: (taskId: string, detailLevel?: TestCaseDetailLevel) => Promise<void>;
  isGeneratingAll?: boolean;
  onSaveBddScenario: (
    taskId: string,
    scenario: Omit<BddScenario, 'id'>,
    scenarioId?: string
  ) => void;
  onDeleteBddScenario: (taskId: string, scenarioId: string) => void;
  onAddTestCaseFromTemplate?: (taskId: string) => void;
  onAddComment?: (content: string) => void;
  onEditComment?: (commentId: string, content: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onEditTestCase?: (taskId: string, testCase: TestCase) => void;
  onDeleteTestCase?: (taskId: string, testCaseId: string) => void;
  onDuplicateTestCase?: (taskId: string, testCase: TestCase) => void;
  project?: Project;
  onUpdateProject?: (project: Project) => void;
  /** Navegação para outra aba do projeto (ex.: Documentos). */
  onNavigateToTab?: (tabId: string) => void;
  onOpenTask?: (task: JiraTask) => void;
  onUpdateFromJira?: (taskId: string) => Promise<void>;
  isUpdatingFromJira?: boolean;
  /**
   * Modo Filas (Jira): apenas aba Resumo com SLAs e metadados de acompanhamento,
   * sem testes, BDD ou colaboração.
   */
  hideTestFeatures?: boolean;
}

export type { TaskDetailsViewProps };

export const TaskDetailsView: React.FC<TaskDetailsViewProps> = ({
  task,
  presentation = 'modal',
  onClose,
  onTestCaseStatusChange,
  onTestCaseObservedResultChange,
  onTestCaseExecutionKindChange,
  onTaskToolsChange,
  onStrategyExecutedChange,
  onStrategyToolsChange,
  onGenerateTests,
  isGenerating,
  onGenerateBddScenarios,
  isGeneratingBdd,
  onGenerateAll,
  isGeneratingAll,
  onSaveBddScenario,
  onDeleteBddScenario,
  onAddTestCaseFromTemplate,
  onAddComment,
  onEditComment,
  onDeleteComment,
  onEditTestCase,
  onDeleteTestCase,
  onDuplicateTestCase,
  project,
  onUpdateProject,
  onNavigateToTab,
  onOpenTask,
  onUpdateFromJira,
  isUpdatingFromJira,
  hideTestFeatures = false,
}) => {
  const reduceMotion = useReducedMotion();
  const [editingBddScenario, setEditingBddScenario] = useState<BddScenario | null>(null);
  const [isCreatingBdd, setIsCreatingBdd] = useState(false);
  const [detailLevel, setDetailLevel] = useState<TestCaseDetailLevel>('Estruturado');
  const [showTestReport, setShowTestReport] = useState(false);
  const {
    viewingJiraAttachment,
    setViewingJiraAttachment,
    loadingJiraAttachmentId,
    handleViewJiraAttachment,
  } = useJiraAttachmentViewer();
  const [activeSection, setActiveSection] = useState<DetailSection>('overview');
  const [activeTestSubSection, setActiveTestSubSection] = useState<TestSubSection>('strategy');
  const nextStep = getNextStepForTask(task);
  const hasTests = task.testCases && task.testCases.length > 0;
  const safeDomId = useMemo(() => task.id.replace(/[^a-zA-Z0-9_-]/g, '_'), [task.id]);

  const jiraAttachmentItems = useMemo(() => {
    const jiraConfig = getJiraConfig();
    const jiraUrl = jiraConfig?.url ?? '';
    return (task.jiraAttachments ?? []).map(att => ({
      ...att,
      attachmentUrl: jiraUrl
        ? `${jiraUrl}/secure/attachment/${att.id}/${encodeURIComponent(att.filename)}`
        : '',
      mimeType: resolveMimeType(att.filename),
    }));
  }, [task.jiraAttachments]);

  const sectionTabs = useMemo(() => {
    if (hideTestFeatures) {
      return [{ id: 'overview' as const, label: 'Resumo' }];
    }

    const tabs: { id: DetailSection; label: string; badge?: number }[] = [
      { id: 'overview', label: 'Resumo' },
    ];

    if (task.type === 'Tarefa' || task.type === 'Bug') {
      tabs.push({ id: 'bdd', label: 'Cenários BDD', badge: task.bddScenarios?.length || 0 });
    }

    if (task.type === 'Tarefa' || task.type === 'Bug') {
      tabs.push({ id: 'tests', label: 'Testes', badge: task.testCases?.length || 0 });
    }

    if (project && onUpdateProject) {
      const idSet = new Set((task.linkedBusinessRuleIds ?? []).filter(Boolean));
      const catSet = new Set(
        (task.linkedBusinessRuleCategories ?? [])
          .map(c => (typeof c === 'string' ? c.trim() : ''))
          .filter(Boolean)
      );
      for (const r of project.businessRules ?? []) {
        if (catSet.has((r.category ?? '').trim())) {
          idSet.add(r.id);
        }
      }
      const brLinkedCount = idSet.size;
      tabs.push({
        id: 'businessRules',
        label: 'Regras de negócio',
        badge: brLinkedCount > 0 ? brLinkedCount : undefined,
      });
      const dependentsCount = getTaskDependents(task.id, project).length;
      const planningBadge =
        (task.dependencies?.length || 0) +
        dependentsCount +
        (task.attachments?.length || 0) +
        (task.checklist?.length || 0) +
        (task.estimatedHours ? 1 : 0);
      tabs.push({ id: 'planning', label: 'Planejamento', badge: planningBadge });
    }

    return tabs;
  }, [
    hideTestFeatures,
    task.type,
    task.bddScenarios,
    task.testCases,
    task.dependencies,
    task.attachments,
    task.checklist,
    task.estimatedHours,
    project,
    onUpdateProject,
    project?.tasks,
    task.linkedBusinessRuleIds,
    task.linkedBusinessRuleCategories,
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
    const currentTabExists = sectionTabs.some(tab => tab.id === activeSection);
    if (!currentTabExists) {
      const next = sectionTabs[0]?.id ?? 'overview';
      if (next !== activeSection) setActiveSection(next);
      return;
    }
    if (activeSection === 'businessRules' && (!project || !onUpdateProject)) {
      setActiveSection(sectionTabs[0]?.id ?? 'overview');
      return;
    }
    if (
      (activeSection === 'tests' || activeSection === 'bdd') &&
      task.type !== 'Tarefa' &&
      task.type !== 'Bug'
    ) {
      setActiveSection('overview');
    }
  }, [sectionTabs, activeSection, task.type, project, onUpdateProject]);

  const handleSaveScenario = (scenario: Omit<BddScenario, 'id'>) => {
    onSaveBddScenario(task.id, scenario, editingBddScenario?.id);
    setEditingBddScenario(null);
    setIsCreatingBdd(false);
  };

  const handleCancelBddForm = () => {
    setEditingBddScenario(null);
    setIsCreatingBdd(false);
  };

  const hasJiraSidebarFields = !!(
    task.dueDate ||
    task.timeTracking ||
    task.components ||
    task.fixVersions ||
    task.environment ||
    task.reporter ||
    task.watchers ||
    task.issueLinks ||
    task.jiraAttachments?.length
  );

  const renderBusinessRulesSection = () => {
    if (!project || !onUpdateProject) return null;
    return (
      <div className="space-y-4">
      <TaskBusinessRulesLinker
        task={task}
        project={project}
        onUpdateProject={onUpdateProject}
        onNavigateToTab={onNavigateToTab}
      />
      </div>
    );
  };

  const renderOverviewSection = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* Coluna principal */}
      <div className="lg:col-span-2 space-y-3">
        {hideTestFeatures ? (
          <>
            <JiraTaskSlaSummary task={task} />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {task.reporter?.displayName ? (
                <div className={cn(taskDetailsModalSectionClass, 'p-2.5')}>
                  <p className={cn(leveTaskModalFieldLabelClass, 'mb-1 block')}>Relator</p>
                  <p className={cn('text-sm font-semibold', leveTaskModalStrongClass)}>
                    {task.reporter.displayName}
                  </p>
                </div>
              ) : null}
              {(task.jiraAssignee?.displayName ?? task.assignee) ? (
                <div className={cn(taskDetailsModalSectionClass, 'p-2.5')}>
                  <p className={cn(leveTaskModalFieldLabelClass, 'mb-1 block')}>Responsável</p>
                  <p className={cn('text-sm font-semibold', leveTaskModalStrongClass)}>
                    {task.jiraAssignee?.displayName ?? task.assignee}
                  </p>
                </div>
              ) : null}
              {task.createdAt ? (
                <div className={cn(taskDetailsModalSectionClass, 'p-2.5')}>
                  <p className={cn(leveTaskModalFieldLabelClass, 'mb-1 block')}>Data de criação</p>
                  <p className={cn('text-sm font-semibold', leveTaskModalStrongClass)}>
                    {new Date(task.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ) : null}
            </div>
            <JiraFilasExtraFieldsGrid task={task} />
          </>
        ) : null}

        {/* Cartões de resumo no topo */}
        {!hideTestFeatures &&
        (task.priority ||
          task.severity ||
          task.owner ||
          task.assignee ||
          task.jiraAssignee?.displayName ||
          nextStep) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {task.owner && (
              <div className={cn(taskDetailsModalSectionClass, 'p-3')}>
                <p className={cn(leveTaskModalFieldLabelClass, 'mb-1 block')}>Owner</p>
                <p className={cn('text-sm font-medium', leveTaskModalStrongClass)}>{task.owner}</p>
              </div>
            )}
            {(task.jiraAssignee?.displayName ?? task.assignee) && (
              <div className={cn(taskDetailsModalSectionClass, 'p-3')}>
                <p className={cn(leveTaskModalFieldLabelClass, 'mb-1 block')}>Responsável</p>
                <p className={cn('text-sm font-medium', leveTaskModalStrongClass)}>
                  {task.jiraAssignee?.displayName ?? task.assignee}
                </p>
              </div>
            )}
            {(task.priority || task.jiraPriority) && (
              <div className={cn(taskDetailsModalSectionClass, 'p-3')}>
                <p className={cn(leveTaskModalFieldLabelClass, 'mb-1 block')}>Prioridade</p>
                <p className={cn('text-sm font-medium', leveTaskModalStrongClass)}>
                  {getDisplayPriorityLabel(task, project)}
                </p>
              </div>
            )}
            {task.severity && (
              <div className={cn(taskDetailsModalSectionClass, 'p-3')}>
                <p className={cn(leveTaskModalFieldLabelClass, 'mb-1 block')}>Severidade</p>
                <p className={cn('text-sm font-medium', leveTaskModalStrongClass)}>{task.severity}</p>
              </div>
            )}
            {nextStep && (
              <div className={cn(leveTaskModalSectionAccentClass, 'p-3')}>
                <p className={cn(leveTaskModalFieldLabelClass, 'mb-1 block')}>Próximo passo</p>
                <p className={cn('text-[0.82rem] font-medium line-clamp-2', leveTaskModalStrongClass)}>
                  {nextStep}
                </p>
              </div>
            )}
          </div>
        )}

        {!hideTestFeatures &&
        (task.type === 'Tarefa' || task.type === 'Bug') &&
          (task.testCases?.length > 0 || (task.testStrategy?.length ?? 0) > 0) && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowTestReport(true)}
                className={testReportGenerateRecordBtnClass}
                aria-label="Gerar registro de testes"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Gerar Registro de Testes</span>
              </button>
            </div>
          )}

        <section className="space-y-2">
          <h3 className={leveTaskModalFieldLabelClass}>Descrição</h3>
          <div className={taskDetailsModalDescriptionClass}>
            {task.description ? (
              <DescriptionRenderer
                description={task.description}
                jiraAttachments={task.jiraAttachments}
              />
            ) : (
              <p className={cn(leveTaskModalMutedClass, 'italic')}>Sem descrição</p>
            )}
          </div>
        </section>

        {(hideTestFeatures ||
          onAddComment ||
          (task.comments?.length ?? 0) > 0) && (
          <TaskSummaryCommentsSection
            task={task}
            onAddComment={hideTestFeatures ? undefined : onAddComment}
            onEditComment={hideTestFeatures ? undefined : onEditComment}
            onDeleteComment={hideTestFeatures ? undefined : onDeleteComment}
          />
        )}

        {(() => {
          const versions = getTaskVersions(task);
          const otherTags = task.tags?.filter(tag => !/^V\d+/i.test(tag.trim())) || [];
          return (
            (versions.length > 0 || otherTags.length > 0) && (
              <div className="space-y-2">
                {versions.length > 0 && (
                  <div>
                    <p className={cn(leveTaskModalFieldLabelClass, 'mb-1.5 block')}>
                      Versão do Projeto
                    </p>
                    <VersionBadges versions={versions} size="md" />
                  </div>
                )}
                {otherTags.length > 0 && (
                  <div>
                    {versions.length > 0 && (
                      <p className={cn(leveTaskModalFieldLabelClass, 'mb-1.5 block')}>Tags</p>
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

        {jiraAttachmentItems.length > 0 && (
          <section className="space-y-2">
            <h3 className={leveTaskModalFieldLabelClass}>Anexos do Jira</h3>
            <div className={cn(taskDetailsModalSectionClass, 'p-3')}>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {jiraAttachmentItems.map(att => (
                  <JiraAttachment
                    key={att.id}
                    id={att.id}
                    url={att.attachmentUrl}
                    filename={att.filename}
                    mimeType={att.mimeType}
                    size={att.size}
                    onView={handleViewJiraAttachment}
                    isLoading={loadingJiraAttachmentId === att.id}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Sidebar: Atualizar do Jira + Campos do Jira + Ações Rápidas */}
      <aside className="space-y-4">
        {onUpdateFromJira && /^[A-Z]+-\d+$/.test(task.id) && (
          <div className={cn(taskDetailsModalSectionClass, 'p-4')}>
            <Button
              variant="brandOutline"
              size="sm"
              className={taskDetailsModalJiraBtnClass}
              onClick={() => onUpdateFromJira(task.id)}
              disabled={!!isUpdatingFromJira}
              aria-label="Atualizar somente esta tarefa do Jira"
            >
              {isUpdatingFromJira ? (
                <Spinner small />
              ) : (
                <Download className="w-4 h-4" aria-hidden />
              )}
              {isUpdatingFromJira ? 'Atualizando…' : 'Atualizar do Jira (só esta tarefa)'}
            </Button>
            <p className={cn(leveTaskModalMutedXsClass, 'mt-2')}>
              Busca apenas esta tarefa no Jira, sem carregar o projeto inteiro.
            </p>
          </div>
        )}
        {hasJiraSidebarFields && (
          <div className={cn(taskDetailsModalSectionClass, 'overflow-visible')}>
            <div className={leveTaskModalSectionHeaderClass}>
              <span className={leveSettingsSectionIconWrapClass}>
                <Sparkles className="h-5 w-5" aria-hidden />
              </span>
              <h2 className={leveTaskModalSectionTitleClass}>Campos do Jira</h2>
            </div>
            <div className="p-4 space-y-3">
              {(task.reporter || task.dueDate || task.environment) && (
                <div>
                  <p className={cn(leveTaskModalFieldLabelClass, 'mb-2 block')}>Informações Básicas</p>
                  <div className="space-y-2">
                    {task.reporter && (
                      <div className="flex items-center gap-3">
                        <div className={leveTaskModalAvatarClass}>
                          {task.reporter.displayName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className={cn('truncate text-sm font-semibold', leveTaskModalStrongClass)}>
                            {task.reporter.displayName}
                          </p>
                          {task.reporter.emailAddress && (
                            <p className={cn(leveTaskModalMutedXsClass, 'truncate')}>
                              {task.reporter.emailAddress}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    {task.dueDate && (
                      <p className={cn('text-sm', leveTaskModalStrongClass)}>
                        <span className={cn(leveTaskModalMutedXsClass, 'font-bold uppercase')}>
                          Due Date:{' '}
                        </span>
                        {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                    {task.environment && (
                      <p className={cn('text-sm', leveTaskModalStrongClass)}>
                        <span className={cn(leveTaskModalMutedXsClass, 'font-bold uppercase')}>
                          Environment:{' '}
                        </span>
                        {task.environment}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {task.timeTracking &&
                (task.timeTracking.originalEstimate ||
                  task.timeTracking.remainingEstimate ||
                  task.timeTracking.timeSpent) && (
                  <div>
                    <p className={cn(leveTaskModalFieldLabelClass, 'mb-2 block')}>Time Tracking</p>
                    <div className={cn('space-y-1 text-[11px]', leveTaskModalMutedXsClass)}>
                      {task.timeTracking.originalEstimate && (
                        <p>Estimado: {task.timeTracking.originalEstimate}</p>
                      )}
                      {task.timeTracking.remainingEstimate && (
                        <p>Restando: {task.timeTracking.remainingEstimate}</p>
                      )}
                      {task.timeTracking.timeSpent && <p>Gasto: {task.timeTracking.timeSpent}</p>}
                    </div>
                  </div>
                )}

              {(task.issueLinks?.length || task.watchers) && (
                <div>
                  <p className={cn(leveTaskModalFieldLabelClass, 'mb-2 block')}>Relacionamentos</p>
                  {task.issueLinks && task.issueLinks.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {task.issueLinks.map(link => (
                        <div key={link.id} className={cn('text-sm', leveTaskModalStrongClass)}>
                          <span className={leveTaskModalMutedXsClass}>{link.type}</span>{' '}
                          {link.relatedKey}
                        </div>
                      ))}
                    </div>
                  )}
                  {task.watchers && (
                    <div className={taskDetailsModalWatchersClass}>
                      <p className={cn(leveTaskModalFieldLabelClass, '!text-[10px] !pb-0')}>
                        Observadores
                      </p>
                      <p className={cn('mt-0.5 text-xs font-medium', leveTaskModalStrongClass)}>
                        {task.watchers.watchCount} observador(es)
                        {task.watchers.isWatching && ' • Você está observando'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {(task.components?.length || task.fixVersions?.length) && (
                <div>
                  <p className={cn(leveTaskModalFieldLabelClass, 'mb-2 block')}>Organização</p>
                  <div className="flex flex-wrap gap-1.5">
                    {task.components?.map(comp => (
                      <span
                        key={comp.id}
                        className={cn(taskUiTagClass, taskUiTagInfoClass, 'px-2 py-0.5')}
                      >
                        {comp.name}
                      </span>
                    ))}
                    {task.fixVersions?.map(version => (
                      <span
                        key={version.id}
                        className={cn(taskUiTagClass, taskUiTagSuccessClass, 'px-2 py-0.5')}
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

        {project && onUpdateProject && (
          <div className={cn(taskDetailsModalSectionClass, 'p-4')}>
            <h4 className={cn(leveTaskModalSectionTitleClass, 'mb-3')}>Ações Rápidas</h4>
            <QuickActions task={task} project={project} onUpdateProject={onUpdateProject} />
          </div>
        )}
      </aside>
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
        <header className={cn(taskDetailsModalSectionClass, 'mb-4 space-y-1 p-4')}>
          <h2 className={leveTaskModalPageTitleClass}>Cenários de Teste BDD</h2>
          <p className={cn(leveTaskModalMutedClass, 'mt-1 text-sm')}>
            Gerencie e visualize seus critérios de aceite em formato Gherkin.
          </p>
          <span className={cn(leveTaskModalTabBadgeIdleClass, 'mt-2 inline-flex px-2.5 py-1')}>
            {bddCount} cenário(s)
          </span>
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
          className="mx-auto w-full max-w-2xl"
        />
      </div>
    );
  };

  const renderTestsSection = () => {
    if (task.type !== 'Tarefa' && task.type !== 'Bug') {
      return null;
    }

    const canHaveTestCases = task.type === 'Tarefa' || task.type === 'Bug';

    return (
      <div className={cn('space-y-4', taskCardTypography, taskTextStrongClass)}>
        <div className={taskDetailsModalTabsScrollWrapClass}>
          <div className={taskDetailsModalTabsTrackClass} role="tablist" aria-label="Sub-abas de testes">
          <button
            type="button"
            role="tab"
            aria-selected={activeTestSubSection === 'strategy'}
            onClick={() => setActiveTestSubSection('strategy')}
            className={taskDetailsModalTabClass(activeTestSubSection === 'strategy')}
          >
            Estratégia
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTestSubSection === 'test-cases'}
            onClick={() => setActiveTestSubSection('test-cases')}
            className={taskDetailsModalTabClass(activeTestSubSection === 'test-cases')}
          >
            Casos de teste
            {task.testCases?.length ? (
              <span
                className={
                  activeTestSubSection === 'test-cases'
                    ? leveTaskModalTabBadgeActiveClass
                    : leveTaskModalTabBadgeIdleClass
                }
                aria-hidden
              >
                {task.testCases.length}
              </span>
            ) : null}
          </button>
          </div>
        </div>

        {activeTestSubSection === 'strategy' && (
          <div>
            <header className={cn(taskDetailsModalSectionClass, 'mb-4 flex flex-wrap items-center gap-3 p-4')}>
              <span className={leveSettingsSectionIconWrapClass}>
                <BarChart3 className="h-5 w-5" aria-hidden />
              </span>
              <h2 className={cn('text-lg font-bold', leveTaskModalStrongClass)}>Estratégia de Teste</h2>
              <span className={cn(leveTaskModalTabBadgeIdleClass, 'px-3 py-1')}>
                {task.testStrategy?.length || 0} item(ns)
              </span>
            </header>
            {isGenerating && (
              <div className="flex justify-center py-2">
                <Spinner small />
              </div>
            )}
            {(task.testStrategy?.length ?? 0) > 0 ? (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
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
              !isGenerating && (
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

        {activeTestSubSection === 'test-cases' && canHaveTestCases && (
          <TestCasesSection
            task={task}
            isGenerating={isGenerating}
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

        <section className={cn(taskDetailsModalSectionClass, 'mt-6 overflow-visible')}>
          <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:gap-5">
            <div className="flex-grow">
              {onTaskToolsChange && (
                <>
                  <h3
                    className={cn(
                      leveTaskModalFieldLabelClass,
                      'mb-3 flex items-center gap-2 !normal-case'
                    )}
                  >
                    <Wrench className="h-5 w-5 text-[var(--leve-header-accent)]" aria-hidden />
                    Ferramentas Utilizadas (Geral)
                  </h3>
                  <ToolsSelector
                    selectedTools={task.toolsUsed || []}
                    onToolsChange={onTaskToolsChange}
                    label=""
                    compact={false}
                    neuVariant="taskModal"
                  />
                </>
              )}
              {!onTaskToolsChange && <div className="h-0" />}
            </div>
            <div className="flex min-w-0 flex-col gap-4 border-t border-[color-mix(in_srgb,var(--leve-header-border)_55%,transparent)] pt-5 lg:w-80 lg:shrink-0 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <TestCaseDetailLevelControl
                idPrefix={task.id}
                value={detailLevel}
                onChange={setDetailLevel}
                disabled={isGenerating}
                neuVariant="taskModal"
              />
              {!isGenerating && (
                <button
                  type="button"
                  className={taskDetailsModalPrimaryCtaClass}
                  onClick={() => onGenerateTests(task.id, detailLevel)}
                >
                  <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                  {hasTests ? 'Regerar com IA' : 'Gerar com IA'}
                </button>
              )}
              {isGenerating && (
                <div className="flex items-center justify-center gap-2 py-2">
                  <Spinner small />
                  <span className={leveTaskModalMutedClass}>Gerando...</span>
                </div>
              )}
              {hasTests && (
                <TestCasesFreshnessIndicator task={task} isGenerating={isGenerating} />
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
        <p className={leveTaskModalMutedClass}>
          Conecte um projeto para gerenciar dependências e planejamento.
        </p>
      );
    }

    return (
      <div className="space-y-4">
        <header className={cn(taskDetailsModalSectionClass, 'p-4')}>
          <h2 className={leveTaskModalPageTitleClass}>Planejamento</h2>
        </header>
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12">
        <div className="min-w-0 space-y-3 sm:space-y-4 lg:col-span-7">
          <section className={cn(taskDetailsModalSectionClass, 'p-3 sm:p-4')}>
            <h2 className={CARD_TITLE_CLASS}>
              <Link className="h-4 w-4 shrink-0 text-[var(--leve-header-accent)] sm:h-5 sm:w-5" aria-hidden />
              Dependências
            </h2>
            <TaskLinksView
              task={task}
              project={project}
              onUpdateProject={onUpdateProject}
              onOpenTask={onOpenTask}
            />
          </section>

          <section className={cn(taskDetailsModalSectionClass, 'p-3 sm:p-4')}>
            <h2 className={CARD_TITLE_CLASS}>
              <Paperclip className="h-4 w-4 shrink-0 text-[var(--leve-header-accent)] sm:h-5 sm:w-5" aria-hidden />
              Anexos
              <span
                className={cn(
                  leveTaskModalTabBadgeIdleClass,
                  'rounded-full px-2 py-0.5 font-normal normal-case'
                )}
              >
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
            <section className={cn(taskDetailsModalSectionClass, 'p-3 sm:p-4')}>
              <h2 className={CARD_TITLE_CLASS}>Checklist</h2>
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

        {/* Coluna direita - Estimativas (fixa ao lado ao rolar) */}
        <div className="lg:col-span-5 min-w-0 self-start">
          <section className={cn(taskDetailsModalSectionClass, 'sticky top-20 p-3 sm:p-4 lg:top-24')}>
            <h2 className={CARD_TITLE_CLASS}>
              <Timer className="h-4 w-4 shrink-0 text-[var(--leve-header-accent)] sm:h-5 sm:w-5" aria-hidden />
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
      case 'businessRules':
        return renderBusinessRulesSection();
      case 'planning':
        return renderPlanningSection();
      default:
        return null;
    }
  };

  const renderNavigationFooter = () => {
    const currentIndex = sectionTabs.findIndex(tab => tab.id === activeSection);
    const prevTab = sectionTabs[currentIndex - 1];
    const nextTab = sectionTabs[currentIndex + 1];
    return (
      <nav className={leveTaskModalNavFooterClass} aria-label="Navegação entre seções da tarefa">
        {prevTab ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(taskDetailsModalGhostBtnClass, 'gap-1')}
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
            className={cn(taskDetailsModalGhostBtnClass, 'gap-1')}
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

  const activeSectionLabel =
    sectionTabs.find(tab => tab.id === activeSection)?.label ?? 'Detalhes da tarefa';

  const modalTitle = (
    <div className="flex min-w-0 w-full flex-col gap-1 pr-10 sm:pr-12">
      <span className={taskDetailsModalHeaderSectionClass} title={activeSectionLabel}>
        {activeSectionLabel}
      </span>
      <span
        className={cn(
          'min-w-0 truncate font-sans text-sm font-bold sm:text-base',
          leveTaskModalStrongClass
        )}
        title={`${task.id} - ${task.title || 'Sem título'}`}
      >
        {task.id} - {task.title || 'Sem título'}
      </span>
    </div>
  );

  const innerContent = (
    <div className="flex flex-col gap-4">
      <BackButton
        className={cn('task-details-neu-back-btn self-start -ml-1', taskDetailsModalGhostBtnClass)}
        onClick={onClose}
        aria-label={
          presentation === 'workspace'
            ? 'Fechar aba da tarefa'
            : 'Voltar para a lista de tarefas'
        }
      />
      <div className={taskDetailsModalTabsScrollWrapClass}>
        <div className={taskDetailsModalTabsTrackClass} role="tablist" aria-label="Seções da tarefa">
          {sectionTabs.length > 1
            ? sectionTabs.map(tab => {
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
                    className={taskDetailsModalTabClass(isActive)}
                    onClick={e => {
                      e.stopPropagation();
                      setActiveSection(tab.id);
                    }}
                  >
                    <span>{tab.label}</span>
                    {typeof tab.badge === 'number' && tab.badge > 0 ? (
                      <span
                        className={
                          isActive ? leveTaskModalTabBadgeActiveClass : leveTaskModalTabBadgeIdleClass
                        }
                        aria-hidden
                      >
                        {tab.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })
            : null}
        </div>
      </div>

      <div
        id={`task-${safeDomId}-panel-${activeSection}`}
        role="tabpanel"
        aria-labelledby={`task-${safeDomId}-tab-${activeSection}`}
        className={cn(taskDetailsModalPanelShellClass, 'overflow-visible')}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeSection}
            initial={reduceMotion ? false : { opacity: 0, x: sectionEnterDirection * 28 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, x: sectionEnterDirection * -28 }}
            transition={{
              duration: reduceMotion ? 0 : 0.22,
              ease: [0.25, 1, 0.5, 1],
            }}
          >
            {renderSectionContent()}
            {sectionTabs.length > 1 ? renderNavigationFooter() : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <>
      {presentation === 'workspace' ? (
        <div
          className={cn(
            taskDetailsModalShellClass,
            taskDetailsModalBodyClass,
            'rounded-[var(--leve-header-radius)] p-3 sm:p-4'
          )}
        >
          <div className="mb-3 flex min-w-0 flex-col gap-1 border-b border-[color-mix(in_srgb,var(--workspace-panel-divider)_80%,transparent)] pb-3">
            <span className={taskDetailsModalHeaderSectionClass} title={activeSectionLabel}>
              {activeSectionLabel}
            </span>
            <span
              className={cn(
                'min-w-0 truncate font-sans text-sm font-bold sm:text-base',
                leveTaskModalStrongClass
              )}
              title={`${task.id} - ${task.title || 'Sem título'}`}
            >
              {task.id} - {task.title || 'Sem título'}
            </span>
          </div>
          {innerContent}
        </div>
      ) : (
        <Modal
          isOpen
          onClose={onClose}
          title={modalTitle}
          size="full"
          panelClassName={taskDetailsModalShellClass}
          titleClassName={taskDetailsModalTitleClass}
          bodyClassName={taskDetailsModalBodyClass}
        >
          {innerContent}
        </Modal>
      )}

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
    </>
  );
};
