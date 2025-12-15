import React from 'react';
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
            className="flex flex-col gap-6 rounded-[var(--rounded-box)] border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6 lg:p-8"
        >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/60">
                        Trilha do Projeto
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold tracking-tight text-base-content">
                        {projectName}
                    </h2>
                    <p className="mt-2 text-sm text-base-content/70 sm:text-base">
                        Você está em <span className="font-semibold text-base-content">{currentPhase}</span>
                        {nextPhase && (
                            <>
                                , próximo checkpoint: <span className="font-semibold text-primary">{nextPhase}</span>
                            </>
                        )}
                    </p>
                </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex flex-col w-full text-xs font-semibold uppercase tracking-[0.2em] text-base-content/60 sm:w-auto">
                    Versão do projeto
                    <select
                        className="select select-bordered mt-2 w-full sm:w-auto"
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
                    className="btn btn-primary h-12 whitespace-nowrap px-6"
                >
                    {isAiLoading ? <Spinner small /> : <span aria-hidden>🧠</span>}
                    {analysisOutdated ? 'Atualizar Recomendações' : 'O que posso fazer agora?'}
                </button>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-base-300 bg-base-200 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/60">Fase atual</p>
                    <p className="mt-2 text-lg font-semibold text-base-content">{currentPhase}</p>
                    <p className="mt-1 text-sm text-base-content/70">
                        {nextPhase ? `Próxima: ${nextPhase}` : 'Todas as fases mapeadas'}
                    </p>
                </div>

                <div className="rounded-2xl border border-base-300 bg-base-200 p-4">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-base-content/60">
                        <span>Progresso geral</span>
                        <span className="text-base-content">{overallProgress}%</span>
                    </div>
                    <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-base-300">
                        <div
                            className="h-full rounded-full bg-primary transition-all duration-300"
                            style={{ width: `${overallProgress}%` }}
                        />
                    </div>
                    <p className="mt-2 text-sm text-base-content/70">
                        {remainingPhases} fase(s) restante(s)
                    </p>
                </div>

                <div
                    className={`rounded-2xl border p-4 ${analysisOutdated ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}
                >
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-base-content/60">
                        <span>Status da IA</span>
                        <span className={`text-sm font-semibold ${analysisOutdated ? 'text-amber-800' : 'text-emerald-800'}`}>
                            {analysisOutdated ? 'Revisar' : 'Atualizado'}
                        </span>
                    </div>
                    <p className="mt-2 text-sm text-base-content/70 leading-relaxed">
                        Última análise: <span className="font-medium text-base-content">{formattedAnalysis}</span>
                    </p>
                    <p className="mt-1 text-xs text-base-content/70">
                        {analysisOutdated
                            ? 'Detectamos alterações recentes. Execute a IA para recomendações atualizadas.'
                            : 'Todas as recomendações levam em conta as últimas atualizações do projeto.'}
                    </p>
                </div>
            </div>
        </section>
    );
};

