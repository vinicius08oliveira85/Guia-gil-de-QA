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
import { projectsDashboardStatIconPlateClass } from './projectsDashboardUi';
import { RadialProgress } from '../common/RadialProgress';

export type LocalBackupStatStatus = 'ok' | 'pending' | 'unconfigured';

export type WorkspaceStatKey = 'projects' | 'success' | 'progress' | 'backup';

export interface WorkspaceDaisyStatsProps {
  projectCount: number;
  testSuccessPercent: number;
  taskDonePercent: number;
  localBackupStatus: LocalBackupStatStatus;
  /** Use `contents` quando o pai define o grid (faixa de 5 métricas). */
  className?: string;
  onStatClick?: (key: WorkspaceStatKey) => void;
}

const iconClass = 'h-3.5 w-3.5 shrink-0 text-[var(--workspace-stat-accent)] sm:h-4 sm:w-4';

export const WorkspaceDaisyStats: React.FC<WorkspaceDaisyStatsProps> = ({
  projectCount,
  testSuccessPercent,
  taskDonePercent,
  localBackupStatus,
  className,
  onStatClick,
}) => {
  let backupValue: string;
  let backupIcon: React.ReactNode;
  let backupValueClass = workspaceDaisyStatValueClass;
  let backupTitle: string;

  if (localBackupStatus === 'unconfigured') {
    backupValue = '—';
    backupTitle = 'Backup local não configurado. Clique para abrir Configurações.';
    backupIcon = (
      <HardDrive
        className="h-3.5 w-3.5 shrink-0 text-[var(--workspace-stat-text)] opacity-50 sm:h-4 sm:w-4"
        strokeWidth={1.75}
        aria-hidden
      />
    );
    backupValueClass = cn(workspaceDaisyStatValueClass, 'opacity-50');
  } else if (localBackupStatus === 'pending') {
    backupValue = 'Pendente';
    backupTitle = 'Backup local pendente ou com erro. Clique para abrir Configurações.';
    backupIcon = (
      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning sm:h-4 sm:w-4" strokeWidth={1.75} aria-hidden />
    );
    backupValueClass = cn(workspaceDaisyStatValueClass, 'text-base sm:text-lg');
  } else {
    backupValue = 'OK';
    backupTitle = 'Backup local configurado. Clique para gerenciar em Configurações.';
    backupIcon = <HardDrive className={iconClass} strokeWidth={1.75} aria-hidden />;
  }

  const items = [
    {
      key: 'projects' as const,
      icon: <FolderKanban className={iconClass} strokeWidth={1.75} aria-hidden />,
      label: 'Projetos',
      value: formatWorkspaceStatCount(projectCount),
      valueClass: workspaceDaisyStatValueClass,
      title: 'Mostrar todos os projetos',
      progress: undefined as number | undefined,
      progressLabel: '',
    },
    {
      key: 'success' as const,
      icon: <CircleCheck className={iconClass} strokeWidth={1.75} aria-hidden />,
      label: 'Sucesso',
      value: formatWorkspaceStatPercent(testSuccessPercent),
      valueClass: workspaceDaisyStatValueClass,
      title: 'Taxa de sucesso dos casos de teste executados no workspace',
      progress: testSuccessPercent,
      progressLabel: 'Sucesso dos testes',
    },
    {
      key: 'progress' as const,
      icon: <ListTodo className={iconClass} strokeWidth={1.75} aria-hidden />,
      label: 'Progresso',
      value: formatWorkspaceStatPercent(taskDonePercent),
      valueClass: workspaceDaisyStatValueClass,
      title: 'Percentual de tasks concluídas. Clique para ver projetos que precisam de atenção.',
      progress: taskDonePercent,
      progressLabel: 'Progresso das tasks',
    },
    {
      key: 'backup' as const,
      icon: backupIcon,
      label: 'Backup local',
      value: backupValue,
      valueClass: backupValueClass,
      title: backupTitle,
      progress: undefined as number | undefined,
      progressLabel: '',
    },
  ];

  const isContents = className?.includes('contents');

  return (
    <div
      className={cn(
        isContents ? 'contents' : 'grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3',
        className
      )}
    >
      {items.map(item => {
        const clickable = Boolean(onStatClick);
        const content = (
          <>
            <div className="flex w-full min-w-0 items-center gap-2">
              <span className={projectsDashboardStatIconPlateClass} aria-hidden>
                {item.icon}
              </span>
              <span className={workspaceDaisyStatLabelClass}>{item.label}</span>
            </div>
            <div className="flex w-full min-w-0 items-center justify-between gap-2">
              <span className={cn(item.valueClass, 'min-w-0 truncate')}>{item.value}</span>
              {item.progress !== undefined ? (
                <RadialProgress
                  value={item.progress}
                  size={36}
                  strokeWidth={4}
                  ariaLabel={item.progressLabel}
                  className="shrink-0"
                />
              ) : null}
            </div>
          </>
        );

        if (clickable) {
          return (
            <button
              key={item.key}
              type="button"
              className={cn(
                workspaceDaisyStatCardClass,
                'projects-dashboard-stat-card cursor-pointer text-left transition-[transform,box-shadow] hover:-translate-y-0.5',
                'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--workspace-stat-accent)]',
                'motion-reduce:transform-none'
              )}
              onClick={() => onStatClick?.(item.key)}
              title={item.title}
              aria-label={item.title}
            >
              {content}
            </button>
          );
        }

        return (
          <div key={item.key} className={cn(workspaceDaisyStatCardClass, 'projects-dashboard-stat-card')} title={item.title}>
            {content}
          </div>
        );
      })}
    </div>
  );
};

WorkspaceDaisyStats.displayName = 'WorkspaceDaisyStats';
