import React, { useMemo, useState, useRef } from 'react';
import { Card } from '../common/Card';
import { Project } from '../../types';

interface ProgressTrendsCardProps {
    project: Project;
    cumulativeProgress: Array<{ date: number; series: number[] }>;
}

type PeriodFilter = 7 | 14 | 30;

interface TooltipData {
    date: string;
    created: number;
    completed: number;
    x: number;
    y: number;
}

export const ProgressTrendsCard: React.FC<ProgressTrendsCardProps> = ({ project, cumulativeProgress }) => {
    const [period, setPeriod] = useState<PeriodFilter>(7);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [tooltip, setTooltip] = useState<TooltipData | null>(null);
    const chartRef = useRef<HTMLDivElement>(null);
    
    const tasks = project.tasks || [];
    const allTestCases = tasks.flatMap(t => t.testCases || []);

    // Calcular tendências
    const trends = useMemo(() => {
        const sortedTasks = [...tasks].sort((a, b) => 
            new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );

        // Dias baseado no período selecionado
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

        // Calcular tendência melhorada
        const recentCompleted = tasksByDay.slice(-Math.ceil(period / 3)).reduce((sum, day) => sum + day.completed, 0);
        const previousCompleted = tasksByDay.slice(0, Math.ceil(period / 3)).reduce((sum, day) => sum + day.completed, 0);
        
        let trend: 'improving' | 'declining' | 'stable' = 'stable';
        const changePercent = previousCompleted > 0 ? ((recentCompleted - previousCompleted) / previousCompleted) * 100 : 0;
        
        if (changePercent > 10) {
            trend = 'improving';
        } else if (changePercent < -10) {
            trend = 'declining';
        }

        // Calcular velocidade média
        const totalCompleted = tasksByDay.reduce((sum, day) => sum + day.completed, 0);
        const averageVelocity = totalCompleted / period;

        // Calcular variação percentual
        const totalCreated = tasksByDay.reduce((sum, day) => sum + day.created, 0);
        const totalCompletedSum = tasksByDay.reduce((sum, day) => sum + day.completed, 0);
        const completionRate = totalCreated > 0 ? (totalCompletedSum / totalCreated) * 100 : 0;

        return {
            tasksByDay,
            trend,
            changePercent: Math.abs(changePercent),
            averageVelocity: Math.round(averageVelocity * 10) / 10,
            totalCreated,
            totalCompleted: totalCompletedSum,
            completionRate: Math.round(completionRate),
            testsExecuted: allTestCases.filter(tc => tc.status !== 'Not Run').length,
        };
    }, [tasks, allTestCases, period]);

    const trendLabels = {
        improving: { 
            label: 'Melhorando', 
            icon: '📈', 
            color: 'text-success',
            bgColor: 'bg-success/10',
            borderColor: 'border-success/30'
        },
        declining: { 
            label: 'Declinando', 
            icon: '📉', 
            color: 'text-danger',
            bgColor: 'bg-danger/10',
            borderColor: 'border-danger/30'
        },
        stable: { 
            label: 'Estável', 
            icon: '➡️', 
            color: 'text-text-secondary',
            bgColor: 'bg-surface-hover/50',
            borderColor: 'border-surface-border'
        },
    };

    const trendInfo = trendLabels[trends.trend];

    // Calcular dimensões do gráfico - aumentado para melhor visualização
    const chartWidth = 100;
    const chartHeight = 250;
    const padding = { top: 25, right: 10, bottom: 35, left: 10 };
    const graphWidth = chartWidth - padding.left - padding.right;
    const graphHeight = chartHeight - padding.top - padding.bottom;

    // Preparar dados para SVG - formato empilhado
    const maxValue = Math.max(
        ...trends.tasksByDay.map(d => d.created),
        1
    );

    // Calcular pontos para gráfico empilhado
    const points = trends.tasksByDay.map((day, index) => {
        const x = padding.left + (index / (trends.tasksByDay.length - 1 || 1)) * graphWidth;
        
        // Base (zero)
        const bottomY = padding.top + graphHeight;
        
        // Topo da área de concluídas (verde)
        const completedTopY = padding.top + graphHeight - (day.completed / maxValue) * graphHeight;
        
        // Topo da área total (criadas) - azul vai de completedTopY até createdTopY
        const createdTopY = padding.top + graphHeight - (day.created / maxValue) * graphHeight;
        
        // Área pendente (criadas - concluídas)
        const pendingHeight = day.created > day.completed ? day.created - day.completed : 0;
        const pendingTopY = padding.top + graphHeight - ((day.completed + pendingHeight) / maxValue) * graphHeight;
        
        return {
            x,
            bottomY,
            completedTopY,
            createdTopY,
            pendingTopY,
            day,
            index,
            completed: day.completed,
            created: day.created,
            pending: pendingHeight,
        };
    });

    // Criar paths para áreas empilhadas
    const createStackedAreaPath = (points: typeof points, type: 'completed' | 'pending') => {
        if (points.length === 0) return '';
        
        // Path superior (topo da área)
        const topPoints = points.map(p => {
            const y = type === 'completed' ? p.completedTopY : p.pendingTopY;
            return `${p.x},${y}`;
        });
        
        // Path inferior (base da área)
        const bottomPoints = [...points].reverse().map(p => {
            const y = type === 'completed' ? p.bottomY : p.completedTopY;
            return `${p.x},${y}`;
        });
        
        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        const topY = type === 'completed' ? firstPoint.completedTopY : firstPoint.pendingTopY;
        const bottomY = type === 'completed' ? firstPoint.bottomY : firstPoint.completedTopY;
        
        return `M ${firstPoint.x},${bottomY} L ${topPoints.join(' L ')} L ${lastPoint.x},${topY} L ${bottomPoints.join(' L ')} Z`;
    };

    const completedAreaPath = createStackedAreaPath(points, 'completed');
    const pendingAreaPath = createStackedAreaPath(points, 'pending');

    // Criar paths para linhas de referência (topo de cada área)
    const createLinePath = (points: typeof points, type: 'completed' | 'created') => {
        if (points.length === 0) return '';
        
        const pathPoints = points.map((p, i) => {
            const y = type === 'completed' ? p.completedTopY : p.createdTopY;
            return i === 0 ? `M ${p.x},${y}` : `L ${p.x},${y}`;
        });

        return pathPoints.join(' ');
    };

    const completedLinePath = createLinePath(points, 'completed');
    const createdLinePath = createLinePath(points, 'created');

    // Handler para hover
    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>, index: number) => {
        if (!chartRef.current) return;
        
        const rect = chartRef.current.getBoundingClientRect();
        const point = points[index];
        const day = trends.tasksByDay[index];
        
        setHoveredIndex(index);
        setTooltip({
            date: new Date(day.date).toLocaleDateString('pt-BR', { 
                weekday: 'short', 
                day: '2-digit', 
                month: '2-digit' 
            }),
            created: day.created,
            completed: day.completed,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    const handleMouseLeave = () => {
        setHoveredIndex(null);
        setTooltip(null);
    };

    return (
        <Card>
            <div className="space-y-6">
                {/* Header com filtros */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-semibold text-text-primary mb-1">
                            Tendências e Progresso
                        </h3>
                        <p className="text-sm text-text-secondary">
                            Acompanhamento de produtividade e progresso do projeto
                        </p>
                    </div>
                    
                    {/* Filtros de período */}
                    <div className="flex items-center gap-2">
                        {([7, 14, 30] as PeriodFilter[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
                                    period === p
                                        ? 'bg-accent text-white shadow-lg shadow-accent/20'
                                        : 'bg-surface-hover text-text-secondary hover:text-text-primary hover:bg-surface-hover/80'
                                }`}
                                aria-label={`Filtrar últimos ${p} dias`}
                            >
                                {p}d
                            </button>
                        ))}
                    </div>
                </div>

                {/* Indicador de tendência melhorado */}
                <div className={`flex items-center justify-between p-4 rounded-2xl border-2 ${trendInfo.bgColor} ${trendInfo.borderColor} transition-all`}>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{trendInfo.icon}</span>
                        <div>
                            <p className="text-sm text-text-secondary">Tendência</p>
                            <p className={`text-lg font-bold ${trendInfo.color}`}>
                                {trendInfo.label}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-text-tertiary">Variação</p>
                        <p className={`text-lg font-bold ${trendInfo.color}`}>
                            {trends.changePercent > 0 ? '+' : ''}{trends.changePercent.toFixed(1)}%
                        </p>
                    </div>
                </div>

                {/* Gráfico de Área */}
                <div className="relative" ref={chartRef}>
                    <div className="mb-4">
                        <h4 className="text-sm font-semibold text-text-primary mb-1">
                            Progresso de Tarefas (Últimos {period} dias)
                        </h4>
                        <p className="text-xs text-text-tertiary">
                            Visualização temporal de criação e conclusão de tarefas
                        </p>
                    </div>
                    
                    <div className="relative bg-surface-hover/30 rounded-2xl p-4 overflow-hidden">
                        <svg
                            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                            className="w-full h-80"
                            onMouseLeave={handleMouseLeave}
                            aria-label="Gráfico de progresso de tarefas"
                            role="img"
                        >
                            <defs>
                                {/* Gradiente para área de concluídas (base) - Verde */}
                                <linearGradient id="completedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="rgb(47, 219, 147)" stopOpacity="0.7" />
                                    <stop offset="100%" stopColor="rgb(47, 219, 147)" stopOpacity="0.3" />
                                </linearGradient>
                                
                                {/* Gradiente para área de pendentes (topo) - Azul */}
                                <linearGradient id="pendingGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="rgb(14, 109, 253)" stopOpacity="0.6" />
                                    <stop offset="100%" stopColor="rgb(14, 109, 253)" stopOpacity="0.2" />
                                </linearGradient>
                                
                                {/* Padrão para grid lines */}
                                <pattern id="gridPattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="0.5"/>
                                </pattern>
                            </defs>
                            
                            {/* Grid lines horizontais */}
                            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                                const y = padding.top + graphHeight - (ratio * graphHeight);
                                return (
                                    <line
                                        key={ratio}
                                        x1={padding.left}
                                        y1={y}
                                        x2={padding.left + graphWidth}
                                        y2={y}
                                        stroke="rgba(255, 255, 255, 0.08)"
                                        strokeWidth="0.5"
                                        strokeDasharray="2 2"
                                    />
                                );
                            })}

                            {/* Área de concluídas (base) - Verde */}
                            <path
                                d={completedAreaPath}
                                fill="url(#completedGradient)"
                                className="transition-opacity duration-300"
                                style={{ opacity: hoveredIndex !== null ? 0.7 : 1 }}
                            />
                            
                            {/* Área de pendentes (topo) - Azul - destacando a diferença */}
                            <path
                                d={pendingAreaPath}
                                fill="url(#pendingGradient)"
                                stroke="rgba(14, 109, 253, 0.4)"
                                strokeWidth="0.5"
                                className="transition-opacity duration-300"
                                style={{ opacity: hoveredIndex !== null ? 0.7 : 1 }}
                            />

                            {/* Linha de separação entre concluídas e pendentes */}
                            <path
                                d={completedLinePath}
                                fill="none"
                                stroke="rgb(47, 219, 147)"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="transition-opacity duration-300"
                                style={{ opacity: hoveredIndex !== null ? 0.8 : 1 }}
                            />

                            {/* Linha de topo (total criadas) - Azul */}
                            <path
                                d={createdLinePath}
                                fill="none"
                                stroke="rgb(14, 109, 253)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="transition-opacity duration-300"
                                style={{ opacity: hoveredIndex !== null ? 0.8 : 1 }}
                            />

                            {/* Pontos interativos */}
                            {points.map((point, index) => (
                                <g key={index}>
                                    {/* Círculo no topo (total criadas) - Azul */}
                                    <circle
                                        cx={point.x}
                                        cy={point.createdTopY}
                                        r={hoveredIndex === index ? 6 : 4}
                                        fill="rgb(14, 109, 253)"
                                        stroke="rgba(255, 255, 255, 0.4)"
                                        strokeWidth="1.5"
                                        className="transition-all duration-200 cursor-pointer"
                                        onMouseMove={(e) => handleMouseMove(e, index)}
                                        style={{ opacity: hoveredIndex === index || hoveredIndex === null ? 1 : 0.5 }}
                                    />
                                    
                                    {/* Círculo na linha de separação (concluídas) - Verde */}
                                    <circle
                                        cx={point.x}
                                        cy={point.completedTopY}
                                        r={hoveredIndex === index ? 6 : 4}
                                        fill="rgb(47, 219, 147)"
                                        stroke="rgba(255, 255, 255, 0.4)"
                                        strokeWidth="1.5"
                                        className="transition-all duration-200 cursor-pointer"
                                        onMouseMove={(e) => handleMouseMove(e, index)}
                                        style={{ opacity: hoveredIndex === index || hoveredIndex === null ? 1 : 0.5 }}
                                    />
                                    
                                    {/* Linha vertical no hover */}
                                    {hoveredIndex === index && (
                                        <>
                                            <line
                                                x1={point.x}
                                                y1={padding.top}
                                                x2={point.x}
                                                y2={padding.top + graphHeight}
                                                stroke="rgba(255, 255, 255, 0.4)"
                                                strokeWidth="1.5"
                                                strokeDasharray="3 3"
                                            />
                                            {/* Marcadores horizontais no hover */}
                                            <line
                                                x1={padding.left}
                                                y1={point.completedTopY}
                                                x2={padding.left + graphWidth}
                                                y2={point.completedTopY}
                                                stroke="rgba(47, 219, 147, 0.3)"
                                                strokeWidth="1"
                                                strokeDasharray="2 2"
                                            />
                                            <line
                                                x1={padding.left}
                                                y1={point.createdTopY}
                                                x2={padding.left + graphWidth}
                                                y2={point.createdTopY}
                                                stroke="rgba(14, 109, 253, 0.3)"
                                                strokeWidth="1"
                                                strokeDasharray="2 2"
                                            />
                                        </>
                                    )}
                                </g>
                            ))}

                            {/* Labels do eixo X */}
                            {points.map((point, index) => {
                                if (period === 7 && index % 1 !== 0 && index !== points.length - 1) return null;
                                if (period === 14 && index % 2 !== 0 && index !== points.length - 1) return null;
                                if (period === 30 && index % 5 !== 0 && index !== points.length - 1) return null;
                                
                                return (
                                    <text
                                        key={index}
                                        x={point.x}
                                        y={chartHeight - padding.bottom + 15}
                                        textAnchor="middle"
                                        className="text-xs fill-text-tertiary"
                                    >
                                        {new Date(point.day.date).toLocaleDateString('pt-BR', { 
                                            day: '2-digit', 
                                            month: '2-digit' 
                                        })}
                                    </text>
                                );
                            })}
                        </svg>

                        {/* Tooltip */}
                        {tooltip && (
                            <div
                                className="absolute z-10 px-4 py-3 rounded-xl bg-surface border border-surface-border shadow-2xl pointer-events-none transition-all"
                                style={{
                                    left: `${tooltip.x}px`,
                                    top: `${tooltip.y - 100}px`,
                                    transform: 'translateX(-50%)',
                                }}
                            >
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-text-primary">{tooltip.date}</p>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded bg-[#2FDB93]"></div>
                                            <span className="text-xs text-text-secondary">Concluídas:</span>
                                            <span className="text-sm font-bold text-text-primary">{tooltip.completed}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded bg-[#0E6DFD]"></div>
                                            <span className="text-xs text-text-secondary">Pendentes:</span>
                                            <span className="text-sm font-bold text-text-primary">{tooltip.created - tooltip.completed}</span>
                                        </div>
                                        <div className="flex items-center gap-2 pt-1 border-t border-surface-border/50">
                                            <span className="text-xs text-text-secondary">Total Criadas:</span>
                                            <span className="text-sm font-bold text-text-primary">{tooltip.created}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Legenda */}
                    <div className="flex items-center justify-center gap-4 mt-4">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-hover/50 border border-[#2FDB93]/20">
                            <div className="w-4 h-4 rounded bg-[#2FDB93] shadow-sm"></div>
                            <span className="text-sm font-medium text-text-primary">Concluídas</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-hover/50 border border-[#0E6DFD]/20">
                            <div className="w-4 h-4 rounded bg-[#0E6DFD] shadow-sm"></div>
                            <span className="text-sm font-medium text-text-primary">Pendentes</span>
                        </div>
                        <div className="text-xs text-text-tertiary px-2">
                            (Total: Concluídas + Pendentes)
                        </div>
                    </div>
                </div>

                {/* Cards de Métricas Melhorados */}
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
