import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

interface DocumentMetricsCardProps {
    documentMetrics: {
        total: number;
        byCategory: Record<string, number>;
        withAnalysis: number;
        recent: number;
        linkedToTasks: number;
    };
}

const categoryLabels: Record<string, { label: string; icon: string; color: string }> = {
    requisitos: { label: 'Requisitos', icon: '📋', color: 'blue' },
    testes: { label: 'Testes', icon: '🧪', color: 'green' },
    arquitetura: { label: 'Arquitetura', icon: '🏗️', color: 'purple' },
    outros: { label: 'Outros', icon: '📄', color: 'gray' },
};

export const DocumentMetricsCard: React.FC<DocumentMetricsCardProps> = ({ documentMetrics }) => {
    return (
        <Card className="p-5 space-y-4 border border-base-300 hover:border-primary/30 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-base-content">Métricas de Documentos</h3>
            </div>

            {/* Total de Documentos */}
            <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-base-200 border border-base-300">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">📄</span>
                        <span className="text-sm font-semibold text-base-content/70">Total</span>
                    </div>
                    <p className="text-2xl font-bold text-base-content">{documentMetrics.total}</p>
                </div>

                <div className="p-4 rounded-xl bg-base-200 border border-base-300">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🤖</span>
                        <span className="text-sm font-semibold text-base-content/70">Com Análise IA</span>
                    </div>
                    <p className="text-2xl font-bold text-base-content">{documentMetrics.withAnalysis}</p>
                </div>
            </div>

            {/* Distribuição por Categoria */}
            <div>
                <h4 className="text-sm font-semibold text-base-content/70 mb-3">Por Categoria</h4>
                <div className="grid grid-cols-2 gap-2">
                    {Object.entries(documentMetrics.byCategory).map(([category, count]) => {
                        const categoryInfo = categoryLabels[category] || categoryLabels.outros;
                        return (
                            <div
                                key={category}
                                className="flex items-center justify-between p-3 rounded-xl bg-base-200 border border-base-300"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{categoryInfo.icon}</span>
                                    <span className="text-sm text-base-content">{categoryInfo.label}</span>
                                </div>
                                <Badge variant="default" size="sm">
                                    {count}
                                </Badge>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Estatísticas Adicionais */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-base-300">
                <div>
                    <p className="text-xs text-base-content/60 mb-1">Vinculados a Tarefas</p>
                    <p className="text-lg font-semibold text-base-content">{documentMetrics.linkedToTasks}</p>
                </div>
                <div>
                    <p className="text-xs text-base-content/60 mb-1">Recentes (7 dias)</p>
                    <p className="text-lg font-semibold text-base-content">{documentMetrics.recent}</p>
                </div>
            </div>
        </Card>
    );
};

