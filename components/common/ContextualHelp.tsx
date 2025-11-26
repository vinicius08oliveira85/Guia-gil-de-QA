import React, { useState } from 'react';
import { HelpTooltip } from './HelpTooltip';

interface ContextualHelpProps {
    title: string;
    content: string | React.ReactNode;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    variant?: 'tooltip' | 'banner' | 'inline';
    icon?: React.ReactNode;
}

/**
 * Componente de ajuda contextual que fornece informações úteis
 * baseadas no contexto atual do usuário
 */
export const ContextualHelp: React.FC<ContextualHelpProps> = ({
    title,
    content,
    placement = 'top',
    variant = 'tooltip',
    icon
}) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (variant === 'tooltip') {
        return (
            <HelpTooltip content={content} placement={placement}>
                <button
                    type="button"
                    className="inline-flex items-center gap-1 text-text-secondary hover:text-accent transition-colors"
                    aria-label={title}
                >
                    {icon || (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                </button>
            </HelpTooltip>
        );
    }

    if (variant === 'banner') {
        return (
            <div className="rounded-lg border border-accent/30 bg-accent/10 p-4">
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                        {icon || (
                            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-text-primary mb-1">{title}</h4>
                        <div className="text-sm text-text-secondary">
                            {typeof content === 'string' ? <p>{content}</p> : content}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // inline variant
    return (
        <div className="inline-flex items-start gap-2">
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex-shrink-0 mt-0.5 text-text-secondary hover:text-accent transition-colors"
                aria-label={title}
                aria-expanded={isExpanded}
            >
                {icon || (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )}
            </button>
            {isExpanded && (
                <div className="flex-1 rounded-lg border border-surface-border bg-surface p-3 text-sm text-text-secondary">
                    <h4 className="font-semibold text-text-primary mb-1">{title}</h4>
                    {typeof content === 'string' ? <p>{content}</p> : content}
                </div>
            )}
        </div>
    );
};

/**
 * Hook para obter ajuda contextual baseada no contexto atual
 */
export const useContextualHelp = (context: string) => {
    const helpContent: Record<string, { title: string; content: string }> = {
        'metrics-overview': {
            title: 'Visão Geral de Métricas',
            content: 'Esta seção consolida todas as métricas principais do projeto em um único lugar. Use o seletor de versão para filtrar métricas por versão específica.'
        },
        'test-coverage': {
            title: 'Cobertura de Testes',
            content: 'A cobertura de testes indica quantas tarefas têm casos de teste documentados. Uma cobertura acima de 70% é recomendada para projetos em produção.'
        },
        'quality-metrics': {
            title: 'Métricas de Qualidade',
            content: 'As métricas de qualidade incluem taxa de aprovação de testes, bugs abertos e análise de risco. Use a análise IA para obter recomendações personalizadas.'
        },
        'filters': {
            title: 'Filtros Rápidos',
            content: 'Use os filtros para encontrar tarefas específicas rapidamente. Os filtros são salvos automaticamente e persistem entre sessões.'
        },
        'tasks': {
            title: 'Gerenciamento de Tarefas',
            content: 'Organize suas tarefas usando tags, prioridades e dependências. Use templates para criar tarefas rapidamente com estruturas pré-definidas.'
        }
    };

    return helpContent[context] || { title: 'Ajuda', content: 'Informação não disponível para este contexto.' };
};

