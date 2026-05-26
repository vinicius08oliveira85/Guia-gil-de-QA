import React, { useMemo, useState } from 'react';
import { GeneralIAAnalysis, Project } from '../../types';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';
import { isAnalysisOutdated } from '../../utils/analysisFreshness';
import { getGeneralIAAnalysisSnapshotHash } from '../../services/ai/generalAnalysisService';
import { SafeMarkdown } from '../common/SafeMarkdown';
import { analysisPanelClass, analysisTileClass } from './analysisNeuUi';
import { neuSurfaceInsetClass } from '../common/neuUi';

interface GeneralAnalysisCardProps {
  analysis: GeneralIAAnalysis;
  onRefresh?: () => void;
  /** Quando informado, o estado “desatualizada” usa `snapshotHash` vs snapshot atual do projeto. */
  project?: Project;
}

export const GeneralAnalysisCard: React.FC<GeneralAnalysisCardProps> = ({
  analysis,
  onRefresh,
  project,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));

  const contentStale = useMemo(() => {
    if (project) {
      return isAnalysisOutdated(analysis, getGeneralIAAnalysisSnapshotHash(project));
    }
    return analysis.isOutdated === true;
  }, [analysis, project]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const overallRiskBadge = useMemo(() => {
    switch (analysis.riskCalculation.overallRisk) {
      case 'Crítico':
        return { box: 'bg-error/10 border-error/30', badge: 'badge badge-error badge-outline' };
      case 'Alto':
        return {
          box: 'bg-warning/10 border-warning/30',
          badge: 'badge badge-warning badge-outline',
        };
      case 'Médio':
        return { box: 'bg-info/10 border-info/30', badge: 'badge badge-info badge-outline' };
      case 'Baixo':
        return {
          box: 'bg-success/10 border-success/30',
          badge: 'badge badge-success badge-outline',
        };
      default:
        return {
          box: 'leve-neu-surface-inset border-0',
          badge: 'badge badge-neutral badge-outline',
        };
    }
  }, [analysis.riskCalculation.overallRisk]);

  const SectionHeader: React.FC<{
    title: string;
    icon: string;
    count?: number;
    sectionKey: string;
  }> = ({ title, icon, count, sectionKey }) => (
    <button
      type="button"
      onClick={() => toggleSection(sectionKey)}
      className="flex w-full items-center justify-between rounded-lg p-4 transition-all hover:shadow-[var(--leve-neu-hover)]"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <span className="font-semibold text-base-content text-lg">{title}</span>
        {count !== undefined && (
          <span className="badge badge-outline badge-sm text-primary">{count}</span>
        )}
      </div>
      <svg
        className={cn(
          'w-5 h-5 text-base-content/70 transition-transform',
          expandedSections.has(sectionKey) ? 'rotate-180' : undefined
        )}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );

  return (
    <div className={analysisPanelClass}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-base-content">
              Análise Geral IA
            </h3>
            {contentStale && (
              <span className="badge badge-warning badge-outline badge-sm whitespace-nowrap">
                Base desatualizada
              </span>
            )}
          </div>
          <p className="text-sm text-base-content/70">
            Gerada em {format(new Date(analysis.generatedAt), "dd/MM/yyyy 'às' HH:mm")}
          </p>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="btn btn-ghost btn-sm btn-circle"
            title="Atualizar análise"
            aria-label="Atualizar análise geral"
          >
            <svg
              className="w-5 h-5 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Risk Badge */}
      <div
        className={cn('mb-6 p-5 rounded-xl border', overallRiskBadge.box)}
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold mb-2 uppercase tracking-wide">
              Risco Geral do Projeto
            </p>
            <p className="text-2xl font-bold mb-1">{analysis.riskCalculation.overallRisk}</p>
            <p className="text-sm opacity-80">Score: {analysis.riskCalculation.riskScore}/100</p>
          </div>
          <div className="text-4xl" aria-hidden="true">
            {analysis.riskCalculation.overallRisk === 'Crítico' && '🚨'}
            {analysis.riskCalculation.overallRisk === 'Alto' && '⚠️'}
            {analysis.riskCalculation.overallRisk === 'Médio' && '⚡'}
            {analysis.riskCalculation.overallRisk === 'Baixo' && '✅'}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="mb-6">
        <SectionHeader title="Resumo Geral" icon="📊" sectionKey="summary" />
        {expandedSections.has('summary') && (
          <div className={cn(analysisTileClass, 'mt-4')}>
            <SafeMarkdown
              source={analysis.summary}
              className="leading-relaxed text-base"
            />
          </div>
        )}
      </div>

      {/* Detected Problems */}
      <div className="mb-6">
        <SectionHeader
          title="Problemas Detectados"
          icon="🔍"
          count={analysis.detectedProblems.length}
          sectionKey="problems"
        />
        {expandedSections.has('problems') && (
          <div className="mt-4 space-y-3">
            {analysis.detectedProblems.map((problem, idx) => (
              <div
                key={idx}
                className="p-4 bg-error/10 border border-error/20 rounded-xl hover:bg-error/15 hover:border-error/30 transition-all"
              >
                <p className="text-base-content text-base leading-relaxed">{problem}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Risk Factors */}
      <div className="mb-6">
        <SectionHeader
          title="Fatores de Risco"
          icon="⚡"
          count={analysis.riskCalculation.riskFactors.length}
          sectionKey="riskFactors"
        />
        {expandedSections.has('riskFactors') && (
          <div className="mt-4 space-y-3">
            {analysis.riskCalculation.riskFactors.map((factor, idx) => (
              <div
                key={idx}
                className={cn(
                  'p-4 rounded-xl border transition-all hover:opacity-90',
                  factor.impact === 'Alto'
                    ? 'bg-error/10 border-error/20'
                    : factor.impact === 'Médio'
                      ? 'bg-warning/10 border-warning/20'
                      : 'bg-info/10 border-info/20'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-base-content text-base">{factor.factor}</p>
                  <span
                    className={cn(
                      'badge badge-outline badge-sm',
                      factor.impact === 'Alto'
                        ? 'badge-error'
                        : factor.impact === 'Médio'
                          ? 'badge-warning'
                          : 'badge-info'
                    )}
                  >
                    {factor.impact}
                  </span>
                </div>
                <p className="text-base text-base-content/70 leading-relaxed">
                  {factor.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Missing Items */}
      <div className="mb-6">
        <SectionHeader
          title="Itens Faltantes"
          icon="📋"
          count={analysis.missingItems.length}
          sectionKey="missingItems"
        />
        {expandedSections.has('missingItems') && (
          <div className="mt-4 space-y-3">
            {analysis.missingItems.map((item, idx) => (
              <div
                key={idx}
                className="p-4 bg-warning/5 border border-warning/20 rounded-xl flex items-start gap-3 hover:border-warning/30 transition-all"
              >
                <span className="text-yellow-400 mt-0.5 text-xl">⚠️</span>
                <p className="text-base-content text-base flex-1 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BDD Suggestions */}
      <div className="mb-6">
        <SectionHeader
          title="Sugestões de Cenários BDD"
          icon="🧪"
          count={analysis.bddSuggestions.length}
          sectionKey="bddSuggestions"
        />
        {expandedSections.has('bddSuggestions') && (
          <div className="mt-4 space-y-4">
            {analysis.bddSuggestions.map((suggestion, idx) => (
              <div key={idx} className={cn(analysisTileClass, 'p-5')}>
                <p className="font-semibold text-base-content mb-3 text-lg">
                  {suggestion.taskTitle}
                </p>
                <div className="space-y-2">
                  {suggestion.scenarios.map((scenario, sIdx) => (
                    <div
                      key={sIdx}
                      className={cn(neuSurfaceInsetClass, 'rounded-lg p-4 font-mono text-sm leading-relaxed text-base-content transition-all hover:shadow-[var(--leve-neu-hover)]')}
                    >
                      {scenario}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* QA Improvements */}
      <div className="mb-6">
        <SectionHeader
          title="Melhorias de QA"
          icon="✨"
          count={analysis.qaImprovements.length}
          sectionKey="qaImprovements"
        />
        {expandedSections.has('qaImprovements') && (
          <div className="mt-4 space-y-3">
            {analysis.qaImprovements.map((improvement, idx) => (
              <div
                key={idx}
                className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-3 hover:bg-primary/15 hover:border-primary/30 transition-all"
              >
                <span className="text-primary mt-0.5 text-xl">💡</span>
                <p className="text-base-content text-base flex-1 leading-relaxed">{improvement}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outdated indicator */}
      {contentStale && (
        <div className="mt-4 p-4 bg-warning/10 border border-warning/30 rounded-xl animate-pulse">
          <p className="text-sm text-warning flex items-center gap-2">
            <span>⚠️</span>
            Esta análise pode estar desatualizada. Execute uma nova análise para obter resultados
            atualizados.
          </p>
        </div>
      )}
    </div>
  );
};
