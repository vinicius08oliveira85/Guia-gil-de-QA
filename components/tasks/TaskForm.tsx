
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { JiraTask, JiraTaskType, BugSeverity, TeamRole, TaskPriority } from '../../types';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { TagInput } from '../common/TagInput';
import { RichTextEditor } from '../common/RichTextEditor';
import { HelpTooltip } from '../common/HelpTooltip';
import { Input } from '../common/Input';
import { helpContent } from '../../utils/helpContent';

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
        assignee: existingTask?.assignee || (parentId ? 'Dev' : 'QA'),
        tags: existingTask?.tags || []
    });

    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Atualizar taskData quando existingTask mudar
    useEffect(() => {
        if (existingTask) {
            setTaskData({
                id: existingTask.id || '',
                title: existingTask.title || '',
                description: existingTask.description || '',
                type: existingTask.type || 'Tarefa',
                parentId: existingTask.parentId || parentId || '',
                severity: existingTask.severity || 'Médio',
                priority: existingTask.priority || 'Média',
                owner: existingTask.owner || (parentId ? 'QA' : 'Product'),
                assignee: existingTask.assignee || (parentId ? 'Dev' : 'QA'),
                tags: existingTask.tags || []
            });
            // Limpar erros de validação quando a tarefa mudar
            setValidationErrors({});
        } else {
            // Se não há tarefa existente, resetar para valores padrão
            setTaskData({
                id: '',
                title: '',
                description: '',
                type: 'Tarefa',
                parentId: parentId || '',
                severity: 'Médio',
                priority: 'Média',
                owner: parentId ? 'QA' : 'Product',
                assignee: parentId ? 'Dev' : 'QA',
                tags: []
            });
            setValidationErrors({});
        }
    }, [existingTask, parentId]);

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};

        // Validar ID
        if (!taskData.id || taskData.id.trim() === '') {
            errors.id = 'ID da tarefa é obrigatório. Exemplo: PROJ-001';
        } else if (taskData.id.length < 3) {
            errors.id = 'ID muito curto. Use pelo menos 3 caracteres. Exemplo: PROJ-001';
        }

        // Validar Título
        if (!taskData.title || taskData.title.trim() === '') {
            errors.title = 'Título é obrigatório. Descreva o que precisa ser feito.';
        } else if (taskData.title.length < 5) {
            errors.title = 'Título muito curto. Seja mais descritivo. Exemplo: "Implementar login com email"';
        }

        // Validar Descrição (opcional)

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            handleWarning("Por favor, corrija os erros no formulário antes de salvar.");
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
        setValidationErrors({});
    };

    const labelClass = 'flex items-center gap-1.5 text-xs font-medium text-base-content/70 mb-1';
    const selectClass = 'select select-bordered select-sm w-full bg-base-100 border-base-300 text-base-content text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-xl';

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <motion.div
                className="rounded-2xl border border-base-300 bg-base-100/50 p-4 space-y-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2 md:col-span-1">
                        <Input
                            label={
                                <span className="flex items-center gap-1.5 text-xs font-medium text-base-content/70">
                                    ID da Tarefa (ex: PROJ-123)
                                    <HelpTooltip title={helpContent.task.fields.id.title} content={helpContent.task.fields.id.content} />
                                </span>
                            }
                            type="text"
                            id="id"
                            value={taskData.id}
                            onChange={(e) => {
                                setTaskData({ ...taskData, id: e.target.value });
                                if (validationErrors.id) setValidationErrors({ ...validationErrors, id: '' });
                            }}
                            placeholder="PROJ-123"
                            error={validationErrors.id}
                            success={taskData.id.length >= 3 && !validationErrors.id}
                            required
                            className="input-sm rounded-xl border-base-300"
                        />
                    </div>
                    <div className="sm:col-span-2 md:col-span-1">
                        <Input
                            label={
                                <span className="flex items-center gap-1.5 text-xs font-medium text-base-content/70">
                                    Título
                                    <HelpTooltip title={helpContent.task.fields.title.title} content={helpContent.task.fields.title.content} />
                                </span>
                            }
                            type="text"
                            id="title"
                            value={taskData.title}
                            onChange={(e) => {
                                setTaskData({ ...taskData, title: e.target.value });
                                if (validationErrors.title) setValidationErrors({ ...validationErrors, title: '' });
                            }}
                            placeholder=""
                            error={validationErrors.title}
                            success={taskData.title.length >= 5 && !validationErrors.title}
                            required
                            className="input-sm rounded-xl border-base-300"
                        />
                    </div>
                    <div>
                        <label htmlFor="type" className={labelClass}>
                            Tipo
                            <HelpTooltip title={helpContent.task.fields.type.title} content={helpContent.task.fields.type.content} />
                        </label>
                        <select id="type" value={taskData.type} onChange={e => setTaskData({ ...taskData, type: e.target.value as JiraTaskType, parentId: e.target.value === 'Epic' ? '' : taskData.parentId })} className={selectClass}>
                            <option value="Epic">Epic</option>
                            <option value="História">História</option>
                            <option value="Tarefa">Tarefa</option>
                            <option value="Bug">Bug</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="priority" className={labelClass}>
                            Prioridade
                            <HelpTooltip title={helpContent.task.fields.priority.title} content={helpContent.task.fields.priority.content} />
                        </label>
                        <select id="priority" value={taskData.priority} onChange={e => setTaskData({ ...taskData, priority: e.target.value as TaskPriority })} className={selectClass}>
                            <option value="Baixa">Baixa</option>
                            <option value="Média">Média</option>
                            <option value="Alta">Alta</option>
                            <option value="Urgente">Urgente</option>
                        </select>
                    </div>
                    {taskData.type === 'Bug' && (
                        <div>
                            <label htmlFor="severity" className={labelClass}>
                                Severidade
                                <HelpTooltip title={helpContent.task.fields.severity.title} content={helpContent.task.fields.severity.content} />
                            </label>
                            <select id="severity" value={taskData.severity} onChange={e => setTaskData({ ...taskData, severity: e.target.value as BugSeverity })} className={selectClass}>
                                <option value="Crítico">Crítico</option>
                                <option value="Alto">Alto</option>
                                <option value="Médio">Médio</option>
                                <option value="Baixo">Baixo</option>
                            </select>
                        </div>
                    )}
                    {taskData.type !== 'Epic' && (
                        <div className={taskData.type === 'Bug' ? '' : 'sm:col-span-2'}>
                            <label htmlFor="parentId" className={labelClass}>
                                Vincular ao Epic (Opcional)
                                <HelpTooltip title={helpContent.task.fields.parentId.title} content={helpContent.task.fields.parentId.content} />
                            </label>
                            <select id="parentId" value={taskData.parentId} onChange={e => setTaskData({ ...taskData, parentId: e.target.value })} className={selectClass}>
                                <option value="">Nenhum</option>
                                {epics.map(epic => <option key={epic.id} value={epic.id}>{epic.id}: {epic.title}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                        <label htmlFor="owner" className={labelClass}>
                            Dono (Owner)
                            <HelpTooltip title={helpContent.task.fields.owner.title} content={helpContent.task.fields.owner.content} />
                        </label>
                        <select id="owner" value={taskData.owner} onChange={e => setTaskData({ ...taskData, owner: e.target.value as TeamRole })} className={selectClass}>
                            <option value="Product">Produto</option>
                            <option value="QA">QA</option>
                            <option value="Dev">Desenvolvimento</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="assignee" className={labelClass}>
                            Responsável (Assignee)
                            <HelpTooltip title={helpContent.task.fields.assignee.title} content={helpContent.task.fields.assignee.content} />
                        </label>
                        <select id="assignee" value={taskData.assignee} onChange={e => setTaskData({ ...taskData, assignee: e.target.value as TeamRole })} className={selectClass}>
                            <option value="Product">Produto</option>
                            <option value="QA">QA</option>
                            <option value="Dev">Desenvolvimento</option>
                        </select>
                    </div>
                </div>
            </motion.div>

            <div className="rounded-2xl border border-base-300 bg-base-100/50 p-4 space-y-2">
                <label className={labelClass}>
                    Descrição
                    <HelpTooltip title={helpContent.task.fields.description.title} content={helpContent.task.fields.description.content} />
                </label>
                <RichTextEditor
                    value={taskData.description}
                    onChange={(value) => {
                        setTaskData({ ...taskData, description: value });
                        if (validationErrors.description) setValidationErrors({ ...validationErrors, description: '' });
                    }}
                    placeholder="Digite a descrição da tarefa..."
                    taskId={taskData.id || undefined}
                />
                {validationErrors.description && (
                    <p className="text-xs text-error mt-1" role="alert">{validationErrors.description}</p>
                )}
            </div>

            <div className="rounded-2xl border border-base-300 bg-base-100/50 p-4 space-y-2">
                <label className={labelClass}>
                    Tags
                    <HelpTooltip title={helpContent.task.fields.tags.title} content={helpContent.task.fields.tags.content} />
                </label>
                <TagInput tags={taskData.tags || []} onChange={(tags) => setTaskData({ ...taskData, tags })} allowNewTags={true} />
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-1">
                <button type="button" onClick={onCancel} className="btn btn-ghost btn-sm rounded-xl border border-base-300 text-base-content hover:bg-base-200">
                    Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-sm rounded-xl shadow-md shadow-primary/20">
                    Salvar Tarefa
                </button>
            </div>
        </form>
    );
};