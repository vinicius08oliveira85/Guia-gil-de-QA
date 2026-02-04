import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Play, Check, X, Pause } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { JiraTask } from '../../types';

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
  const testStatus = useMemo(() => {
    if (!testMetrics.total || testMetrics.total === 0) {
      return { label: 'Sem Testes', variant: 'neutral', icon: null };
    }
    if (testMetrics.executed === 0) {
      return { label: 'Testar', variant: 'info', icon: <Play className="w-3 h-3" /> };
    }
    if (testMetrics.executed < testMetrics.total) {
      return { label: 'Testando', variant: 'warning', icon: <Pause className="w-3 h-3" /> };
    }
    return { label: 'Teste Concluído', variant: 'success', icon: <Check className="w-3 h-3" /> };
  }, [testMetrics]);

  // Mapeia o status do Jira para um badge
  const jiraStatusBadge = useMemo(() => {
    switch (task.status) {
      case 'To Do': return { label: 'Pendente', variant: 'neutral' };
      case 'In Progress': return { label: 'Em Andamento', variant: 'info' };
      case 'Done': return { label: 'Concluído', variant: 'success' };
      default: return { label: task.status, variant: 'error' };
    }
  }, [task.status]);

  // Mapeia o tipo de tarefa para um badge
  const taskTypeBadge = useMemo(() => {
    switch (task.type) {
      case 'Bug': return { label: 'Bug', variant: 'error' };
      case 'História': return { label: 'História', variant: 'primary' };
      case 'Tarefa': return { label: 'Tarefa', variant: 'secondary' };
      default: return { label: task.type, variant: 'accent' };
    }
  }, [task.type]);

  const handleToggleExpand = () => setIsExpanded(!isExpanded);

  return (
    <Card className="p-4 space-y-3 transition-all duration-300">
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-4 cursor-pointer" onClick={handleToggleExpand}>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={taskTypeBadge.variant} size="sm">{taskTypeBadge.label}</Badge>
            <span className="font-semibold text-base-content">{task.id}</span>
          </div>
          <h3 className="font-bold text-lg text-base-content leading-tight">{task.title}</h3>
        </div>
        <button onClick={handleToggleExpand} className="btn btn-ghost btn-sm btn-circle">
          {isExpanded ? <ChevronUp /> : <ChevronDown />}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-wrap">
          <Badge variant={testStatus.variant} size="md" className="flex items-center gap-1.5">
            {testStatus.icon}
            <span>{testStatus.label}</span>
          </Badge>
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1 text-success" title="Aprovados">
              <Check className="w-4 h-4" /> {testMetrics.passed}
            </span>
            <span className="flex items-center gap-1 text-error" title="Reprovados">
              <X className="w-4 h-4" /> {testMetrics.failed}
            </span>
            <span className="flex items-center gap-1 text-base-content/60" title="Pendentes">
              <Pause className="w-4 h-4" /> {testMetrics.notRun}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={jiraStatusBadge.variant} size="sm">{jiraStatusBadge.label}</Badge>
          {testStatus.label !== 'Teste Concluído' && testStatus.label !== 'Sem Testes' && (
            <button 
              className="btn btn-primary btn-sm"
              onClick={() => onStartTest?.(task.id)}
            >
              {testStatus.label === 'Testar' ? 'Iniciar Teste' : 'Continuar'}
            </button>
          )}
          {testStatus.label === 'Teste Concluído' && (
             <button 
              className="btn btn-secondary btn-sm"
              onClick={() => onCompleteTest?.(task.id)}
            >
              Concluir
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="pt-4 mt-4 border-t border-base-300/20">
          <h4 className="font-semibold mb-2 text-base-content">Descrição</h4>
          <p className="text-base-content/80 whitespace-pre-wrap text-sm">
            {task.description || 'Esta tarefa não possui uma descrição detalhada.'}
          </p>
          
          <div className="mt-4">
             <h4 className="font-semibold mb-2 text-base-content">Casos de Teste ({testMetrics.total})</h4>
             {/* Você pode renderizar a lista de casos de teste aqui */}
             <ul className="space-y-1 text-sm list-disc list-inside">
                {task.testCases.map(tc => <li key={tc.id} className="text-base-content/80">{tc.description} - <strong>{tc.status}</strong></li>)}
             </ul> 
          </div>
        </div>
      )}
    </Card>
  );
};