import React, { useMemo } from 'react';
import { Card } from '../common/Card';
import { Project } from '../../types';

interface ProgressTrendsCardProps {
    project: Project;
    cumulativeProgress: Array<{ date: number; series: number[] }>;
}

export const ProgressTrendsCard: React.FC<ProgressTrendsCardProps> = ({ project }) => {
    const period = 7; // Período fixo de 7 dias
    
    const tasks = project.tasks || [];
    const allTestCases = tasks.flatMap(t => t.testCases || []);

    // Calcular métricas
    const trends = useMemo(() => {
        const sortedTasks = [...tasks].sort((a, b) => 
            new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );

        // Dias baseado no período
        const days = Array.from({ length: period }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (period - 1 - i));
            date.setHours(0, 0, 0, 0);
            return date.getTime();
        });

        const tasksByDay = days.map(day => {
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

        // Calcular velocidade média
        const totalCompleted = tasksByDay.reduce((sum, day) => sum + day.completed, 0);
        const averageVelocity = totalCompleted / period;

        // Calcular taxa de conclusão
        const totalCreated = tasksByDay.reduce((sum, day) => sum + day.created, 0);
        const totalCompletedSum = tasksByDay.reduce((sum, day) => sum + day.completed, 0);
        const completionRate = totalCreated > 0 ? (totalCompletedSum / totalCreated) * 100 : 0;

        return {
            averageVelocity: Math.round(averageVelocity * 10) / 10,
            totalCreated,
            totalCompleted: totalCompletedSum,
            completionRate: Math.round(completionRate),
            testsExecuted: allTestCases.filter(tc => tc.status !== 'Not Run').length,
        };
    }, [tasks, allTestCases, period]);

    return (
        <Card>
            <div className="p-6">
                {/* Cards de Métricas */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 hover:border-accent/40 transition-all group">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">📝</span>
                            <span className="text-xs text-text-tertiary group-hover:text-text-secondary transition-colors">
                                Últimos {period}d
                            </span>
                        </div>
                        <p className="text-xs text-text-tertiary mb-1">Tarefas Criadas</p>
                        <p className="text-2xl font-bold text-text-primary">{trends.totalCreated}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-success/10 to-success/5 border border-success/20 hover:border-success/40 transition-all group">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">✅</span>
                            <span className="text-xs text-text-tertiary group-hover:text-text-secondary transition-colors">
                                Últimos {period}d
                            </span>
                        </div>
                        <p className="text-xs text-text-tertiary mb-1">Tarefas Concluídas</p>
                        <p className="text-2xl font-bold text-text-primary">{trends.totalCompleted}</p>
                        <p className="text-xs text-success mt-1">
                            {trends.completionRate}% de conclusão
                        </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 hover:border-purple-500/40 transition-all group">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">⚡</span>
                            <span className="text-xs text-text-tertiary group-hover:text-text-secondary transition-colors">
                                Média diária
                            </span>
                        </div>
                        <p className="text-xs text-text-tertiary mb-1">Velocidade</p>
                        <p className="text-2xl font-bold text-text-primary">{trends.averageVelocity}</p>
                        <p className="text-xs text-text-tertiary mt-1">tarefas/dia</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 hover:border-blue-500/40 transition-all group">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-2xl">🧪</span>
                            <span className="text-xs text-text-tertiary group-hover:text-text-secondary transition-colors">
                                Total
                            </span>
                        </div>
                        <p className="text-xs text-text-tertiary mb-1">Testes Executados</p>
                        <p className="text-2xl font-bold text-text-primary">{trends.testsExecuted}</p>
                    </div>
                </div>
            </div>
        </Card>
    );
};
