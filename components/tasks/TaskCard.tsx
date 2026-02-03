import React from 'react';
import { 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertCircle, 
  User,
  Calendar,
  MoreVertical,
  ArrowUp,
  ArrowRight,
  ArrowDown
} from 'lucide-react';

// Interface compatível com JiraTask
export interface Task {
  id: string;
  title: string;
  status: string;
  priority?: string;
  assignee?: string;
  dueDate?: string;
  type?: string;
  [key: string]: any; // Flexibilidade para outros campos
}

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  onClick?: (task: Task) => void;
  compact?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  onEdit, 
  onDelete, 
  onClick,
  compact = false 
}) => {
  
  // Configuração visual baseada no status
  const getStatusConfig = (status: string) => {
    const s = String(status).toLowerCase();
    if (s.includes('concluído') || s.includes('done') || s.includes('finalizado')) {
      return { icon: CheckCircle2, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' };
    }
    if (s.includes('andamento') || s.includes('progress') || s.includes('doing')) {
      return { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' };
    }
    if (s.includes('bloqueado') || s.includes('blocked') || s.includes('erro')) {
      return { icon: AlertCircle, color: 'text-error', bg: 'bg-error/10', border: 'border-error/20' };
    }
    return { icon: Circle, color: 'text-base-content/60', bg: 'bg-base-200/50', border: 'border-base-200' };
  };

  const statusConfig = getStatusConfig(task.status);
  const StatusIcon = statusConfig.icon;

  // Cores de prioridade
  const getPriorityColor = (priority?: string) => {
    switch (String(priority).toLowerCase()) {
      case 'alta':
      case 'crítico':
      case 'high':
      case 'critical':
        return { color: 'text-error', bg: 'bg-error/10', border: 'border-l-error', icon: ArrowUp };
      case 'média':
      case 'medium':
        return { color: 'text-warning', bg: 'bg-warning/10', border: 'border-l-warning', icon: ArrowRight };
      case 'baixa':
      case 'low':
        return { color: 'text-info', bg: 'bg-info/10', border: 'border-l-info', icon: ArrowDown };
      default:
        return { color: 'text-base-content/50', bg: 'bg-base-200', border: 'border-l-base-300', icon: Circle };
    }
  };

  const priorityConfig = getPriorityColor(task.priority);
  const PriorityIcon = priorityConfig.icon;

  return (
    <div 
      className={`
        group relative flex flex-col gap-2 p-3
        bg-base-100 border border-base-200 rounded-xl
        border-l-[3px] ${priorityConfig.border}
        hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5
        transition-all duration-200 cursor-pointer
        ${compact ? 'text-sm' : ''}
      `}
      onClick={() => onClick?.(task)}
      role="article"
      aria-label={`Tarefa ${task.title}`}
    >
      {/* Header: ID e Prioridade */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] font-bold text-base-content/50 tracking-wider uppercase">
          {task.id}
        </span>
        {task.priority && (
          <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${priorityConfig.bg} ${priorityConfig.color}`}>
            <PriorityIcon size={10} strokeWidth={3} />
            <span>{task.priority}</span>
          </div>
        )}
      </div>

      {/* Body: Título e Status */}
      <div className="flex items-start gap-2">
        <div className={`mt-0.5 flex-shrink-0 ${statusConfig.color}`}>
          <StatusIcon size={16} />
        </div>
        <h3 className="font-medium text-base-content leading-snug line-clamp-2">
          {task.title}
        </h3>
      </div>

      {/* Footer: Meta info e Ações */}
      {!compact && (
        <div className="flex items-center justify-between mt-1 pt-2 border-t border-base-100">
          <div className="flex items-center gap-3 text-xs text-base-content/60">
            {task.assignee && (
              <div className="flex items-center gap-1.5" title={`Responsável: ${task.assignee}`}>
                <div className="w-5 h-5 rounded-full bg-base-200 flex items-center justify-center text-[9px] font-bold text-base-content/70">
                  {task.assignee.charAt(0).toUpperCase()}
                </div>
                <span className="truncate max-w-[80px]">{task.assignee}</span>
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center gap-1.5" title={`Prazo: ${task.dueDate}`}>
                <Calendar size={12} />
                <span>{task.dueDate}</span>
              </div>
            )}
          </div>

          {/* Ações visíveis no hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
            {onEdit && (
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                className="p-1.5 text-base-content/60 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                title="Editar tarefa"
              >
                <Edit2 size={14} />
              </button>
            )}
            {onDelete && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
                className="p-1.5 text-base-content/60 hover:text-error hover:bg-error/10 rounded-md transition-colors"
                title="Excluir tarefa"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};