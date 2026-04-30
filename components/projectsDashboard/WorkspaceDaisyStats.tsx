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
 * Indicadores do workspace em grade compacta (estilo bento): ícone + rótulo + valor em linha.
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
    cloudIcon = <CloudOff className="h-5 w-5 opacity-80" aria-hidden />;
    cloudValueClass = 'text-base-content/70';
  } else if (supabaseLoadFailed) {
    cloudValue = 'Indisponível';
    cloudDesc = 'Falha ao sincronizar';
    cloudIcon = <AlertTriangle className="h-5 w-5 text-warning" aria-hidden />;
    cloudValueClass = 'text-warning';
  } else if (lastSaveToSupabase === true) {
    cloudValue = 'OK';
    cloudDesc = 'Último save na nuvem';
    cloudIcon = <Cloud className="h-5 w-5 text-success" aria-hidden />;
    cloudValueClass = 'text-success';
  } else if (lastSaveToSupabase === false) {
    cloudValue = 'Local';
    cloudDesc = 'Último save só local';
    cloudIcon = <CloudOff className="h-5 w-5 text-warning" aria-hidden />;
    cloudValueClass = 'text-warning';
  } else {
    cloudValue = '—';
    cloudDesc = 'Nenhum save nesta sessão';
    cloudIcon = <Cloud className="h-5 w-5 opacity-60" aria-hidden />;
    cloudValueClass = 'text-base-content/65';
  }

  const statCard =
    'group flex min-h-[4rem] w-full flex-row items-center gap-2.5 rounded-xl border border-base-300/65 bg-base-100/90 px-2.5 py-2 text-left shadow-sm ring-1 ring-base-content/[0.03] backdrop-blur-sm transition-[box-shadow,transform,border-color] duration-200 hover:-translate-y-px hover:border-primary/25 hover:shadow-md motion-reduce:transform-none sm:min-h-[4.25rem] sm:gap-3 sm:px-3 sm:py-2.5';

  const statTitle =
    'text-[11px] font-semibold uppercase tracking-wide text-base-content/78 sm:text-xs sm:tracking-wider';
  const statValue = 'text-lg font-bold tabular-nums leading-tight sm:text-xl';
  const statDesc = 'mt-0.5 line-clamp-2 text-[11px] leading-snug text-base-content/72 sm:text-xs';

  return (
    <div
      className={cn(
        'grid w-full grid-cols-2 items-stretch gap-2 sm:grid-cols-4 sm:gap-2.5',
        className
      )}
      role="region"
      aria-label="Indicadores do workspace"
    >
      <div className={cn(statCard)}>
        <div className="shrink-0 rounded-lg bg-primary/12 p-1.5 text-primary ring-1 ring-primary/15 transition-colors group-hover:bg-primary/18">
          <FolderKanban className="h-5 w-5 sm:h-5 sm:w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className={statTitle}>Projetos</div>
          <div className={cn(statValue, 'text-base-content')}>{projectCount}</div>
          <div className={statDesc}>Total no workspace</div>
        </div>
      </div>

      <div className={cn(statCard)}>
        <div className="shrink-0 rounded-lg bg-success/12 p-1.5 text-success ring-1 ring-success/15 transition-colors group-hover:bg-success/18">
          <CircleCheck className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className={statTitle}>Sucesso nos testes</div>
          <div className={cn(statValue, 'text-success')}>{testSuccessPercent}%</div>
          <div className={statDesc}>Passados ÷ total de casos (global)</div>
        </div>
      </div>

      <div className={cn(statCard)}>
        <div className="shrink-0 rounded-lg bg-secondary/12 p-1.5 text-secondary ring-1 ring-secondary/15 transition-colors group-hover:bg-secondary/18">
          <ListTodo className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className={statTitle}>Progresso tarefas</div>
          <div className={cn(statValue, 'text-secondary')}>{taskDonePercent}%</div>
          <div className={statDesc}>Concluídas ÷ total (status Done)</div>
        </div>
      </div>

      <div className={cn(statCard)}>
        <div className="shrink-0 rounded-lg bg-base-200/70 p-1.5 ring-1 ring-base-300/55 transition-colors group-hover:bg-base-200">
          {cloudIcon}
        </div>
        <div className="min-w-0 flex-1">
          <div className={statTitle}>{cloudTitle}</div>
          <div className={cn(statValue, cloudValueClass)}>{cloudValue}</div>
          <div className={statDesc}>{cloudDesc}</div>
        </div>
      </div>
    </div>
  );
};
