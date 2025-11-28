import React, { useState } from 'react';
import { Project, Requirement, STLCPhaseName, RequirementType, RequirementStatus } from '../../types';
import { useRequirements } from '../../hooks/useRequirements';
import { useSTLCPhase } from '../../hooks/useSTLCPhase';
import { useDashboardAnalysis } from '../../hooks/useDashboardAnalysis';
import { useRequirementAutomation } from '../../hooks/useRequirementAutomation';
import { createRequirement, updateRequirement, deleteRequirement } from '../../services/requirementService';
import { RequirementForm } from './RequirementForm';
import { RequirementCard } from './RequirementCard';
import { RTMView } from './RTMView';
import { DashboardAnalysisModal } from '../dashboard/DashboardAnalysisModal';
import { Modal } from '../common/Modal';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { Spinner } from '../common/Spinner';

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
    const [showRequirementsAnalysis, setShowRequirementsAnalysis] = useState(false);
    const [showExtractionModal, setShowExtractionModal] = useState(false);
    const [selectedTaskForExtraction, setSelectedTaskForExtraction] = useState<string | null>(null);
    
    const {
        requirementsAnalysis,
        isGeneratingRequirements,
        generateRequirementsAnalysis,
    } = useDashboardAnalysis(project, onUpdateProject);
    
    const {
        isExtracting,
        isAnalyzing,
        isLinking,
        extractRequirementsFromTask,
        analyzeRequirement,
        autoLinkTestCases,
        batchProcessTasks,
    } = useRequirementAutomation(project, onUpdateProject);

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
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setViewMode(viewMode === 'list' ? 'rtm' : 'list')}
                            className="px-4 py-2 rounded-xl border border-surface-border bg-surface-card text-text-primary hover:bg-surface-hover transition-colors"
                        >
                            {viewMode === 'list' ? 'Ver RTM' : 'Ver Lista'}
                        </button>
                        {requirementsAnalysis?.isOutdated && (
                            <Badge variant="warning" size="sm">Análise Desatualizada</Badge>
                        )}
                        <button
                            onClick={() => {
                                if (requirementsAnalysis) {
                                    setShowRequirementsAnalysis(true);
                                } else {
                                    generateRequirementsAnalysis().then(() => setShowRequirementsAnalysis(true));
                                }
                            }}
                            disabled={isGeneratingRequirements}
                            className="px-4 py-2 text-sm rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isGeneratingRequirements ? (
                                <>
                                    <Spinner small />
                                    Gerando...
                                </>
                            ) : requirementsAnalysis ? (
                                'Ver Análise IA'
                            ) : (
                                'Gerar Análise IA'
                            )}
                        </button>
                        <button
                            onClick={() => setShowExtractionModal(true)}
                            disabled={isExtracting || project.tasks.length === 0}
                            className="px-4 py-2 text-sm rounded-xl bg-info/10 text-info hover:bg-info/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isExtracting ? (
                                <>
                                    <Spinner small />
                                    Extraindo...
                                </>
                            ) : (
                                <>
                                    🤖 Extrair das Tarefas
                                </>
                            )}
                        </button>
                        <button
                            onClick={async () => {
                                const requirementsToAnalyze = (project.requirements || []).filter(r => !r.aiAnalysis);
                                if (requirementsToAnalyze.length === 0) {
                                    alert('Todos os requisitos já foram analisados!');
                                    return;
                                }
                                for (const req of requirementsToAnalyze) {
                                    await analyzeRequirement(req);
                                }
                            }}
                            disabled={isAnalyzing || (project.requirements || []).length === 0}
                            className="px-4 py-2 text-sm rounded-xl bg-success/10 text-success hover:bg-success/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isAnalyzing ? (
                                <>
                                    <Spinner small />
                                    Analisando...
                                </>
                            ) : (
                                '📊 Analisar Requisitos'
                            )}
                        </button>
                        <button
                            onClick={autoLinkTestCases}
                            disabled={isLinking || (project.requirements || []).length === 0}
                            className="px-4 py-2 text-sm rounded-xl bg-warning/10 text-warning-dark hover:bg-warning/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLinking ? (
                                <>
                                    <Spinner small />
                                    Vinculando...
                                </>
                            ) : (
                                '🔗 Vincular Testes'
                            )}
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

            {/* Modal de Análise de Requisitos */}
            <DashboardAnalysisModal
                isOpen={showRequirementsAnalysis}
                onClose={() => setShowRequirementsAnalysis(false)}
                type="requirements"
                analysis={requirementsAnalysis}
                isLoading={isGeneratingRequirements}
                onRegenerate={async () => {
                    await generateRequirementsAnalysis();
                }}
            />

            {/* Modal de Extração de Requisitos */}
            <Modal
                isOpen={showExtractionModal}
                onClose={() => {
                    setShowExtractionModal(false);
                    setSelectedTaskForExtraction(null);
                }}
                title="Extrair Requisitos das Tarefas"
                size="lg"
            >
                <div className="space-y-4">
                    <p className="text-sm text-text-secondary">
                        Selecione as tarefas das quais deseja extrair requisitos automaticamente usando IA.
                    </p>
                    
                    <div className="max-h-96 overflow-y-auto space-y-2">
                        {project.tasks
                            .filter(task => task.type !== 'Bug')
                            .map(task => {
                                const hasRequirements = (project.requirements || []).some(
                                    r => r.sourceTaskId === task.id
                                );
                                return (
                                    <div
                                        key={task.id}
                                        className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                                            selectedTaskForExtraction === task.id
                                                ? 'border-accent bg-accent/10'
                                                : 'border-surface-border bg-surface-card hover:bg-surface-hover'
                                        }`}
                                        onClick={() => setSelectedTaskForExtraction(
                                            selectedTaskForExtraction === task.id ? null : task.id
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-semibold text-text-primary">
                                                        {task.id}
                                                    </span>
                                                    {hasRequirements && (
                                                        <Badge variant="info" size="sm">
                                                            Já tem requisitos
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-text-primary font-medium">
                                                    {task.title}
                                                </p>
                                                {task.description && (
                                                    <p className="text-xs text-text-secondary mt-1 line-clamp-2">
                                                        {task.description}
                                                    </p>
                                                )}
                                            </div>
                                            <input
                                                type="checkbox"
                                                checked={selectedTaskForExtraction === task.id}
                                                onChange={() => {}}
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                    </div>

                    {project.tasks.filter(task => task.type !== 'Bug').length === 0 && (
                        <EmptyState
                            icon="📋"
                            title="Nenhuma tarefa disponível"
                            description="Adicione tarefas ao projeto para extrair requisitos."
                        />
                    )}

                    <div className="flex gap-3 justify-end pt-4 border-t border-surface-border">
                        <button
                            onClick={() => {
                                setShowExtractionModal(false);
                                setSelectedTaskForExtraction(null);
                            }}
                            className="px-6 py-2 rounded-xl border border-surface-border bg-surface-card text-text-primary hover:bg-surface-hover transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={async () => {
                                if (!selectedTaskForExtraction) {
                                    alert('Selecione pelo menos uma tarefa');
                                    return;
                                }
                                
                                const task = project.tasks.find(t => t.id === selectedTaskForExtraction);
                                if (task) {
                                    await extractRequirementsFromTask(task);
                                    setShowExtractionModal(false);
                                    setSelectedTaskForExtraction(null);
                                }
                            }}
                            disabled={!selectedTaskForExtraction || isExtracting}
                            className="px-6 py-2 rounded-xl bg-accent text-white hover:bg-accent-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isExtracting ? (
                                <>
                                    <Spinner small />
                                    Extraindo...
                                </>
                            ) : (
                                'Extrair Requisitos'
                            )}
                        </button>
                        <button
                            onClick={async () => {
                                const tasksToProcess = project.tasks.filter(
                                    t => t.type !== 'Bug' && 
                                    !(project.requirements || []).some(r => r.sourceTaskId === t.id)
                                );
                                
                                if (tasksToProcess.length === 0) {
                                    alert('Todas as tarefas já têm requisitos extraídos!');
                                    return;
                                }
                                
                                if (window.confirm(`Extrair requisitos de ${tasksToProcess.length} tarefa(s)?`)) {
                                    await batchProcessTasks(tasksToProcess);
                                    setShowExtractionModal(false);
                                }
                            }}
                            disabled={isExtracting}
                            className="px-6 py-2 rounded-xl bg-info text-white hover:bg-info/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isExtracting ? (
                                <>
                                    <Spinner small />
                                    Processando...
                                </>
                            ) : (
                                'Extrair de Todas'
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

