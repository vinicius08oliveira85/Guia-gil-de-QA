import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { JiraTask, BddScenario, TestCaseDetailLevel, Project, TestCase } from '../../types';
import { Modal } from '../common/Modal';
import { TestReportModal } from './TestReportModal';
import { TaskWithChildren } from './JiraTaskItem';
import { getTaskDependents } from '../../utils/dependencyService';
import { getLinkedBusinessRuleIdsForTask } from '../../utils/businessRuleTaskLinking';
import { cn } from '../../utils/cn';
import { TaskBusinessRulesLinker } from './TaskBusinessRulesLinker';
import { FileViewer } from '../common/FileViewer';
import { ImageModal } from '../common/ImageModal';
import { detectFileType } from '../../services/fileViewerService';
import { fetchJiraAttachmentAsDataUrl } from '../../utils/jiraAttachmentFetch';
import { Button } from '../common/Button';
import { BackButton } from '../common/BackButton';
import { useJiraAttachmentViewer } from '../../hooks/useJiraAttachmentViewer';
import {
  leveTaskModalNavFooterClass,
  leveTaskModalStrongClass,
  leveTaskModalTabBadgeActiveClass,
  leveTaskModalTabBadgeIdleClass,
} from '../common/projectCardUi';
import {
  taskDetailsModalBodyClass,
  taskDetailsModalGhostBtnClass,
  taskDetailsModalPanelShellClass,
  taskDetailsModalShellClass,
  taskDetailsModalTabClass,
  taskDetailsModalTabsScrollWrapClass,
  taskDetailsModalTabsTrackClass,
  taskDetailsModalTitleClass,
  taskDetailsModalHeaderSectionClass,
} from './taskDetailsNeuUi';
import {
  ClipboardList,
  Timer,
  ChevronLeft,
  ChevronRight,
  FileText,
  FlaskConical,
  Scale,
  type LucideIcon,
} from 'lucide-react';
import { TaskOverviewSection } from './sections/TaskOverviewSection';
import { TaskBddSection } from './sections/TaskBddSection';
import { TaskTestsSection } from './sections/TaskTestsSection';
import { TaskPlanningSection } from './sections/TaskPlanningSection';
import { TaskDetailProvider, type TaskDetailContextValue } from './sections/TaskDetailContext';

