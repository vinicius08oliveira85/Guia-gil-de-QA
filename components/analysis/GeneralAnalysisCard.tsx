import React, { useState } from 'react';
import { GeneralIAAnalysis } from '../../types';
import { format } from 'date-fns';
import { windows12Styles, getRiskStyle } from '../../utils/windows12Styles';

interface GeneralAnalysisCardProps {
  analysis: GeneralIAAnalysis;
  onRefresh?: () => void;
}

export const GeneralAnalysisCard: React.FC<GeneralAnalysisCardProps> = ({ 
  analysis, 
  onRefresh 
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['summary']));

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

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Crítico': return 'text-red-400 bg-red-400/20 border-red-400/30';
      case 'Alto': return 'text-orange-400 bg-orange-400/20 border-orange-400/30';
      case 'Médio': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      case 'Baixo': return 'text-green-400 bg-green-400/20 border-green-400/30';
      default: return 'text-text-secondary bg-surface-hover border-surface-border';
    }
  };

  const SectionHeader: React.FC<{ 
    title: string; 
    icon: string; 
    count?: number;
    sectionKey: string;
  }> = ({ title, icon, count, sectionKey }) => (
    <button
      onClick={() => toggleSection(sectionKey)}
      className={`
        w-full flex items-center justify-between p-4
        hover:bg-surface-hover rounded-lg
        ${windows12Styles.transition.fast}
      `}
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <span className="font-semibold text-text-primary text-lg">{title}</span>
        {count !== undefined && (
          <span className="px-3 py-1 text-sm rounded-full bg-accent/20 text-accent-light">
            {count}
          </span>
        )}
      </div>
      <svg
        className={`
          w-5 h-5 text-text-secondary
          ${windows12Styles.transition.normal}
          ${expandedSections.has(sectionKey) ? 'rotate-180' : ''}
        `}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );

  return (
    <div className={`
      ${windows12Styles.card}
      ${windows12Styles.spacing.lg}
      ${windows12Styles.glow('accent')}
      shadow-xl
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="heading-section text-text-primary mb-2">Análise Geral IA</h3>
          <p className="text-sm text-text-secondary">
            Gerada em {format(new Date(analysis.generatedAt), "dd/MM/yyyy 'às' HH:mm")}
          </p>
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className={`
              p-2 rounded-lg hover:bg-surface-hover
              ${windows12Styles.transition.fast}
            `}
            title="Atualizar análise"
            aria-label="Atualizar análise geral"
          >
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        )}
      </div>

      {/* Risk Badge */}
      <div className={`
        mb-6 p-5 rounded-xl border-2
        ${getRiskStyle(analysis.riskCalculation.overallRisk as any)}
        ${windows12Styles.glow(analysis.riskCalculation.overallRisk === 'Crítico' ? 'red' : analysis.riskCalculation.overallRisk === 'Alto' ? 'yellow' : 'accent')}
        ${windows12Styles.transition.normal}
      `} role="alert" aria-live="polite">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold mb-2 uppercase tracking-wide">Risco Geral do Projeto</p>
            <p className="text-2xl font-bold mb-1">{analysis.riskCalculation.overallRisk}</p>
            <p className="text-sm opacity-80">
              Score: {analysis.riskCalculation.riskScore}/100
            </p>
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
          <div className={`
            mt-4 p-6 bg-surface-hover rounded-lg border border-surface-border
            ${windows12Styles.transition.normal}
            hover:border-accent/30
          `}>
            <p className="text-text-primary whitespace-pre-wrap leading-relaxed text-base">
              {analysis.summary}
            </p>
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
                className={`
                  p-4 bg-red-400/10 border border-red-400/20 rounded-lg
                  ${windows12Styles.transition.fast}
                  hover:bg-red-400/15 hover:border-red-400/30
                `}
              >
                <p className="text-text-primary text-base leading-relaxed">{problem}</p>
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
                className={`
                  p-4 rounded-lg border
                  ${factor.impact === 'Alto' ? 'bg-red-400/10 border-red-400/20' :
                  factor.impact === 'Médio' ? 'bg-orange-400/10 border-orange-400/20' :
                  'bg-yellow-400/10 border-yellow-400/20'}
                  ${windows12Styles.transition.fast}
                  hover:opacity-90
                `}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-text-primary text-base">{factor.factor}</p>
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    factor.impact === 'Alto' ? 'bg-red-400/20 text-red-400' :
                    factor.impact === 'Médio' ? 'bg-orange-400/20 text-orange-400' :
                    'bg-yellow-400/20 text-yellow-400'
                  }`}>
                    {factor.impact}
                  </span>
                </div>
                <p className="text-base text-text-secondary leading-relaxed">{factor.description}</p>
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
                className={`
                  p-4 bg-surface-hover border border-surface-border rounded-lg
                  flex items-start gap-3
                  ${windows12Styles.transition.fast}
                  hover:border-yellow-400/30 hover:bg-yellow-400/5
                `}
              >
                <span className="text-yellow-400 mt-0.5 text-xl">⚠️</span>
                <p className="text-text-primary text-base flex-1 leading-relaxed">{item}</p>
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
              <div
                key={idx}
                className="p-5 bg-surface-hover border border-surface-border rounded-lg"
              >
                <p className="font-semibold text-text-primary mb-3 text-lg">{suggestion.taskTitle}</p>
                <div className="space-y-2">
                  {suggestion.scenarios.map((scenario, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-3 bg-surface rounded border border-surface-border text-base text-text-secondary font-mono leading-relaxed"
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
                className={`
                  p-4 bg-accent/10 border border-accent/20 rounded-lg
                  flex items-start gap-3
                  ${windows12Styles.transition.fast}
                  hover:bg-accent/15 hover:border-accent/30
                `}
              >
                <span className="text-accent-light mt-0.5 text-xl">💡</span>
                <p className="text-text-primary text-base flex-1 leading-relaxed">{improvement}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outdated indicator */}
      {analysis.isOutdated && (
        <div className={`
          mt-4 p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-lg
          ${windows12Styles.transition.normal}
          ${windows12Styles.glow('yellow')}
          animate-pulse
        `}>
          <p className="text-sm text-yellow-400 flex items-center gap-2">
            <span>⚠️</span>
            Esta análise pode estar desatualizada. Execute uma nova análise para obter resultados atualizados.
          </p>
        </div>
      )}
    </div>
  );
};

