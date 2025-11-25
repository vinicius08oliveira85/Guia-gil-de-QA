import React from 'react';
import { windows12Styles } from '../../utils/windows12Styles';

interface CoverageMetricsCardProps {
    versionLabel: string;
    testCoverage: number;
    automationRatio: number;
    tasksWithTestCases: number;
    totalTasks: number;
    totalTestCases: number;
    automatedTestCases: number;
}

export const CoverageMetricsCard: React.FC<CoverageMetricsCardProps> = ({
    versionLabel,
    testCoverage,
    automationRatio,
    tasksWithTestCases,
    totalTasks,
    totalTestCases,
    automatedTestCases
}) => {
    const documentedPercentage = totalTasks > 0 ? Math.round((tasksWithTestCases / totalTasks) * 100) : 0;
    const automationInfo = totalTestCases > 0 ? `${automatedTestCases}/${totalTestCases}` : '0/0';

    return (
        <section className={`${windows12Styles.card} ${windows12Styles.spacing.lg} space-y-5`}>
            <header>
                <p className="text-xs uppercase tracking-[0.35em] text-text-secondary">Bloco 4</p>
                <h3 className="text-xl font-semibold text-text-primary">Métricas de Cobertura</h3>
                <p className="text-sm text-text-secondary mt-1">
                    Visão de documentação e automação para {versionLabel}.
                </p>
            </header>

            <div className="space-y-4">
                <div>
                    <div className="flex items-center justify-between text-sm text-text-secondary">
                        <span>Stories com testes</span>
                        <span>{documentedPercentage}%</span>
                    </div>
                    <div className="mt-2 h-3 rounded-full bg-surface-contrast">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-sky-400 to-accent"
                            style={{ width: `${documentedPercentage}%` }}
                        />
                    </div>
                    <p className="mt-1 text-xs text-text-secondary">
                        {tasksWithTestCases}/{totalTasks || 0} histórias documentadas
                    </p>
                </div>

                <div>
                    <div className="flex items-center justify-between text-sm text-text-secondary">
                        <span>Automação disponível</span>
                        <span>{automationRatio}%</span>
                    </div>
                    <div className="mt-2 h-3 rounded-full bg-surface-contrast">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-400 to-fuchsia-500"
                            style={{ width: `${automationRatio}%` }}
                        />
                    </div>
                    <p className="mt-1 text-xs text-text-secondary">
                        {automationInfo} casos automatizados
                    </p>
                </div>

                <div>
                    <div className="flex items-center justify-between text-sm text-text-secondary">
                        <span>Cobertura planejada</span>
                        <span>{testCoverage}%</span>
                    </div>
                    <div className="mt-2 h-3 rounded-full bg-surface-contrast">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500"
                            style={{ width: `${testCoverage}%` }}
                        />
                    </div>
                    <p className="mt-1 text-xs text-text-secondary">
                        Representa tarefas com casos de teste vinculados.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-2xl glass-surface glass-surface--tint p-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-text-secondary">Quando investigar</p>
                    <ul className="mt-2 space-y-1 text-sm text-text-primary">
                        <li>• Cobertura &lt; 70% indica riscos funcionais.</li>
                        <li>• Automação &lt; 30% aumenta tempo de regressão.</li>
                    </ul>
                </div>
                <div className="rounded-2xl glass-surface glass-surface--tint p-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-text-secondary">Próximas ações</p>
                    <ul className="mt-2 space-y-1 text-sm text-text-primary">
                        <li>• Priorizar histórias sem casos documentados.</li>
                        <li>• Mapear candidatos à automação no backlog.</li>
                    </ul>
                </div>
            </div>
        </section>
    );
};

