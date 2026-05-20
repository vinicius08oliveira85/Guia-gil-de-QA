import React from 'react';
import { Spinner } from '../common/Spinner';
import { cn } from '../../utils/cn';
import {
  compactMetricTile,
  primaryActionBtn,
  projectViewCard,
  pageSubtitleClass,
  pageTitleClass,
} from '../common/viewUi';

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
  lastAnalysisAt,
}) => {
  const formattedAnalysis = lastAnalysisAt
    ? new Date(lastAnalysisAt).toLocaleString('pt-BR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Nunca executada';

  return (
    <section className={cn(projectViewCard, 'space-y-5')}>
      <header className="flex flex-col gap-4 border-b border-base-300/60 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-base-content/55">
            Trilha do projeto
          </p>
          <h2 className={cn(pageTitleClass, 'mt-1')}>{projectName}</h2>
          <p className={cn(pageSubtitleClass, 'mt-2')}>
            Você está em <span className="font-semibold text-base-content">{currentPhase}</span>
            {nextPhase && (
              <>
                {' '}
                — próximo checkpoint:{' '}
                <span className="font-semibold text-[var(--brand-cta)]">{nextPhase}</span>
              </>
            )}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex min-w-[10rem] flex-col gap-1.5 text-xs font-medium text-base-content/65">
            Versão
            <select
              className="select select-bordered h-10 min-h-0 rounded-lg border-base-300/80 bg-base-100 text-sm shadow-sm"
              value={selectedVersion}
              onChange={event => onVersionChange(event.target.value)}
            >
              {versionOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={onAskAI}
            disabled={isAiLoading}
            className={cn(primaryActionBtn, 'w-full sm:w-auto')}
          >
            {isAiLoading ? <Spinner size="sm" /> : <span aria-hidden>🧠</span>}
            {analysisOutdated ? 'Atualizar recomendações' : 'O que posso fazer agora?'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className={compactMetricTile}>
          <p className="text-xs font-semibold uppercase tracking-wider text-base-content/55">
            Fase atual
          </p>
          <p className="mt-2 text-lg font-semibold text-base-content">{currentPhase}</p>
          <p className="mt-1 text-sm text-base-content/65">
            {nextPhase ? `Próxima: ${nextPhase}` : 'Todas as fases mapeadas'}
          </p>
        </div>

        <div className={compactMetricTile}>
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-base-content/55">
            <span>Progresso geral</span>
            <span className="text-base-content">{overallProgress}%</span>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-base-300/80">
            <div
              className="h-full rounded-full bg-[var(--brand-cta)] transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <p className="mt-2 text-sm text-base-content/65">{remainingPhases} fase(s) restante(s)</p>
        </div>

        <div
          className={cn(
            compactMetricTile,
            analysisOutdated ? 'border-warning/40 bg-warning/5' : 'border-success/30 bg-success/5'
          )}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-base-content/55">
            <span>Status da IA</span>
            <span
              className={cn(
                'text-sm font-semibold',
                analysisOutdated ? 'text-warning' : 'text-success'
              )}
            >
              {analysisOutdated ? 'Revisar' : 'Atualizado'}
            </span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-base-content/70">
            Última análise: <span className="font-medium text-base-content">{formattedAnalysis}</span>
          </p>
        </div>
      </div>
    </section>
  );
};
