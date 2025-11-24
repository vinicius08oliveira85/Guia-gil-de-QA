import React from 'react';
import { Card } from '../common/Card';
import { useQualityMetrics } from '../../hooks/useQualityMetrics';
import { Project } from '../../types';

interface QualityTrafficLightProps {
    project: Project;
}

export const QualityTrafficLight: React.FC<QualityTrafficLightProps> = ({ project }) => {
    const metrics = useQualityMetrics(project);
    
    // Determinar status do semáforo
    const hasCriticalBugs = metrics.criticalBugsOpen > 0;
    const hasRegressionFail = metrics.regressionStatus === 'Fail';
    
    // Status: Go (verde), Warning (amarelo), No-Go (vermelho)
    const status = hasCriticalBugs || hasRegressionFail ? 'No-Go' : 'Go';
    const statusColor = status === 'Go' 
        ? 'text-emerald-400' 
        : status === 'Warning' 
        ? 'text-amber-400' 
        : 'text-rose-400';
    
    const statusBg = status === 'Go'
        ? 'bg-emerald-500/20'
        : status === 'Warning'
        ? 'bg-amber-500/20'
        : 'bg-rose-500/20';
    
    const statusBorder = status === 'Go'
        ? 'border-emerald-500/40'
        : status === 'Warning'
        ? 'border-amber-500/40'
        : 'border-rose-500/40';
    
    const statusGlow = status === 'Go'
        ? 'shadow-[0_0_40px_rgba(16,185,129,0.3)]'
        : status === 'Warning'
        ? 'shadow-[0_0_40px_rgba(245,158,11,0.3)]'
        : 'shadow-[0_0_40px_rgba(244,63,94,0.3)]';
    
    return (
        <Card className={`!p-6 sm:!p-8 relative overflow-hidden border-2 ${statusBorder} ${statusGlow}`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${statusBg} to-transparent opacity-50`} />
            
            <div className="relative">
                <div className="flex flex-col items-center justify-center gap-6">
                    {/* Semáforo Visual */}
                    <div className="relative">
                        <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full ${statusColor} ${statusBg} border-4 ${statusBorder} flex items-center justify-center ${statusGlow} transition-all duration-500`}>
                            {status === 'Go' ? (
                                <svg className="w-12 h-12 sm:w-16 sm:h-16" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-12 h-12 sm:w-16 sm:h-16" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            )}
                        </div>
                    </div>
                    
                    {/* Status Text */}
                    <div className="text-center">
                        <h2 className={`text-3xl sm:text-4xl font-bold ${statusColor} mb-2`}>
                            {status === 'Go' ? 'GO' : 'NO-GO'}
                        </h2>
                        <p className="text-text-secondary text-sm sm:text-base">
                            {status === 'Go' 
                                ? 'Produto pronto para produção' 
                                : 'Produto não está pronto para produção'}
                        </p>
                    </div>
                    
                    {/* Métricas Detalhadas */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-4">
                        <div className={`rounded-2xl border ${hasCriticalBugs ? 'border-rose-500/40 bg-rose-500/10' : 'border-emerald-500/40 bg-emerald-500/10'} p-4`}>
                            <div className="flex items-center justify-between">
                                <span className="text-text-secondary text-sm">Bugs Críticos em Aberto</span>
                                <span className={`text-2xl font-bold ${hasCriticalBugs ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {metrics.criticalBugsOpen}
                                </span>
                            </div>
                            <p className="text-xs text-text-secondary/80 mt-1">
                                Meta: 0
                            </p>
                        </div>
                        
                        <div className={`rounded-2xl border ${hasRegressionFail ? 'border-rose-500/40 bg-rose-500/10' : 'border-emerald-500/40 bg-emerald-500/10'} p-4`}>
                            <div className="flex items-center justify-between">
                                <span className="text-text-secondary text-sm">Regressão Automática</span>
                                <span className={`text-2xl font-bold ${hasRegressionFail ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {metrics.regressionStatus === 'Pass' ? 'PASS' : 'FAIL'}
                                </span>
                            </div>
                            <p className="text-xs text-text-secondary/80 mt-1">
                                {hasRegressionFail ? 'Testes automatizados falhando' : 'Todos os testes passando'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
};

