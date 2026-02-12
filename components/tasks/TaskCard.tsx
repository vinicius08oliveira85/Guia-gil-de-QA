import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Play, Check, X, Pause } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

// Assumindo que seus tipos estão definidos em um arquivo como 'types.ts'
// import { JiraTask } from '../../types';

// Definição de tipos para o exemplo, caso não existam.
// O ideal é que venham de um arquivo central de tipos.
interface TestCase {
  id: string;
  status: 'Not Run' | 'Passed' | 'Failed' | 'Blocked';
  description?: string;
}

interface JiraTask {
  id: string;
  title: string;
  description: string;
  type: 'Epic' | 'História' | 'Tarefa' | 'Bug';
  status: 'To Do' | 'In Progress' | 'Done' | 'Blocked';
  testCases: TestCase[];
}

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
    <Card className="p-2 sm:p-4 transition-all duration-300">
      {/* Linha 1 Mobile: Badge Tipo + ID + Título Truncado | Status Jira + Botão */}
      <div className="flex items-center gap-1.5 sm:gap-2 h-6 sm:h-auto overflow-hidden">
        <div className="flex items-center gap-1 sm:gap-2 flex-1 min-w-0 overflow-hidden">
          <Badge variant={taskTypeBadge.variant} size="sm" className="shrink-0 text-[10px] sm:!text-sm px-1 sm:px-2 py-0 sm:py-1">
            {taskTypeBadge.label}
          </Badge>
          <span className="font-semibold text-base-content text-[10px] sm:text-base shrink-0">
            {task.id}
          </span>
          <h3 
            className="font-bold text-xs sm:text-lg text-base-content truncate flex-1 min-w-0 cursor-pointer" 
            onClick={handleToggleExpand}
            title={task.title}
          >
            {task.title}
          </h3>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Badge variant={jiraStatusBadge.variant} size="sm" className="text-[10px] sm:!text-sm px-1 sm:px-2 py-0 sm:py-1 hidden sm:inline-flex">
            {jiraStatusBadge.label}
          </Badge>
          <button 
            onClick={handleToggleExpand} 
            className="btn btn-ghost btn-xs sm:btn-sm btn-circle shrink-0 h-5 w-5 sm:!h-auto sm:!w-auto min-h-0 sm:!min-h-0" 
            aria-label={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}
          >
            {isExpanded ? <ChevronUp className="w-3 h-3 sm:!w-4 sm:!h-4" /> : <ChevronDown className="w-3 h-3 sm:!w-4 sm:!h-4" />}
          </button>
        </div>
      </div>

      {/* Linha 2 Mobile: Status Teste + Métricas + Ações */}
      <div className="flex items-center gap-1 sm:gap-4 h-6 sm:h-auto overflow-hidden">
        <div className="flex items-center gap-1 sm:gap-4 flex-1 min-w-0">
          <Badge variant={testStatus.variant} size="sm" className="flex items-center gap-0.5 sm:gap-1.5 shrink-0 text-[10px] sm:!text-sm px-1 sm:px-2 py-0 sm:py-1">
            {testStatus.icon && (
              <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex items-center justify-center [&>svg]:w-2.5 [&>svg]:h-2.5 sm:[&>svg]:w-3 sm:[&>svg]:h-3">
                {testStatus.icon}
              </span>
            )}
            <span className="text-[10px] sm:text-sm truncate max-w-[60px] sm:max-w-none">{testStatus.label}</span>
          </Badge>
          <div className="flex items-center gap-1 sm:gap-3 text-[10px] sm:text-sm shrink-0">
            <span className="flex items-center gap-0.5 text-success" title="Aprovados">
              <Check className="w-2.5 h-2.5 sm:w-4 sm:h-4" /> 
              <span>{testMetrics.passed}</span>
            </span>
            <span className="flex items-center gap-0.5 text-error" title="Reprovados">
              <X className="w-2.5 h-2.5 sm:w-4 sm:h-4" /> 
              <span>{testMetrics.failed}</span>
            </span>
            <span className="flex items-center gap-0.5 text-base-content/60" title="Pendentes">
              <Pause className="w-2.5 h-2.5 sm:w-4 sm:h-4" /> 
              <span>{testMetrics.notRun}</span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          <Badge variant={jiraStatusBadge.variant} size="sm" className="text-[10px] sm:!text-sm px-1 sm:px-2 py-0 sm:py-1 inline-flex sm:hidden">
            {jiraStatusBadge.label}
          </Badge>
          {testStatus.label !== 'Teste Concluído' && testStatus.label !== 'Sem Testes' && (
            <button 
              className="btn btn-primary btn-xs sm:btn-sm shrink-0 h-5 sm:!h-auto px-1.5 sm:!px-3 text-[10px] sm:!text-sm min-h-0 sm:!min-h-0"
              onClick={() => onStartTest?.(task.id)}
              aria-label={testStatus.label === 'Testar' ? 'Iniciar teste' : 'Continuar teste'}
            >
              <span className="truncate max-w-[50px] sm:max-w-none">{testStatus.label === 'Testar' ? 'Iniciar' : 'Continuar'}</span>
            </button>
          )}
          {testStatus.label === 'Teste Concluído' && (
            <button 
              className="btn btn-secondary btn-xs sm:btn-sm shrink-0 h-5 sm:!h-auto px-1.5 sm:!px-3 text-[10px] sm:!text-sm min-h-0 sm:!min-h-0"
              onClick={() => onCompleteTest?.(task.id)}
              aria-label="Concluir tarefa"
            >
              <span className="truncate max-w-[50px] sm:max-w-none">Concluir</span>
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