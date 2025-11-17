
import React, { useState } from 'react';
import { JiraTask, JiraTaskType, BugSeverity, TeamRole } from '../../types';

export const TaskForm: React.FC<{
    onSave: (task: Omit<JiraTask, 'testCases' | 'status' | 'testStrategy' | 'bddScenarios' | 'createdAt' | 'completedAt'>) => void;
    onCancel: () => void;
    existingTask?: JiraTask;
    epics: JiraTask[];
    parentId?: string;
}> = ({ onSave, onCancel, existingTask, epics, parentId }) => {
    const [taskData, setTaskData] = useState({
        id: existingTask?.id || '',
        title: existingTask?.title || '',
        description: existingTask?.description || '',
        type: existingTask?.type || 'Tarefa',
        parentId: existingTask?.parentId || parentId || '',
        severity: existingTask?.severity || 'Médio',
        owner: existingTask?.owner || (parentId ? 'QA' : 'Product'),
        assignee: existingTask?.assignee || (parentId ? 'Dev' : 'QA')
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskData.id || !taskData.title) {
            alert("ID da Tarefa e Título são obrigatórios.");
            return;
        }
        const { severity, ...restOfTaskData } = taskData;
        
        const taskToSave: any = {
            ...restOfTaskData,
            owner: restOfTaskData.owner as TeamRole,
            assignee: restOfTaskData.assignee as TeamRole,
        };

        if (taskData.type === 'Bug') {
            taskToSave.severity = severity as BugSeverity;
        }
        onSave(taskToSave);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="id" className="block text-sm font-medium text-gray-400">ID da Tarefa (ex: PROJ-123)</label>
                    <input type="text" id="id" value={taskData.id} onChange={(e) => setTaskData({ ...taskData, id: e.target.value })} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-400">Título</label>
                    <input type="text" id="title" value={taskData.title} onChange={(e) => setTaskData({ ...taskData, title: e.target.value })} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-400">Tipo</label>
                    <select id="type" value={taskData.type} onChange={e => setTaskData({ ...taskData, type: e.target.value as JiraTaskType, parentId: e.target.value === 'Epic' ? '' : taskData.parentId })} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                        <option value="Epic">Epic</option>
                        <option value="História">História</option>
                        <option value="Tarefa">Tarefa</option>
                        <option value="Bug">Bug</option>
                    </select>
                </div>
                {taskData.type === 'Bug' && (
                     <div>
                        <label htmlFor="severity" className="block text-sm font-medium text-gray-400">Severidade</label>
                        <select id="severity" value={taskData.severity} onChange={e => setTaskData({ ...taskData, severity: e.target.value as BugSeverity })} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                            <option value="Crítico">Crítico</option>
                            <option value="Alto">Alto</option>
                            <option value="Médio">Médio</option>
                            <option value="Baixo">Baixo</option>
                        </select>
                    </div>
                )}
                {taskData.type !== 'Epic' && (
                    <div>
                        <label htmlFor="parentId" className="block text-sm font-medium text-gray-400">Vincular ao Epic (Opcional)</label>
                        <select id="parentId" value={taskData.parentId} onChange={e => setTaskData({ ...taskData, parentId: e.target.value })} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                            <option value="">Nenhum</option>
                            {epics.map(epic => <option key={epic.id} value={epic.id}>{epic.id}: {epic.title}</option>)}
                        </select>
                    </div>
                )}
                 <div>
                    <label htmlFor="owner" className="block text-sm font-medium text-gray-400">Dono (Owner)</label>
                    <select id="owner" value={taskData.owner} onChange={e => setTaskData({ ...taskData, owner: e.target.value as TeamRole })} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                        <option value="Product">Produto</option>
                        <option value="QA">QA</option>
                        <option value="Dev">Desenvolvimento</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="assignee" className="block text-sm font-medium text-gray-400">Responsável (Assignee)</label>
                    <select id="assignee" value={taskData.assignee} onChange={e => setTaskData({ ...taskData, assignee: e.target.value as TeamRole })} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500">
                        <option value="Product">Produto</option>
                        <option value="QA">QA</option>
                        <option value="Dev">Desenvolvimento</option>
                    </select>
                </div>
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-400">Descrição</label>
                <textarea id="description" value={taskData.description} onChange={(e) => setTaskData({ ...taskData, description: e.target.value })} rows={4} className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-teal-500 focus:border-teal-500"></textarea>
            </div>
            <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-500">Salvar Tarefa</button>
            </div>
        </form>
    );
};