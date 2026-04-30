import React from 'react';
import { FolderKanban, CircleCheck, ListTodo, Cloud, CloudOff, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface WorkspaceDaisyStatsProps {
  projectCount: number;
  /** % Passed / total test cases */
  testSuccessPercent: number;
  /** % Done / total tasks */
  taskDonePercent: number;
  lastSaveToSupabase: boolean | null;
  supabaseAvailable: boolean;
  supabaseLoadFailed: boolean;
  className?: string;
}

/**
 * Faixa superior do dashboard de projetos — grade de cards com espaçamento explícito (evita `stats` colados).
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
  const cloudTitle = 'Nuvem';
  let cloudValue: string;
  let cloudDesc: string;
  let cloudIcon: React.ReactNode;
  let cloudValueClass = 'text-base-content';

  if (!supabaseAvailable) {
    cloudValue = '—';
    cloudDesc = 'Supabase não configurado';
    cloudIcon = <CloudOff className="h-7 w-7 opacity-70" aria-hidden />;
    cloudValueClass = 'text-base-content/60';
  } else if (supabaseLoadFailed) {
    cloudValue = 'Indisponível';
    cloudDesc = 'Falha ao sincronizar';
    cloudIcon = <AlertTriangle className="h-7 w-7 text-warning" aria-hidden />;
    cloudValueClass = 'text-warning';
  } else if (lastSaveToSupabase === true) {
    cloudValue = 'OK';
    cloudDesc = 'Último save na nuvem';
    cloudIcon = <Cloud className="h-7 w-7 text-success" aria-hidden />;
    cloudValueClass = 'text-success';
  } else if (lastSaveToSupabase === false) {
    cloudValue = 'Local';
    cloudDesc = 'Último save só local';
    cloudIcon = <CloudOff className="h-7 w-7 text-warning" aria-hidden />;
    cloudValueClass = 'text-warning';
  } else {
    cloudValue = '—';
    cloudDesc = 'Nenhum save nesta sessão';
    cloudIcon = <Cloud className="h-7 w-7 opacity-50" aria-hidden />;
    cloudValueClass = 'text-base-content/50';
  }

  const statCard =
    'flex h-full min-h-[8.75rem] w-full flex-col items-center gap-1 rounded-xl border border-base-300/70 bg-base-100/80 px-2.5 py-2.5 text-center shadow-sm ring-1 ring-base-content/[0.02] backdrop-blur-sm transition-[background-color,box-shadow] duration-200 hover:bg-base-200/40 sm:min-h-[10.5rem] sm:items-start sm:gap-1 sm:px-3 sm:py-3 sm:text-left lg:min-h-[10.75rem]';

  const statDesc =
    'stat-desc mt-auto shrink-0 text-[11px] leading-snug text-base-content/60 sm:text-xs sm:leading-snug';

  return (
    <div
      className={cn(
        'grid w-full grid-cols-2 items-stretch gap-2 sm:grid-cols-4 sm:gap-2.5 md:gap-3',
        className
      )}
      role="region"
      aria-label="Indicadores do workspace"
    >
      <div className={cn(statCard)}>
        <div className="stat-figure shrink-0 rounded-lg bg-primary/10 p-1.5 text-primary ring-1 ring-primary/10 sm:self-start">
          <FolderKanban className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
        </div>
        <div className="stat-title text-[10px] font-semibold uppercase tracking-wide text-base-content/55 sm:text-[11px] sm:tracking-wider">
          Projetos
        </div>
        <div className="stat-value text-xl font-bold tabular-nums sm:text-2xl">{projectCount}</div>
        <div className={cn(statDesc, 'max-w-[12rem] text-center sm:max-w-none sm:text-left')}>
          Total no workspace
        </div>
      </div>

      <div className={cn(statCard)}>
        <div className="stat-figure shrink-0 rounded-lg bg-success/10 p-1.5 text-success ring-1 ring-success/10 sm:self-start">
          <CircleCheck className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
        </div>
        <div className="stat-title text-[10px] font-semibold uppercase tracking-wide text-base-content/55 sm:text-[11px] sm:tracking-wider">
          Sucesso nos testes
        </div>
        <div className="stat-value text-xl font-bold tabular-nums text-success sm:text-2xl">
          {testSuccessPercent}%
        </div>
        <div className={cn(statDesc, 'max-w-[14rem] text-center sm:max-w-none sm:text-left')}>
          Passados ÷ total de casos (global)
        </div>
      </div>

      <div className={cn(statCard)}>
        <div className="stat-figure shrink-0 rounded-lg bg-secondary/10 p-1.5 text-secondary ring-1 ring-secondary/10 sm:self-start">
          <ListTodo className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden />
        </div>
        <div className="stat-title text-[10px] font-semibold uppercase tracking-wide text-base-content/55 sm:text-[11px] sm:tracking-wider">
          Progresso tarefas
        </div>
        <div className="stat-value text-xl font-bold tabular-nums text-secondary sm:text-2xl">
          {taskDonePercent}%
        </div>
        <div className={cn(statDesc, 'text-center sm:text-left')}>Concluídas ÷ total (status Done)</div>
      </div>

      <div className={cn(statCard)}>
        <div className="stat-figure shrink-0 rounded-lg bg-base-200/60 p-1.5 ring-1 ring-base-300/50 sm:self-start">{cloudIcon}</div>
        <div className="stat-title text-[10px] font-semibold uppercase tracking-wide text-base-content/55 sm:text-[11px] sm:tracking-wider">
          {cloudTitle}
        </div>
        <div className={cn('stat-value text-xl font-bold sm:text-2xl', cloudValueClass)}>{cloudValue}</div>
        <div className={cn(statDesc, 'text-center sm:text-left')}>{cloudDesc}</div>
      </div>
    </div>
  );
};
