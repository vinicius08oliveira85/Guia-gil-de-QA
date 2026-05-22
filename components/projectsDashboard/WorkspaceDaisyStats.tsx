import React from 'react';
import { FolderKanban, CircleCheck, ListTodo, Cloud, CloudOff, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  workspaceStatCardClass,
  workspaceStatLabelClass,
  workspaceStatValueClass,
} from '../common/projectCardUi';

export interface WorkspaceDaisyStatsProps {
  projectCount: number;
  testSuccessPercent: number;
  taskDonePercent: number;
  lastSaveToSupabase: boolean | null;
  supabaseAvailable: boolean;
  supabaseLoadFailed: boolean;
  /** Use `contents` quando o pai define o grid (faixa de 5 métricas). */
  className?: string;
}

export const WorkspaceDaisyStats: React.FC<WorkspaceDaisyStatsProps> = ({
  projectCount,
  testSuccessPercent,
  taskDonePercent,
  lastSaveToSupabase,
  supabaseAvailable,
  supabaseLoadFailed,
  className,
}) => {
  let cloudValue: string;
  let cloudIcon: React.ReactNode;
  let cloudValueClass = 'text-[var(--brand-text-strong)]';

  if (!supabaseAvailable) {
    cloudValue = '—';
    cloudIcon = <CloudOff className="h-3.5 w-3.5 text-[var(--brand-text-muted)]" aria-hidden />;
    cloudValueClass = 'text-[var(--brand-text-muted)]';
  } else if (supabaseLoadFailed) {
    cloudValue = 'Indisponível';
    cloudIcon = <AlertTriangle className="h-3.5 w-3.5 text-warning" aria-hidden />;
    cloudValueClass = 'text-warning';
  } else if (lastSaveToSupabase === true) {
    cloudValue = 'OK';
    cloudIcon = <Cloud className="h-3.5 w-3.5 text-success" aria-hidden />;
    cloudValueClass = 'text-success';
  } else if (lastSaveToSupabase === false) {
    cloudValue = 'Local';
    cloudIcon = <CloudOff className="h-3.5 w-3.5 text-warning" aria-hidden />;
    cloudValueClass = 'text-warning';
  } else {
    cloudValue = '—';
    cloudIcon = <Cloud className="h-3.5 w-3.5 text-[var(--brand-text-muted)]" aria-hidden />;
    cloudValueClass = 'text-[var(--brand-text-muted)]';
  }

  const items = [
    {
      key: 'projects',
      icon: <FolderKanban className="h-3.5 w-3.5 text-[var(--brand-cta)] sm:h-4 sm:w-4" aria-hidden />,
      label: 'Projetos',
      value: String(projectCount),
      valueClass: 'text-[var(--brand-text-strong)]',
    },
    {
      key: 'success',
      icon: <CircleCheck className="h-3.5 w-3.5 text-success sm:h-4 sm:w-4" aria-hidden />,
      label: 'Sucesso testes',
      value: `${testSuccessPercent}%`,
      valueClass: 'text-success',
    },
    {
      key: 'progress',
      icon: <ListTodo className="h-3.5 w-3.5 text-[var(--brand-cta)] sm:h-4 sm:w-4" aria-hidden />,
      label: 'Progresso',
      value: `${taskDonePercent}%`,
      valueClass: 'text-[var(--brand-cta)]',
    },
    {
      key: 'cloud',
      icon: cloudIcon,
      label: 'Nuvem',
      value: cloudValue,
      valueClass: cloudValueClass,
    },
  ] as const;

  const isContents = className?.includes('contents');

  return (
    <div
      className={cn(className, !isContents && 'grid w-full grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5')}
      role={isContents ? undefined : 'region'}
      aria-label={isContents ? undefined : 'Indicadores do workspace'}
    >
      {items.map(item => (
        <div key={item.key} className={workspaceStatCardClass} title={item.label}>
          <div className="flex items-center gap-1">
            {item.icon}
            <span className={workspaceStatLabelClass}>{item.label}</span>
          </div>
          <span className={cn(workspaceStatValueClass, item.valueClass)}>{item.value}</span>
        </div>
      ))}
    </div>
  );
};
