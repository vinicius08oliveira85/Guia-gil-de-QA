import React, { useEffect, useId, useState } from 'react';
import type { Project } from '../../types';
import { AlertOctagon, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';

export type WorkspaceAlertsTab = 'health' | 'tests';

export interface WorkspaceAlertsPanelProps {
  healthProjects: Project[];
  testExecutionAlertProjects: Project[];
  onSelectProject: (id: string) => void;
  /** Filtro da grade em “precisa de atenção” (mesmo critério da aba Saúde). */
  listFilterNeedsAttention: boolean;
  onToggleListFilterNeedsAttention: () => void;
  className?: string;
}

/**
 * Painel único de alertas do workspace: aba “Saúde” (bugs / taxa) e aba “Execução” (casos Falhou ou Bloqueado).
 */
export const WorkspaceAlertsPanel: React.FC<WorkspaceAlertsPanelProps> = ({
  healthProjects,
  testExecutionAlertProjects,
  onSelectProject,
  listFilterNeedsAttention,
  onToggleListFilterNeedsAttention,
  className,
}) => {
  const baseId = useId();
  const tabHealthId = `${baseId}-tab-health`;
  const tabTestsId = `${baseId}-tab-tests`;
  const panelHealthId = `${baseId}-panel-health`;
  const panelTestsId = `${baseId}-panel-tests`;

  const [tab, setTab] = useState<WorkspaceAlertsTab>(() =>
    healthProjects.length > 0 ? 'health' : 'tests'
  );

  useEffect(() => {
    if (tab === 'health' && healthProjects.length === 0 && testExecutionAlertProjects.length > 0) {
      setTab('tests');
    }
    if (tab === 'tests' && testExecutionAlertProjects.length === 0 && healthProjects.length > 0) {
      setTab('health');
    }
  }, [tab, healthProjects.length, testExecutionAlertProjects.length]);

  const healthCount = healthProjects.length;
  const testsCount = testExecutionAlertProjects.length;

  if (healthCount === 0 && testsCount === 0) {
    return null;
  }

  const tabBtnClass = (active: boolean) =>
    cn(
      'inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors sm:min-h-0 sm:flex-none sm:px-3 sm:text-sm',
      active
        ? 'bg-base-200 text-base-content shadow-sm ring-1 ring-base-300/60'
        : 'text-base-content/70 hover:bg-base-200/55 hover:text-base-content'
    );

  return (
    <div
      className={cn(
        'relative z-[1] flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-base-300/70 bg-base-100/80 p-2.5 shadow-sm ring-1 ring-base-content/[0.03] sm:p-3',
        className
      )}
      role="region"
      aria-label="Alertas do workspace"
    >
      <div
        role="tablist"
        aria-label="Tipo de alerta"
        className="mb-2 flex shrink-0 flex-wrap gap-1 border-b border-base-300/50 pb-1.5 sm:gap-1.5 sm:pb-2"
      >
        {healthCount > 0 && (
          <button
            type="button"
            role="tab"
            id={tabHealthId}
            aria-selected={tab === 'health'}
            aria-controls={panelHealthId}
            tabIndex={tab === 'health' ? 0 : -1}
            className={tabBtnClass(tab === 'health')}
            onClick={() => setTab('health')}
          >
            <AlertTriangle className="h-4 w-4 shrink-0 text-warning" aria-hidden />
            Saúde do workspace
            <span className="tabular-nums opacity-80">({healthCount})</span>
          </button>
        )}
        {testsCount > 0 && (
          <button
            type="button"
            role="tab"
            id={tabTestsId}
            aria-selected={tab === 'tests'}
            aria-controls={panelTestsId}
            tabIndex={tab === 'tests' ? 0 : -1}
            className={tabBtnClass(tab === 'tests')}
            onClick={() => setTab('tests')}
          >
            <AlertOctagon className="h-4 w-4 shrink-0 text-error" aria-hidden />
            Execução de testes
            <span className="tabular-nums opacity-80">({testsCount})</span>
          </button>
        )}
      </div>

      {healthCount > 0 && (
        <div
          id={panelHealthId}
          role="tabpanel"
          aria-labelledby={tabHealthId}
          hidden={tab !== 'health'}
          className={cn(
            'flex min-h-0 flex-1 flex-col overflow-hidden',
            tab !== 'health' && 'hidden'
          )}
        >
          <p className="mb-1.5 shrink-0 text-xs leading-snug text-base-content/80 sm:text-[13px]">
            Critério: 2 ou mais bugs abertos, ou taxa de sucesso dos testes abaixo de 70% com casos
            já executados.
          </p>
          <ul
            className="m-0 grid min-h-0 flex-1 list-none grid-cols-2 gap-1.5 overflow-y-auto overscroll-contain p-0 pr-0.5 [scrollbar-gutter:stable] sm:grid-cols-3 sm:gap-2"
            aria-label="Projetos com alerta de saúde"
          >
            {healthProjects.map(p => (
              <li key={p.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onSelectProject(p.id)}
                  className="w-full truncate rounded-lg border border-warning/30 bg-base-100 px-2 py-1.5 text-left text-xs font-medium text-base-content transition-colors hover:border-warning/50 hover:bg-warning/5 sm:px-2.5 sm:text-sm"
                  title={p.name}
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
          <div className="shrink-0 pt-2">
            <button
              type="button"
              onClick={onToggleListFilterNeedsAttention}
              className={cn(
                'btn btn-xs w-full sm:w-auto',
                listFilterNeedsAttention ? 'btn-warning btn-outline' : 'btn-outline'
              )}
              aria-pressed={listFilterNeedsAttention}
            >
              {listFilterNeedsAttention
                ? 'Ver todos os projetos na grade'
                : 'Filtrar grade: só estes projetos'}
            </button>
          </div>
        </div>
      )}

      {testsCount > 0 && (
        <div
          id={panelTestsId}
          role="tabpanel"
          aria-labelledby={tabTestsId}
          hidden={tab !== 'tests'}
          className={cn(
            'flex min-h-0 flex-1 flex-col overflow-hidden',
            tab !== 'tests' && 'hidden'
          )}
        >
          <div className="mb-1.5 flex shrink-0 items-start gap-2">
            <AlertOctagon
              className="mt-0.5 h-4 w-4 shrink-0 text-error sm:h-5 sm:w-5"
              aria-hidden
            />
            <p className="text-xs leading-snug text-base-content/80 sm:text-[13px]">
              Projetos com ao menos um caso de teste em status <strong>Falhou</strong> ou{' '}
              <strong>Bloqueado</strong>.
            </p>
          </div>
          <ul
            className="m-0 flex min-h-0 flex-1 flex-wrap content-start gap-2 overflow-y-auto overscroll-contain p-0 pr-0.5 [scrollbar-gutter:stable]"
            aria-label="Projetos com falha ou bloqueio em testes"
          >
            {testExecutionAlertProjects.map(p => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onSelectProject(p.id)}
                  className="min-h-[44px] rounded-xl border border-error/25 bg-base-100 px-3 py-2 text-left text-sm font-medium text-base-content transition-colors hover:border-error/45 hover:bg-error/5 sm:min-h-0"
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
