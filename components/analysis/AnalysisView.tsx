import React, { useState, useCallback } from 'react';
import { Project } from '../../types';
import { generateProjectLifecyclePlan, generateShiftLeftAnalysis, generateTestPyramidAnalysis } from '../../services/geminiService';
import { Spinner } from '../common/Spinner';
import { ProjectLifecycleCard } from './ProjectLifecycleCard';
import { ShiftLeftCard } from './ShiftLeftCard';
import { TestPyramidCard } from './TestPyramidCard';
import { PhaseLogicGuideCard } from './PhaseLogicGuideCard';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { Modal } from '../common/Modal';

export const AnalysisView: React.FC<{ project: Project; onUpdateProject: (project: Project) => void; }> = ({ project, onUpdateProject }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [showLifecycleModal, setShowLifecycleModal] = useState(false);
    const [showShiftLeftModal, setShowShiftLeftModal] = useState(false);
    const [showPyramidModal, setShowPyramidModal] = useState(false);
    const { handleError, handleSuccess } = useErrorHandler();

    const handleAnalyzeAndUpdateDashboard = useCallback(async () => {
        setIsAnalyzing(true);
        try {
            const [lifecyclePlan, shiftLeft, testPyramid] = await Promise.all([
                generateProjectLifecyclePlan(project.name, project.description, project.tasks),
                generateShiftLeftAnalysis(project.name, project.description, project.tasks),
                generateTestPyramidAnalysis(project.name, project.description, project.tasks)
            ]);
    
            const updatedPhases = project.phases.map(phase => ({
                ...phase, 
                summary: lifecyclePlan[phase.name]?.summary || phase.summary,
                testTypes: lifecyclePlan[phase.name]?.testTypes || phase.testTypes
            }));
    
            const updatedProject: Project = {
                ...project,
                phases: updatedPhases,
                shiftLeftAnalysis: shiftLeft,
                testPyramidAnalysis: testPyramid,
            };
    
            onUpdateProject(updatedProject);
            handleSuccess('Análise do projeto concluída com sucesso!');
    
        } catch (error) {
            handleError(error, 'Analisar dashboard');
        } finally {
            setIsAnalyzing(false);
        }
    }, [project, onUpdateProject, handleError, handleSuccess]);

    return (
        <div>
            <div className="mica rounded-lg p-4 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-text-secondary text-center sm:text-left">Gere e atualize todas as análises estratégicas para o seu projeto com um único clique.</p>
                 <button onClick={handleAnalyzeAndUpdateDashboard} disabled={isAnalyzing} className="btn btn-primary w-full sm:w-auto sm:min-w-[240px] flex-shrink-0 disabled:bg-slate-600 disabled:cursor-not-allowed">
                    {isAnalyzing ? <Spinner small /> : 'Analisar Projeto com IA'}
                </button>
            </div>
            
            {/* Cards Compactos com Botões para Abrir Modais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {project.phases && (
                    <div className="mica rounded-lg p-4 border border-surface-border hover:border-accent/50 transition-colors cursor-pointer" onClick={() => setShowLifecycleModal(true)}>
                        <h3 className="text-lg font-bold text-text-primary mb-2">📊 Ciclo de Vida</h3>
                        <p className="text-sm text-text-secondary mb-3">Visualize o ciclo de vida do projeto e testes recomendados</p>
                        <button className="btn btn-secondary w-full text-sm">Ver Detalhes</button>
                    </div>
                )}
                
                <div className="mica rounded-lg p-4 border border-surface-border hover:border-accent/50 transition-colors cursor-pointer" onClick={() => setShowShiftLeftModal(true)}>
                    <h3 className="text-lg font-bold text-text-primary mb-2">⬅️ Shift Left</h3>
                    <p className="text-sm text-text-secondary mb-3">Análise de Shift Left Testing e recomendações</p>
                    <button className="btn btn-secondary w-full text-sm">Ver Detalhes</button>
                </div>
                
                <div className="mica rounded-lg p-4 border border-surface-border hover:border-accent/50 transition-colors cursor-pointer" onClick={() => setShowPyramidModal(true)}>
                    <h3 className="text-lg font-bold text-text-primary mb-2">🔺 Pirâmide de Testes</h3>
                    <p className="text-sm text-text-secondary mb-3">Análise da pirâmide de testes e distribuição</p>
                    <button className="btn btn-secondary w-full text-sm">Ver Detalhes</button>
                </div>
            </div>
            
            <PhaseLogicGuideCard />
            
            {/* Modais para Análises Detalhadas */}
            {project.phases && (
                <Modal 
                    isOpen={showLifecycleModal} 
                    onClose={() => setShowLifecycleModal(false)} 
                    title="Ciclo de Vida do Projeto (SDLC & DevOps)"
                    size="lg"
                    maxHeight="90vh"
                >
                    <ProjectLifecycleCard project={project} />
                </Modal>
            )}
            
            <Modal 
                isOpen={showShiftLeftModal} 
                onClose={() => setShowShiftLeftModal(false)} 
                title="Análise de Shift Left Testing"
                size="lg"
                maxHeight="90vh"
            >
                <ShiftLeftCard project={project} />
            </Modal>
            
            <Modal 
                isOpen={showPyramidModal} 
                onClose={() => setShowPyramidModal(false)} 
                title="Análise da Pirâmide de Testes"
                size="lg"
                maxHeight="90vh"
            >
                <TestPyramidCard project={project} />
            </Modal>
        </div>
    );
};