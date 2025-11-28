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
        <Card>
            <div className="space-y-md">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-text-primary">Métricas de Documentos</h3>
                </div>

                {/* Total de Documentos */}
                <div className="grid grid-cols-2 gap-md">
                    <div className="p-3 rounded-xl bg-surface-hover/50">
                        <div className="flex items-center gap-sm mb-sm">
                            <span className="text-2xl">📄</span>
                            <span className="text-sm font-semibold text-text-secondary">Total</span>
                        </div>
                        <p className="text-2xl font-bold text-text-primary">{documentMetrics.total}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-surface-hover/50">
                        <div className="flex items-center gap-sm mb-sm">
                            <span className="text-2xl">🤖</span>
                            <span className="text-sm font-semibold text-text-secondary">Com Análise IA</span>
                        </div>
                        <p className="text-2xl font-bold text-text-primary">{documentMetrics.withAnalysis}</p>
                    </div>
                </div>

                {/* Distribuição por Categoria */}
                <div>
                    <h4 className="text-sm font-semibold text-text-secondary mb-md">Por Categoria</h4>
                    <div className="grid grid-cols-2 gap-sm">
                        {Object.entries(documentMetrics.byCategory).map(([category, count]) => {
                            const categoryInfo = categoryLabels[category] || categoryLabels.outros;
                            return (
                                <div
                                    key={category}
                                    className="flex items-center justify-between p-2 rounded-xl bg-surface-hover/30"
                                >
                                    <div className="flex items-center gap-sm">
                                        <span className="text-lg">{categoryInfo.icon}</span>
                                        <span className="text-sm text-text-primary">{categoryInfo.label}</span>
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
                <div className="grid grid-cols-2 gap-md pt-sm border-t border-surface-border">
                    <div>
                        <p className="text-xs text-text-tertiary mb-xs">Vinculados a Tarefas</p>
                        <p className="text-lg font-semibold text-text-primary">{documentMetrics.linkedToTasks}</p>
                    </div>
                    <div>
                        <p className="text-xs text-text-tertiary mb-xs">Recentes (7 dias)</p>
                        <p className="text-lg font-semibold text-text-primary">{documentMetrics.recent}</p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

