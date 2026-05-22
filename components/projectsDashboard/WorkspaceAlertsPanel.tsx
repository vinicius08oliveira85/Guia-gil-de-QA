import React, { useEffect, useId, useState } from 'react';
import type { Project } from '../../types';
import { AlertOctagon, AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { workspacePanelShellClass } from '../common/projectCardUi';

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

  const tabBtnClass = (active: boolean, tone: 'warning' | 'error') =>
    cn(
      'inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all duration-200 sm:min-h-0 sm:flex-none sm:px-3 sm:text-xs',
      active
        ? tone === 'warning'
          ? 'bg-[color-mix(in_srgb,var(--brand-cta)_12%,var(--brand-surface-strong))] text-[var(--brand-text-strong)] ring-1 ring-[color-mix(in_srgb,var(--brand-cta)_35%,transparent)] shadow-sm'
          : 'bg-error/10 text-[var(--brand-text-strong)] ring-1 ring-error/30 shadow-sm'
        : 'text-[var(--brand-text-muted)] hover:bg-[var(--brand-chip)] hover:text-[var(--brand-text-strong)]'
    );

  const projectChipClass = (tone: 'warning' | 'error') =>
    cn(
      'w-full truncate rounded-lg border px-2 py-1.5 text-left text-xs font-medium transition-colors sm:px-2.5 sm:text-sm',
      tone === 'warning'
        ? 'border-[color-mix(in_srgb,var(--brand-cta)_28%,transparent)] bg-[var(--brand-surface-strong)] text-[var(--brand-text-strong)] hover:border-[color-mix(in_srgb,var(--brand-cta)_45%,transparent)] hover:bg-[color-mix(in_srgb,var(--brand-cta)_6%,transparent)]'
        : 'border-error/25 bg-[var(--brand-surface-strong)] text-[var(--brand-text-strong)] hover:border-error/40 hover:bg-error/5'
    );

  return (
    <div
      className={cn(workspacePanelShellClass, 'p-3 sm:p-3.5', className)}
      role="region"
      aria-label="Alertas do workspace"
    >
      <div
        role="tablist"
        aria-label="Tipo de alerta"
        className="mb-2.5 flex shrink-0 flex-wrap gap-1 rounded-full bg-[var(--brand-chip)] p-0.5 sm:gap-1"
      >
        {healthCount > 0 && (
          <button
            type="button"
            role="tab"
            id={tabHealthId}
            aria-selected={tab === 'health'}
            aria-controls={panelHealthId}
            tabIndex={tab === 'health' ? 0 : -1}
            className={tabBtnClass(tab === 'health', 'warning')}
            onClick={() => setTab('health')}
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" aria-hidden />
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
            className={tabBtnClass(tab === 'tests', 'error')}
            onClick={() => setTab('tests')}
          >
            <AlertOctagon className="h-3.5 w-3.5 shrink-0 text-error" aria-hidden />
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
          className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', tab !== 'health' && 'hidden')}
        >
          <p className="mb-2 shrink-0 text-[11px] leading-snug text-[var(--brand-text-muted)] sm:text-xs">
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
                  className={projectChipClass('warning')}
                  title={p.name}
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2.5 shrink-0 pt-0.5">
            <button
              type="button"
              onClick={onToggleListFilterNeedsAttention}
              className={cn(
                'rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors',
                listFilterNeedsAttention
                  ? 'border-[color-mix(in_srgb,var(--brand-cta)_45%,transparent)] bg-[color-mix(in_srgb,var(--brand-cta)_10%,transparent)] text-[var(--brand-cta)]'
                  : 'border-[var(--brand-surface-border)] bg-[var(--brand-surface-strong)] text-[var(--brand-text-strong)] hover:border-[color-mix(in_srgb,var(--brand-cta)_35%,transparent)]'
              )}
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
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-error/10 text-error"
              aria-hidden
            >
              <AlertOctagon className="h-4 w-4" />
            </div>
            <p className="text-[11px] leading-snug text-[var(--brand-text-muted)] sm:text-xs">
              Projetos com ao menos um caso de teste em status <strong className="text-[var(--brand-text-strong)]">Falhou</strong> ou{' '}
              <strong className="text-[var(--brand-text-strong)]">Bloqueado</strong>.
            </p>
          </div>
          <ul
            className="m-0 flex min-h-0 flex-1 flex-wrap content-start gap-2 overflow-y-auto overscroll-contain p-0 [scrollbar-gutter:stable]"
            aria-label="Projetos com falha ou bloqueio em testes"
          >
            {testExecutionAlertProjects.map(p => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => onSelectProject(p.id)}
                  className={cn(projectChipClass('error'), 'min-h-[40px] px-3 py-2 sm:min-h-0')}
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
