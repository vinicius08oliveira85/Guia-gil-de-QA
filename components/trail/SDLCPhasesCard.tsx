import React, { useEffect, useMemo, useState } from 'react';
import { Phase } from '../../types';
import { windows12Styles } from '../../utils/windows12Styles';
import { timelineData } from '../../utils/projectPhases';

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
    completed: 'phase-pill phase-pill--success',
    current: 'phase-pill phase-pill--current',
    upcoming: 'phase-pill phase-pill--neutral'
};

const statusBadgeStyles: Record<PhaseDisplayStatus, string> = {
    completed: 'px-3 py-1 text-xs font-semibold rounded-full border border-emerald-300 text-emerald-300 bg-emerald-400/10',
    current: 'px-3 py-1 text-xs font-semibold rounded-full border border-accent/40 text-accent bg-accent/10',
    upcoming: 'px-3 py-1 text-xs font-semibold rounded-full border border-surface-border text-text-secondary bg-surface-contrast'
};

export const SDLCPhasesCard: React.FC<SDLCPhasesCardProps> = ({
    phases,
    versionLabel,
    overallProgress,
    onAskAI,
    isAiLoading,
    analysisOutdated
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
        <section className={`${windows12Styles.card} ${windows12Styles.spacing.lg} space-y-5`}>
            <header className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-text-secondary">Bloco 1</p>
                    <h3 className="text-xl font-semibold text-text-primary">
                        Fases do SDLC (Software Development Life Cycle)
                    </h3>
                    <p className="text-sm text-text-secondary mt-1">
                        Acompanhando {versionLabel} • {overallProgress}% concluído •{' '}
                        {analysisOutdated ? (
                            <span className="text-amber-300">IA sugere atualização</span>
                        ) : (
                            <span className="text-emerald-300">Em linha com a última análise</span>
                        )}
                    </p>
                </div>
                <button
                    onClick={onAskAI}
                    disabled={isAiLoading}
                    className={`
                        ${windows12Styles.buttonSecondary}
                        flex items-center justify-center gap-2 text-sm w-full sm:w-auto
                    `}
                >
                    {isAiLoading ? '…' : '🤖'}
                    Reprocessar IA
                </button>
            </header>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <div className="rounded-2xl glass-surface p-4">
                    <p className="data-label">Concluídas</p>
                    <p className="data-value mt-1 text-2xl text-emerald-300">{summary.completed}</p>
                    <p className="text-xs text-text-secondary mt-1">Fases já entregues com critérios atendidos</p>
                </div>
                <div className="rounded-2xl glass-surface p-4">
                    <p className="data-label">Em execução</p>
                    <p className="data-value mt-1 text-2xl text-accent">{summary.current}</p>
                    <p className="text-xs text-text-secondary mt-1">Fases ativas para {versionLabel}</p>
                </div>
                <div className="rounded-2xl glass-surface p-4">
                    <p className="data-label">Planejadas</p>
                    <p className="data-value mt-1 text-2xl text-text-primary">{summary.upcoming}</p>
                    <p className="text-xs text-text-secondary mt-1">Próximas etapas da trilha</p>
                </div>
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar">
                {phases.map((phase, index) => {
                    const status = statusMap[phase.name];
                    return (
                        <button
                            key={phase.name}
                            className={`
                                text-left ${phaseButtonStyles[status]}
                                ${expandedPhase === phase.name ? 'ring-2 ring-accent/30' : ''}
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
                <div className="rounded-2xl glass-surface glass-surface--tint p-5 space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.35em] text-text-secondary">Fase selecionada</p>
                            <h4 className="text-lg font-semibold text-text-primary">{selectedDetails.phase}</h4>
                            <p className="text-sm text-text-secondary mt-1">{selectedDetails.duration}</p>
                        </div>
                        <span className={statusBadgeStyles[statusMap[expandedPhase]]}>
                            {statusMap[expandedPhase] === 'completed' && '✅ Concluída'}
                            {statusMap[expandedPhase] === 'current' && '🔄 Em andamento'}
                            {statusMap[expandedPhase] === 'upcoming' && '⏳ Planejada'}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div className="rounded-xl glass-surface glass-surface--tint p-4">
                            <p className="text-xs uppercase tracking-[0.35em] text-text-secondary">Dependências</p>
                            <p className="text-sm text-text-primary mt-1">{selectedDetails.dependencies}</p>
                        </div>
                        <div className="rounded-xl glass-surface glass-surface--tint p-4">
                            <p className="text-xs uppercase tracking-[0.35em] text-text-secondary">Marco</p>
                            <p className="text-sm text-text-primary mt-1">{selectedDetails.milestone}</p>
                        </div>
                    </div>

                    <div className="rounded-xl glass-surface glass-surface--tint p-4">
                        <p className="text-xs uppercase tracking-[0.35em] text-text-secondary mb-2">Checklist-chave</p>
                        {selectedDetails.checklist.length === 0 ? (
                            <p className="text-sm text-text-secondary">Adicione critérios de saída para esta fase.</p>
                        ) : (
                            <ul className="space-y-2 text-sm text-text-primary">
                                {selectedDetails.checklist.slice(0, 4).map((item, idx) => (
                                    <li key={`${selectedDetails.phase}-${idx}`} className="flex items-start gap-2">
                                        <span>•</span>
                                        <div>
                                            <p className="font-semibold">{item.label}</p>
                                            {item.description && (
                                                <p className="text-xs text-text-secondary">{item.description}</p>
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

