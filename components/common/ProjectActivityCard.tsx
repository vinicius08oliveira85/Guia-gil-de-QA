import React, { useMemo, useState } from 'react';
import { Project, JiraTask } from '../../types';
import { Activity, ArrowUpRight, Target, CheckCircle2 } from 'lucide-react';
import { cn } from '../../utils/cn';
import { calculateProjectMetrics } from '../../hooks/useProjectMetrics';
import { getTaskStatusCategory } from '../../utils/jiraStatusCategorizer';

export interface ProjectMetric {
    label: string;
    value: string | number;
    trend: number; // Percentual (0-100)
    unit?: string;
}

export interface ProjectGoal {
    id: string;
    title: string;
    isCompleted: boolean;
}

interface ProjectActivityCardProps {
    project: Project;
    onSelect?: () => void;
    onDelete?: () => void;
    className?: string;
}

const METRIC_COLORS = {
    Testes: '#2CD758', // Verde
    Tarefas: '#007AFF', // Azul
    Sucesso: '#FF9500', // Laranja
} as const;

export const ProjectActivityCard: React.FC<ProjectActivityCardProps> = ({
    project,
    onSelect,
    onDelete,
    className
}) => {
    const [isHovering, setIsHovering] = useState<string | null>(null);

    // Calcular métricas do projeto
    const metrics = useMemo(() => {
        const projectMetrics = calculateProjectMetrics(project);
        const tasks = project.tasks || [];
        
        // Calcular tarefas completadas
        const totalTasks = tasks.filter(t => t.type === 'Tarefa').length;
        const completedTasks = tasks.filter(t => {
            if (t.type !== 'Tarefa') return false;
            const category = getTaskStatusCategory(t);
            return category === 'Concluído';
        }).length;

        // Métricas para os rings
        const testExecutionPercent = projectMetrics.totalTestCases > 0
            ? Math.round((projectMetrics.executedTestCases / projectMetrics.totalTestCases) * 100)
            : 0;

        const taskProgressPercent = totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0;

        const successRatePercent = projectMetrics.executedTestCases > 0
            ? Math.round((projectMetrics.passedTestCases / projectMetrics.executedTestCases) * 100)
            : 0;

        return [
            {
                label: 'Testes',
                value: projectMetrics.executedTestCases,
                trend: testExecutionPercent,
                unit: 'exec'
            },
            {
                label: 'Tarefas',
                value: completedTasks,
                trend: taskProgressPercent,
                unit: 'done'
            },
            {
                label: 'Sucesso',
                value: successRatePercent,
                trend: successRatePercent,
                unit: '%'
            }
        ] as ProjectMetric[];
    }, [project]);

    // Mapear tarefas para goals (top 3-4 tarefas pendentes)
    const goals = useMemo(() => {
        const tasks = project.tasks || [];
        const taskTasks = tasks.filter(t => t.type === 'Tarefa');
        
        // Priorizar tarefas sem casos de teste ou com alta prioridade
        const prioritizedTasks = taskTasks
            .map(task => {
                const hasTestCases = (task.testCases?.length || 0) > 0;
                const category = getTaskStatusCategory(task);
                const isCompleted = category === 'Concluído';
                const priority = task.priority === 'Urgente' ? 3 : task.priority === 'Alta' ? 2 : 1;
                
                return {
                    task,
                    priority: !hasTestCases ? 4 : priority,
                    isCompleted
                };
            })
            .sort((a, b) => {
                // Primeiro: não completadas
                if (a.isCompleted !== b.isCompleted) {
                    return a.isCompleted ? 1 : -1;
                }
                // Segundo: prioridade
                return b.priority - a.priority;
            })
            .slice(0, 4); // Top 4

        return prioritizedTasks.map((item, index) => ({
            id: item.task.id,
            title: item.task.title,
            isCompleted: item.isCompleted
        })) as ProjectGoal[];
    }, [project]);

    const handleViewDetails = () => {
        onSelect?.();
    };

    return (
        <div
            className={cn(
                "relative h-full rounded-3xl p-6",
                "bg-base-100",
                "border border-base-200",
                "hover:border-primary/30",
                "transition-all duration-300",
                "cursor-pointer",
                className
            )}
            onClick={(e) => {
                const target = e.target as HTMLElement;
                if (target.closest('button')) {
                    return;
                }
                onSelect?.();
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect?.();
                }
            }}
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-full bg-primary/10">
                    <Activity className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-base-content truncate" title={project.name}>
                        {project.name}
                    </h3>
                    <p className="text-sm text-base-content/60 truncate">
                        {project.settings?.jiraProjectKey ? `Jira: ${project.settings.jiraProjectKey}` : 'Projeto QA'}
                    </p>
                </div>
                {onDelete && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onDelete();
                        }}
                        className="btn btn-ghost btn-xs btn-circle opacity-0 hover:opacity-100 group-hover:opacity-100 text-base-content/60 hover:text-error hover:bg-error/10 transition-all"
                        aria-label={`Excluir projeto ${project.name}`}
                    >
                        ×
                    </button>
                )}
            </div>

            {/* Metrics Rings */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
                {metrics.map((metric) => {
                    const radius = 36; // Para viewBox 0-100, radius de 36 deixa espaço para strokeWidth 8
                    const circumference = 2 * Math.PI * radius;
                    const offset = circumference * (1 - metric.trend / 100);
                    const color = METRIC_COLORS[metric.label as keyof typeof METRIC_COLORS] || '#007AFF';
                    
                    return (
                        <div
                            key={metric.label}
                            className="relative flex flex-col items-center"
                            onMouseEnter={() => setIsHovering(metric.label)}
                            onMouseLeave={() => setIsHovering(null)}
                        >
                            <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                                {/* Background ring */}
                                <div className="absolute inset-0 rounded-full border-4 border-base-200" />
                                {/* Progress ring */}
                                <svg 
                                    className={cn(
                                        "absolute inset-0 w-full h-full transform -rotate-90 transition-all duration-500",
                                        isHovering === metric.label && "scale-105"
                                    )}
                                    viewBox="0 0 100 100"
                                >
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r={radius}
                                        fill="none"
                                        stroke={color}
                                        strokeWidth="8"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={offset}
                                        strokeLinecap="round"
                                        className="transition-all duration-500"
                                    />
                                </svg>
                                {/* Center content */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-lg sm:text-xl font-bold text-base-content">
                                        {metric.value}
                                    </span>
                                    <span className="text-[10px] sm:text-xs text-base-content/60">
                                        {metric.unit}
                                    </span>
                                </div>
                            </div>
                            <span className="mt-3 text-sm font-medium text-base-content/80 text-center">
                                {metric.label}
                            </span>
                            <span className="text-xs text-base-content/50">
                                {metric.trend}%
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Goals Section */}
            {goals.length > 0 && (
                <div className="mt-6 space-y-4">
                    <div className="h-px bg-gradient-to-r from-transparent via-base-300 to-transparent" />

                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-base-content/60" />
                            <h4 className="text-sm font-medium text-base-content/80">
                                Tarefas Principais
                            </h4>
                        </div>

                        <div className="space-y-2">
                            {goals.map((goal) => (
                                <div
                                    key={goal.id}
                                    className={cn(
                                        "w-full flex items-center gap-3 p-3 rounded-xl",
                                        "bg-base-200/50",
                                        "border border-base-300/50",
                                        "hover:border-primary/30",
                                        "transition-all"
                                    )}
                                >
                                    <CheckCircle2
                                        className={cn(
                                            "w-5 h-5 flex-shrink-0",
                                            goal.isCompleted
                                                ? "text-success"
                                                : "text-base-content/30"
                                        )}
                                    />
                                    <span
                                        className={cn(
                                            "text-sm text-left flex-1",
                                            goal.isCompleted
                                                ? "text-base-content/50 line-through"
                                                : "text-base-content/80"
                                        )}
                                        title={goal.title}
                                    >
                                        {goal.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="pt-4 mt-6 border-t border-base-300">
                <button
                    onClick={handleViewDetails}
                    className="inline-flex items-center gap-2 text-sm font-medium
                      text-primary hover:text-primary-focus
                      transition-colors duration-200"
                >
                    Ver Detalhes do Projeto
                    <ArrowUpRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

