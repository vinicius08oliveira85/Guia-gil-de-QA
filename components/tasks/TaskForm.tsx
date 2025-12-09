
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { JiraTask, JiraTaskType, BugSeverity, TeamRole, TaskPriority } from '../../types';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { TagInput } from '../common/TagInput';
import { RichTextEditor } from '../common/RichTextEditor';
import { HelpTooltip } from '../common/HelpTooltip';
import { Input } from '../common/Input';
import { helpContent } from '../../utils/helpContent';
import { useBeginnerMode } from '../../hooks/useBeginnerMode';
import { getTaskExample, taskExamples } from '../../utils/taskExamples';

export const TaskForm: React.FC<{
    onSave: (task: Omit<JiraTask, 'testCases' | 'status' | 'testStrategy' | 'bddScenarios' | 'createdAt' | 'completedAt'>) => void;
    onCancel: () => void;
    existingTask?: JiraTask;
    epics: JiraTask[];
    parentId?: string;
}> = ({ onSave, onCancel, existingTask, epics, parentId }) => {
    const { handleWarning } = useErrorHandler();
    const { isBeginnerMode } = useBeginnerMode();
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

        // Validar Descrição (opcional, mas recomendada)
        if (isBeginnerMode && (!taskData.description || taskData.description.trim() === '')) {
            errors.description = '💡 Dica: Adicione uma descrição detalhada para ajudar a entender o que precisa ser feito.';
        }

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

    const handleLoadExample = () => {
        const example = getTaskExample(taskData.type);
        if (example) {
            setTaskData({
                ...taskData,
                id: example.id,
                title: example.title,
                description: example.description,
                priority: example.priority,
                owner: example.owner,
                assignee: example.assignee,
                severity: example.severity || taskData.severity,
                tags: example.tags || []
            });
        }
    };

    const hasExample = taskExamples[taskData.type] && taskExamples[taskData.type].length > 0;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {isBeginnerMode && (
                <div className="mb-4 p-4 bg-accent/10 border border-accent/30 rounded-lg">
                    <div className="flex items-start justify-between gap-4">
                        <p className="text-sm text-text-primary">
                            💡 <strong>Modo Iniciante Ativado:</strong> Passe o mouse sobre os ícones de ajuda (ℹ️) para ver explicações detalhadas de cada campo.
                        </p>
                        {hasExample && !existingTask && (
                            <button
                                type="button"
                                onClick={handleLoadExample}
                                className="btn btn-secondary text-xs whitespace-nowrap flex-shrink-0"
                                title="Preencher formulário com um exemplo"
                            >
                                📝 Usar Exemplo
                            </button>
                        )}
                    </div>
                </div>
            )}
            <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div>
                    <Input
                        label={
                            <span className="flex items-center gap-2">
                                ID da Tarefa (ex: PROJ-123)
                                <HelpTooltip 
                                    title={helpContent.task.fields.id.title}
                                    content={helpContent.task.fields.id.content}
                                />
                            </span>
                        }
                        type="text"
                        id="id"
                        value={taskData.id}
                        onChange={(e) => {
                            setTaskData({ ...taskData, id: e.target.value });
                            if (validationErrors.id) {
                                setValidationErrors({ ...validationErrors, id: '' });
                            }
                        }}
                        placeholder={isBeginnerMode ? "Ex: PROJ-001, LOGIN-001" : ""}
                        error={validationErrors.id}
                        success={taskData.id && !validationErrors.id && taskData.id.length >= 3}
                        required
                    />
                </div>
                <div>
                    <Input
                        label={
                            <span className="flex items-center gap-2">
                                Título
                                <HelpTooltip 
                                    title={helpContent.task.fields.title.title}
                                    content={helpContent.task.fields.title.content}
                                />
                            </span>
                        }
                        type="text"
                        id="title"
                        value={taskData.title}
                        onChange={(e) => {
                            setTaskData({ ...taskData, title: e.target.value });
                            if (validationErrors.title) {
                                setValidationErrors({ ...validationErrors, title: '' });
                            }
                        }}
                        placeholder={isBeginnerMode ? "Ex: Implementar login com email" : ""}
                        error={validationErrors.title}
                        success={taskData.title && !validationErrors.title && taskData.title.length >= 5}
                        required 
                    />
                </div>
                <div>
                    <label htmlFor="type" className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-1">
                        Tipo
                        <HelpTooltip 
                            title={helpContent.task.fields.type.title}
                            content={helpContent.task.fields.type.content}
                        />
                    </label>
                    <select id="type" value={taskData.type} onChange={e => setTaskData({ ...taskData, type: e.target.value as JiraTaskType, parentId: e.target.value === 'Epic' ? '' : taskData.parentId })}>
                        <option value="Epic">Epic</option>
                        <option value="História">História</option>
                        <option value="Tarefa">Tarefa</option>
                        <option value="Bug">Bug</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="priority" className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-1">
                        Prioridade
                        <HelpTooltip 
                            title={helpContent.task.fields.priority.title}
                            content={helpContent.task.fields.priority.content}
                        />
                    </label>
                    <select id="priority" value={taskData.priority} onChange={e => setTaskData({ ...taskData, priority: e.target.value as TaskPriority })}>
                        <option value="Baixa">Baixa</option>
                        <option value="Média">Média</option>
                        <option value="Alta">Alta</option>
                        <option value="Urgente">Urgente</option>
                    </select>
                </div>
                {taskData.type === 'Bug' && (
                     <div>
                        <label htmlFor="severity" className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-1">
                            Severidade
                            <HelpTooltip 
                                title={helpContent.task.fields.severity.title}
                                content={helpContent.task.fields.severity.content}
                            />
                        </label>
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
                        <label htmlFor="parentId" className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-1">
                            Vincular ao Epic (Opcional)
                            <HelpTooltip 
                                title={helpContent.task.fields.parentId.title}
                                content={helpContent.task.fields.parentId.content}
                            />
                        </label>
                        <select id="parentId" value={taskData.parentId} onChange={e => setTaskData({ ...taskData, parentId: e.target.value })}>
                            <option value="">Nenhum</option>
                            {epics.map(epic => <option key={epic.id} value={epic.id}>{epic.id}: {epic.title}</option>)}
                        </select>
                    </div>
                )}
                 <div>
                    <label htmlFor="owner" className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-1">
                        Dono (Owner)
                        <HelpTooltip 
                            title={helpContent.task.fields.owner.title}
                            content={helpContent.task.fields.owner.content}
                        />
                    </label>
                    <select id="owner" value={taskData.owner} onChange={e => setTaskData({ ...taskData, owner: e.target.value as TeamRole })}>
                        <option value="Product">Produto</option>
                        <option value="QA">QA</option>
                        <option value="Dev">Desenvolvimento</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="assignee" className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-1">
                        Responsável (Assignee)
                        <HelpTooltip 
                            title={helpContent.task.fields.assignee.title}
                            content={helpContent.task.fields.assignee.content}
                        />
                    </label>
                    <select id="assignee" value={taskData.assignee} onChange={e => setTaskData({ ...taskData, assignee: e.target.value as TeamRole })}>
                        <option value="Product">Produto</option>
                        <option value="QA">QA</option>
                        <option value="Dev">Desenvolvimento</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-1">
                    Descrição
                    <HelpTooltip 
                        title={helpContent.task.fields.description.title}
                        content={helpContent.task.fields.description.content}
                    />
                </label>
                {isBeginnerMode && (
                    <p className="text-xs text-text-secondary mb-2">
                        💡 Inclua: contexto, requisitos, critérios de aceite e exemplos.
                    </p>
                )}
                <RichTextEditor
                    value={taskData.description}
                    onChange={(value) => {
                        setTaskData({ ...taskData, description: value });
                        if (validationErrors.description) {
                            setValidationErrors({ ...validationErrors, description: '' });
                        }
                    }}
                    placeholder={isBeginnerMode ? "Ex: Implementar login...\n\nContexto: Usuários precisam acessar o sistema...\n\nRequisitos:\n- Campo de email\n- Campo de senha\n..." : "Digite a descrição da tarefa..."}
                    taskId={taskData.id || undefined}
                />
                {validationErrors.description && (
                    <p className="text-xs text-yellow-400 mt-1">{validationErrors.description}</p>
                )}
            </div>
            <div>
                <label className="flex items-center gap-2 text-sm font-medium text-text-secondary mb-1">
                    Tags
                    <HelpTooltip 
                        title={helpContent.task.fields.tags.title}
                        content={helpContent.task.fields.tags.content}
                    />
                </label>
                {isBeginnerMode && (
                    <p className="text-xs text-text-secondary mb-2">
                        💡 Exemplos: "login", "pagamento", "mobile", "api"
                    </p>
                )}
                <TagInput
                    tags={taskData.tags || []}
                    onChange={(tags) => setTaskData({ ...taskData, tags })}
                    allowNewTags={true}
                />
            </div>
            <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={onCancel} className="btn btn-secondary">Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Tarefa</button>
            </div>
        </form>
    );
};