import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from '../common/Modal';
import { TestReportModal } from './TestReportModal';
import { DevImplementationReportModal } from './DevImplementationReportModal';
import { JiraTask, BddScenario, TestCaseDetailLevel, Project, TestCase, DevImplementationRecord } from '../../types';
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
  Code2,
  type LucideIcon,
} from 'lucide-react';
import { TaskOverviewSection } from './sections/TaskOverviewSection';
import { TaskBddSection } from './sections/TaskBddSection';
import { TaskTestsSection } from './sections/TaskTestsSection';
import { TaskDevGuidanceSection } from './sections/TaskDevGuidanceSection';
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
  onGenerateStrategyHowToExecute?: (strategyIndex: number) => Promise<void>;
  generatingStrategyHowToExecuteIndex?: number | null;
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
  /** Fluxo Projetos Dev: guia de implementação em vez de BDD/testes. */
  devMode?: boolean;
  onGenerateDevGuidance?: (taskId: string) => Promise<void>;
  isGeneratingDevGuidance?: boolean;
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
  onGenerateStrategyHowToExecute,
  generatingStrategyHowToExecuteIndex = null,
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
  devMode = false,
  onGenerateDevGuidance,
  isGeneratingDevGuidance = false,
  initialSection,
  onSectionChange,
  openTaskNav,
}) => {
  const [detailLevel, setDetailLevel] = useState<TestCaseDetailLevel>('Estruturado');
  const [showTestReport, setShowTestReport] = useState(false);
  const [showDevImplementationReport, setShowDevImplementationReport] = useState(false);
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

    if (devMode && (task.type === 'Tarefa' || task.type === 'Bug')) {
      tabs.push({
        id: 'guidance',
        label: 'Guia Dev',
        badge: task.devGuidance ? 1 : undefined,
        icon: Code2,
      });
    }

    if (!devMode && (task.type === 'Tarefa' || task.type === 'Bug')) {
      tabs.push({
        id: 'bdd',
        label: 'Cenários BDD',
        badge: task.bddScenarios?.length || 0,
        icon: ClipboardList,
      });
    }

    if (!devMode && (task.type === 'Tarefa' || task.type === 'Bug')) {
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
    devMode,
    task.type,
    task.devGuidance,
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
      (activeSection === 'tests' || activeSection === 'bdd' || activeSection === 'guidance') &&
      task.type !== 'Tarefa' &&
      task.type !== 'Bug'
    ) {
      setActiveSection('overview');
    }
    if (activeSection === 'guidance' && !devMode) {
      setActiveSection('overview');
    }
  }, [sectionTabs, activeSection, task.type, project, onUpdateProject, setActiveSection, devMode]);

  const handleShowTestReport = useCallback(() => setShowTestReport(true), []);
  const handleShowDevImplementationReport = useCallback(
    () => setShowDevImplementationReport(true),
    []
  );

  const handleSaveDevImplementationRecord = useCallback(
    async (record: DevImplementationRecord, markAsDone: boolean) => {
      if (!project || !onUpdateProject) {
        throw new Error('Projeto indisponível para salvar registro.');
      }
      const updatedTask: JiraTask = {
        ...task,
        devImplementationRecord: record,
        ...(markAsDone
          ? {
              status: 'Done' as const,
              completedAt: record.completedAt,
            }
          : {}),
      };
      await onUpdateProject({
        ...project,
        tasks: project.tasks.map(t => (t.id === task.id ? updatedTask : t)),
      });
    },
    [project, onUpdateProject, task]
  );

  const taskDetailValue = useMemo<TaskDetailContextValue>(
    () => ({
      task,
      project,
      onUpdateProject,
      hideTestFeatures,
      devMode,
      onGenerateDevGuidance,
      isGeneratingDevGuidance,
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
      onGenerateStrategyHowToExecute,
      generatingStrategyHowToExecuteIndex,
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
      onShowDevImplementationReport: devMode ? handleShowDevImplementationReport : undefined,
      onViewJiraAttachment: handleViewJiraAttachment,
      loadingJiraAttachmentId,
    }),
    [
      task,
      project,
      onUpdateProject,
      hideTestFeatures,
      devMode,
      onGenerateDevGuidance,
      isGeneratingDevGuidance,
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
      onGenerateStrategyHowToExecute,
      generatingStrategyHowToExecuteIndex,
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
      handleShowDevImplementationReport,
      handleViewJiraAttachment,
      loadingJiraAttachmentId,
    ]
  );

  const renderBusinessRulesSection = () => {
    if (!project || !onUpdateProject) return null;
    return (
      <TaskBusinessRulesLinker
        task={task}
        project={project}
        onUpdateProject={onUpdateProject}
        onNavigateToTab={onNavigateToTab}
      />
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
      case 'guidance':
        return (
          <TaskDevGuidanceSection
            task={task}
            project={project}
            isGenerating={isGeneratingDevGuidance}
            onGenerate={() => onGenerateDevGuidance?.(task.id) ?? Promise.resolve()}
          />
        );
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
    <div className="flex flex-col gap-2">
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
          className="flex items-center justify-between gap-2 rounded-selector border border-base-300/45 bg-base-200/35 px-2 py-1"
          aria-label="Navegação entre tarefas abertas"
        >
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(taskDetailsModalGhostBtnClass, 'gap-0.5 px-2')}
            onClick={openTaskNav.onPrev}
            aria-label="Tarefa anterior (Alt + seta esquerda)"
          >
            <ChevronLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Anterior</span>
          </Button>
          <span className="text-[11px] font-medium tabular-nums text-base-content/70" aria-live="polite">
            {openTaskNav.currentIndex} de {openTaskNav.total}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(taskDetailsModalGhostBtnClass, 'gap-0.5 px-2')}
            onClick={openTaskNav.onNext}
            aria-label="Próxima tarefa (Alt + seta direita)"
          >
            <span className="hidden sm:inline">Próxima</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
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
                    <TabIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
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
            'rounded-box p-3 sm:p-4'
          )}
        >
          <div className="mb-3 flex min-w-0 flex-col gap-1 border-b border-base-300/55 pb-3">
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
        isOpen={showTestReport && !devMode && !hideTestFeatures}
        onClose={() => setShowTestReport(false)}
        task={task}
      />

      {devMode && task.devGuidance ? (
        <DevImplementationReportModal
          isOpen={showDevImplementationReport}
          onClose={() => setShowDevImplementationReport(false)}
          task={task}
          project={project}
          onSaveRecord={handleSaveDevImplementationRecord}
        />
      ) : null}

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
