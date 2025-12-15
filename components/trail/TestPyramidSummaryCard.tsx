import React, { useMemo } from 'react';
import { Project, TestPyramidLevel } from '../../types';

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
        <section className="space-y-5 rounded-[var(--rounded-box)] border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
            <header>
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-base-content/60">Bloco 2</p>
                <h3 className="text-xl font-semibold text-base-content">Pirâmide de Testes</h3>
                <p className="mt-1 break-words text-sm text-base-content/70">
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
                                    className="mx-auto mb-1 rounded-t-md border border-base-300 bg-base-200 px-3 py-2 text-center text-sm font-semibold text-base-content shadow-sm"
                                >
                                    {level}
                                    {levelData?.effort && (
                                        <span className="ml-1 text-xs text-base-content/70">({levelData.effort})</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-3 flex w-full max-w-xs justify-between text-[11px] text-base-content/60">
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
                                    className="min-w-0 rounded-2xl border border-base-300 bg-base-200 p-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <p className="break-words text-sm font-semibold text-base-content">
                                            {data.level} • foco {data.effort}
                                        </p>
                                        <span className="text-xs text-base-content/70">
                                            {data.examples.length} recomendações
                                        </span>
                                    </div>
                                    <ul className="mt-2 space-y-1 break-words text-sm leading-relaxed text-base-content/70">
                                        {data.examples.slice(0, 2).map((example, idx) => (
                                            <li key={`${data.level}-${idx}`} className="flex items-start gap-2 break-words">
                                                <span>•</span>
                                                <span>{example}</span>
                                            </li>
                                        ))}
                                        {data.examples.length > 2 && (
                                            <li className="break-words text-xs text-primary">
                                                +{data.examples.length - 2} exemplos adicionais
                                            </li>
                                        )}
                                    </ul>
                                </div>
                            );
                        })
                    ) : (
                        <div className="rounded-2xl border border-base-300 bg-base-200 p-6 text-center text-sm text-base-content/70 break-words">
                            <p>Sem análise disponível. Gere recomendações de IA para visualizar a pirâmide de testes.</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

