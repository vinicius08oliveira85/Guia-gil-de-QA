
import React, { useState } from 'react';
import { Project, ProjectDocument, JiraTask, TestStrategy, TestCase } from '../types';
import { analyzeDocumentContent, generateTaskFromDocument } from '../services/geminiService';
import { Card } from './common/Card';
import { Modal } from './common/Modal';
import { Spinner } from './common/Spinner';
import { TrashIcon } from './common/Icons';

export const DocumentsView: React.FC<{ project: Project; onUpdateProject: (project: Project) => void; }> = ({ project, onUpdateProject }) => {
    const [analysisResult, setAnalysisResult] = useState<{ name: string; content: string } | null>(null);
    const [loadingStates, setLoadingStates] = useState<{ [docName: string]: 'analyze' | 'generate' | null }>({});

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && (file.type === "text/plain" || file.type === "text/markdown")) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target?.result as string;
                const newDocument: ProjectDocument = { name: file.name, content };
                onUpdateProject({
                    ...project,
                    documents: [...project.documents, newDocument]
                });
            };
            reader.readAsText(file);
        } else {
            alert("Por favor, carregue um arquivo .txt ou .md");
        }
        event.target.value = ''; // Reset input
    };

    const handleAnalyze = async (doc: ProjectDocument) => {
        setLoadingStates(prev => ({ ...prev, [doc.name]: 'analyze' }));
        try {
            const analysis = await analyzeDocumentContent(doc.content);
            setAnalysisResult({ name: doc.name, content: analysis });
        } catch (error) {
            alert("Falha ao analisar o documento.");
        } finally {
            setLoadingStates(prev => ({ ...prev, [doc.name]: null }));
        }
    };
    
    const handleGenerateTask = async (doc: ProjectDocument) => {
        setLoadingStates(prev => ({ ...prev, [doc.name]: 'generate' }));
        try {
            const { task, strategy, testCases } = await generateTaskFromDocument(doc.content);
            const newTask: JiraTask = {
                ...task,
                id: `DOC-${doc.name.substring(0, 5)}-${Date.now().toString().slice(-4)}`,
                status: 'To Do',
                testCases: testCases,
                testStrategy: strategy,
                bddScenarios: [],
            };
            onUpdateProject({ ...project, tasks: [...project.tasks, newTask] });
            alert(`Tarefa "${newTask.id}" criada com sucesso a partir do documento!`);
        } catch (error) {
            alert("Falha ao gerar tarefa a partir do documento.");
        } finally {
            setLoadingStates(prev => ({ ...prev, [doc.name]: null }));
        }
    };

    const handleDelete = (docName: string) => {
        onUpdateProject({
            ...project,
            documents: project.documents.filter(d => d.name !== docName)
        });
    };

    return (
        <Card>
            <Modal isOpen={!!analysisResult} onClose={() => setAnalysisResult(null)} title={`Análise de ${analysisResult?.name}`}>
                <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: analysisResult?.content || '' }} />
            </Modal>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-white">Documentos do Projeto</h3>
                <label className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 cursor-pointer">
                    Carregar Documento
                    <input type="file" accept=".txt,.md" onChange={handleFileUpload} className="hidden" />
                </label>
            </div>
            {project.documents.length > 0 ? (
                <ul className="space-y-3">
                    {project.documents.map(doc => (
                        <li key={doc.name} className="flex items-center justify-between bg-gray-900/50 p-3 rounded-md">
                            <span className="text-white">{doc.name}</span>
                            <div className="flex gap-2">
                                <button onClick={() => handleAnalyze(doc)} disabled={!!loadingStates[doc.name]} className="text-sm px-3 py-1 bg-blue-600/50 text-blue-300 rounded-md hover:bg-blue-600/80 disabled:opacity-50">
                                    {loadingStates[doc.name] === 'analyze' ? <Spinner small/> : 'Analisar'}
                                </button>
                                <button onClick={() => handleGenerateTask(doc)} disabled={!!loadingStates[doc.name]} className="text-sm px-3 py-1 bg-purple-600/50 text-purple-300 rounded-md hover:bg-purple-600/80 disabled:opacity-50">
                                     {loadingStates[doc.name] === 'generate' ? <Spinner small/> : 'Gerar Tarefa'}
                                </button>
                                <button onClick={() => handleDelete(doc.name)} className="text-gray-400 hover:text-red-400"><TrashIcon/></button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500 text-center py-8">Nenhum documento carregado.</p>
            )}
        </Card>
    );
};
