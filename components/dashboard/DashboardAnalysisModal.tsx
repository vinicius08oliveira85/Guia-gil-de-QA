import React from 'react';
import { DashboardOverviewAnalysis } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Spinner } from '../common/Spinner';

interface DashboardAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    analysis: DashboardOverviewAnalysis | null;
    isLoading: boolean;
    onRegenerate?: () => void;
}

export const DashboardAnalysisModal: React.FC<DashboardAnalysisModalProps> = ({
    isOpen,
    onClose,
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
                    <span>Análise IA - Visão Geral</span>
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
                        <p className="mt-4 text-base-content/70">
                            Gerando análise com IA...
                        </p>
                    </div>
                ) : analysis ? (
                    <>
                        <OverviewAnalysisContent 
                            analysis={analysis as DashboardOverviewAnalysis}
                        />
                        
                        <div className="flex items-center justify-between pt-4 border-t border-base-300">
                            <p className="text-xs text-base-content/60">
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
                    <div className="text-center py-12 text-base-content/70">
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
                <h3 className="text-lg font-semibold text-base-content mb-3">Resumo Executivo</h3>
                <p className="text-sm text-base-content leading-relaxed whitespace-pre-wrap">
                    {analysis.summary}
                </p>
            </section>

            {/* Fase Atual */}
            <section>
                <h3 className="text-lg font-semibold text-base-content mb-3">Análise da Fase Atual</h3>
                <p className="text-sm text-base-content leading-relaxed whitespace-pre-wrap">
                    {analysis.currentPhase}
                </p>
            </section>

            {/* Métricas */}
            <section>
                <h3 className="text-lg font-semibold text-base-content mb-3">Análise de Métricas</h3>
                <p className="text-sm text-base-content leading-relaxed mb-4 whitespace-pre-wrap">
                    {analysis.metrics.analysis}
                </p>
                
                {analysis.metrics.strengths.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-success mb-2">Pontos Fortes</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-base-content">
                            {analysis.metrics.strengths.map((strength, idx) => (
                                <li key={idx}>{strength}</li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {analysis.metrics.weaknesses.length > 0 && (
                    <div>
                        <h4 className="text-sm font-semibold text-warning-dark mb-2">Pontos Fracos</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm text-base-content">
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
                    <h3 className="text-lg font-semibold text-base-content mb-3">Riscos Identificados</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-base-content">
                        {analysis.risks.map((risk, idx) => (
                            <li key={idx}>{risk}</li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Recomendações */}
            {analysis.recommendations.length > 0 && (
                <section>
                    <h3 className="text-lg font-semibold text-base-content mb-3">Recomendações</h3>
                    <ul className="list-disc list-inside space-y-2 text-sm text-base-content">
                        {analysis.recommendations.map((recommendation, idx) => (
                            <li key={idx}>{recommendation}</li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
};

