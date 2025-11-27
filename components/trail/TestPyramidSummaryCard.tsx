import React, { useMemo } from 'react';
import { Project, TestPyramidLevel } from '../../types';
import { windows12Styles } from '../../utils/windows12Styles';

interface TestPyramidSummaryCardProps {
    project: Project;
    versionLabel: string;
}

const pyramidLevels: TestPyramidLevel['level'][] = ['Unitário', 'Integração', 'E2E'];

export const TestPyramidSummaryCard: React.FC<TestPyramidSummaryCardProps> = ({ project, versionLabel }) => {
    const analysisMap = useMemo(() => {
        if (!project.testPyramidAnalysis) {
            return null;
        }
        return new Map(project.testPyramidAnalysis.distribution.map(level => [level.level, level]));
    }, [project.testPyramidAnalysis]);

    return (
        <section className={`${windows12Styles.card} ${windows12Styles.spacing.lg} space-y-5`}>
            <header>
                <p className="text-xs uppercase tracking-[0.35em] text-text-secondary">Bloco 2</p>
                <h3 className="text-xl font-semibold text-text-primary">Pirâmide de Testes</h3>
                <p className="text-sm text-text-secondary mt-1 break-words">
                    Distribuição ideal de esforços de teste para {versionLabel}.
                </p>
            </header>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="flex flex-col items-center justify-center">
                    <div className="w-full max-w-xs">
                        {pyramidLevels.map((level, index) => {
                            const widthPercentage = 90 - index * 25;
                            const levelData = analysisMap?.get(level);
                            return (
                                <div
                                    key={level}
                                    style={{ width: `${widthPercentage}%` }}
                                    className="mx-auto mb-1 rounded-t-md bg-surface-contrast px-3 py-2 text-center text-sm font-semibold text-text-primary shadow"
                                >
                                    {level}
                                    {levelData?.effort && (
                                        <span className="ml-1 text-xs text-text-secondary">({levelData.effort})</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-3 flex w-full max-w-xs justify-between text-[11px] text-text-secondary">
                        <div>
                            <p>Mais lento</p>
                            <p>Mais caro</p>
                        </div>
                        <div className="text-right">
                            <p>Mais rápido</p>
                            <p>Mais barato</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-3 min-w-0">
                    {analysisMap ? (
                        pyramidLevels.map(level => {
                            const data = analysisMap.get(level);
                            if (!data) {
                                return null;
                            }
                            return (
                                <div
                                    key={level}
                                    className="rounded-2xl glass-surface glass-surface--tint p-4 min-w-0"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-text-primary break-words">
                                            {data.level} • foco {data.effort}
                                        </p>
                                        <span className="text-xs text-text-secondary">
                                            {data.examples.length} recomendações
                                        </span>
                                    </div>
                                    <ul className="mt-2 space-y-1 text-sm text-text-secondary leading-relaxed break-words">
                                        {data.examples.slice(0, 2).map((example, idx) => (
                                            <li key={`${data.level}-${idx}`} className="flex items-start gap-2 break-words">
                                                <span>•</span>
                                                <span>{example}</span>
                                            </li>
                                        ))}
                                        {data.examples.length > 2 && (
                                            <li className="text-xs text-accent break-words">
                                                +{data.examples.length - 2} exemplos adicionais
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            );
                        })
                    ) : (
                        <div className="rounded-2xl glass-surface p-6 text-center text-sm text-text-secondary break-words">
                            <p>Sem análise disponível. Gere recomendações de IA para visualizar a pirâmide de testes.</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

