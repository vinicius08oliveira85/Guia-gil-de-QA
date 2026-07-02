import React from 'react';
import { FolderKanban, CircleCheck, ListTodo, HardDrive, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  formatWorkspaceStatCount,
  formatWorkspaceStatPercent,
  workspaceDaisyStatCardClass,
  workspaceDaisyStatLabelClass,
  workspaceDaisyStatValueClass,
} from '../common/projectCardUi';
import { RadialProgress } from '../common/RadialProgress';

export type LocalBackupStatStatus = 'ok' | 'pending' | 'unconfigured';

export interface WorkspaceDaisyStatsProps {
  projectCount: number;
  testSuccessPercent: number;
  taskDonePercent: number;
  localBackupStatus: LocalBackupStatStatus;
  /** Use `contents` quando o pai define o grid (faixa de 5 métricas). */
  className?: string;
}

const iconClass = 'h-3.5 w-3.5 shrink-0 text-[var(--workspace-stat-accent)] sm:h-4 sm:w-4';

export const WorkspaceDaisyStats: React.FC<WorkspaceDaisyStatsProps> = ({
  projectCount,
  testSuccessPercent,
  taskDonePercent,
  localBackupStatus,
  className,
}) => {
  let backupValue: string;
  let backupIcon: React.ReactNode;
  let backupValueClass = workspaceDaisyStatValueClass;

  if (localBackupStatus === 'unconfigured') {
    backupValue = '—';
    backupIcon = (
      <HardDrive
        className="h-3.5 w-3.5 shrink-0 text-[var(--workspace-stat-text)] opacity-50 sm:h-4 sm:w-4"
        strokeWidth={1.75}
        aria-hidden
      />
    );
    backupValueClass =
      'font-sans text-xl font-extrabold tabular-nums leading-none text-[var(--workspace-stat-text)] opacity-50 sm:text-2xl';
  } else if (localBackupStatus === 'pending') {
    backupValue = 'Pendente';
    backupIcon = <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning sm:h-4 sm:w-4" strokeWidth={1.75} aria-hidden />;
    backupValueClass = 'font-sans text-lg font-extrabold tabular-nums leading-none text-warning sm:text-xl';
  } else {
    backupValue = 'OK';
    backupIcon = <HardDrive className={iconClass} strokeWidth={1.75} aria-hidden />;
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
      key: 'backup',
      icon: backupIcon,
      label: 'Backup local',
      value: backupValue,
      valueClass: backupValueClass,
    },
  ] as const;

  const isContents = className?.includes('contents');

  return (
    <div
      className={cn(
        isContents ? 'contents' : 'grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3',
        className
      )}
    >
      {items.map(item => (
        <div key={item.key} className={workspaceDaisyStatCardClass}>
          <div className="flex items-center gap-1.5">
            {item.icon}
            <span className={workspaceDaisyStatLabelClass}>{item.label}</span>
          </div>
          <div className="mt-1 flex items-end justify-between gap-2">
            <span className={item.valueClass}>{item.value}</span>
            {'progress' in item && item.progress !== undefined ? (
              <RadialProgress value={item.progress} size={36} strokeWidth={4} />
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
};

WorkspaceDaisyStats.displayName = 'WorkspaceDaisyStats';
