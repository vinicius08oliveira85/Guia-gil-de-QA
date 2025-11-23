import React, { useMemo } from 'react';
import { JiraTask, Project } from '../../types';
import { windows12Styles, getStatusStyle } from '../../utils/windows12Styles';

interface NextStepsProps {
    project: Project;
    selectedVersion: string;
    versionTasks: JiraTask[];
    onStartStep: (taskId?: string) => void;
}

const FALLBACK_CHECKLIST = [
    'Refinar critérios de aceitação',
    'Sincronizar com stakeholders',
    'Registrar evidências de teste'
];

const formatChecklist = (task: JiraTask) => {
    if (task.checklist && task.checklist.length > 0) {
        return task.checklist.slice(0, 3).map(item => ({
            id: item.id,
            text: item.text,
            checked: item.checked
        }));
    }

    return FALLBACK_CHECKLIST.map((text, index) => ({
        id: `${task.id}-fallback-${index}`,
        text,
        checked: false
    }));
};

const formatDependencies = (dependencies?: string[]) => {
    if (!dependencies || dependencies.length === 0) {
        return 'Sem dependências';
    }
    if (dependencies.length === 1) {
        return `Depende de ${dependencies[0]}`;
    }
    return `Depende de ${dependencies.length} itens`;
};

export const NextSteps: React.FC<NextStepsProps> = ({
    project,
    selectedVersion,
    versionTasks,
    onStartStep
}) => {
    const candidateTasks = useMemo(() => {
        const pool = versionTasks.length > 0 ? versionTasks : project.tasks;

        return pool
            .filter(task => task.type !== 'Bug' && task.status !== 'Done')
            .sort((a, b) => {
                const statusRank: Record<string, number> = { 'In Progress': 0, 'To Do': 1 };
                const aRank = statusRank[a.status] ?? 2;
                const bRank = statusRank[b.status] ?? 2;
                if (aRank !== bRank) return aRank - bRank;
                const priorityRank: Record<string, number> = { 'Urgente': 0, 'Alta': 1, 'Média': 2, 'Baixa': 3 };
                const aPriority = priorityRank[a.priority || 'Média'] ?? 2;
                const bPriority = priorityRank[b.priority || 'Média'] ?? 2;
                return aPriority - bPriority;
            })
            .slice(0, 3)
            .map(task => ({
                ...task,
                checklist: formatChecklist(task)
            }));
    }, [project.tasks, versionTasks]);

    if (candidateTasks.length === 0) {
        return (
            <section
                className={`
                    ${windows12Styles.card}
                    ${windows12Styles.spacing.lg}
                    text-center
                `}
            >
                <p className="text-sm text-text-secondary">
                    Não encontramos próximos passos para {selectedVersion === 'Todos' ? 'o projeto' : selectedVersion}.
                </p>
                <p className="text-base text-text-primary mt-2">
                    Adicione novas tarefas ou ajuste os filtros para ver recomendações.
                </p>
            </section>
        );
    }

    return (
        <section className={`${windows12Styles.card} ${windows12Styles.spacing.lg} space-y-5`}>
            <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-text-secondary">Bloco 2</p>
                    <h3 className="text-xl font-semibold text-text-primary">Próximos passos essenciais</h3>
                    <p className="text-sm text-text-secondary">
                        Mostrando prioridades para {selectedVersion === 'Todos' ? 'todas as versões' : selectedVersion}.
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {candidateTasks.map(task => (
                    <article
                        key={task.id}
                        className={`
                            rounded-2xl border border-white/10 bg-white/5
                            p-4 flex flex-col gap-4
                            backdrop-blur hover:border-accent/40 transition-all
                        `}
                    >
                        <div>
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-xs uppercase tracking-wide text-text-secondary">
                                    {task.tags?.find(tag => /^V\d+/i.test(tag))?.toUpperCase() || 'Backlog'}
                                </p>
                                <span className={getStatusStyle(task.status)}>
                                    {task.status}
                                </span>
                            </div>
                            <h4 className="text-lg font-semibold text-text-primary mt-1">
                                {task.title}
                            </h4>
                            <p className="text-sm text-text-secondary line-clamp-2">
                                {task.description}
                            </p>
                        </div>

                        <div className="space-y-2 text-sm">
                            <p className="text-text-secondary uppercase text-[11px] tracking-[0.3em]">
                                Dependências
                            </p>
                            <p className="text-text-primary">{formatDependencies(task.dependencies)}</p>
                        </div>

                        <div>
                            <p className="text-text-secondary uppercase text-[11px] tracking-[0.3em] mb-2">
                                Checklist mínimo
                            </p>
                            <ul className="space-y-2">
                                {task.checklist!.map(item => (
                                    <li
                                        key={item.id}
                                        className={`
                                            flex items-center gap-2 text-sm
                                            ${item.checked ? 'text-emerald-300' : 'text-text-primary'}
                                        `}
                                    >
                                        <span
                                            className={`
                                                h-4 w-4 rounded-md border flex items-center justify-center
                                                ${item.checked
                                                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-200'
                                                    : 'border-white/10 text-text-secondary'}
                                            `}
                                        >
                                            {item.checked ? '✓' : ''}
                                        </span>
                                        <span className={item.checked ? 'line-through text-emerald-200/70' : ''}>
                                            {item.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            onClick={() => onStartStep(task.id)}
                            className={`
                                ${windows12Styles.buttonSecondary}
                                flex items-center justify-center gap-2 text-sm
                            `}
                        >
                            {task.status === 'In Progress' ? 'Continuar' : 'Iniciar'}
                            <span aria-hidden>→</span>
                        </button>
                    </article>
                ))}
            </div>
        </section>
    );
};

