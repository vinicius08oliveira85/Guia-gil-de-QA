import React from 'react';
import { FolderKanban, CircleCheck, ListTodo, Cloud, CloudOff, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  formatWorkspaceStatCount,
  formatWorkspaceStatPercent,
  workspaceDaisyStatCardClass,
  workspaceDaisyStatLabelClass,
  workspaceDaisyStatValueClass,
} from '../common/projectCardUi';
import { RadialProgress } from '../common/RadialProgress';

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

const iconClass = 'h-3.5 w-3.5 shrink-0 text-[var(--workspace-stat-accent)] sm:h-4 sm:w-4';

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
  let cloudValueClass = workspaceDaisyStatValueClass;

  if (!supabaseAvailable) {
    cloudValue = '—';
    cloudIcon = (
      <CloudOff className="h-3.5 w-3.5 shrink-0 text-[var(--workspace-stat-text)] opacity-50 sm:h-4 sm:w-4" strokeWidth={1.75} aria-hidden />
    );
    cloudValueClass = 'font-sans text-xl font-extrabold tabular-nums leading-none text-[var(--workspace-stat-text)] opacity-50 sm:text-2xl';
  } else if (supabaseLoadFailed) {
    cloudValue = 'Indisponível';
    cloudIcon = <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning sm:h-4 sm:w-4" strokeWidth={1.75} aria-hidden />;
    cloudValueClass = 'font-sans text-lg font-extrabold tabular-nums leading-none text-warning sm:text-xl';
  } else if (lastSaveToSupabase === true) {
    cloudValue = 'OK';
    cloudIcon = <Cloud className={iconClass} strokeWidth={1.75} aria-hidden />;
  } else if (lastSaveToSupabase === false) {
    cloudValue = 'Local';
    cloudIcon = <CloudOff className="h-3.5 w-3.5 shrink-0 text-warning sm:h-4 sm:w-4" strokeWidth={1.75} aria-hidden />;
    cloudValueClass = 'font-sans text-xl font-extrabold tabular-nums leading-none text-warning sm:text-2xl';
  } else {
    cloudValue = '—';
    cloudIcon = (
      <Cloud className="h-3.5 w-3.5 shrink-0 text-[var(--workspace-stat-text)] opacity-50 sm:h-4 sm:w-4" strokeWidth={1.75} aria-hidden />
    );
    cloudValueClass = 'font-sans text-xl font-extrabold tabular-nums leading-none text-[var(--workspace-stat-text)] opacity-50 sm:text-2xl';
  }

  const items = [
    {
      key: 'projects',
      icon: <FolderKanban className={iconClass} strokeWidth={1.75} aria-hidden />,
      label: 'Projetos',
      value: formatWorkspaceStatCount(projectCount),
      valueClass: workspaceDaisyStatValueClass,
    },
    {
      key: 'success',
      icon: <CircleCheck className={iconClass} strokeWidth={1.75} aria-hidden />,
      label: 'Sucesso testes',
      value: formatWorkspaceStatPercent(testSuccessPercent),
      valueClass: workspaceDaisyStatValueClass,
      progress: testSuccessPercent,
    },
    {
      key: 'progress',
      icon: <ListTodo className={iconClass} strokeWidth={1.75} aria-hidden />,
      label: 'Progresso',
      value: formatWorkspaceStatPercent(taskDonePercent),
      valueClass: workspaceDaisyStatValueClass,
      progress: taskDonePercent,
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
        <div key={item.key} className={workspaceDaisyStatCardClass} title={item.label}>
          <div className="flex items-center justify-center gap-1.5">
            {item.icon}
            <span className={workspaceDaisyStatLabelClass}>{item.label}</span>
          </div>
          {'progress' in item ? (
            <RadialProgress
              value={item.progress}
              size={46}
              strokeWidth={5}
              ariaLabel={item.label}
            >
              <span className={cn(item.valueClass, 'text-base sm:text-lg')}>{item.value}</span>
            </RadialProgress>
          ) : (
            <span className={cn(item.valueClass)}>{item.value}</span>
          )}
        </div>
      ))}
    </div>
  );
};
