import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { TestMetricBadge } from '../common/TestMetricBadge';
import { TaskTestStatusBadge } from '../common/TaskTestStatusBadge';
import type { JiraTask } from '../../types';
import { cn } from '../../utils/cn';

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
    <Card className="p-4 space-y-3 transition-all duration-300">
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-4 cursor-pointer" onClick={handleToggleExpand}>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={taskTypeBadge.variant} size="sm">
              {taskTypeBadge.label}
            </Badge>
            <span className="font-semibold text-base-content">{task.id}</span>
          </div>
          <h3 className="font-bold text-lg text-base-content leading-tight">{task.title}</h3>
        </div>
        <button
          type="button"
          onClick={handleToggleExpand}
          className="btn btn-ghost btn-sm btn-circle min-h-[44px] min-w-[44px] sm:min-h-8 sm:min-w-8 p-0 [&_svg]:size-[18px] sm:[&_svg]:size-5"
          aria-expanded={isExpanded}
          aria-controls={contentId}
          aria-label={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
        >
          {isExpanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
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

        <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap lg:justify-end">
          <Badge
            variant={jiraStatusBadge.variant}
            size="sm"
            className="inline-flex min-w-[7.5rem] justify-center"
          >
            {jiraStatusBadge.label}
          </Badge>
          {testStatus.status !== 'teste_concluido' && testStatus.status !== 'sem_testes' && (
            <button
              className={cn(
                'min-w-[8.75rem] justify-center',
                testStatus.status === 'testar'
                  ? 'btn btn-info btn-sm'
                  : testStatus.status === 'testando'
                    ? 'btn btn-secondary btn-sm'
                    : 'btn btn-warning btn-sm'
              )}
              onClick={() => onStartTest?.(task.id)}
            >
              {testStatus.status === 'testar' ? 'Iniciar Teste' : 'Continuar'}
            </button>
          )}
          {testStatus.status === 'teste_concluido' && (
            <button
              className="btn btn-success btn-sm min-w-[8.75rem] justify-center"
              onClick={() => onCompleteTest?.(task.id)}
            >
              Concluir
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div id={contentId} className="pt-4 mt-4 border-t border-base-300/20">
          <h4 className="font-semibold mb-2 text-base-content">Descrição</h4>
          <p className="text-base-content/80 whitespace-pre-wrap text-sm">
            {task.description || 'Esta tarefa não possui uma descrição detalhada.'}
          </p>

          <div className="mt-4">
            <h4 className="font-semibold mb-2 text-base-content">
              Casos de Teste ({testMetrics.total})
            </h4>
            {/* Você pode renderizar a lista de casos de teste aqui */}
            <ul className="space-y-1 text-sm list-disc list-inside">
              {task.testCases.map(tc => (
                <li key={tc.id} className="text-base-content/80 whitespace-pre-wrap break-words">
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
