
import React, { useMemo } from 'react';
import { Project } from '../../types';
import { Card } from '../common/Card';

export const TestPyramidCard: React.FC<{ project: Project; }> = ({ project }) => {
    const pyramidLevels: Array<'E2E' | 'Integração' | 'Unitário'> = ['E2E', 'Integração', 'Unitário'];
    const analysisMap = useMemo(() => {
        if (!project.testPyramidAnalysis) return null;
        return new Map(project.testPyramidAnalysis.distribution.map(d => [d.level, d]));
    }, [project.testPyramidAnalysis]);

    return (
        <Card className="mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">Análise da Pirâmide de Testes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Responsive Pyramid Visualization */}
                <div className="flex flex-col items-center justify-center min-h-[200px] w-full max-w-sm mx-auto">
                    <div className="w-full">
                        {pyramidLevels.map((level, index) => {
                             const widthPercentage = 90 - index * 25; // 90%, 65%, 40%
                             return (
                                <div
                                    key={level}
                                    style={{ width: `${widthPercentage}%` }}
                                    className="bg-gray-700 mx-auto text-center py-2 sm:py-3 text-sm sm:text-base font-bold text-white mb-px rounded-t-sm"
                                >
                                    {level} {analysisMap?.get(level)?.effort && `(${analysisMap.get(level)?.effort})`}
                                </div>
                             );
                        })}
                    </div>
                     <div className="flex justify-between w-full px-2 mt-4 text-center text-xs text-gray-400">
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
                            {pyramidLevels.map(levelName => {
                                const levelData = analysisMap?.get(levelName);
                                if (!levelData) return null;
                                return (
                                    <div key={levelData.level}>
                                        <h5 className="font-semibold text-white">{levelData.level} ({levelData.effort})</h5>
                                        <ul className="list-disc list-inside text-gray-400 text-sm mt-1 space-y-1">
                                            {levelData.examples.map((ex, i) => <li key={i}>{ex}</li>)}
                                        </ul>
                                    </div>
                                );
                            })}
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