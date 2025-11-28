import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

interface TestExecutionCardProps {
    testExecution: {
        passed: number;
        failed: number;
        notRun: number;
        blocked: number;
        passRate: number;
        distribution: Array<{ status: string; count: number; percentage: number }>;
    };
    totalTestCases: number;
}

const testStatusConfig: Record<string, { label: string; icon: string; color: string; bgColor: string }> = {
    'Passed': { label: 'Aprovados', icon: '✅', color: 'text-success', bgColor: 'bg-success/10' },
    'Failed': { label: 'Falharam', icon: '❌', color: 'text-danger', bgColor: 'bg-danger/10' },
    'Not Run': { label: 'Não Executados', icon: '⏸️', color: 'text-text-secondary', bgColor: 'bg-surface-hover' },
    'Blocked': { label: 'Bloqueados', icon: '🚫', color: 'text-warning-dark', bgColor: 'bg-warning/10' },
};

export const TestExecutionCard: React.FC<TestExecutionCardProps> = ({ testExecution, totalTestCases }) => {
    const getPassRateColor = (rate: number): string => {
        if (rate >= 80) return 'text-success';
        if (rate >= 60) return 'text-warning-dark';
        return 'text-danger';
    };

    const getPassRateBgColor = (rate: number): string => {
        if (rate >= 80) return 'bg-success/10';
        if (rate >= 60) return 'bg-warning/10';
        return 'bg-danger/10';
    };

    return (
        <Card>
            <div className="space-y-md">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-text-primary">Execução de Testes</h3>
                    <Badge variant="info" size="sm">
                        {totalTestCases} total
                    </Badge>
                </div>

                {/* Taxa de Sucesso */}
                <div className={`p-3 rounded-xl ${getPassRateBgColor(testExecution.passRate)}`}>
                    <div className="flex items-center justify-between mb-sm">
                        <span className="text-sm font-semibold text-text-secondary">Taxa de Sucesso</span>
                        <span className={`text-2xl font-bold ${getPassRateColor(testExecution.passRate)}`}>
                            {testExecution.passRate}%
                        </span>
                    </div>
                    <div className="w-full h-3 bg-surface-hover rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-300 ${
                                testExecution.passRate >= 80 ? 'bg-success' :
                                testExecution.passRate >= 60 ? 'bg-warning-dark' :
                                'bg-danger'
                            }`}
                            style={{ width: `${testExecution.passRate}%` }}
                        />
                    </div>
                </div>

                {/* Distribuição por Status */}
                <div className="space-y-sm">
                    {testExecution.distribution.map((item) => {
                        const config = testStatusConfig[item.status] || testStatusConfig['Not Run'];
                        return (
                            <div key={item.status} className="space-y-xs">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-sm">
                                        <span className="text-lg">{config.icon}</span>
                                        <span className="text-sm font-medium text-text-primary">{config.label}</span>
                                    </div>
                                    <div className="flex items-center gap-sm">
                                        <span className="text-sm font-semibold text-text-primary">{item.count}</span>
                                        <span className="text-xs text-text-tertiary">({item.percentage}%)</span>
                                    </div>
                                </div>
                                <div className="w-full h-2 bg-surface-hover rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${config.bgColor} transition-all duration-300`}
                                        style={{ width: `${item.percentage}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Resumo Rápido */}
                <div className="grid grid-cols-2 gap-sm pt-sm border-t border-surface-border">
                    <div className="text-center p-2 rounded-xl bg-success/10">
                        <p className="text-xs text-text-tertiary mb-xs">Aprovados</p>
                        <p className="text-xl font-bold text-success">{testExecution.passed}</p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-danger/10">
                        <p className="text-xs text-text-tertiary mb-xs">Falharam</p>
                        <p className="text-xl font-bold text-danger">{testExecution.failed}</p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

