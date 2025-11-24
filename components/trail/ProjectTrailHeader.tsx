import React from 'react';
import { windows12Styles } from '../../utils/windows12Styles';
import { Spinner } from '../common/Spinner';

interface ProjectTrailHeaderProps {
    projectName: string;
    versionOptions: string[];
    selectedVersion: string;
    onVersionChange: (version: string) => void;
    currentPhase: string;
    nextPhase?: string;
    overallProgress: number;
    remainingPhases: number;
    onAskAI: () => void;
    isAiLoading: boolean;
    analysisOutdated: boolean;
    lastAnalysisAt?: string;
}

export const ProjectTrailHeader: React.FC<ProjectTrailHeaderProps> = ({
    projectName,
    versionOptions,
    selectedVersion,
    onVersionChange,
    currentPhase,
    nextPhase,
    overallProgress,
    remainingPhases,
    onAskAI,
    isAiLoading,
    analysisOutdated,
    lastAnalysisAt
}) => {
    const formattedAnalysis = lastAnalysisAt
        ? new Date(lastAnalysisAt).toLocaleString('pt-BR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
        : 'Nunca executada';

    return (
        <section
            className={`
                ${windows12Styles.card}
                ${windows12Styles.glow()}
                ${windows12Styles.spacing.lg}
                flex flex-col gap-6
                bg-gradient-to-tr from-white/8 via-white/2 to-transparent
            `}
        >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.4em] text-text-secondary/70">
                        Trilha do Projeto
                    </p>
                    <h2 className="text-[clamp(1.6rem,3vw,2.4rem)] font-semibold text-text-primary mt-1">
                        {projectName}
                    </h2>
                    <p className="text-sm text-text-secondary mt-2">
                        Você está em <span className="text-text-primary font-semibold">{currentPhase}</span>
                        {nextPhase && (
                            <>
                                , próximo checkpoint: <span className="text-accent font-semibold">{nextPhase}</span>
                            </>
                        )}
                    </p>
                </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex flex-col text-xs font-semibold uppercase tracking-[0.2em] text-text-secondary w-full sm:w-auto">
                    Versão do projeto
                    <select
                        className="input-select version-select mt-2 w-full sm:w-auto"
                        value={selectedVersion}
                        onChange={(event) => onVersionChange(event.target.value)}
                    >
                        {versionOptions.map(option => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </label>

                <button
                    onClick={onAskAI}
                    disabled={isAiLoading}
                    className={`
                        ${windows12Styles.buttonPrimary}
                        flex items-center justify-center gap-2
                        whitespace-nowrap h-12 px-6
                    `}
                >
                    {isAiLoading ? <Spinner small /> : '🧠'}
                    {analysisOutdated ? 'Atualizar Recomendações' : 'O que posso fazer agora?'}
                </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl glass-surface p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-text-secondary">Fase atual</p>
                    <p className="mt-2 text-lg font-semibold text-text-primary">{currentPhase}</p>
                    <p className="text-xs text-text-secondary mt-1">
                        {nextPhase ? `Próxima: ${nextPhase}` : 'Todas as fases mapeadas'}
                    </p>
                </div>

                <div className="rounded-2xl glass-surface p-4">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-text-secondary">
                        <span>Progresso geral</span>
                        <span>{overallProgress}%</span>
                    </div>
                    <div className="mt-3 h-2 w-full rounded-full glass-track overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-accent via-accent to-emerald-400 transition-all duration-300"
                            style={{ width: `${overallProgress}%` }}
                        />
                    </div>
                    <p className="text-xs text-text-secondary mt-2">
                        {remainingPhases} fase(s) restante(s)
                    </p>
                </div>

                <div className={`rounded-2xl glass-surface p-4 space-y-2 ${analysisOutdated ? 'glass-surface--warning' : ''}`}>
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-text-secondary">
                        <span>Status da IA</span>
                        <span className={analysisOutdated ? 'text-amber-300' : 'text-emerald-300'}>
                            {analysisOutdated ? 'Revisar' : 'Atualizado'}
                        </span>
                    </div>
                    <p className="text-sm text-text-secondary leading-relaxed">
                        Última análise: <span className="text-text-primary font-medium">{formattedAnalysis}</span>
                    </p>
                    <p className="text-xs text-text-secondary/80">
                        {analysisOutdated
                            ? 'Detectamos alterações recentes. Execute a IA para recomendações atualizadas.'
                            : 'Todas as recomendações levam em conta as últimas atualizações do projeto.'}
                    </p>
                </div>
            </div>
        </section>
    );
};