import type { TaskDetailSectionId, OpenTaskNavProps } from '../../utils/workspaceSessionStorage';
type DetailSection = TaskDetailSectionId;

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
  /** Seção inicial restaurada da sessão do workspace. */
  initialSection?: DetailSection;
  onSectionChange?: (section: DetailSection) => void;
  /** Navegação entre abas de tarefa abertas (modo workspace). */
  openTaskNav?: OpenTaskNavProps;
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
  initialSection,
  onSectionChange,
  openTaskNav,
}) => {
  const [detailLevel, setDetailLevel] = useState<TestCaseDetailLevel>('Estruturado');
  const [showTestReport, setShowTestReport] = useState(false);
  const {
    viewingJiraAttachment,
    setViewingJiraAttachment,
    loadingJiraAttachmentId,
    handleViewJiraAttachment,
  } = useJiraAttachmentViewer();
  const [activeSection, setActiveSectionState] = useState<DetailSection>(
    initialSection ?? 'overview'
  );

  const setActiveSection = useCallback(
    (section: DetailSection) => {
      setActiveSectionState(section);
      onSectionChange?.(section);
    },
    [onSectionChange]
  );

  useEffect(() => {
    if (initialSection) {
      setActiveSectionState(initialSection);
    }
  }, [initialSection]);

  const safeDomId = useMemo(() => task.id.replace(/[^a-zA-Z0-9_-]/g, '_'), [task.id]);

  const sectionTabs = useMemo(() => {
    if (hideTestFeatures) {
      return [{ id: 'overview' as const, label: 'Resumo', icon: FileText }];
    }

    const tabs: { id: DetailSection; label: string; badge?: number; icon: LucideIcon }[] = [
      { id: 'overview', label: 'Resumo', icon: FileText },
    ];

    if (task.type === 'Tarefa' || task.type === 'Bug') {
      tabs.push({
        id: 'bdd',
        label: 'Cenários BDD',
        badge: task.bddScenarios?.length || 0,
        icon: ClipboardList,
      });
    }

    if (task.type === 'Tarefa' || task.type === 'Bug') {
      tabs.push({
        id: 'tests',
        label: 'Testes',
        badge: task.testCases?.length || 0,
        icon: FlaskConical,
      });
    }

    if (project && onUpdateProject) {
      const idSet = new Set(getLinkedBusinessRuleIdsForTask(project, task));
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
        icon: Scale,
      });
      const dependentsCount = getTaskDependents(task.id, project).length;
      const planningBadge =
        (task.dependencies?.length || 0) +
        dependentsCount +
        (task.attachments?.length || 0) +
        (task.checklist?.length || 0) +
        (task.estimatedHours ? 1 : 0);
      tabs.push({ id: 'planning', label: 'Planejamento', badge: planningBadge, icon: Timer });
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
  }, [sectionTabs, activeSection, task.type, project, onUpdateProject, setActiveSection]);

  const handleShowTestReport = useCallback(() => setShowTestReport(true), []);

  const taskDetailValue = useMemo<TaskDetailContextValue>(
    () => ({
      task,
      project,
      onUpdateProject,
      hideTestFeatures,
      detailLevel,
      onDetailLevelChange: setDetailLevel,
      isGenerating,
      isGeneratingBdd,
      isGeneratingAll,
      isUpdatingFromJira,
      onGenerateTests,
      onGenerateBddScenarios,
      onGenerateAll,
      onUpdateFromJira,
      onSaveBddScenario,
      onDeleteBddScenario,
      onAddComment,
      onEditComment,
      onDeleteComment,
      onTaskToolsChange,
      onStrategyExecutedChange,
      onStrategyToolsChange,
      onTestCaseStatusChange,
      onTestCaseObservedResultChange,
      onTestCaseExecutionKindChange,
      onEditTestCase,
      onDeleteTestCase,
      onDuplicateTestCase,
      onAddTestCaseFromTemplate,
      onNavigateToTab,
      onOpenTask,
      onShowTestReport: handleShowTestReport,
      onViewJiraAttachment: handleViewJiraAttachment,
      loadingJiraAttachmentId,
    }),
    [
      task,
      project,
      onUpdateProject,
      hideTestFeatures,
      detailLevel,
      isGenerating,
      isGeneratingBdd,
      isGeneratingAll,
      isUpdatingFromJira,
      onGenerateTests,
      onGenerateBddScenarios,
      onGenerateAll,
      onUpdateFromJira,
      onSaveBddScenario,
      onDeleteBddScenario,
      onAddComment,
      onEditComment,
      onDeleteComment,
      onTaskToolsChange,
      onStrategyExecutedChange,
      onStrategyToolsChange,
      onTestCaseStatusChange,
      onTestCaseObservedResultChange,
      onTestCaseExecutionKindChange,
      onEditTestCase,
      onDeleteTestCase,
      onDuplicateTestCase,
      onAddTestCaseFromTemplate,
      onNavigateToTab,
      onOpenTask,
      handleShowTestReport,
      handleViewJiraAttachment,
      loadingJiraAttachmentId,
    ]
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

  const renderSectionById = (sectionId: DetailSection) => {
    switch (sectionId) {
      case 'overview':
        return <TaskOverviewSection />;
      case 'bdd':
        return <TaskBddSection />;
      case 'tests':
        return <TaskTestsSection />;
      case 'businessRules':
        return renderBusinessRulesSection();
      case 'planning':
        return <TaskPlanningSection />;
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
    <TaskDetailProvider value={taskDetailValue}>
    <div className="flex flex-col gap-3">
      <BackButton
        className={cn('task-details-neu-back-btn self-start -ml-1', taskDetailsModalGhostBtnClass)}
        onClick={onClose}
        aria-label={
          presentation === 'workspace'
            ? 'Fechar aba da tarefa'
            : 'Voltar para a lista de tarefas'
        }
      />
      {presentation === 'workspace' && openTaskNav && openTaskNav.total > 1 ? (
        <nav
          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-base-300/50 bg-base-200/40 px-3 py-2"
          aria-label="Navegação entre tarefas abertas"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(taskDetailsModalGhostBtnClass, 'gap-1')}
            onClick={openTaskNav.onPrev}
            aria-label="Tarefa anterior (Alt + seta esquerda)"
          >
            <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
            Tarefa anterior
          </Button>
          <span className="text-xs text-base-content/70" aria-live="polite">
            {openTaskNav.currentIndex} de {openTaskNav.total}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(taskDetailsModalGhostBtnClass, 'gap-1')}
            onClick={openTaskNav.onNext}
            aria-label="Próxima tarefa (Alt + seta direita)"
          >
            Próxima tarefa
            <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
          </Button>
        </nav>
      ) : null}
      <div className={taskDetailsModalTabsScrollWrapClass}>
        <div className={taskDetailsModalTabsTrackClass} role="tablist" aria-label="Seções da tarefa">
          {sectionTabs.length > 1
            ? sectionTabs.map(tab => {
                const isActive = tab.id === activeSection;
                const tabId = `task-${safeDomId}-tab-${tab.id}`;
                const panelId = `task-${safeDomId}-panel-${tab.id}`;
                const TabIcon = tab.icon;
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
                    <TabIcon className="h-4 w-4 shrink-0" aria-hidden />
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

      <div className={cn(taskDetailsModalPanelShellClass, 'overflow-visible')}>
        {sectionTabs.map(tab => {
          const isActive = tab.id === activeSection;
          const panelId = `task-${safeDomId}-panel-${tab.id}`;
          return (
            <div
              key={tab.id}
              id={panelId}
              role="tabpanel"
              aria-labelledby={`task-${safeDomId}-tab-${tab.id}`}
              hidden={!isActive}
              aria-hidden={!isActive}
              className={cn(!isActive && 'hidden')}
            >
              {renderSectionById(tab.id)}
              {isActive && sectionTabs.length > 1 ? renderNavigationFooter() : null}
            </div>
          );
        })}
      </div>
    </div>
    </TaskDetailProvider>
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

      <TestReportModal isOpen={showTestReport} onClose={() => setShowTestReport(false)} task={task} />

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
