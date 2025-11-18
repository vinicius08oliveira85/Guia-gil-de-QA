import React, { useState, useCallback } from 'react';
import { Project } from '../../types';
import { generateProjectLifecyclePlan, generateShiftLeftAnalysis, generateTestPyramidAnalysis } from '../../services/geminiService';
import { Spinner } from '../common/Spinner';
import { ProjectLifecycleCard } from './ProjectLifecycleCard';
import { ShiftLeftCard } from './ShiftLeftCard';
import { TestPyramidCard } from './TestPyramidCard';
import { PhaseLogicGuideCard } from './PhaseLogicGuideCard';

export const AnalysisView: React.FC<{ project: Project; onUpdateProject: (project: Project) => void; }> = ({ project, onUpdateProject }) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);

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
    
        } catch (error) {
            console.error("Failed to analyze dashboard", error);
            alert("Falha ao analisar o dashboard.");
        } finally {
            setIsAnalyzing(false);
        }
    }, [project, onUpdateProject]);

    return (
        <div>
            <div className="mica rounded-lg p-4 mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-text-secondary text-center sm:text-left">Gere e atualize todas as análises estratégicas para o seu projeto com um único clique.</p>
                 <button onClick={handleAnalyzeAndUpdateDashboard} disabled={isAnalyzing} className="btn btn-primary w-full sm:w-auto sm:min-w-[240px] flex-shrink-0 disabled:bg-slate-600 disabled:cursor-not-allowed">
                    {isAnalyzing ? <Spinner small /> : 'Analisar Projeto com IA'}
                </button>
            </div>
            {project.phases && <ProjectLifecycleCard project={project} />}
            <ShiftLeftCard project={project} />
            <TestPyramidCard project={project} />
            <PhaseLogicGuideCard />
        </div>
    );
};