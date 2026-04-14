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
 * Faixa superior do dashboard de projetos — componente `stats` do DaisyUI.
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
    cloudIcon = <CloudOff className="h-8 w-8 opacity-70" aria-hidden />;
    cloudValueClass = 'text-base-content/60';
  } else if (supabaseLoadFailed) {
    cloudValue = 'Indisponível';
    cloudDesc = 'Falha ao sincronizar';
    cloudIcon = <AlertTriangle className="h-8 w-8 text-warning" aria-hidden />;
    cloudValueClass = 'text-warning';
  } else if (lastSaveToSupabase === true) {
    cloudValue = 'OK';
    cloudDesc = 'Último save na nuvem';
    cloudIcon = <Cloud className="h-8 w-8 text-success" aria-hidden />;
    cloudValueClass = 'text-success';
  } else if (lastSaveToSupabase === false) {
    cloudValue = 'Local';
    cloudDesc = 'Último save só local';
    cloudIcon = <CloudOff className="h-8 w-8 text-warning" aria-hidden />;
    cloudValueClass = 'text-warning';
  } else {
    cloudValue = '—';
    cloudDesc = 'Nenhum save nesta sessão';
    cloudIcon = <Cloud className="h-8 w-8 opacity-50" aria-hidden />;
    cloudValueClass = 'text-base-content/50';
  }

  return (
    <div
      className={cn(
        'stats stats-vertical shadow-sm w-full sm:stats-horizontal sm:shadow-md rounded-2xl border border-base-300 bg-base-100',
        className
      )}
      role="region"
      aria-label="Indicadores do workspace"
    >
      <div className="stat place-items-center sm:place-items-start py-4 sm:py-6">
        <div className="stat-figure text-primary">
          <FolderKanban className="h-8 w-8" aria-hidden />
        </div>
        <div className="stat-title text-xs uppercase tracking-wide">Projetos</div>
        <div className="stat-value text-2xl md:text-3xl font-bold tabular-nums">{projectCount}</div>
        <div className="stat-desc text-center sm:text-left">Total no workspace</div>
      </div>

      <div className="stat place-items-center sm:place-items-start py-4 sm:py-6">
        <div className="stat-figure text-success">
          <CircleCheck className="h-8 w-8" aria-hidden />
        </div>
        <div className="stat-title text-xs uppercase tracking-wide">Sucesso nos testes</div>
        <div className="stat-value text-2xl md:text-3xl font-bold tabular-nums text-success">
          {testSuccessPercent}%
        </div>
        <div className="stat-desc text-center sm:text-left max-w-[14rem] sm:max-w-none">
          Passados ÷ total de casos (global)
        </div>
      </div>

      <div className="stat place-items-center sm:place-items-start py-4 sm:py-6">
        <div className="stat-figure text-secondary">
          <ListTodo className="h-8 w-8" aria-hidden />
        </div>
        <div className="stat-title text-xs uppercase tracking-wide">Progresso tarefas</div>
        <div className="stat-value text-2xl md:text-3xl font-bold tabular-nums text-secondary">
          {taskDonePercent}%
        </div>
        <div className="stat-desc text-center sm:text-left">Concluídas ÷ total (status Done)</div>
      </div>

      <div className="stat place-items-center sm:place-items-start py-4 sm:py-6">
        <div className="stat-figure">{cloudIcon}</div>
        <div className="stat-title text-xs uppercase tracking-wide">{cloudTitle}</div>
        <div className={cn('stat-value text-2xl md:text-3xl font-bold', cloudValueClass)}>{cloudValue}</div>
        <div className="stat-desc text-center sm:text-left">{cloudDesc}</div>
      </div>
    </div>
  );
};
