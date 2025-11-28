import React from 'react';
import { Requirement, STLCPhaseName } from '../../types';
import { RequirementAccess } from '../../utils/requirementAccessControl';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';

interface RequirementCardProps {
    requirement: Requirement;
    access: RequirementAccess;
    currentPhase: STLCPhaseName;
    onEdit?: () => void;
    onDelete?: () => void;
}

const phaseIcons: Record<STLCPhaseName, string> = {
    'Análise de Requisitos': '🔎',
    'Planejamento de Testes': '📋',
    'Desenvolvimento de Casos de Teste': '✍️',
    'Execução de Testes': '🚀',
    'Encerramento do Teste': '✅',
};

const statusColors: Record<Requirement['status'], 'default' | 'success' | 'warning' | 'info'> = {
    'Rascunho': 'default',
    'Aprovado': 'info',
    'Em Teste': 'warning',
    'Validado': 'success',
};

const priorityColors: Record<Requirement['priority'], 'default' | 'warning' | 'error'> = {
    'Baixa': 'default',
    'Média': 'default',
    'Alta': 'warning',
    'Urgente': 'error',
};

export const RequirementCard: React.FC<RequirementCardProps> = ({
    requirement,
    access,
    currentPhase,
    onEdit,
    onDelete,
}) => {
    const isRestricted = access.accessLevel === 'restricted';
    const isFuturePhase = requirement.stlcPhase !== currentPhase && 
        requirement.stlcPhase !== 'Análise de Requisitos' && 
        requirement.stlcPhase !== 'Planejamento de Testes';

    return (
        <Card className={`${isRestricted ? 'opacity-75 border-2 border-warning/30' : ''}`}>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">{phaseIcons[requirement.stlcPhase]}</span>
                            <h3 className={`text-lg font-semibold ${isRestricted ? 'text-text-secondary' : 'text-text-primary'}`}>
                                {requirement.id} - {requirement.title}
                            </h3>
                        </div>
                        <p className={`text-sm ${isRestricted ? 'text-text-tertiary' : 'text-text-secondary'} line-clamp-2`}>
                            {requirement.description}
                        </p>
                    </div>
                    {isRestricted && (
                        <Badge variant="warning" size="sm">
                            Restrito
                        </Badge>
                    )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                    <Badge variant={statusColors[requirement.status]} size="sm">
                        {requirement.status}
                    </Badge>
                    <Badge variant={requirement.type === 'Funcional' ? 'info' : 'default'} size="sm">
                        {requirement.type}
                    </Badge>
                    <Badge variant={priorityColors[requirement.priority]} size="sm">
                        {requirement.priority}
                    </Badge>
                    <Badge variant="default" size="sm">
                        {phaseIcons[requirement.stlcPhase]} {requirement.stlcPhase}
                    </Badge>
                </div>

                {/* Restrição de Acesso */}
                {isRestricted && access.message && (
                    <div className="p-3 rounded-xl bg-warning/10 border border-warning/30">
                        <p className="text-sm font-semibold text-warning-dark">
                            {access.message}
                        </p>
                    </div>
                )}

                {/* Critérios de Aceitação */}
                {requirement.acceptanceCriteria.length > 0 && (
                    <div>
                        <p className="text-xs font-semibold text-text-secondary mb-2">
                            Critérios de Aceitação:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-text-secondary">
                            {requirement.acceptanceCriteria.slice(0, 3).map((criteria, idx) => (
                                <li key={idx}>{criteria}</li>
                            ))}
                            {requirement.acceptanceCriteria.length > 3 && (
                                <li className="text-text-tertiary">
                                    +{requirement.acceptanceCriteria.length - 3} mais
                                </li>
                            )}
                        </ul>
                    </div>
                )}

                {/* Estatísticas */}
                <div className="flex gap-4 text-sm text-text-secondary">
                    <span>
                        {requirement.relatedTasks.length} {requirement.relatedTasks.length === 1 ? 'tarefa' : 'tarefas'}
                    </span>
                    <span>
                        {requirement.testCases.length} {requirement.testCases.length === 1 ? 'caso de teste' : 'casos de teste'}
                    </span>
                </div>

                {/* Ações */}
                {!isRestricted && (
                    <div className="flex gap-2 pt-2 border-t border-surface-border">
                        {access.canEdit && onEdit && (
                            <button
                                onClick={onEdit}
                                className="px-4 py-2 text-sm rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
                            >
                                Editar
                            </button>
                        )}
                        {access.canDelete && onDelete && (
                            <button
                                onClick={onDelete}
                                className="px-4 py-2 text-sm rounded-xl bg-danger/10 text-danger hover:bg-danger/20 transition-colors"
                            >
                                Excluir
                            </button>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};

