import React, { useMemo } from 'react';
import { Card } from '../common/Card';
import { Project } from '../../types';

interface ProgressTrendsCardProps {
    project: Project;
    cumulativeProgress: Array<{ date: number; series: number[] }>;
}

export const ProgressTrendsCard: React.FC<ProgressTrendsCardProps> = ({ project, cumulativeProgress }) => {
    const tasks = project.tasks || [];
    const allTestCases = tasks.flatMap(t => t.testCases || []);

    // Calcular tendências
    const trends = useMemo(() => {
        const sortedTasks = [...tasks].sort((a, b) => 
            new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );

        // Últimos 7 dias de atividade
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            date.setHours(0, 0, 0, 0);
            return date.getTime();
        });

        const tasksByDay = last7Days.map(day => {
            const dayStart = day;
            const dayEnd = day + (24 * 60 * 60 * 1000);
            return {
                date: day,
                created: sortedTasks.filter(t => {
                    const created = new Date(t.createdAt || 0).getTime();
                    return created >= dayStart && created < dayEnd;
                }).length,
                completed: sortedTasks.filter(t => {
                    const completed = t.completedAt ? new Date(t.completedAt).getTime() : 0;
                    return completed >= dayStart && completed < dayEnd;
                }).length,
            };
        });

        // Calcular tendência (melhorando, piorando, estável)
        const recentCompleted = tasksByDay.slice(-3).reduce((sum, day) => sum + day.completed, 0);
        const previousCompleted = tasksByDay.slice(0, 3).reduce((sum, day) => sum + day.completed, 0);
        
        let trend: 'improving' | 'declining' | 'stable' = 'stable';
        if (recentCompleted > previousCompleted * 1.1) {
            trend = 'improving';
        } else if (recentCompleted < previousCompleted * 0.9) {
            trend = 'declining';
        }

        // Testes executados nos últimos 7 dias
        const testsByDay = last7Days.map(day => {
            const dayStart = day;
            const dayEnd = day + (24 * 60 * 60 * 1000);
            return {
                date: day,
                executed: allTestCases.filter(tc => {
                    // Assumindo que testes executados têm um campo executedAt
                    // Por enquanto, vamos usar uma estimativa baseada no status
                    return tc.status !== 'Not Run';
                }).length,
            };
        });

        return {
            tasksByDay,
            testsByDay,
            trend,
        };
    }, [tasks, allTestCases]);

    const trendLabels = {
        improving: { label: 'Melhorando', icon: '📈', color: 'text-success' },
        declining: { label: 'Declinando', icon: '📉', color: 'text-danger' },
        stable: { label: 'Estável', icon: '➡️', color: 'text-text-secondary' },
    };

    const trendInfo = trendLabels[trends.trend];

    return (
        <Card>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-text-primary">Tendências e Progresso</h3>
                    <div className="flex items-center gap-2">
                        <span className="text-lg">{trendInfo.icon}</span>
                        <span className={`text-sm font-semibold ${trendInfo.color}`}>{trendInfo.label}</span>
                    </div>
                </div>

                {/* Gráfico de Progresso de Tarefas (Últimos 7 dias) */}
                <div>
                    <h4 className="text-sm font-semibold text-text-secondary mb-3">Progresso de Tarefas (Últimos 7 dias)</h4>
                    <div className="h-32 flex items-end justify-between gap-1">
                        {trends.tasksByDay.map((day, index) => {
                            const maxValue = Math.max(
                                ...trends.tasksByDay.map(d => Math.max(d.created, d.completed)),
                                1
                            );
                            const createdHeight = maxValue > 0 ? (day.created / maxValue) * 100 : 0;
                            const completedHeight = maxValue > 0 ? (day.completed / maxValue) * 100 : 0;
                            
                            return (
                                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                                    <div className="w-full flex flex-col-reverse gap-0.5" style={{ height: '100%' }}>
                                        <div
                                            className="w-full bg-accent/60 rounded-t transition-all"
                                            style={{ height: `${completedHeight}%`, minHeight: completedHeight > 0 ? '4px' : '0' }}
                                            title={`Concluídas: ${day.completed}`}
                                        />
                                        <div
                                            className="w-full bg-accent rounded-t transition-all"
                                            style={{ height: `${createdHeight}%`, minHeight: createdHeight > 0 ? '4px' : '0' }}
                                            title={`Criadas: ${day.created}`}
                                        />
                                    </div>
                                    <span className="text-xs text-text-tertiary mt-1">
                                        {new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex items-center justify-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-accent"></div>
                            <span className="text-xs text-text-secondary">Criadas</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded bg-accent/60"></div>
                            <span className="text-xs text-text-secondary">Concluídas</span>
                        </div>
                    </div>
                </div>

                {/* Resumo de Progresso */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-surface-border">
                    <div className="text-center p-2 rounded-xl bg-surface-hover/50">
                        <p className="text-xs text-text-tertiary mb-1">Tarefas Criadas</p>
                        <p className="text-lg font-bold text-text-primary">
                            {trends.tasksByDay.reduce((sum, day) => sum + day.created, 0)}
                        </p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-surface-hover/50">
                        <p className="text-xs text-text-tertiary mb-1">Tarefas Concluídas</p>
                        <p className="text-lg font-bold text-text-primary">
                            {trends.tasksByDay.reduce((sum, day) => sum + day.completed, 0)}
                        </p>
                    </div>
                    <div className="text-center p-2 rounded-xl bg-surface-hover/50">
                        <p className="text-xs text-text-tertiary mb-1">Testes Executados</p>
                        <p className="text-lg font-bold text-text-primary">
                            {allTestCases.filter(tc => tc.status !== 'Not Run').length}
                        </p>
                    </div>
                </div>
            </div>
        </Card>
    );
};

