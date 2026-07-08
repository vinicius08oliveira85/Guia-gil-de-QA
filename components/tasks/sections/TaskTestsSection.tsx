import React, { useState } from 'react';
import { BarChart3, Sparkles, Wrench } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { Spinner } from '../../common/Spinner';
import { EmptyState } from '../../common/EmptyState';
import { TestCasesSection } from '../TestCasesSection';
import { TestStrategyCard } from '../TestStrategyCard';
import { TestCaseDetailLevelControl } from '../TestCaseDetailLevelControl';
import { TestCasesFreshnessIndicator } from '../TestCasesFreshnessIndicator';
import { ToolsSelector } from '../ToolsSelector';
import { taskCardTypography, taskTextStrongClass } from '../taskActionLayout';
import {
  leveTaskModalFieldLabelClass,
  leveTaskModalMutedClass,
  leveTaskModalStrongClass,
  leveTaskModalTabBadgeActiveClass,
  leveTaskModalTabBadgeIdleClass,
  leveSettingsSectionIconWrapClass,
} from '../../common/projectCardUi';
import {
  taskDetailsModalSectionClass,
  taskDetailsModalTabClass,
  taskDetailsModalTabsScrollWrapClass,
  taskDetailsModalTabsTrackClass,
  taskDetailsModalPrimaryCtaClass,
} from '../taskDetailsNeuUi';
import { useTaskDetail } from './TaskDetailContext';

type TestSubSection = 'strategy' | 'test-cases';

/** Aba «Testes» do detalhe da tarefa: estratégia + casos de teste. */
export const TaskTestsSection: React.FC = () => {
  const {
    task,
    project,
    isGenerating,
    detailLevel,
    onDetailLevelChange,
    onGenerateTests,
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
  } = useTaskDetail();
  const [activeTestSubSection, setActiveTestSubSection] = useState<TestSubSection>('strategy');

  if (task.type !== 'Tarefa' && task.type !== 'Bug') {
    return null;
  }

  const canHaveTestCases = task.type === 'Tarefa' || task.type === 'Bug';
  const hasTests = !!(task.testCases && task.testCases.length > 0);

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
                <h3 className={cn(leveTaskModalFieldLabelClass, 'mb-3 flex items-center gap-2 !normal-case')}>
                  <Wrench className="h-5 w-5 text-primary" aria-hidden />
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
          <div className="flex min-w-0 flex-col gap-4 border-t border-base-300/55 pt-5 lg:w-80 lg:shrink-0 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <TestCaseDetailLevelControl
              idPrefix={task.id}
              value={detailLevel}
              onChange={onDetailLevelChange}
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
              <TestCasesFreshnessIndicator task={task} project={project} isGenerating={isGenerating} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

TaskTestsSection.displayName = 'TaskTestsSection';
