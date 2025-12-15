import React from 'react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

interface TaskStatusCardProps {
    taskStatus: {
        toDo: number;
        inProgress: number;
        done: number;
        blocked: number;
        distribution: Array<{ status: string; count: number; percentage: number }>;
    };
    totalTasks: number;
}

const statusConfig: Record<string, { label: string; icon: string; color: string; bgColor: string }> = {
    'To Do': { label: 'A Fazer', icon: '📝', color: 'text-base-content/70', bgColor: 'bg-base-200' },
    'In Progress': { label: 'Em Progresso', icon: '🔄', color: 'text-warning', bgColor: 'bg-warning/10' },
    'Done': { label: 'Concluído', icon: '✅', color: 'text-success', bgColor: 'bg-success/10' },
    'Blocked': { label: 'Bloqueado', icon: '🚫', color: 'text-error', bgColor: 'bg-error/10' },
};

export const TaskStatusCard: React.FC<TaskStatusCardProps> = ({ taskStatus, totalTasks }) => {
    const progressPercentage = totalTasks > 0 
        ? Math.round((taskStatus.done / totalTasks) * 100) 
        : 0;

    return (
        <Card className="p-5 space-y-4 border border-base-300 hover:border-primary/30 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-base-content">Status das Tarefas</h3>
                <Badge variant="info" size="sm">
                    {totalTasks} total
                </Badge>
            </div>

            {/* Progresso Geral */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-base-content/70">Progresso Geral</span>
                    <span className="text-sm font-semibold text-base-content">{progressPercentage}%</span>
                </div>
                <div className="w-full h-3 bg-base-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${progressPercentage}%` }}
                    />
                </div>
            </div>

            {/* Distribuição por Status */}
            <div className="space-y-3">
                {taskStatus.distribution.map((item) => {
                    const config = statusConfig[item.status] || statusConfig['To Do'];
                    return (
                        <div key={item.status} className="space-y-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">{config.icon}</span>
                                    <span className="text-sm font-medium text-base-content">{config.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-base-content">{item.count}</span>
                                    <span className="text-xs text-base-content/50">({item.percentage}%)</span>
                                </div>
                            </div>
                            <div className="w-full h-2 bg-base-200 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${config.bgColor} transition-all duration-300`}
                                    style={{ width: `${item.percentage}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Resumo Rápido */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-base-300">
                <div className="text-center p-3 rounded-xl bg-success/10">
                    <p className="text-xs text-base-content/60 mb-1">Concluídas</p>
                    <p className="text-xl font-bold text-success">{taskStatus.done}</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-warning/10">
                    <p className="text-xs text-base-content/60 mb-1">Em Progresso</p>
                    <p className="text-xl font-bold text-warning">{taskStatus.inProgress}</p>
                </div>
            </div>
        </Card>
    );
};

