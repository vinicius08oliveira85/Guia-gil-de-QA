import React, { useEffect, useMemo, useState } from 'react';
import { Phase } from '../../types';
import { timelineData } from '../../utils/projectPhases';
import { cn } from '../../utils/cn';
import { filterPillClass, primaryActionBtn, projectViewCard } from '../common/viewUi';
import { trailPanelClass, trailTileClass } from './trailNeuUi';
import { neuSurfaceClass } from '../common/neuUi';

type PhaseDisplayStatus = 'completed' | 'current' | 'upcoming';

interface SDLCPhasesCardProps {
  phases: Phase[];
  versionLabel: string;
  overallProgress: number;
  onAskAI: () => void;
  isAiLoading: boolean;
  analysisOutdated: boolean;
}

const phaseButtonStyles: Record<PhaseDisplayStatus, string> = {
  completed: 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100',
  current:
    'border-[color-mix(in_srgb,var(--brand-cta)_35%,transparent)] bg-[color-mix(in_srgb,var(--brand-cta)_10%,transparent)] text-base-content hover:bg-[color-mix(in_srgb,var(--brand-cta)_16%,transparent)]',
  upcoming:
    'leve-neu-surface text-base-content/80 hover:shadow-[var(--leve-neu-hover)] border-0',
};

const statusBadgeStyles: Record<PhaseDisplayStatus, string> = {
  completed: 'badge badge-success badge-sm',
  current: 'badge badge-primary badge-sm',
  upcoming: 'badge badge-outline badge-sm',
};

export const SDLCPhasesCard: React.FC<SDLCPhasesCardProps> = ({
  phases,
  versionLabel,
  overallProgress,
  onAskAI,
  isAiLoading,
  analysisOutdated,
}) => {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  useEffect(() => {
    if (phases.length === 0) {
      setExpandedPhase(null);
      return;
    }

    setExpandedPhase(prev => {
      if (prev && phases.some(phase => phase.name === prev)) {
        return prev;
      }
      return phases.find(phase => phase.status === 'Em Andamento')?.name ?? phases[0].name;
    });
  }, [phases]);

  const statusMap = useMemo(() => {
    return phases.reduce<Record<string, PhaseDisplayStatus>>((acc, phase) => {
      const status: PhaseDisplayStatus =
        phase.status === 'Concluído'
          ? 'completed'
          : phase.status === 'Em Andamento'
            ? 'current'
            : 'upcoming';
      acc[phase.name] = status;
      return acc;
    }, {});
  }, [phases]);

  const summary = useMemo(() => {
    const completed = phases.filter(phase => phase.status === 'Concluído').length;
    const current = phases.filter(phase => phase.status === 'Em Andamento').length;
    const upcoming = Math.max(phases.length - completed - current, 0);

    return { completed, current, upcoming };
  }, [phases]);

  const selectedDetails = expandedPhase
    ? timelineData.find(detail => detail.phase === expandedPhase)
    : undefined;

  return (
    <section className={cn('space-y-5', projectViewCard)}>
      <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-base-content/60">
            Bloco 1
          </p>
          <h3 className="text-xl font-semibold text-base-content">
            Fases do SDLC (Software Development Life Cycle)
          </h3>
          <p className="mt-1 text-sm text-base-content/70">
            Acompanhando {versionLabel} • {overallProgress}% concluído •{' '}
            {analysisOutdated ? (
              <span className="text-amber-700">IA sugere atualização</span>
            ) : (
              <span className="text-emerald-700">Em linha com a última análise</span>
            )}
          </p>
        </div>
        <button
          onClick={onAskAI}
          disabled={isAiLoading}
          className="btn btn-outline btn-sm flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
        >
          {isAiLoading ? '…' : '🤖'}
          Reprocessar IA
        </button>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className={trailTileClass}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/60">
            Concluídas
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">{summary.completed}</p>
          <p className="mt-1 text-xs text-base-content/70">
            Fases já entregues com critérios atendidos
          </p>
        </div>
        <div className={trailTileClass}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/60">
            Em execução
          </p>
          <p className="mt-2 text-2xl font-semibold text-primary">{summary.current}</p>
          <p className="mt-1 text-xs text-base-content/70">Fases ativas para {versionLabel}</p>
        </div>
        <div className={trailTileClass}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/60">
            Planejadas
          </p>
          <p className="mt-2 text-2xl font-semibold text-base-content">{summary.upcoming}</p>
          <p className="mt-1 text-xs text-base-content/70">Próximas etapas da trilha</p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {phases.map((phase, index) => {
          const status = statusMap[phase.name];
          return (
            <button
              key={phase.name}
              className={`
                                min-w-[220px] rounded-2xl border px-4 py-3 text-left transition-colors
                                ${phaseButtonStyles[status]}
                                ${expandedPhase === phase.name ? 'ring-2 ring-primary/20' : ''}
                            `}
              onClick={() => setExpandedPhase(prev => (prev === phase.name ? null : phase.name))}
            >
              <p className="text-xs uppercase tracking-[0.3em]">{`#${index + 1}`}</p>
              <p className="text-base font-semibold">{phase.name}</p>
              <p className="text-xs mt-1">
                {status === 'completed' && 'Concluída'}
                {status === 'current' && 'Em execução'}
                {status === 'upcoming' && 'Planejada'}
              </p>
            </button>
          );
        })}
      </div>

      {expandedPhase && selectedDetails && (
        <div className={cn(trailPanelClass, 'space-y-4')}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-base-content/60">
                Fase selecionada
              </p>
              <h4 className="text-lg font-semibold text-base-content">{selectedDetails.phase}</h4>
              <p className="mt-1 text-sm text-base-content/70">{selectedDetails.duration}</p>
            </div>
            <span className={statusBadgeStyles[statusMap[expandedPhase]]}>
              {statusMap[expandedPhase] === 'completed' && '✅ Concluída'}
              {statusMap[expandedPhase] === 'current' && '🔄 Em andamento'}
              {statusMap[expandedPhase] === 'upcoming' && '⏳ Planejada'}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className={cn(neuSurfaceClass, 'rounded-xl p-4')}>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-base-content/60">
                Dependências
              </p>
              <p className="mt-1 text-sm text-base-content">{selectedDetails.dependencies}</p>
            </div>
            <div className={cn(neuSurfaceClass, 'rounded-xl p-4')}>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-base-content/60">
                Marco
              </p>
              <p className="mt-1 text-sm text-base-content">{selectedDetails.milestone}</p>
            </div>
          </div>

          <div className={cn(neuSurfaceClass, 'rounded-xl p-4')}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-base-content/60">
              Checklist-chave
            </p>
            {selectedDetails.checklist.length === 0 ? (
              <p className="text-sm text-base-content/70">
                Adicione critérios de saída para esta fase.
              </p>
            ) : (
              <ul className="space-y-2 text-sm text-base-content">
                {selectedDetails.checklist.slice(0, 4).map((item, idx) => (
                  <li key={`${selectedDetails.phase}-${idx}`} className="flex items-start gap-2">
                    <span>•</span>
                    <div>
                      <p className="font-semibold">{item.label}</p>
                      {item.description && (
                        <p className="text-xs text-base-content/70">{item.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
