import React from 'react';
import { RequirementAIAnalysis } from '../../types';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

interface RequirementAIAnalysisCardProps {
    analysis: RequirementAIAnalysis;
    onApplyImprovements?: (improvements: string[]) => void;
}

export const RequirementAIAnalysisCard: React.FC<RequirementAIAnalysisCardProps> = ({
    analysis,
    onApplyImprovements,
}) => {
    const getQualityColor = (score: number): 'success' | 'warning' | 'error' => {
        if (score >= 80) return 'success';
        if (score >= 60) return 'warning';
        return 'error';
    };

    const getQualityLabel = (score: number): string => {
        if (score >= 80) return 'Excelente';
        if (score >= 60) return 'Bom';
        if (score >= 40) return 'Regular';
        return 'Baixo';
    };

    return (
        <Card className="border-2 border-accent/30">
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-text-primary">
                        Análise de IA
                    </h3>
                    <div className="flex items-center gap-2">
                        <Badge variant={getQualityColor(analysis.qualityScore)} size="sm">
                            {analysis.qualityScore}% - {getQualityLabel(analysis.qualityScore)}
                        </Badge>
                    </div>
                </div>

                {/* Score de Qualidade */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-text-secondary">Score de Qualidade</span>
                        <span className="text-sm text-text-primary">{analysis.qualityScore}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-hover rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all ${
                                getQualityColor(analysis.qualityScore) === 'success' ? 'bg-success' :
                                getQualityColor(analysis.qualityScore) === 'warning' ? 'bg-warning-dark' :
                                'bg-danger'
                            }`}
                            style={{ width: `${analysis.qualityScore}%` }}
                        />
                    </div>
                </div>

                {/* Análises Detalhadas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-3 rounded-xl bg-surface-hover/50">
                        <h4 className="text-sm font-semibold text-text-primary mb-2">Completude</h4>
                        <p className="text-xs text-text-secondary leading-relaxed">
                            {analysis.completeness}
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-hover/50">
                        <h4 className="text-sm font-semibold text-text-primary mb-2">Clareza</h4>
                        <p className="text-xs text-text-secondary leading-relaxed">
                            {analysis.clarity}
                        </p>
                    </div>
                    <div className="p-3 rounded-xl bg-surface-hover/50">
                        <h4 className="text-sm font-semibold text-text-primary mb-2">Testabilidade</h4>
                        <p className="text-xs text-text-secondary leading-relaxed">
                            {analysis.testability}
                        </p>
                    </div>
                </div>

                {/* Melhorias Sugeridas */}
                {analysis.suggestedImprovements.length > 0 && (
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-text-primary">
                                Melhorias Sugeridas
                            </h4>
                            {onApplyImprovements && (
                                <button
                                    onClick={() => onApplyImprovements(analysis.suggestedImprovements)}
                                    className="text-xs px-3 py-1 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                                >
                                    Aplicar Todas
                                </button>
                            )}
                        </div>
                        <ul className="list-disc list-inside space-y-1 text-sm text-text-primary">
                            {analysis.suggestedImprovements.map((improvement, idx) => (
                                <li key={idx}>{improvement}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Gaps Detectados */}
                {analysis.detectedGaps.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-warning-dark mb-2">
                            Gaps Detectados
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-text-primary">
                            {analysis.detectedGaps.map((gap, idx) => (
                                <li key={idx}>{gap}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Timestamp */}
                <div className="pt-2 border-t border-surface-border">
                    <p className="text-xs text-text-tertiary">
                        Análise gerada em: {new Date(analysis.generatedAt).toLocaleString('pt-BR')}
                    </p>
                </div>
            </div>
        </Card>
    );
};

