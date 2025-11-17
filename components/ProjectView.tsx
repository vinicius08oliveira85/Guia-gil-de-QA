
import React, { useState, useEffect } from 'react';
import { Project } from '../types';
import { useProjectMetrics } from '../hooks/useProjectMetrics';
import { ProjectQADashboard } from './dashboard/ProjectQADashboard';
import { AnalysisView } from './analysis/AnalysisView';
import { TasksView } from './tasks/TasksView';
import { DocumentsView } from './DocumentsView';
import { RoadmapView } from './roadmap/RoadmapView';
import { GlossaryView } from './glossary/GlossaryView';
import { TimelineView } from './timeline/TimelineView';

export const ProjectView: React.FC<{ project: Project; onUpdateProject: (project: Project) => void; onBack: () => void; }> = ({ project, onUpdateProject, onBack }) => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const { newPhases } = useProjectMetrics(project);

    useEffect(() => {
        // Update project state only if the calculated phases have changed
        if (newPhases && JSON.stringify(newPhases) !== JSON.stringify(project.phases)) {
            onUpdateProject({ ...project, phases: newPhases });
        }
    }, [newPhases, project, onUpdateProject]);
    
    const tabStyle = "px-4 py-2 text-sm font-medium transition-colors";
    const activeTabStyle = "text-teal-400 border-b-2 border-teal-400";
    const inactiveTabStyle = "text-gray-400 hover:text-white";

    const currentPhaseName = newPhases.find(p => p.status === 'Em Andamento')?.name || 'N/A';

    return (
        <div className="container mx-auto p-4 md:p-8">
            <button onClick={onBack} className="mb-4 text-teal-500 hover:text-teal-400">&larr; Voltar para o Dashboard de Projetos</button>
            <h2 className="text-3xl font-bold text-white mb-2">{project.name}</h2>
            <p className="text-gray-400 mb-8">{project.description}</p>
            
            <div className="border-b border-gray-700 mb-6">
                <nav className="-mb-px flex space-x-6 overflow-x-auto" aria-label="Tabs">
                    <button onClick={() => setActiveTab('dashboard')} className={`${tabStyle} ${activeTab === 'dashboard' ? activeTabStyle : inactiveTabStyle}`}>Dashboard</button>
                    <button onClick={() => setActiveTab('timeline')} className={`${tabStyle} ${activeTab === 'timeline' ? activeTabStyle : inactiveTabStyle}`}>Timeline</button>
                    <button onClick={() => setActiveTab('analysis')} className={`${tabStyle} ${activeTab === 'analysis' ? activeTabStyle : inactiveTabStyle}`}>Análise IA</button>
                    <button onClick={() => setActiveTab('tasks')} className={`${tabStyle} ${activeTab === 'tasks' ? activeTabStyle : inactiveTabStyle}`}>Tarefas & Testes</button>
                    <button onClick={() => setActiveTab('documents')} className={`${tabStyle} ${activeTab === 'documents' ? activeTabStyle : inactiveTabStyle}`}>Documentos</button>
                    <button onClick={() => setActiveTab('roadmap')} className={`${tabStyle} ${activeTab === 'roadmap' ? activeTabStyle : inactiveTabStyle}`}>Roadmap</button>
                    <button onClick={() => setActiveTab('glossary')} className={`${tabStyle} ${activeTab === 'glossary' ? activeTabStyle : inactiveTabStyle}`}>Glossário</button>
                </nav>
            </div>
            
            {activeTab === 'dashboard' && <ProjectQADashboard project={project} />}
            {activeTab === 'timeline' && <TimelineView project={project} currentPhaseName={currentPhaseName} />}
            {activeTab === 'analysis' && <AnalysisView project={project} onUpdateProject={onUpdateProject} />}
            {activeTab === 'tasks' && <TasksView project={project} onUpdateProject={onUpdateProject} />}
            {activeTab === 'documents' && <DocumentsView project={project} onUpdateProject={onUpdateProject} />}
            {activeTab === 'roadmap' && <RoadmapView />}
            {activeTab === 'glossary' && <GlossaryView />}
        </div>
    );
};
