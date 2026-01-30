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
  MoreVertical
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
      case 'high':
      case 'alta':
      case 'crítico':
      case 'critical':
        return 'text-error bg-error/5 border-error/20';
      case 'medium':
      case 'média':
        return 'text-warning bg-warning/5 border-warning/20';
      case 'low':
      case 'baixa':
        return 'text-info bg-info/5 border-info/20';
      default:
        return 'text-base-content/60 bg-base-200/50 border-base-200';
    }
  };

  return (
    <div 
      className={`
        group relative flex items-center gap-3 px-3 
        bg-base-100 border border-base-200 rounded-lg 
        hover:border-primary/40 hover:shadow-sm hover:bg-base-50/50
        transition-all duration-200 cursor-pointer
        ${compact ? 'py-2' : 'py-3'}
      `}
      onClick={() => onClick?.(task)}
      role="article"
      aria-label={`Tarefa ${task.title}`}
    >
      {/* Status Icon */}
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        transition-colors duration-200
        ${statusConfig.bg} ${statusConfig.color}
      `}>
        <StatusIcon size={16} strokeWidth={2.5} />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-medium text-base-content/50 tracking-tight">
            {task.id}
          </span>
          {task.priority && (
            <span className={`
              text-[10px] px-1.5 py-0.5 rounded-full border font-medium leading-none
              ${getPriorityColor(task.priority)}
            `}>
              {task.priority}
            </span>
          )}
        </div>
        
        <h3 className={`
          font-medium text-base-content truncate leading-tight
          ${compact ? 'text-sm' : 'text-[15px]'}
        `}>
          {task.title}
        </h3>
        
        {!compact && (
          <div className="flex items-center gap-3 mt-1 text-xs text-base-content/60">
            {task.assignee && (
              <div className="flex items-center gap-1.5" title={`Responsável: ${task.assignee}`}>
                <User size={12} />
                <span className="truncate max-w-[120px]">{task.assignee}</span>
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center gap-1.5" title={`Prazo: ${task.dueDate}`}>
                <Calendar size={12} />
                <span>{task.dueDate}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions (Hover) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
        {onEdit && (
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            className="p-2 text-base-content/60 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Editar tarefa"
            aria-label="Editar"
          >
            <Edit2 size={16} />
          </button>
        )}
        {onDelete && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
            className="p-2 text-base-content/60 hover:text-error hover:bg-error/10 rounded-lg transition-colors"
            title="Excluir tarefa"
            aria-label="Excluir"
          >
            <Trash2 size={16} />
          </button>
        )}
        {!onEdit && !onDelete && (
           <button className="p-2 text-base-content/40 hover:text-base-content hover:bg-base-200 rounded-lg transition-colors">
             <MoreVertical size={16} />
           </button>
        )}
      </div>
    </div>
  );
};