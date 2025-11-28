import React, { useState } from 'react';
import { Project, Requirement, STLCPhaseName, RequirementType, RequirementStatus } from '../../types';
import { useRequirements } from '../../hooks/useRequirements';
import { useSTLCPhase } from '../../hooks/useSTLCPhase';
import { createRequirement, updateRequirement, deleteRequirement } from '../../services/requirementService';
import { RequirementForm } from './RequirementForm';
import { RequirementCard } from './RequirementCard';
import { RTMView } from './RTMView';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';

interface RequirementsManagerProps {
    project: Project;
    onUpdateProject: (project: Project) => void;
}

export const RequirementsManager: React.FC<RequirementsManagerProps> = ({
    project,
    onUpdateProject,
}) => {
    const { currentPhase } = useSTLCPhase(project);
    const {
        filteredRequirements,
        statistics,
        getRequirementAccessInfo,
    } = useRequirements(project, { showRestricted: true });

    const [showForm, setShowForm] = useState(false);
    const [editingRequirement, setEditingRequirement] = useState<Requirement | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'rtm'>('list');
    const [filterType, setFilterType] = useState<RequirementType | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<RequirementStatus | 'all'>('all');
    const [filterPhase, setFilterPhase] = useState<STLCPhaseName | 'all'>('all');

    const handleCreateRequirement = () => {
        setEditingRequirement(null);
        setShowForm(true);
    };

    const handleEditRequirement = (requirement: Requirement) => {
        setEditingRequirement(requirement);
        setShowForm(true);
    };

    const handleDeleteRequirement = (requirement: Requirement) => {
        if (window.confirm(`Tem certeza que deseja excluir o requisito ${requirement.id}?`)) {
            const updatedRequirements = (project.requirements || []).filter(
                r => r.id !== requirement.id
            );
            const updatedRTM = (project.rtm || []).filter(
                entry => entry.requirementId !== requirement.id
            );
            onUpdateProject({
                ...project,
                requirements: updatedRequirements,
                rtm: updatedRTM,
            });
        }
    };

    const handleSubmitRequirement = (requirementData: Omit<Requirement, 'id' | 'createdAt' | 'updatedAt'>) => {
        const requirements = project.requirements || [];

        if (editingRequirement) {
            // Atualizar
            const updated = updateRequirement(project, editingRequirement.id, requirementData);
            if (updated) {
                const updatedRequirements = requirements.map(r =>
                    r.id === updated.id ? updated : r
                );
                onUpdateProject({
                    ...project,
                    requirements: updatedRequirements,
                });
            }
        } else {
            // Criar
            const newRequirement = createRequirement(project, requirementData);
            onUpdateProject({
                ...project,
                requirements: [...requirements, newRequirement],
            });
        }

        setShowForm(false);
        setEditingRequirement(null);
    };

    // Filtrar requisitos adicionais
    const displayRequirements = filteredRequirements.filter(req => {
        if (filterType !== 'all' && req.type !== filterType) return false;
        if (filterStatus !== 'all' && req.status !== filterStatus) return false;
        if (filterPhase !== 'all' && req.stlcPhase !== filterPhase) return false;
        return true;
    });

    const phaseIcons: Record<STLCPhaseName, string> = {
        'Análise de Requisitos': '🔎',
        'Planejamento de Testes': '📋',
        'Desenvolvimento de Casos de Teste': '✍️',
        'Execução de Testes': '🚀',
        'Encerramento do Teste': '✅',
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="win-toolbar flex flex-col gap-4 rounded-[26px] border border-surface-border/60 bg-gradient-to-br from-white/8 via-white/2 to-transparent px-4 py-4 sm:px-6 sm:py-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="space-y-2">
                        <p className="eyebrow text-text-secondary/80">Gerenciamento de Requisitos</p>
                        <h2 className="heading-section text-text-primary">
                            Requisitos do Projeto
                        </h2>
                        <p className="text-lead text-sm sm:text-base">
                            Fase Atual: <span className="font-semibold text-accent">
                                {phaseIcons[currentPhase]} {currentPhase}
                            </span>
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode(viewMode === 'list' ? 'rtm' : 'list')}
                            className="px-4 py-2 rounded-xl border border-surface-border bg-surface-card text-text-primary hover:bg-surface-hover transition-colors"
                        >
                            {viewMode === 'list' ? 'Ver RTM' : 'Ver Lista'}
                        </button>
                        <button
                            onClick={handleCreateRequirement}
                            className="px-4 py-2 rounded-xl bg-accent text-white hover:bg-accent-light transition-colors"
                        >
                            + Novo Requisito
                        </button>
                    </div>
                </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Card>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-text-primary">{statistics.total}</p>
                        <p className="text-sm text-text-secondary">Total</p>
                    </div>
                </Card>
                <Card>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-text-primary">{statistics.functional}</p>
                        <p className="text-sm text-text-secondary">Funcionais</p>
                    </div>
                </Card>
                <Card>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-text-primary">{statistics.validated}</p>
                        <p className="text-sm text-text-secondary">Validados</p>
                    </div>
                </Card>
                <Card>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-text-primary">{statistics.coverage}%</p>
                        <p className="text-sm text-text-secondary">Cobertura</p>
                    </div>
                </Card>
            </div>

            {/* Filtros */}
            {viewMode === 'list' && (
                <Card>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-2">
                                Tipo
                            </label>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as RequirementType | 'all')}
                                className="w-full px-4 py-2 rounded-xl border border-surface-border bg-surface-card text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                            >
                                <option value="all">Todos</option>
                                <option value="Funcional">Funcional</option>
                                <option value="Não Funcional">Não Funcional</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-2">
                                Status
                            </label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as RequirementStatus | 'all')}
                                className="w-full px-4 py-2 rounded-xl border border-surface-border bg-surface-card text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                            >
                                <option value="all">Todos</option>
                                <option value="Rascunho">Rascunho</option>
                                <option value="Aprovado">Aprovado</option>
                                <option value="Em Teste">Em Teste</option>
                                <option value="Validado">Validado</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-primary mb-2">
                                Fase STLC
                            </label>
                            <select
                                value={filterPhase}
                                onChange={(e) => setFilterPhase(e.target.value as STLCPhaseName | 'all')}
                                className="w-full px-4 py-2 rounded-xl border border-surface-border bg-surface-card text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                            >
                                <option value="all">Todas</option>
                                <option value="Análise de Requisitos">Análise de Requisitos</option>
                                <option value="Planejamento de Testes">Planejamento de Testes</option>
                                <option value="Desenvolvimento de Casos de Teste">Desenvolvimento de Casos de Teste</option>
                                <option value="Execução de Testes">Execução de Testes</option>
                                <option value="Encerramento do Teste">Encerramento do Teste</option>
                            </select>
                        </div>
                    </div>
                </Card>
            )}

            {/* Conteúdo */}
            {viewMode === 'list' ? (
                <div className="space-y-4">
                    {displayRequirements.length === 0 ? (
                        <EmptyState
                            icon="📋"
                            title="Nenhum requisito encontrado"
                            description="Crie seu primeiro requisito para começar."
                        />
                    ) : (
                        displayRequirements.map(requirement => {
                            const access = getRequirementAccessInfo(requirement);
                            return (
                                <RequirementCard
                                    key={requirement.id}
                                    requirement={requirement}
                                    access={access}
                                    currentPhase={currentPhase}
                                    onEdit={access.canEdit ? () => handleEditRequirement(requirement) : undefined}
                                    onDelete={access.canDelete ? () => handleDeleteRequirement(requirement) : undefined}
                                />
                            );
                        })
                    )}
                </div>
            ) : (
                <RTMView project={project} requirements={displayRequirements} />
            )}

            {/* Form Modal */}
            <RequirementForm
                isOpen={showForm}
                onClose={() => {
                    setShowForm(false);
                    setEditingRequirement(null);
                }}
                onSubmit={handleSubmitRequirement}
                initialData={editingRequirement}
                currentPhase={currentPhase}
            />
        </div>
    );
};

