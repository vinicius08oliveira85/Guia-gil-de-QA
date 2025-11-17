
import React, { useMemo } from 'react';
import { Project } from '../../types';
import { Card } from '../common/Card';

export const TestPyramidCard: React.FC<{ project: Project; }> = ({ project }) => {
    const pyramidLevels = ['E2E', 'Integração', 'Unitário'];
    const analysisMap = useMemo(() => {
        if (!project.testPyramidAnalysis) return null;
        return new Map(project.testPyramidAnalysis.distribution.map(d => [d.level, d]));
    }, [project.testPyramidAnalysis]);

    return (
        <Card className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">Análise da Pirâmide de Testes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col items-center justify-center">
                    {pyramidLevels.map((level, index) => (
                        <div key={level} className="w-full flex flex-col items-center">
                            <div className={`bg-gray-700 w-${10 - index*2}/12 min-w-[120px] text-center py-3 font-bold text-white`}>
                                {level} {analysisMap?.get(level as any)?.effort && `(${analysisMap.get(level as any)?.effort})`}
                            </div>
                            {index < pyramidLevels.length - 1 && <div className="bg-gray-700 h-1 w-0"></div>}
                        </div>
                    ))}
                     <div className="flex justify-between w-full mt-4 text-center text-xs text-gray-400">
                        <div>
                            <p>Mais Lento</p>
                            <p>Mais Caro</p>
                        </div>
                        <div>
                            <p>Mais Rápido</p>
                            <p>Mais Barato</p>
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className="font-bold text-teal-400 mb-2">Exemplos e Recomendações da IA</h4>
                    {project.testPyramidAnalysis ? (
                        <div className="space-y-4">
                            {project.testPyramidAnalysis.distribution.map(levelData => (
                                <div key={levelData.level}>
                                    <h5 className="font-semibold text-white">{levelData.level} ({levelData.effort})</h5>
                                    <ul className="list-disc list-inside text-gray-400 text-sm mt-1 space-y-1">
                                        {levelData.examples.map((ex, i) => <li key={i}>{ex}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full bg-gray-900/50 rounded-lg">
                           <p className="text-gray-500">Análise da IA pendente...</p>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};
