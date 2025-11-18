
import React, { useState } from 'react';
import { JiraTask, JiraTaskType, BugSeverity, TeamRole, TaskPriority } from '../../types';
import { useErrorHandler } from '../../hooks/useErrorHandler';

export const TaskForm: React.FC<{
    onSave: (task: Omit<JiraTask, 'testCases' | 'status' | 'testStrategy' | 'bddScenarios' | 'createdAt' | 'completedAt'>) => void;
    onCancel: () => void;
    existingTask?: JiraTask;
    epics: JiraTask[];
    parentId?: string;
}> = ({ onSave, onCancel, existingTask, epics, parentId }) => {
    const { handleWarning } = useErrorHandler();
    const [taskData, setTaskData] = useState({
        id: existingTask?.id || '',
        title: existingTask?.title || '',
        description: existingTask?.description || '',
        type: existingTask?.type || 'Tarefa',
        parentId: existingTask?.parentId || parentId || '',
        severity: existingTask?.severity || 'Médio',
        priority: existingTask?.priority || 'Média',
        owner: existingTask?.owner || (parentId ? 'QA' : 'Product'),
        assignee: existingTask?.assignee || (parentId ? 'Dev' : 'QA')
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskData.id || !taskData.title) {
            handleWarning("ID da Tarefa e Título são obrigatórios.");
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
                    <label htmlFor="id" className="block text-sm font-medium text-text-secondary mb-1">ID da Tarefa (ex: PROJ-123)</label>
                    <input type="text" id="id" value={taskData.id} onChange={(e) => setTaskData({ ...taskData, id: e.target.value })} required />
                </div>
                <div>
                    <label htmlFor="title" className="block text-sm font-medium text-text-secondary mb-1">Título</label>
                    <input type="text" id="title" value={taskData.title} onChange={(e) => setTaskData({ ...taskData, title: e.target.value })} required />
                </div>
                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-text-secondary mb-1">Tipo</label>
                    <select id="type" value={taskData.type} onChange={e => setTaskData({ ...taskData, type: e.target.value as JiraTaskType, parentId: e.target.value === 'Epic' ? '' : taskData.parentId })}>
                        <option value="Epic">Epic</option>
                        <option value="História">História</option>
                        <option value="Tarefa">Tarefa</option>
                        <option value="Bug">Bug</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="priority" className="block text-sm font-medium text-text-secondary mb-1">Prioridade</label>
                    <select id="priority" value={taskData.priority} onChange={e => setTaskData({ ...taskData, priority: e.target.value as TaskPriority })}>
                        <option value="Baixa">Baixa</option>
                        <option value="Média">Média</option>
                        <option value="Alta">Alta</option>
                        <option value="Urgente">Urgente</option>
                    </select>
                </div>
                {taskData.type === 'Bug' && (
                     <div>
                        <label htmlFor="severity" className="block text-sm font-medium text-text-secondary mb-1">Severidade</label>
                        <select id="severity" value={taskData.severity} onChange={e => setTaskData({ ...taskData, severity: e.target.value as BugSeverity })}>
                            <option value="Crítico">Crítico</option>
                            <option value="Alto">Alto</option>
                            <option value="Médio">Médio</option>
                            <option value="Baixo">Baixo</option>
                        </select>
                    </div>
                )}
                {taskData.type !== 'Epic' && (
                    <div>
                        <label htmlFor="parentId" className="block text-sm font-medium text-text-secondary mb-1">Vincular ao Epic (Opcional)</label>
                        <select id="parentId" value={taskData.parentId} onChange={e => setTaskData({ ...taskData, parentId: e.target.value })}>
                            <option value="">Nenhum</option>
                            {epics.map(epic => <option key={epic.id} value={epic.id}>{epic.id}: {epic.title}</option>)}
                        </select>
                    </div>
                )}
                 <div>
                    <label htmlFor="owner" className="block text-sm font-medium text-text-secondary mb-1">Dono (Owner)</label>
                    <select id="owner" value={taskData.owner} onChange={e => setTaskData({ ...taskData, owner: e.target.value as TeamRole })}>
                        <option value="Product">Produto</option>
                        <option value="QA">QA</option>
                        <option value="Dev">Desenvolvimento</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="assignee" className="block text-sm font-medium text-text-secondary mb-1">Responsável (Assignee)</label>
                    <select id="assignee" value={taskData.assignee} onChange={e => setTaskData({ ...taskData, assignee: e.target.value as TeamRole })}>
                        <option value="Product">Produto</option>
                        <option value="QA">QA</option>
                        <option value="Dev">Desenvolvimento</option>
                    </select>
                </div>
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-text-secondary mb-1">Descrição</label>
                <textarea id="description" value={taskData.description} onChange={(e) => setTaskData({ ...taskData, description: e.target.value })} rows={4}></textarea>
            </div>
            <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={onCancel} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Tarefa</button>
            </div>
        </form>
    );
};