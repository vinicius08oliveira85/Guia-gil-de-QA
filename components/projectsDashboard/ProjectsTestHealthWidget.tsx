import React from 'react';
import type { Project } from '../../types';
import { AlertOctagon } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ProjectsTestHealthWidgetProps {
  /** Projetos com ao menos um caso Failed ou Blocked. */
  alertProjects: Project[];
  onSelectProject: (id: string) => void;
  className?: string;
}

/**
 * Widget compacto: projetos com falhas ou bloqueios em casos de teste.
 */
export const ProjectsTestHealthWidget: React.FC<ProjectsTestHealthWidgetProps> = ({
  alertProjects,
  onSelectProject,
  className,
}) => {
  if (alertProjects.length === 0) {
    return (
      <aside
        className={cn(
          'rounded-2xl border border-success/30 bg-success/5 p-4 sm:p-5 text-sm text-base-content/80',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <p className="font-medium text-success">Nenhum projeto em alerta de execução</p>
        <p className="text-xs mt-1 text-base-content/60">Não há casos de teste com status Falhou ou Bloqueado no workspace.</p>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        'rounded-2xl border border-error/30 bg-error/5 p-4 sm:p-5 shadow-sm',
        className
      )}
      aria-labelledby="test-health-heading"
    >
      <div className="flex items-start gap-2 mb-2">
        <AlertOctagon className="h-5 w-5 text-error shrink-0 mt-0.5" aria-hidden />
        <div>
          <h2 id="test-health-heading" className="text-sm font-bold text-error uppercase tracking-wide">
            Projetos em alerta (testes)
          </h2>
          <p className="text-xs text-base-content/70 mt-0.5">
            {alertProjects.length === 1
              ? '1 projeto com casos Falhou ou Bloqueado.'
              : `${alertProjects.length} projetos com casos Falhou ou Bloqueado.`}
          </p>
        </div>
      </div>
      <ul className="flex flex-wrap gap-2">
        {alertProjects.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onSelectProject(p.id)}
              className="rounded-xl border border-error/25 bg-base-100 px-3 py-2 text-left text-sm font-medium text-base-content hover:border-error/50 hover:bg-error/5 transition-colors min-h-[44px] sm:min-h-0"
            >
              {p.name}
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
};
