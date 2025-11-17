
import React, { useState } from 'react';
import { JiraTask, BddScenario, TestCaseDetailLevel, TeamRole } from '../../types';
import { Spinner } from '../common/Spinner';
import { TaskTypeIcon, TaskStatusIcon, PlusIcon, EditIcon, TrashIcon, ChevronDownIcon, RefreshIcon } from '../common/Icons';
import { BddScenarioForm, BddScenarioItem } from './BddScenario';
import { TestCaseItem } from './TestCaseItem';
import { TestStrategyCard } from './TestStrategyCard';

export type TaskWithChildren = JiraTask & { children: TaskWithChildren[] };

const TeamRoleBadge: React.FC<{ role: TeamRole }> = ({ role }) => {
    const roleStyles: Record<TeamRole, { bg: string, text: string }> = {
        'Product': { bg: 'bg-purple-600/50', text: 'text-purple-300' },
        'QA': { bg: 'bg-teal-600/50', text: 'text-teal-300' },
        'Dev': { bg: 'bg-blue-600/50', text: 'text-blue-300' },
    };
    const styles = roleStyles[role];

    return (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles.bg} ${styles.text}`}>
            {role}
        </span>
    );
};

export const JiraTaskItem: React.FC<{
    task: JiraTask;
    onTestCaseStatusChange: (testCaseId: string, status: 'Passed' | 'Failed') => void;
    onDelete: (taskId: string) => void;
    onGenerateTests: (taskId: string, detailLevel: TestCaseDetailLevel) => Promise<void>;
    isGenerating: boolean;
    onAddSubtask: (parentId: string) => void;
    onEdit: (task: JiraTask) => void;
    onGenerateBddScenarios: (taskId: string) => Promise<void>;
    isGeneratingBdd: boolean;
    onSaveBddScenario: (taskId: string, scenario: Omit<BddScenario, 'id'>, scenarioId?: string) => void;
    onDeleteBddScenario: (taskId: string, scenarioId: string) => void;
    onTaskStatusChange: (status: 'To Do' | 'In Progress' | 'Done') => void;
    children?: React.ReactNode;
    level: number;
}> = React.memo(({ task, onTestCaseStatusChange, onDelete, onGenerateTests, isGenerating, onAddSubtask, onEdit, onGenerateBddScenarios, isGeneratingBdd, onSaveBddScenario, onDeleteBddScenario, onTaskStatusChange, children, level }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [editingBddScenario, setEditingBddScenario] = useState<BddScenario | null>(null);
    const [isCreatingBdd, setIsCreatingBdd] = useState(false);
    const [detailLevel, setDetailLevel] = useState<TestCaseDetailLevel>('Padrão');
    const hasTests = task.testCases && task.testCases.length > 0;

    const handleSaveScenario = (scenario: Omit<BddScenario, 'id'>) => {
        onSaveBddScenario(task.id, scenario, editingBddScenario?.id);
        setEditingBddScenario(null);
        setIsCreatingBdd(false);
    };

    const handleCancelBddForm = () => {
        setEditingBddScenario(null);
        setIsCreatingBdd(false);
    };

    return (
        <div style={{ marginLeft: `${level * 2}rem` }} className={`bg-gray-800 rounded-lg border border-gray-700 mb-2`}>
            <div className="flex items-center p-3 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <TaskTypeIcon type={task.type} />
                </div>
                <div className="ml-3 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <TaskStatusIcon status={task.status} />
                        <div>
                            <span className="font-semibold text-gray-400 truncate">{task.id}</span>
                            <p className="text-white truncate">{task.title}</p>
                        </div>
                    </div>
                     {task.owner && task.assignee && (
                        <div className="mt-2 flex items-center gap-2">
                            <TeamRoleBadge role={task.owner} />
                            <span className="text-gray-500 font-bold text-xs">&rarr;</span>
                            <TeamRoleBadge role={task.assignee} />
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3 text-gray-400 ml-2">
                    <select
                        value={task.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                            e.stopPropagation();
                            onTaskStatusChange(e.target.value as 'To Do' | 'In Progress' | 'Done');
                        }}
                        className="bg-gray-700 border-gray-600 rounded-md text-xs py-1 px-2 text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                    >
                        <option value="To Do">A Fazer</option>
                        <option value="In Progress">Em Andamento</option>
                        <option value="Done">Concluído</option>
                    </select>
                     {task.type === 'Epic' && (
                        <button onClick={(e) => { e.stopPropagation(); onAddSubtask(task.id); }} className="p-1 hover:text-white"><PlusIcon /></button>
                     )}
                    <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="p-1 hover:text-white"><EditIcon /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="p-1 hover:text-red-400"><TrashIcon /></button>
                    <ChevronDownIcon />
                </div>
            </div>
            {isOpen && (
                <div className="p-4 border-t border-gray-700">
                    <p className="text-gray-400 mb-4 whitespace-pre-wrap">{task.description}</p>
                    
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Cenários BDD (Gherkin)</h3>
                        <div className="space-y-3 mt-2">
                             {(task.bddScenarios || []).map(sc => (
                                editingBddScenario?.id === sc.id ? (
                                    <BddScenarioForm key={sc.id} existingScenario={sc} onSave={handleSaveScenario} onCancel={handleCancelBddForm} />
                                ) : (
                                    <BddScenarioItem key={sc.id} scenario={sc} onEdit={() => setEditingBddScenario(sc)} onDelete={() => onDeleteBddScenario(task.id, sc.id)} />
                                )
                            ))}
                        </div>
                         {isCreatingBdd && !editingBddScenario && (
                            <BddScenarioForm onSave={handleSaveScenario} onCancel={handleCancelBddForm} />
                        )}
                        {isGeneratingBdd && <div className="flex justify-center py-2"><Spinner small /></div>}

                        <div className="flex flex-wrap items-center gap-2 mt-4">
                            <button onClick={() => onGenerateBddScenarios(task.id)} disabled={isGeneratingBdd || isCreatingBdd || !!editingBddScenario} className="px-3 py-1.5 bg-blue-600/50 text-blue-300 rounded-md hover:bg-blue-600/80 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                Gerar Cenários com IA
                            </button>
                             <button onClick={() => setIsCreatingBdd(true)} disabled={isGeneratingBdd || isCreatingBdd || !!editingBddScenario} className="px-3 py-1.5 bg-gray-600/50 text-gray-300 rounded-md hover:bg-gray-600/80 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                Adicionar Cenário Manualmente
                            </button>
                        </div>
                        

                        <h3 className="text-lg font-semibold text-white pt-4 mt-6 border-t border-gray-700">Estratégia de Teste</h3>
                        {isGenerating && <div className="flex justify-center py-2"><Spinner small /></div>}
                        {task.testStrategy && task.testStrategy.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {task.testStrategy.map((strategy, i) => <TestStrategyCard key={i} strategy={strategy} />)}
                            </div>
                        ) : (
                            !isGenerating && <p className="text-gray-500">Nenhuma estratégia de teste gerada ainda.</p>
                        )}
                        
                        <h3 className="text-lg font-semibold text-white mt-6">Casos de Teste</h3>
                         {(task.testCases || []).length > 0 ? (
                            <div className="space-y-3">
                                {task.testCases.map(tc => (
                                    <TestCaseItem key={tc.id} testCase={tc} onStatusChange={(status) => onTestCaseStatusChange(tc.id, status)} />
                                ))}
                            </div>
                        ) : (
                           !isGenerating && <p className="text-gray-500">Nenhum caso de teste ainda.</p>
                        )}
                        
                        {!isGenerating && (
                            <div className="flex items-end gap-3 mt-4">
                                <button onClick={() => onGenerateTests(task.id, detailLevel)} className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500 flex items-center gap-2 self-end">
                                    {hasTests ? <RefreshIcon /> : <PlusIcon />}
                                    {hasTests ? 'Regerar com IA' : 'Gerar com IA'}
                                </button>
                                <div className="relative">
                                    <label htmlFor={`detail-level-${task.id}`} className="text-sm text-gray-400">Nível de Detalhe</label>
                                    <select
                                        id={`detail-level-${task.id}`}
                                        value={detailLevel}
                                        onChange={(e) => setDetailLevel(e.target.value as TestCaseDetailLevel)}
                                        className="mt-1 w-full bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
                                    >
                                        <option value="Padrão">Padrão</option>
                                        <option value="Resumido">Resumido</option>
                                        <option value="Detalhado">Detalhado</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {children}
        </div>
    );
});