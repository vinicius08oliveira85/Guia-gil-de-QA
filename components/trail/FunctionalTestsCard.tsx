import React, { useMemo } from 'react';
import { JiraTask } from '../../types';
import { windows12Styles } from '../../utils/windows12Styles';

interface FunctionalTestsCardProps {
    versionLabel: string;
    tasks: JiraTask[];
    totalTestCases: number;
    executedTestCases: number;
    passedTestCases: number;
}

const formatPercent = (value: number) => `${Math.round(value)}%`;

export const FunctionalTestsCard: React.FC<FunctionalTestsCardProps> = ({
    versionLabel,
    tasks,
    totalTestCases,
    executedTestCases,
    passedTestCases
}) => {
    const failedTestCases = Math.max(executedTestCases - passedTestCases, 0);
    const notRunTestCases = Math.max(totalTestCases - executedTestCases, 0);

    const executionRate = totalTestCases > 0 ? (executedTestCases / totalTestCases) * 100 : 0;
    const passRate = executedTestCases > 0 ? (passedTestCases / executedTestCases) * 100 : 0;

    const tasksWithoutTests = useMemo(() => {
        return tasks
            .filter(task => task.type !== 'Bug' && (!task.testCases || task.testCases.length === 0))
            .slice(0, 3);
    }, [tasks]);

    const tasksWithFailures = useMemo(() => {
        return tasks
            .filter(task => (task.testCases || []).some(test => test.status === 'Failed'))
            .slice(0, 3);
    }, [tasks]);

    return (
        <section className={`${windows12Styles.card} ${windows12Styles.spacing.lg} space-y-5`}>
            <header>
                <p className="text-xs uppercase tracking-[0.35em] text-text-secondary">Bloco 3</p>
                <h3 className="text-xl font-semibold text-text-primary">Testes Funcionais</h3>
                <p className="text-sm text-text-secondary mt-1">
                    Execução e qualidade dos testes funcionais para {versionLabel}.
                </p>
            </header>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-2xl glass-surface p-4 text-center">
                    <p className="data-label">Casos totais</p>
                    <p className="data-value mt-1 text-2xl">{totalTestCases}</p>
                </div>
                <div className="rounded-2xl glass-surface p-4 text-center">
                    <p className="data-label">Executados</p>
                    <p className="data-value mt-1 text-2xl text-accent">{executedTestCases}</p>
                    <p className="text-xs text-text-secondary mt-1">{formatPercent(executionRate)} executados</p>
                </div>
                <div className="rounded-2xl glass-surface p-4 text-center">
                    <p className="data-label">Falhas</p>
                    <p className="data-value mt-1 text-2xl text-amber-300">{failedTestCases}</p>
                    <p className="text-xs text-text-secondary mt-1">
                        {failedTestCases > 0 ? `${Math.round((failedTestCases / Math.max(executedTestCases, 1)) * 100)}% dos executados` : 'Tudo passando'}
                    </p>
                </div>
                <div className="rounded-2xl glass-surface p-4 text-center">
                    <p className="data-label">Pendentes</p>
                    <p className="data-value mt-1 text-2xl text-text-primary">{notRunTestCases}</p>
                    <p className="text-xs text-text-secondary mt-1">
                        {notRunTestCases > 0 ? 'Ainda não executados' : 'Execução completa'}
                    </p>
                </div>
            </div>

            <div className="rounded-2xl glass-surface glass-surface--tint p-4">
                <p className="text-xs uppercase tracking-[0.35em] text-text-secondary">Taxa de aprovação</p>
                <div className="mt-3">
                    <div className="flex items-center justify-between text-sm text-text-secondary">
                        <span>Progresso</span>
                        <span>{formatPercent(executionRate)}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-surface-contrast">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-400"
                            style={{ width: `${executionRate}%` }}
                        />
                    </div>
                </div>
                <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-text-secondary">
                        <span>Aprovação</span>
                        <span>{formatPercent(passRate)}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-surface-contrast">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500"
                            style={{ width: `${passRate}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-2xl glass-surface p-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-text-secondary mb-2">Cobertura pendente</p>
                    {tasksWithoutTests.length === 0 ? (
                        <p className="text-sm text-text-secondary">Todas as histórias possuem casos de teste.</p>
                    ) : (
                        <ul className="space-y-2 text-sm text-text-primary">
                            {tasksWithoutTests.map(task => (
                                <li key={task.id} className="flex items-start gap-2">
                                    <span>•</span>
                                    <span>{task.title}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="rounded-2xl glass-surface p-4">
                    <p className="text-xs uppercase tracking-[0.35em] text-text-secondary mb-2">Falhas em atenção</p>
                    {tasksWithFailures.length === 0 ? (
                        <p className="text-sm text-text-secondary">Nenhuma falha registrada nos testes executados.</p>
                    ) : (
                        <ul className="space-y-2 text-sm text-text-primary">
                            {tasksWithFailures.map(task => (
                                <li key={task.id} className="flex items-start gap-2">
                                    <span>⚠️</span>
                                    <span>{task.title}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </section>
    );
};

