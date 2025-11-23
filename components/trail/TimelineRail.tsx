import React, { useMemo, useState } from 'react';
import { JiraTask, Phase, Project } from '../../types';
import { windows12Styles } from '../../utils/windows12Styles';
import { timelineData } from '../../utils/projectPhases';

type PhaseDisplayStatus = 'completed' | 'current' | 'upcoming';

interface TimelineRailProps {
    project: Project;
    phases: Phase[];
    selectedVersion: string;
    versionTasks: JiraTask[];
    overallProgress: number;
    onAskAI: () => void;
    isAiLoading: boolean;
    analysisOutdated: boolean;
}

const statusStyles: Record<PhaseDisplayStatus, string> = {
    completed: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100',
    current: 'border-accent/50 bg-accent/10 text-accent-light',
    upcoming: 'border-white/10 bg-white/5 text-text-secondary'
};

export const TimelineRail: React.FC<TimelineRailProps> = ({
    project,
    phases,
    selectedVersion,
    versionTasks,
    overallProgress,
    onAskAI,
    isAiLoading,
    analysisOutdated
}) => {
    const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

    const tasksPool = versionTasks.length > 0 ? versionTasks : project.tasks;
    const taskTotals = useMemo(() => {
        const done = tasksPool.filter(task => task.status === 'Done').length;
        const inProgress = tasksPool.filter(task => task.status === 'In Progress').length;
        const todo = Math.max(tasksPool.length - done - inProgress, 0);
        return { done, inProgress, todo, total: tasksPool.length };
    }, [tasksPool]);

    const versionCompletionRatio = useMemo(() => {
        if (selectedVersion === 'Todos') {
            return overallProgress / 100;
        }
        if (taskTotals.total === 0) {
            return 0;
        }
        return taskTotals.done / taskTotals.total;
    }, [selectedVersion, taskTotals, overallProgress]);

    const phaseStatusMap = useMemo(() => {
        return phases.reduce<Record<string, PhaseDisplayStatus>>((acc, phase, index) => {
            let status: PhaseDisplayStatus;
            if (selectedVersion === 'Todos') {
                if (phase.status === 'Concluído') status = 'completed';
                else if (phase.status === 'Em Andamento') status = 'current';
                else status = 'upcoming';
            } else {
                const threshold = (index + 1) / phases.length;
                const lowerThreshold = index / phases.length;
                if (versionCompletionRatio >= threshold) status = 'completed';
                else if (versionCompletionRatio >= lowerThreshold) status = 'current';
                else status = 'upcoming';
            }
            acc[phase.name] = status;
            return acc;
        }, {});
    }, [phases, selectedVersion, versionCompletionRatio]);

    const getPhaseDetails = (phaseName: string) => {
        return timelineData.find(detail => detail.phase === phaseName) ?? {
            phase: phaseName,
            duration: '—',
            dependencies: 'Dados indisponíveis',
            exitCriteria: 'Atualize as informações desta fase.',
            milestone: '—',
            checklist: []
        };
    };

    return (
        <section className={`${windows12Styles.card} ${windows12Styles.spacing.lg} space-y-5`}>
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-text-secondary">Bloco 4</p>
                    <h3 className="text-xl font-semibold text-text-primary">Timeline simplificada</h3>
                    <p className="text-sm text-text-secondary">
                        Visualize conquistas, o que está em execução e os próximos saltos da versão selecionada.
                    </p>
                </div>

                <button
                    onClick={onAskAI}
                    disabled={isAiLoading}
                    className={`
                        ${windows12Styles.buttonSecondary}
                        flex items-center justify-center gap-2 text-sm
                    `}
                >
                    {isAiLoading ? '…' : '💡'}
                    Reforçar com IA
                </button>
            </header>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur space-y-4">
                <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
                    <span className="font-semibold text-text-primary">
                        {selectedVersion === 'Todos' ? 'Visão geral do projeto' : `Versão ${selectedVersion}`}
                    </span>
                    <span>•</span>
                    <span>{Math.round(versionCompletionRatio * 100)}% concluído</span>
                    <span>•</span>
                    <span>{taskTotals.done} concluídos • {taskTotals.inProgress} em andamento • {taskTotals.todo} futuros</span>
                    {analysisOutdated && (
                        <>
                            <span>•</span>
                            <span className="text-amber-300">IA sugere atualizar recomendações</span>
                        </>
                    )}
                </div>

                <div className="flex gap-3 overflow-x-auto no-scrollbar">
                    {phases.map((phase, index) => {
                        const status = phaseStatusMap[phase.name];
                        return (
                            <button
                                key={phase.name}
                                className={`
                                    min-w-[180px] rounded-2xl border px-4 py-3 text-left transition-all
                                    ${statusStyles[status]}
                                `}
                                onClick={() => setExpandedPhase(prev => prev === phase.name ? null : phase.name)}
                            >
                                <p className="text-xs uppercase tracking-[0.3em]">{`#${index + 1}`}</p>
                                <p className="text-base font-semibold">{phase.name}</p>
                                <p className="text-xs mt-1">
                                    {status === 'completed' && 'Concluído'}
                                    {status === 'current' && 'Em andamento'}
                                    {status === 'upcoming' && 'Próximo'}
                                </p>
                            </button>
                        );
                    })}
                </div>

                {expandedPhase && (
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                        {(() => {
                            const details = getPhaseDetails(expandedPhase);
                            const status = phaseStatusMap[expandedPhase];
                            return (
                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.3em] text-text-secondary">
                                                Fase selecionada
                                            </p>
                                            <h4 className="text-lg font-semibold text-text-primary">
                                                {details.phase}
                                            </h4>
                                        </div>
                                        <span className={`${statusStyles[status]} inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs`}>
                                            {status === 'completed' ? '✅ Concluído' : status === 'current' ? '🔄 Em execução' : '⏳ Planejado'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                            <p className="text-xs uppercase tracking-[0.3em] text-text-secondary">
                                                Dependências
                                            </p>
                                            <p className="text-sm text-text-primary mt-1">{details.dependencies}</p>
                                        </div>
                                        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                            <p className="text-xs uppercase tracking-[0.3em] text-text-secondary">
                                                Marco
                                            </p>
                                            <p className="text-sm text-text-primary mt-1">{details.milestone}</p>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                                        <p className="text-xs uppercase tracking-[0.3em] text-text-secondary mb-2">
                                            Checklist chave
                                        </p>
                                        {details.checklist.length === 0 ? (
                                            <p className="text-sm text-text-secondary">Adicione critérios para esta fase.</p>
                                        ) : (
                                            <ul className="space-y-1">
                                                {details.checklist.slice(0, 4).map((item, idx) => (
                                                    <li key={idx} className="flex items-start gap-2 text-sm text-text-primary">
                                                        <span>•</span>
                                                        <span>{item.label}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
            </div>
        </section>
    );
};

