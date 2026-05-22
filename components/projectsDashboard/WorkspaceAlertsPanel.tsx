import React, { useEffect, useId, useState } from 'react';
import type { Project } from '../../types';
import { AlertOctagon, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  workspacePanelActionBadgeClass,
  workspacePanelCountBadgeClass,
  workspacePanelShellClass,
} from '../common/projectCardUi';

export type WorkspaceAlertsTab = 'health' | 'tests';

export interface WorkspaceAlertsPanelProps {
  healthProjects: Project[];
  testExecutionAlertProjects: Project[];
  onSelectProject: (id: string) => void;
  listFilterNeedsAttention: boolean;
  onToggleListFilterNeedsAttention: () => void;
  className?: string;
}

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
      'inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-[var(--workspace-panel-inner-radius)] px-2 py-1 font-sans text-[11px] font-semibold transition-all duration-200 sm:min-h-0 sm:flex-none sm:px-2.5 sm:text-xs',
      active
        ? 'bg-[var(--workspace-panel-badge-bg)] text-[var(--workspace-panel-badge-text)] shadow-sm'
        : 'text-[var(--workspace-panel-text-muted)] hover:bg-[var(--workspace-panel-chip)] hover:text-[var(--workspace-panel-text)]'
    );

  const projectChipClass = () =>
    cn(
      'w-full truncate rounded-[var(--workspace-panel-inner-radius)] border px-2 py-1.5 text-left font-sans text-xs font-medium transition-colors sm:px-2.5 sm:text-sm',
      'border-[var(--workspace-panel-border)] bg-[var(--workspace-panel-chip)] text-[var(--workspace-panel-text)]',
      'hover:border-[var(--workspace-panel-accent)] hover:text-[var(--workspace-panel-accent)]'
    );

  return (
    <div
      className={cn(workspacePanelShellClass, 'p-4 sm:p-5', className)}
      role="region"
      aria-label="Alertas do workspace"
    >
      <div
        role="tablist"
        aria-label="Tipo de alerta"
        className="mb-3 flex shrink-0 flex-wrap gap-1.5 rounded-[var(--workspace-panel-inner-radius)] bg-[var(--workspace-panel-chip)] p-1 sm:gap-2"
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
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
            <span>Saúde do workspace</span>
            <span className={workspacePanelCountBadgeClass}>{healthCount}</span>
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
            <AlertOctagon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
            <span>Execução de testes</span>
            <span className={workspacePanelCountBadgeClass}>{testsCount}</span>
          </button>
        )}
      </div>

      {healthCount > 0 && (
        <div
          id={panelHealthId}
          role="tabpanel"
          aria-labelledby={tabHealthId}
          hidden={tab !== 'health'}
          className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', tab !== 'health' && 'hidden')}
        >
          <p className="mb-2 shrink-0 font-sans text-[11px] leading-relaxed text-[var(--workspace-panel-text-muted)] sm:text-xs">
            Critério: 2 ou mais bugs abertos, ou taxa de sucesso dos testes abaixo de 70% com casos já
            executados.
          </p>
          <ul
            className="m-0 grid min-h-0 flex-1 list-none grid-cols-2 gap-1.5 overflow-y-auto overscroll-contain p-0 [scrollbar-gutter:stable] sm:grid-cols-2 sm:gap-2"
            aria-label="Projetos com alerta de saúde"
          >
            {healthProjects.map(p => (
              <li key={p.id} className="min-w-0">
                <button
                  type="button"
                  onClick={() => onSelectProject(p.id)}
                  className={projectChipClass()}
                  title={p.name}
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-3 shrink-0 border-t border-[var(--workspace-panel-divider)] pt-3">
            <button
              type="button"
              onClick={onToggleListFilterNeedsAttention}
              className={workspacePanelActionBadgeClass(listFilterNeedsAttention)}
              aria-pressed={listFilterNeedsAttention}
            >
              {listFilterNeedsAttention ? 'Ver todos na grade' : 'Filtrar grade'}
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
          className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', tab !== 'tests' && 'hidden')}
        >
          <div className="mb-2 flex shrink-0 items-start gap-2">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--workspace-panel-text)] text-[var(--workspace-panel-accent)]"
              aria-hidden
            >
              <AlertOctagon className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <p className="font-sans text-[11px] leading-relaxed text-[var(--workspace-panel-text-muted)] sm:text-xs">
              Projetos com ao menos um caso de teste em status{' '}
              <strong className="font-semibold text-[var(--workspace-panel-text)]">Falhou</strong> ou{' '}
              <strong className="font-semibold text-[var(--workspace-panel-text)]">Bloqueado</strong>.
            </p>
          </div>
          <ul
            className="m-0 flex min-h-0 flex-1 flex-wrap content-start gap-2 overflow-y-auto overscroll-contain p-0 pb-3 [scrollbar-gutter:stable]"
            aria-label="Projetos com falha ou bloqueio em testes"
          >
            {testExecutionAlertProjects.map(p => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onSelectProject(p.id)}
                  className={cn(projectChipClass(), 'min-h-[40px] px-3 py-2 sm:min-h-0')}
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
