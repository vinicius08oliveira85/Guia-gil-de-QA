import React from 'react';
import { FolderKanban, CircleCheck, ListTodo, Cloud, CloudOff, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface WorkspaceDaisyStatsProps {
  projectCount: number;
  testSuccessPercent: number;
  taskDonePercent: number;
  lastSaveToSupabase: boolean | null;
  supabaseAvailable: boolean;
  supabaseLoadFailed: boolean;
  className?: string;
}

/**
 * Indicadores compactos do workspace (ícone + rótulo + valor).
 */
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
  let cloudValueClass = 'text-base-content';

  if (!supabaseAvailable) {
    cloudValue = '—';
    cloudIcon = <CloudOff className="h-4 w-4 opacity-80" aria-hidden />;
    cloudValueClass = 'text-base-content/70';
  } else if (supabaseLoadFailed) {
    cloudValue = 'Indisponível';
    cloudIcon = <AlertTriangle className="h-4 w-4 text-warning" aria-hidden />;
    cloudValueClass = 'text-warning';
  } else if (lastSaveToSupabase === true) {
    cloudValue = 'OK';
    cloudIcon = <Cloud className="h-4 w-4 text-success" aria-hidden />;
    cloudValueClass = 'text-success';
  } else if (lastSaveToSupabase === false) {
    cloudValue = 'Local';
    cloudIcon = <CloudOff className="h-4 w-4 text-warning" aria-hidden />;
    cloudValueClass = 'text-warning';
  } else {
    cloudValue = '—';
    cloudIcon = <Cloud className="h-4 w-4 opacity-60" aria-hidden />;
    cloudValueClass = 'text-base-content/65';
  }

  const statCard =
    'flex min-h-[3.75rem] flex-1 flex-col items-center justify-center gap-1 rounded-[var(--rounded-box)] border border-base-300/60 bg-base-100 px-2 py-2.5 text-center soft-shadow sm:min-h-[4.25rem] sm:px-3';

  const statTitle =
    'text-[9px] font-bold uppercase tracking-wider text-base-content/65 sm:text-[10px]';
  const statValue = 'text-lg font-bold tabular-nums leading-none sm:text-xl';

  const items = [
    {
      key: 'projects',
      icon: <FolderKanban className="h-4 w-4 text-primary" aria-hidden />,
      label: 'Projetos',
      value: String(projectCount),
      valueClass: 'text-base-content',
    },
    {
      key: 'success',
      icon: <CircleCheck className="h-4 w-4 text-success" aria-hidden />,
      label: 'Sucesso testes',
      value: `${testSuccessPercent}%`,
      valueClass: 'text-success',
    },
    {
      key: 'progress',
      icon: <ListTodo className="h-4 w-4 text-info" aria-hidden />,
      label: 'Progresso',
      value: `${taskDonePercent}%`,
      valueClass: 'text-info',
    },
    {
      key: 'cloud',
      icon: cloudIcon,
      label: 'Nuvem',
      value: cloudValue,
      valueClass: cloudValueClass,
    },
  ] as const;

  return (
    <div
      className={cn(
        'grid w-full grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5',
        className
      )}
      role="region"
      aria-label="Indicadores do workspace"
    >
      {items.map(item => (
        <div key={item.key} className={statCard} title={item.label}>
          <div className="flex items-center gap-1">
            {item.icon}
            <span className={statTitle}>{item.label}</span>
          </div>
          <span className={cn(statValue, item.valueClass)}>{item.value}</span>
        </div>
      ))}
    </div>
  );
};
