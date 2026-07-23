import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { TestMetricBadge } from '../common/TestMetricBadge';
import { TaskTestStatusBadge } from '../common/TaskTestStatusBadge';
import type { JiraTask } from '../../types';
import { cn } from '../../utils/cn';
import {
  taskCardMutedClass,
  taskCardShellLayoutClass,
  taskCardTitleClass,
  taskNeuDividerClass,
} from './taskActionLayout';
import { TaskCardHeader, TaskCardMetadataStrip } from './TaskCardHeader';

interface TaskCardProps {
  task: JiraTask;
  onStartTest?: (taskId: string) => void;
  onCompleteTest?: (taskId: string) => void;
}

/**
 * Card de Tarefa com visualização expansível.
 * Mostra informações essenciais e expande para detalhes.
 */
export const TaskCard: React.FC<TaskCardProps> = ({ task, onStartTest, onCompleteTest }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentId = `task-card-content-${task.id}`;
  type BadgeVariant = React.ComponentProps<typeof Badge>['variant'];
  type TaskCardTestStatus = 'testar' | 'testando' | 'teste_concluido' | 'sem_testes';

  // Calcula as métricas dos casos de teste
  const testMetrics = useMemo(() => {
    const total = task.testCases?.length || 0;
    const passed = task.testCases?.filter(tc => tc.status === 'Passed').length || 0;
    const failed = task.testCases?.filter(tc => tc.status === 'Failed').length || 0;
    const notRun = task.testCases?.filter(tc => tc.status === 'Not Run').length || 0;
    const executed = total - notRun;
    return { total, passed, failed, notRun, executed };
  }, [task.testCases]);

  // Determina o status geral do teste para a tarefa
  const testStatus = useMemo<{
    status: TaskCardTestStatus;
  }>(() => {
    if (!testMetrics.total || testMetrics.total === 0) {
      return { status: 'sem_testes' };
    }
    if (testMetrics.executed === 0) {
      return { status: 'testar' };
    }
    if (testMetrics.executed < testMetrics.total) {
      return { status: 'testando' };
    }
    return { status: 'teste_concluido' };
  }, [testMetrics]);

  // Mapeia o status do Jira para um badge
  const jiraStatusBadge = useMemo<{ label: string; variant: BadgeVariant }>(() => {
    switch (task.status) {
      case 'To Do':
        return { label: 'Pendente', variant: 'neutral' };
      case 'In Progress':
        return { label: 'Em Andamento', variant: 'info' };
      case 'Done':
        return { label: 'Concluído', variant: 'success' };
      default:
        return { label: task.status, variant: 'error' };
    }
  }, [task.status]);

  // Mapeia o tipo de tarefa para um badge
  const taskTypeBadge = useMemo<{ label: string; variant: BadgeVariant }>(() => {
    switch (task.type) {
      case 'Bug':
        return { label: 'Bug', variant: 'error' };
      case 'História':
        return { label: 'História', variant: 'primary' };
      case 'Tarefa':
        return { label: 'Tarefa', variant: 'secondary' };
      default:
        return { label: task.type, variant: 'accent' };
    }
  }, [task.type]);

  const handleToggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <Card className="p-4 transition-all duration-300">
      <div className={cn(taskCardShellLayoutClass, 'items-start')}>
        <div
          className="flex min-w-0 flex-1 cursor-pointer"
          onClick={handleToggleExpand}
        >
          <TaskCardHeader
            className="flex-1"
            title={task.title}
            titleAs="h3"
            metadata={
              <TaskCardMetadataStrip>
                <Badge variant={taskTypeBadge.variant} size="sm" className="shrink-0">
                  {taskTypeBadge.label}
                </Badge>
                <span className={cn(taskCardTitleClass, 'shrink-0 text-sm font-semibold')}>
                  {task.id}
                </span>
                <Badge
                  variant={jiraStatusBadge.variant}
                  size="sm"
                  className="inline-flex shrink-0 justify-center"
                >
                  {jiraStatusBadge.label}
                </Badge>
              </TaskCardMetadataStrip>
            }
          />
        </div>
        <Button
          onClick={handleToggleExpand}
          size="circle" variant="ghost"
          className="shrink-0 min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-8 p-0 [&_svg]:size-[18px] sm:[&_svg]:size-5"
          aria-expanded={isExpanded}
          aria-controls={contentId}
          aria-label={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
        >
          {isExpanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
        </Button>
      </div>

      <div className="mt-3 flex flex-col gap-tasks-panel-tight sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-tasks-panel-tight lg:flex-nowrap">
          <TaskTestStatusBadge
            status={testStatus.status}
            className="min-w-[8.25rem] justify-center"
          />
          <div
            className="flex min-w-[4.75rem] items-center justify-end gap-1.5 text-sm"
            aria-label="Métricas de teste"
          >
            <TestMetricBadge value={testMetrics.passed} label="Aprovados" tone="success" />
            <TestMetricBadge value={testMetrics.failed} label="Reprovados" tone="error" />
            <TestMetricBadge value={testMetrics.notRun} label="Pendentes" tone="warning" />
          </div>
        </div>

        <div className="flex w-full flex-wrap items-center gap-tasks-panel-tight lg:w-auto lg:flex-nowrap lg:justify-end">
          {testStatus.status !== 'teste_concluido' && testStatus.status !== 'sem_testes' && (
            <Button
              size="sm"
              variant={
                testStatus.status === 'testar'
                  ? 'info'
                  : testStatus.status === 'testando'
                    ? 'secondary'
                    : 'warning'
              }
              className="min-w-[8.75rem] justify-center"
              onClick={() => onStartTest?.(task.id)}
            >
              {testStatus.status === 'testar' ? 'Iniciar Teste' : 'Continuar'}
            </Button>
          )}
          {testStatus.status === 'teste_concluido' && (
            <Button
              size="sm" variant="success"
              className="min-w-[8.75rem] justify-center"
              onClick={() => onCompleteTest?.(task.id)}
            >
              Concluir
            </Button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div id={contentId} className={cn('mt-4 space-y-4 border-t pt-4', taskNeuDividerClass)}>
          <div>
            <h4 className={cn(taskCardTitleClass, 'mb-2 text-sm')}>Descrição</h4>
            <p
              className={cn(
                taskCardMutedClass,
                'whitespace-pre-wrap text-sm line-clamp-4 max-sm:line-clamp-4 sm:line-clamp-none'
              )}
            >
              {task.description || 'Esta tarefa não possui uma descrição detalhada.'}
            </p>
          </div>

          <div className="mt-4">
            <h4 className={cn(taskCardTitleClass, 'mb-2 text-sm')}>
              Casos de Teste ({testMetrics.total})
            </h4>
            {/* Você pode renderizar a lista de casos de teste aqui */}
            <ul className="space-y-1 text-sm list-disc list-inside">
              {task.testCases.map(tc => (
                <li key={tc.id} className={cn(taskCardMutedClass, 'whitespace-pre-wrap break-words text-sm')}>
                  {tc.action} - <strong>{tc.status}</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
};
