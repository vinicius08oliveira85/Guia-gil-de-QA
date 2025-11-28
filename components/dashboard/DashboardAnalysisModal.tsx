import React from 'react';
import { DashboardOverviewAnalysis, DashboardRequirementsAnalysis } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Spinner } from '../common/Spinner';

interface DashboardAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'overview' | 'requirements';
    analysis: DashboardOverviewAnalysis | DashboardRequirementsAnalysis | null;
    isLoading: boolean;
    onRegenerate?: () => void;
}

export const DashboardAnalysisModal: React.FC<DashboardAnalysisModalProps> = ({
    isOpen,
    onClose,
    type,
    analysis,
    isLoading,
    onRegenerate,
}) => {
    const isOutdated = analysis?.isOutdated || false;
    const generatedAt = analysis?.generatedAt 
        ? new Date(analysis.generatedAt).toLocaleString('pt-BR')
        : null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center justify-between w-full">
                    <span>
                        {type === 'overview' ? 'Análise IA - Visão Geral' : 'Análise IA - Requisitos'}
                    </span>
                    {isOutdated && (
                        <Badge variant="warning" size="sm">
                            Desatualizada
                        </Badge>
                    )}
                </div>
            }
            size="xl"
            maxHeight="85vh"
        >
            <div className="space-y-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Spinner />
                        <p className="mt-4 text-text-secondary">
                            Gerando análise com IA...
                        </p>
                    </div>
                ) : analysis ? (
                    <>
                        {type === 'overview' ? (
                            <OverviewAnalysisContent 
                                analysis={analysis as DashboardOverviewAnalysis}
                            />
                        ) : (
                            <RequirementsAnalysisContent 
                                analysis={analysis as DashboardRequirementsAnalysis}
                            />
                        )}
                        
                        <div className="flex items-center justify-between pt-4 border-t border-surface-border">
                            <p className="text-xs text-text-tertiary">
                                {generatedAt && `Gerada em: ${generatedAt}`}
                            </p>
                            {onRegenerate && (
                                <button
                                    onClick={onRegenerate}
                                    className="px-4 py-2 text-sm rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                                >
                                    Regenerar Análise
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12 text-text-secondary">
                        <p>Nenhuma análise disponível.</p>
                        {onRegenerate && (
                            <button
                                onClick={onRegenerate}
                                className="mt-4 px-4 py-2 rounded-xl bg-accent text-white hover:bg-accent-light transition-colors"
                            >
                                Gerar Análise
                            </button>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};

const OverviewAnalysisContent: React.FC<{ analysis: DashboardOverviewAnalysis }> = ({ analysis }) => {
    return (
        <div className="space-y-6">
            {/* Resumo Executivo */}
            <section>
                <h3 className="text-lg font-semibold text-text-primary mb-3">Resumo Executivo</h3>
                <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                    {analysis.summary}
                </p>
            </section>

            {/* Fase Atual */}
            <section>
                <h3 className="text-lg font-semibold text-text-primary mb-3">Análise da Fase Atual</h3>
                <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                    {analysis.currentPhase}
                </p>
            </section>

            {/* Métricas */}
            <section>
                <h3 className="text-lg font-semibold text-text-primary mb-3">Análise de Métricas</h3>
                <p className="text-sm text-text-primary leading-relaxed mb-4 whitespace-pre-wrap">
                    {analysis.metrics.analysis}
                </p>
                
                {analysis.metrics.strengths.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-success mb-2">Pontos Fortes</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-text-primary">
                            {analysis.metrics.strengths.map((strength, idx) => (
                                <li key={idx}>{strength}</li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {analysis.metrics.weaknesses.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-warning-dark mb-2">Pontos Fracos</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-text-primary">
                            {analysis.metrics.weaknesses.map((weakness, idx) => (
                                <li key={idx}>{weakness}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </section>

            {/* Riscos */}
            {analysis.risks.length > 0 && (
                <section>
                    <h3 className="text-lg font-semibold text-text-primary mb-3">Riscos Identificados</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-text-primary">
                        {analysis.risks.map((risk, idx) => (
                            <li key={idx}>{risk}</li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Recomendações */}
            {analysis.recommendations.length > 0 && (
                <section>
                    <h3 className="text-lg font-semibold text-text-primary mb-3">Recomendações</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-text-primary">
                        {analysis.recommendations.map((recommendation, idx) => (
                            <li key={idx}>{recommendation}</li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
};

const RequirementsAnalysisContent: React.FC<{ analysis: DashboardRequirementsAnalysis }> = ({ analysis }) => {
    return (
        <div className="space-y-6">
            {/* Resumo Executivo */}
            <section>
                <h3 className="text-lg font-semibold text-text-primary mb-3">Resumo Executivo</h3>
                <p className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                    {analysis.summary}
                </p>
            </section>

            {/* Cobertura RTM */}
            <section>
                <h3 className="text-lg font-semibold text-text-primary mb-3">
                    Análise de Cobertura RTM
                </h3>
                <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-text-secondary">Cobertura:</span>
                        <Badge 
                            variant={
                                analysis.coverage.percentage >= 80 ? 'success' :
                                analysis.coverage.percentage >= 50 ? 'warning' :
                                'error'
                            }
                            size="sm"
                        >
                            {analysis.coverage.percentage}%
                        </Badge>
                    </div>
                </div>
                <p className="text-sm text-text-primary leading-relaxed mb-4 whitespace-pre-wrap">
                    {analysis.coverage.analysis}
                </p>
                
                {analysis.coverage.gaps.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-warning-dark mb-2">Gaps de Cobertura</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-text-primary">
                            {analysis.coverage.gaps.map((gap, idx) => (
                                <li key={idx}>{gap}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </section>

            {/* Qualidade */}
            <section>
                <h3 className="text-lg font-semibold text-text-primary mb-3">Análise de Qualidade</h3>
                <p className="text-sm text-text-primary leading-relaxed mb-4 whitespace-pre-wrap">
                    {analysis.quality.analysis}
                </p>
                
                {analysis.quality.strengths.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-success mb-2">Pontos Fortes</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-text-primary">
                            {analysis.quality.strengths.map((strength, idx) => (
                                <li key={idx}>{strength}</li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {analysis.quality.issues.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-danger mb-2">Problemas Identificados</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-text-primary">
                            {analysis.quality.issues.map((issue, idx) => (
                                <li key={idx}>{issue}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </section>

            {/* Gaps */}
            {analysis.gaps.length > 0 && (
                <section>
                    <h3 className="text-lg font-semibold text-text-primary mb-3">Gaps Identificados</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-text-primary">
                        {analysis.gaps.map((gap, idx) => (
                            <li key={idx}>{gap}</li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Inconsistências */}
            {analysis.inconsistencies.length > 0 && (
                <section>
                    <h3 className="text-lg font-semibold text-text-primary mb-3">Inconsistências</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-text-primary">
                        {analysis.inconsistencies.map((inconsistency, idx) => (
                            <li key={idx}>{inconsistency}</li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Sugestões */}
            {analysis.suggestions.length > 0 && (
                <section>
                    <h3 className="text-lg font-semibold text-text-primary mb-3">Sugestões de Melhoria</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-text-primary">
                        {analysis.suggestions.map((suggestion, idx) => (
                            <li key={idx}>{suggestion}</li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
};

