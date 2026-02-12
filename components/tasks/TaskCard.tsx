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
    <Card className="p-3 sm:p-4 space-y-2 sm:space-y-3 transition-all duration-300">
      {/* Mobile: Layout compacto em 2 linhas */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
        {/* Linha 1 Mobile: Badge + ID | Status Jira + Botão Expandir */}
        <div className="flex items-center justify-between w-full sm:w-auto sm:flex-1 sm:pr-4">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Badge variant={taskTypeBadge.variant} size="sm" className="shrink-0">{taskTypeBadge.label}</Badge>
            <span className="font-semibold text-base-content text-sm sm:text-base shrink-0">{task.id}</span>
          </div>
          <div className="flex items-center gap-2 sm:hidden">
            <Badge variant={jiraStatusBadge.variant} size="sm">{jiraStatusBadge.label}</Badge>
            <button onClick={handleToggleExpand} className="btn btn-ghost btn-sm btn-circle shrink-0" aria-label={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}>
              {isExpanded ? <ChevronUp /> : <ChevronDown />}
            </button>
          </div>
        </div>
        
        {/* Título - quebra natural, máximo 2 linhas em mobile */}
        <div className="w-full sm:flex-1 sm:pr-4 cursor-pointer" onClick={handleToggleExpand}>
          <h3 className="font-bold text-base sm:text-lg text-base-content leading-tight line-clamp-2 sm:line-clamp-none">{task.title}</h3>
        </div>
        
        {/* Botão expandir - apenas desktop */}
        <button onClick={handleToggleExpand} className="hidden sm:flex btn btn-ghost btn-sm btn-circle shrink-0" aria-label={isExpanded ? "Recolher detalhes" : "Expandir detalhes"}>
          {isExpanded ? <ChevronUp /> : <ChevronDown />}
        </button>
      </div>

      {/* Linha 2 Mobile: Status Teste + Métricas + Ações */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
        {/* Mobile: Status teste + Métricas em linha única */}
        <div className="flex items-center gap-2 sm:gap-4 flex-wrap sm:flex-nowrap w-full sm:w-auto">
          <Badge variant={testStatus.variant} size="sm" className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {testStatus.icon}
            <span className="text-xs sm:text-sm">{testStatus.label}</span>
          </Badge>
          <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm flex-1 sm:flex-initial">
            <span className="flex items-center gap-1 text-success shrink-0" title="Aprovados">
              <Check className="w-3 h-3 sm:w-4 sm:h-4" /> {testMetrics.passed}
            </span>
            <span className="flex items-center gap-1 text-error shrink-0" title="Reprovados">
              <X className="w-3 h-3 sm:w-4 sm:h-4" /> {testMetrics.failed}
            </span>
            <span className="flex items-center gap-1 text-base-content/60 shrink-0" title="Pendentes">
              <Pause className="w-3 h-3 sm:w-4 sm:h-4" /> {testMetrics.notRun}
            </span>
          </div>
        </div>

        {/* Mobile: Status Jira e botões | Desktop: Apenas botões */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end sm:justify-start">
          <Badge variant={jiraStatusBadge.variant} size="sm" className="hidden sm:inline-flex">{jiraStatusBadge.label}</Badge>
          {testStatus.label !== 'Teste Concluído' && testStatus.label !== 'Sem Testes' && (
            <button 
              className="btn btn-primary btn-xs sm:btn-sm flex-1 sm:flex-initial min-w-[100px] sm:min-w-0"
              onClick={() => onStartTest?.(task.id)}
              aria-label={testStatus.label === 'Testar' ? 'Iniciar teste' : 'Continuar teste'}
            >
              <span className="truncate">{testStatus.label === 'Testar' ? 'Iniciar' : 'Continuar'}</span>
            </button>
          )}
          {testStatus.label === 'Teste Concluído' && (
            <button 
              className="btn btn-secondary btn-xs sm:btn-sm flex-1 sm:flex-initial min-w-[100px] sm:min-w-0"
              onClick={() => onCompleteTest?.(task.id)}
              aria-label="Concluir tarefa"
            >
              <span className="truncate">Concluir</span>
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