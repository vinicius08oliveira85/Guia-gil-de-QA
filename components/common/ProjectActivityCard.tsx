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

interface MetricRingProps {
    metric: ProjectMetric;
    color: string;
    isHovering: boolean;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

/**
 * Componente isolado para renderizar um anel de métrica
 * Responsivo e acessível
 */
const MetricRing: React.FC<MetricRingProps> = ({
    metric,
    color,
    isHovering,
    onMouseEnter,
    onMouseLeave
}) => {
    const radius = 36; // Para viewBox 0-100
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - metric.trend / 100);
    
    return (
        <div
            className="relative flex flex-col items-center w-full min-w-0"
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            role="progressbar"
            aria-valuenow={metric.trend}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${metric.label}: ${metric.value} ${metric.unit}, ${metric.trend}% completo`}
        >
            {/* AUMENTADO: max-w ajustado para 140px para preencher melhor o card.
               mx-auto garante centralização.
            */}
            <div className="relative w-full aspect-square max-w-[96px] sm:max-w-[110px] md:max-w-[130px] lg:max-w-[140px] mx-auto">
                {/* Background ring */}
                <div className="absolute inset-0 rounded-full border-[4px] sm:border-[5px] border-base-200" />
                {/* Progress ring */}
                <svg 
                    aria-hidden="true"
                    className={cn(
                        "absolute inset-0 w-full h-full transform -rotate-90 transition-all duration-500",
                        isHovering && "md:scale-105"
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
                    {/* Texto ajustado para melhor espaçamento interno */}
                    <span className="block max-w-full px-1 text-center text-sm sm:text-base md:text-lg font-semibold tabular-nums text-base-content leading-none mb-0.5">
                        {metric.value}
                    </span>
                    <span className="block max-w-full px-1 text-center text-[10px] sm:text-[11px] md:text-xs font-normal text-base-content/60 leading-none">
                        {metric.unit}
                    </span>
                </div>
            </div>
            <span className="mt-2 text-sm sm:text-base font-medium text-base-content/80 text-center leading-tight">
                {metric.label}
            </span>
            <span className="text-xs text-base-content/50 leading-tight">
                {metric.trend}%
            </span>
        </div>
    );
};

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
        
        // Usar a mesma lógica do TasksView para consistência
        // Total: todas as tarefas (independente do tipo)
        const totalTasks = tasks.length;
        
        // Concluídas: tarefas com status 'Done' (mesma lógica do TasksView)
        const completedTasks = tasks.filter(t => t.status === 'Done').length;

        // Calcular bugs (mesma lógica do TasksView)
        // Total de bugs: todas as tarefas do tipo 'Bug'
        const totalBugs = tasks.filter(t => t.type === 'Bug').length;
        
        // Bugs concluídos: bugs com status 'Done'
        const completedBugs = tasks.filter(t => t.type === 'Bug' && t.status === 'Done').length;

        // Métricas para os rings
        const testExecutionPercent = projectMetrics.totalTestCases > 0
            ? Math.round((projectMetrics.executedTestCases / projectMetrics.totalTestCases) * 100)
            : 0;

        const taskProgressPercent = totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0;

        // Porcentagem de bugs concluídos
        const bugsCompletedPercent = totalBugs > 0
            ? Math.round((completedBugs / totalBugs) * 100)
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
                value: totalTasks, // Total de tarefas no anel
                trend: taskProgressPercent, // Porcentagem de concluídas (mostrada abaixo do anel)
                unit: 'Total' // Texto abaixo do número no anel
            },
            {
                label: 'Sucesso',
                value: totalBugs, // Total de bugs no anel
                trend: bugsCompletedPercent, // Porcentagem de bugs concluídos (mostrada abaixo do anel)
                unit: 'Bugs' // Texto abaixo do número no anel
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
                "relative h-full flex flex-col rounded-2xl sm:rounded-3xl px-4 py-4 md:px-5 md:py-6",
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
            <div className="flex items-start gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="p-1.5 sm:p-2 rounded-full bg-primary/10 flex-shrink-0 mt-0.5">
                    <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    {/* AUMENTADO: line-clamp-2 permite 2 linhas. min-h ajuda a alinhar cards vizinhos se um tiver titulo curto */}
                    <h3 className="text-base sm:text-lg font-semibold text-base-content line-clamp-3 min-h-[3rem]" title={project.name}>
                        {project.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-base-content/60 truncate mt-0.5">
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
                        className="btn btn-ghost btn-xs btn-circle opacity-100 sm:opacity-0 hover:opacity-100 group-hover:opacity-100 text-base-content/60 hover:text-error hover:bg-error/10 transition-all flex-shrink-0"
                        aria-label={`Excluir projeto ${project.name}`}
                    >
                        ×
                    </button>
                )}
            </div>

            {/* Metrics Rings - Grid layout Ajustado */}
            {/* gap-2 em mobile, gap-3/4 em desktop para não quebrar layout de 4 colunas */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 items-end justify-items-center mb-4 sm:mb-6 flex-1">
                {metrics.map((metric) => {
                    const color = METRIC_COLORS[metric.label as keyof typeof METRIC_COLORS] || '#007AFF';
                    
                    return (
                        <MetricRing
                            key={metric.label}
                            metric={metric}
                            color={color}
                            isHovering={isHovering === metric.label}
                            onMouseEnter={() => setIsHovering(metric.label)}
                            onMouseLeave={() => setIsHovering(null)}
                        />
                    );
                })}
            </div>

            {/* Goals Section */}
            {goals.length > 0 && (
                <div className="mt-auto space-y-3 sm:space-y-4">
                    <div className="h-px bg-gradient-to-r from-transparent via-base-300 to-transparent" />

                    <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-center gap-2">
                            <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-base-content/60 flex-shrink-0" />
                            <h4 className="text-xs sm:text-sm font-medium text-base-content/80">
                                Tarefas Principais
                            </h4>
                        </div>

                        <div className="space-y-1.5 sm:space-y-2">
                            {goals.map((goal) => (
                                <div
                                    key={goal.id}
                                    className={cn(
                                        "w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg",
                                        "bg-base-200/50",
                                        "border border-base-300/50",
                                        "hover:border-primary/30",
                                        "transition-all"
                                    )}
                                >
                                    <CheckCircle2
                                        className={cn(
                                            "w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0",
                                            goal.isCompleted
                                                ? "text-success"
                                                : "text-base-content/30"
                                        )}
                                    />
                                    <span
                                        className={cn(
                                            "text-xs sm:text-sm text-left flex-1 truncate",
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
            <div className="pt-3 sm:pt-4 mt-4 sm:mt-6 border-t border-base-300">
                <button
                    onClick={handleViewDetails}
                    className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium
                      text-primary hover:text-primary-focus
                      transition-colors duration-200"
                >
                    Ver Detalhes do Projeto
                    <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
            </div>
        </div>
    );
};
