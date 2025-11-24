import React, { useState, useMemo } from 'react';
import { roadmapItems, getRoadmapStats, RoadmapItem } from '../../utils/roadmapData';
import { Badge } from '../common/Badge';
import { ProgressIndicator } from '../common/ProgressIndicator';
import { Modal } from '../common/Modal';
import { Card } from '../common/Card';

export const RoadmapView: React.FC = () => {
    const [selectedStatus, setSelectedStatus] = useState<RoadmapItem['status'] | 'all'>('all');
    const [selectedCategory, setSelectedCategory] = useState<RoadmapItem['category'] | 'all'>('all');
    const [selectedPriority, setSelectedPriority] = useState<RoadmapItem['priority'] | 'all'>('all');
    const [selectedItem, setSelectedItem] = useState<RoadmapItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const stats = useMemo(() => {
        try {
            return getRoadmapStats();
        } catch (error) {
            console.error('Erro ao calcular estatísticas do roadmap:', error);
            return {
                total: 0,
                completed: 0,
                inProgress: 0,
                planned: 0,
                future: 0,
                byCategory: {},
                byPriority: {}
            };
        }
    }, []);

    const filteredItems = useMemo(() => {
        let items = roadmapItems;

        // Filtrar por status
        if (selectedStatus !== 'all') {
            items = items.filter(item => item.status === selectedStatus);
        }

        // Filtrar por categoria
        if (selectedCategory !== 'all') {
            items = items.filter(item => item.category === selectedCategory);
        }

        // Filtrar por prioridade
        if (selectedPriority !== 'all') {
            items = items.filter(item => item.priority === selectedPriority);
        }

        // Filtrar por busca
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            items = items.filter(item =>
                item.title.toLowerCase().includes(query) ||
                item.description.toLowerCase().includes(query) ||
                item.tags?.some(tag => tag.toLowerCase().includes(query))
            );
        }

        return items.sort((a, b) => {
            // Ordenar por prioridade primeiro
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[b.priority] - priorityOrder[a.priority];
            }
            // Depois por título
            return a.title.localeCompare(b.title);
        });
    }, [selectedStatus, selectedCategory, selectedPriority, searchQuery]);

    const getStatusColor = (status: RoadmapItem['status']): 'default' | 'success' | 'warning' | 'error' | 'info' => {
        switch (status) {
            case 'completed': return 'success';
            case 'in-progress': return 'info';
            case 'planned': return 'warning';
            case 'future': return 'default';
            default: return 'default';
        }
    };

    const getStatusLabel = (status: RoadmapItem['status']): string => {
        switch (status) {
            case 'completed': return '✅ Concluído';
            case 'in-progress': return '🔄 Em Progresso';
            case 'planned': return '📋 Planejado';
            case 'future': return '🔮 Futuro';
            default: return status;
        }
    };

    const getCategoryColor = (category: RoadmapItem['category']): string => {
        const colors: Record<RoadmapItem['category'], string> = {
            'feature': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'improvement': 'bg-green-500/20 text-green-400 border-green-500/30',
            'bug-fix': 'bg-red-500/20 text-red-400 border-red-500/30',
            'performance': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            'security': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            'ux': 'bg-pink-500/20 text-pink-400 border-pink-500/30'
        };
        return colors[category] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

    const getCategoryLabel = (category: RoadmapItem['category']): string => {
        const labels: Record<RoadmapItem['category'], string> = {
            'feature': '✨ Funcionalidade',
            'improvement': '🔧 Melhoria',
            'bug-fix': '🐛 Correção',
            'performance': '⚡ Performance',
            'security': '🔒 Segurança',
            'ux': '🎨 UX/UI'
        };
        return labels[category] || category;
    };

    const getPriorityIcon = (priority: RoadmapItem['priority']): string => {
        switch (priority) {
            case 'high': return '🔴';
            case 'medium': return '🟡';
            case 'low': return '🟢';
            default: return '⚪';
        }
    };

    const completionPercentage = (stats.completed / stats.total) * 100;

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            <div className="mb-8">
                <h1 className="heading-page text-text-primary mb-4">🗺️ Trilha de Evolução do Aplicativo</h1>
                <p className="text-lead mb-6">
                    Acompanhe o desenvolvimento e evolução do QA Agile Guide através das funcionalidades implementadas, em desenvolvimento e planejadas.
                </p>

                {/* Estatísticas */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="p-4 bg-surface border border-surface-border rounded-lg text-center">
                        <div className="text-2xl font-bold text-text-primary">{stats.total}</div>
                        <div className="text-sm text-text-secondary">Total</div>
                    </div>
                    <div className="p-4 bg-surface border border-surface-border rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-400">{stats.completed}</div>
                        <div className="text-sm text-text-secondary">Concluídas</div>
                    </div>
                    <div className="p-4 bg-surface border border-surface-border rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-400">{stats.inProgress}</div>
                        <div className="text-sm text-text-secondary">Em Progresso</div>
                    </div>
                    <div className="p-4 bg-surface border border-surface-border rounded-lg text-center">
                        <div className="text-2xl font-bold text-orange-400">{stats.planned}</div>
                        <div className="text-sm text-text-secondary">Planejadas</div>
                    </div>
                    <div className="p-4 bg-surface border border-surface-border rounded-lg text-center">
                        <div className="text-2xl font-bold text-gray-400">{stats.future}</div>
                        <div className="text-sm text-text-secondary">Futuras</div>
                    </div>
                </div>

                {/* Progresso Geral */}
                <div className="p-6 bg-surface border border-surface-border rounded-xl mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="heading-card text-text-primary mb-1">Progresso Geral</h3>
                            <p className="text-sm text-text-secondary">Itens concluídos vs. total do roadmap</p>
                        </div>
                        <div className="text-right">
                            <div className="data-value text-3xl text-green-400">{Math.round(completionPercentage)}%</div>
                            <div className="text-xs text-text-tertiary">
                                {stats.completed} de {stats.total} concluídos
                            </div>
                        </div>
                    </div>
                    <ProgressIndicator
                        value={stats.completed}
                        max={stats.total}
                        color="green"
                        size="lg"
                    />
                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-surface-border">
                        <div className="text-center">
                            <div className="text-lg font-bold text-blue-400">{stats.inProgress}</div>
                            <div className="text-xs text-text-secondary">Em andamento</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-orange-400">{stats.planned}</div>
                            <div className="text-xs text-text-secondary">Próximas</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-gray-400">{stats.future}</div>
                            <div className="text-xs text-text-secondary">Futuras</div>
                        </div>
                    </div>
                </div>

                {/* Busca e Filtros */}
                <div className="mb-6 p-5 bg-surface border border-surface-border rounded-xl">
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-text-primary mb-2">🔍 Buscar Funcionalidades</label>
                        <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Digite título, descrição ou tags..."
                                className="w-full px-4 py-3 pl-10 bg-surface-hover border border-surface-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                                aria-label="Buscar funcionalidades no roadmap"
                            />
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                                    aria-label="Limpar busca"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        {searchQuery && (
                            <p className="text-xs text-text-secondary mt-2">
                                {filteredItems.length} resultado{filteredItems.length !== 1 ? 's' : ''} encontrado{filteredItems.length !== 1 ? 's' : ''}
                            </p>
                        )}
                </div>

                {/* Filtros */}
                    <div className="space-y-4">
                    <div>
                            <label className="block text-sm font-semibold text-text-primary mb-3">Status</label>
                        <div className="flex flex-wrap gap-2">
                            {(['all', 'completed', 'in-progress', 'planned', 'future'] as const).map(status => (
                                <button
                                    key={status}
                                    onClick={() => setSelectedStatus(status)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                        selectedStatus === status
                                                ? 'bg-accent text-white shadow-md shadow-accent/30 border border-accent/50'
                                                : 'bg-surface-hover border border-surface-border text-text-secondary hover:bg-surface hover:border-accent/30'
                                    }`}
                                        aria-pressed={selectedStatus === status}
                                >
                                    {status === 'all' ? 'Todos' : getStatusLabel(status as RoadmapItem['status'])}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                                <label className="block text-sm font-semibold text-text-primary mb-3">Categoria</label>
                            <div className="flex flex-wrap gap-2">
                                {(['all', 'feature', 'improvement', 'bug-fix', 'performance', 'security', 'ux'] as const).map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                            selectedCategory === category
                                                    ? 'bg-accent text-white shadow-md shadow-accent/30 border border-accent/50'
                                                    : 'bg-surface-hover border border-surface-border text-text-secondary hover:bg-surface hover:border-accent/30'
                                        }`}
                                            aria-pressed={selectedCategory === category}
                                    >
                                        {category === 'all' ? 'Todas' : getCategoryLabel(category as RoadmapItem['category'])}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                                <label className="block text-sm font-semibold text-text-primary mb-3">Prioridade</label>
                            <div className="flex flex-wrap gap-2">
                                {(['all', 'high', 'medium', 'low'] as const).map(priority => (
                                    <button
                                        key={priority}
                                        onClick={() => setSelectedPriority(priority)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                            selectedPriority === priority
                                                    ? 'bg-accent text-white shadow-md shadow-accent/30 border border-accent/50'
                                                    : 'bg-surface-hover border border-surface-border text-text-secondary hover:bg-surface hover:border-accent/30'
                                        }`}
                                            aria-pressed={selectedPriority === priority}
                                    >
                                        {priority === 'all' ? 'Todas' : `${getPriorityIcon(priority as RoadmapItem['priority'])} ${priority === 'high' ? 'Alta' : priority === 'medium' ? 'Média' : 'Baixa'}`}
                                    </button>
                                ))}
                            </div>
                        </div>
                        </div>

                        {/* Filtros Ativos */}
                        {(selectedStatus !== 'all' || selectedCategory !== 'all' || selectedPriority !== 'all' || searchQuery) && (
                            <div className="pt-4 border-t border-surface-border">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-text-primary">Filtros Ativos</span>
                                    <button
                                        onClick={() => {
                                            setSelectedStatus('all');
                                            setSelectedCategory('all');
                                            setSelectedPriority('all');
                                            setSearchQuery('');
                                        }}
                                        className="text-sm text-accent hover:text-accent-light transition-colors flex items-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                        Limpar todos
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lista de Itens */}
            <div className="space-y-4">
                {filteredItems.length > 0 ? (
                    filteredItems.map((item) => {
                        const progress = item.progress ?? (item.status === 'completed' ? 100 : item.status === 'in-progress' ? 50 : 0);
                        const hasDependencies = item.dependencies && item.dependencies.length > 0;
                        const completedMilestones = item.milestones?.filter(m => m.completed).length ?? 0;
                        const totalMilestones = item.milestones?.length ?? 0;
                        
                        return (
                        <div
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                                className="p-6 bg-surface border border-surface-border rounded-xl hover:border-accent/50 cursor-pointer transition-all hover:shadow-xl group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-3 flex-wrap">
                                            <h3 className="heading-card text-text-primary group-hover:text-accent transition-colors">{item.title}</h3>
                                        <Badge variant={getStatusColor(item.status)} size="sm">
                                            {getStatusLabel(item.status)}
                                        </Badge>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getCategoryColor(item.category)}`}>
                                            {getCategoryLabel(item.category)}
                                        </span>
                                    </div>
                                        <p className="text-text-secondary text-sm mb-4 leading-relaxed">{item.description}</p>
                                        
                                        {/* Progresso Visual */}
                                        {item.status === 'in-progress' && (
                                            <div className="mb-4">
                                                <div className="flex items-center justify-between text-xs text-text-secondary mb-2">
                                                    <span>Progresso</span>
                                                    <span className="font-semibold text-text-primary">{progress}%</span>
                                                </div>
                                                <div className="w-full bg-surface-hover rounded-full h-2 overflow-hidden">
                                                    <div 
                                                        className="h-full bg-gradient-to-r from-accent via-accent-light to-accent rounded-full transition-all duration-500"
                                                        style={{ width: `${progress}%` }}
                                                        role="progressbar"
                                                        aria-valuenow={progress}
                                                        aria-valuemin={0}
                                                        aria-valuemax={100}
                                                    />
                                                </div>
                                                {totalMilestones > 0 && (
                                                    <p className="text-xs text-text-secondary mt-1">
                                                        {completedMilestones}/{totalMilestones} marcos concluídos
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Esforço vs Impacto */}
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-text-secondary">Impacto:</span>
                                                <div className="flex gap-1">
                                                    {['high', 'medium', 'low'].map((level) => (
                                                        <div
                                                            key={level}
                                                            className={`w-2 h-2 rounded-full ${
                                                                item.impact === level
                                                                    ? level === 'high' ? 'bg-red-400' : level === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                                                                    : 'bg-surface-hover'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-text-secondary">Esforço:</span>
                                                <div className="flex gap-1">
                                                    {['high', 'medium', 'low'].map((level) => (
                                                        <div
                                                            key={level}
                                                            className={`w-2 h-2 rounded-full ${
                                                                item.effort === level
                                                                    ? level === 'high' ? 'bg-red-400' : level === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                                                                    : 'bg-surface-hover'
                                                            }`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Informações Adicionais */}
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-text-secondary">
                                            <span className="flex items-center gap-1">
                                                {getPriorityIcon(item.priority)} 
                                                <span className="font-medium">Prioridade {item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Média' : 'Baixa'}</span>
                                            </span>
                                            {item.estimatedRelease && (
                                                <span className="flex items-center gap-1">
                                                    📅 <span className="font-medium">{item.estimatedRelease}</span>
                                                </span>
                                            )}
                                            {item.startDate && (
                                                <span className="flex items-center gap-1">
                                                    🚀 <span className="font-medium">Início: {new Date(item.startDate).toLocaleDateString('pt-BR')}</span>
                                                </span>
                                            )}
                                            {item.assignedTo && (
                                                <span className="flex items-center gap-1">
                                                    👤 <span className="font-medium">{item.assignedTo}</span>
                                                </span>
                                            )}
                                            {hasDependencies && (
                                                <span className="flex items-center gap-1 text-amber-400">
                                                    🔗 <span className="font-medium">{item.dependencies!.length} dependência{item.dependencies!.length > 1 ? 's' : ''}</span>
                                                </span>
                                            )}
                                            {item.risks && item.risks.length > 0 && (
                                                <span className="flex items-center gap-1 text-red-400">
                                                    ⚠️ <span className="font-medium">{item.risks.length} risco{item.risks.length > 1 ? 's' : ''}</span>
                                                </span>
                                            )}
                                        </div>
                                        
                                        {/* Tags */}
                                        {item.tags && item.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                {item.tags.map((tag, idx) => (
                                                    <span key={idx} className="px-2 py-0.5 bg-accent/10 text-accent rounded text-xs font-medium border border-accent/20">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )
                ) : (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold text-text-primary mb-2">Nenhum item encontrado</h3>
                        <p className="text-text-secondary">Tente ajustar os filtros ou buscar com outras palavras.</p>
                    </div>
                )}
            </div>

            {/* Modal de Detalhes */}
            {selectedItem && (
                <Modal
                    isOpen={!!selectedItem}
                    onClose={() => setSelectedItem(null)}
                    title={selectedItem.title}
                    size="lg"
                    maxHeight="90vh"
                >
                    <div className="space-y-6">
                        {/* Header com Status e Categoria */}
                        <div className="flex items-center gap-3 flex-wrap">
                            <Badge variant={getStatusColor(selectedItem.status)} size="md">
                                {getStatusLabel(selectedItem.status)}
                            </Badge>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(selectedItem.category)}`}>
                                {getCategoryLabel(selectedItem.category)}
                            </span>
                            {selectedItem.estimatedRelease && (
                                <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-medium border border-accent/30">
                                    📅 {selectedItem.estimatedRelease}
                                </span>
                            )}
                        </div>

                        {/* Progresso */}
                        {selectedItem.status === 'in-progress' && selectedItem.progress !== undefined && (
                            <div className="p-4 bg-surface-hover rounded-lg border border-surface-border">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-semibold text-text-primary">Progresso</h4>
                                    <span className="text-lg font-bold text-accent">{selectedItem.progress}%</span>
                                </div>
                                <div className="w-full bg-surface rounded-full h-3 overflow-hidden">
                                    <div 
                                        className="h-full bg-gradient-to-r from-accent via-accent-light to-accent rounded-full transition-all duration-500"
                                        style={{ width: `${selectedItem.progress}%` }}
                                        role="progressbar"
                                        aria-valuenow={selectedItem.progress}
                                        aria-valuemin={0}
                                        aria-valuemax={100}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Descrição */}
                        <div>
                            <h4 className="text-sm font-semibold text-text-secondary mb-2 uppercase tracking-wide">Descrição</h4>
                            <p className="text-text-primary leading-relaxed">{selectedItem.description}</p>
                        </div>

                        {/* Informações Principais */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-3 bg-surface-hover rounded-lg border border-surface-border">
                                <h4 className="text-xs font-semibold text-text-secondary mb-1 uppercase tracking-wide">Prioridade</h4>
                                <p className="text-text-primary font-semibold">{getPriorityIcon(selectedItem.priority)} {selectedItem.priority === 'high' ? 'Alta' : selectedItem.priority === 'medium' ? 'Média' : 'Baixa'}</p>
                            </div>
                            <div className="p-3 bg-surface-hover rounded-lg border border-surface-border">
                                <h4 className="text-xs font-semibold text-text-secondary mb-1 uppercase tracking-wide">Impacto</h4>
                                <p className="text-text-primary font-semibold">{selectedItem.impact === 'high' ? '🔴 Alto' : selectedItem.impact === 'medium' ? '🟡 Médio' : '🟢 Baixo'}</p>
                            </div>
                            <div className="p-3 bg-surface-hover rounded-lg border border-surface-border">
                                <h4 className="text-xs font-semibold text-text-secondary mb-1 uppercase tracking-wide">Esforço</h4>
                                <p className="text-text-primary font-semibold">{selectedItem.effort === 'high' ? '🔴 Alto' : selectedItem.effort === 'medium' ? '🟡 Médio' : '🟢 Baixo'}</p>
                            </div>
                            {selectedItem.assignedTo && (
                                <div className="p-3 bg-surface-hover rounded-lg border border-surface-border">
                                    <h4 className="text-xs font-semibold text-text-secondary mb-1 uppercase tracking-wide">Responsável</h4>
                                    <p className="text-text-primary font-semibold">👤 {selectedItem.assignedTo}</p>
                                </div>
                            )}
                        </div>

                        {/* Datas */}
                        {(selectedItem.startDate || selectedItem.completedDate) && (
                            <div className="grid grid-cols-2 gap-4">
                                {selectedItem.startDate && (
                                    <div className="p-3 bg-surface-hover rounded-lg border border-surface-border">
                                        <h4 className="text-xs font-semibold text-text-secondary mb-1 uppercase tracking-wide">Data de Início</h4>
                                        <p className="text-text-primary font-semibold">🚀 {new Date(selectedItem.startDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                )}
                                {selectedItem.completedDate && (
                                    <div className="p-3 bg-surface-hover rounded-lg border border-surface-border">
                                        <h4 className="text-xs font-semibold text-text-secondary mb-1 uppercase tracking-wide">Data de Conclusão</h4>
                                        <p className="text-text-primary font-semibold">✅ {new Date(selectedItem.completedDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Marcos (Milestones) */}
                        {selectedItem.milestones && selectedItem.milestones.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wide">Marcos do Projeto</h4>
                                <div className="space-y-2">
                                    {selectedItem.milestones.map((milestone) => (
                                        <div
                                            key={milestone.id}
                                            className={`p-3 rounded-lg border flex items-start gap-3 ${
                                                milestone.completed
                                                    ? 'bg-green-400/10 border-green-400/30'
                                                    : 'bg-surface-hover border-surface-border'
                                            }`}
                                        >
                                            <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                milestone.completed ? 'bg-green-400 text-white' : 'bg-surface-border text-text-secondary'
                                            }`}>
                                                {milestone.completed ? '✓' : '○'}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`font-semibold ${milestone.completed ? 'text-green-400' : 'text-text-primary'}`}>
                                                    {milestone.title}
                                                </p>
                                                {milestone.description && (
                                                    <p className="text-sm text-text-secondary mt-1">{milestone.description}</p>
                                                )}
                                                {milestone.date && (
                                                    <p className="text-xs text-text-tertiary mt-1">📅 {new Date(milestone.date).toLocaleDateString('pt-BR')}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Critérios de Aceitação */}
                        {selectedItem.acceptanceCriteria && selectedItem.acceptanceCriteria.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wide">Critérios de Aceitação</h4>
                                <ul className="space-y-2">
                                    {selectedItem.acceptanceCriteria.map((criterion, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-text-primary">
                                            <span className="text-accent mt-1">✓</span>
                                            <span className="leading-relaxed">{criterion}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Riscos */}
                        {selectedItem.risks && selectedItem.risks.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wide">Riscos Identificados</h4>
                                <div className="space-y-3">
                                    {selectedItem.risks.map((risk) => (
                                        <div
                                            key={risk.id}
                                            className={`p-4 rounded-lg border ${
                                                risk.severity === 'high' ? 'bg-red-400/10 border-red-400/30' :
                                                risk.severity === 'medium' ? 'bg-orange-400/10 border-orange-400/30' :
                                                'bg-yellow-400/10 border-yellow-400/30'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <p className="font-semibold text-text-primary">{risk.description}</p>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                    risk.severity === 'high' ? 'bg-red-400/20 text-red-400' :
                                                    risk.severity === 'medium' ? 'bg-orange-400/20 text-orange-400' :
                                                    'bg-yellow-400/20 text-yellow-400'
                                                }`}>
                                                    {risk.severity === 'high' ? 'Alto' : risk.severity === 'medium' ? 'Médio' : 'Baixo'}
                                                </span>
                                            </div>
                                            {risk.mitigation && (
                                                <p className="text-sm text-text-secondary mt-2">
                                                    <span className="font-semibold">Mitigação:</span> {risk.mitigation}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Dependências */}
                        {selectedItem.dependencies && selectedItem.dependencies.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wide">Dependências</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedItem.dependencies.map(depId => {
                                        const dep = roadmapItems.find(i => i.id === depId);
                                        return dep ? (
                                            <div
                                                key={depId}
                                                onClick={() => {
                                                    setSelectedItem(null);
                                                    setTimeout(() => setSelectedItem(dep), 100);
                                                }}
                                                className="px-3 py-2 bg-surface-hover border border-surface-border rounded-lg text-sm cursor-pointer hover:border-accent/50 hover:bg-surface transition-colors"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={getStatusColor(dep.status)} size="sm">
                                                        {getStatusLabel(dep.status)}
                                                    </Badge>
                                                    <span className="text-text-primary font-medium">{dep.title}</span>
                                                </div>
                                            </div>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Issues Relacionadas */}
                        {selectedItem.relatedIssues && selectedItem.relatedIssues.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wide">Issues Relacionadas</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedItem.relatedIssues.map((issue, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-blue-400/10 text-blue-400 rounded-lg text-sm font-medium border border-blue-400/30">
                                            #{issue}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Notas */}
                        {selectedItem.notes && (
                            <div>
                                <h4 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wide">Notas</h4>
                                <div className="p-4 bg-surface-hover rounded-lg border border-surface-border">
                                    <p className="text-text-primary leading-relaxed whitespace-pre-wrap">{selectedItem.notes}</p>
                                </div>
                            </div>
                        )}

                        {/* Tags */}
                        {selectedItem.tags && selectedItem.tags.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-text-secondary mb-3 uppercase tracking-wide">Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedItem.tags.map((tag, idx) => (
                                        <span key={idx} className="px-3 py-1 bg-accent/20 text-accent rounded-lg text-sm font-medium border border-accent/30">
                                            #{tag}
                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* Estatísticas Detalhadas */}
            <div className="mt-8 space-y-6">
                {/* Gráfico de Esforço vs Impacto */}
                <Card className="!p-6">
                    <h3 className="heading-card text-text-primary mb-6">📈 Matriz Esforço vs Impacto</h3>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                        <div className="text-xs text-text-tertiary text-center font-semibold">Impacto</div>
                        <div className="text-xs text-text-tertiary text-center">Alto</div>
                        <div className="text-xs text-text-tertiary text-center">Médio</div>
                        <div className="text-xs text-text-tertiary text-center">Baixo</div>
                    </div>
                    {['high', 'medium', 'low'].map((effortLevel) => (
                        <div key={effortLevel} className="grid grid-cols-4 gap-2 mb-2">
                            <div className="text-xs text-text-secondary font-medium flex items-center">
                                {effortLevel === 'high' ? 'Alto' : effortLevel === 'medium' ? 'Médio' : 'Baixo'} Esforço
                            </div>
                            {['high', 'medium', 'low'].map((impactLevel) => {
                                const items = filteredItems.filter(item => 
                                    item.effort === effortLevel && item.impact === impactLevel
                                );
                                const bgColor = effortLevel === 'high' && impactLevel === 'low' 
                                    ? 'bg-red-400/20 border-red-400/40'
                                    : effortLevel === 'low' && impactLevel === 'high'
                                    ? 'bg-green-400/20 border-green-400/40'
                                    : 'bg-surface-hover border-surface-border';
                                return (
                                    <div
                                        key={impactLevel}
                                        className={`p-3 rounded-lg border text-center ${bgColor} transition-all hover:scale-105 cursor-pointer`}
                                        title={`${items.length} item(ns) com ${effortLevel === 'high' ? 'Alto' : effortLevel === 'medium' ? 'Médio' : 'Baixo'} Esforço e ${impactLevel === 'high' ? 'Alto' : impactLevel === 'medium' ? 'Médio' : 'Baixo'} Impacto`}
                                    >
                                        <div className="text-xl font-bold text-text-primary">{items.length}</div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                    <div className="mt-4 pt-4 border-t border-surface-border text-xs text-text-secondary">
                        <p className="mb-2"><span className="inline-block w-3 h-3 bg-green-400/20 border border-green-400/40 rounded mr-2"></span> Prioridade Alta (Baixo Esforço, Alto Impacto)</p>
                        <p><span className="inline-block w-3 h-3 bg-red-400/20 border border-red-400/40 rounded mr-2"></span> Prioridade Baixa (Alto Esforço, Baixo Impacto)</p>
                    </div>
                </Card>

                {/* Timeline Visual por Release */}
                <Card className="!p-6">
                    <h3 className="heading-card text-text-primary mb-6">📅 Timeline por Release</h3>
                    <div className="space-y-6">
                        {useMemo(() => {
                            const releases = new Map<string, RoadmapItem[]>();
                            roadmapItems.forEach(item => {
                                const release = item.estimatedRelease || 'Sem Release';
                                if (!releases.has(release)) {
                                    releases.set(release, []);
                                }
                                releases.get(release)!.push(item);
                            });
                            
                            return Array.from(releases.entries())
                                .sort((a, b) => {
                                    // Ordenar por versão (v1.0, v1.1, v2.0, etc)
                                    const aVersion = a[0].match(/v(\d+)\.(\d+)/);
                                    const bVersion = b[0].match(/v(\d+)\.(\d+)/);
                                    if (aVersion && bVersion) {
                                        const aMajor = parseInt(aVersion[1]);
                                        const aMinor = parseInt(aVersion[2]);
                                        const bMajor = parseInt(bVersion[1]);
                                        const bMinor = parseInt(bVersion[2]);
                                        if (aMajor !== bMajor) return aMajor - bMajor;
                                        return aMinor - bMinor;
                                    }
                                    return a[0].localeCompare(b[0]);
                                })
                                .map(([release, items]) => {
                                    const completed = items.filter(i => i.status === 'completed').length;
                                    const inProgress = items.filter(i => i.status === 'in-progress').length;
                                    const planned = items.filter(i => i.status === 'planned').length;
                                    const future = items.filter(i => i.status === 'future').length;
                                    const total = items.length;
                                    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
                                    
                                    return (
                                        <div key={release} className="p-4 bg-surface-hover rounded-lg border border-surface-border">
                                            <div className="flex items-center justify-between mb-3">
                                                <h4 className="font-semibold text-text-primary">{release}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm text-text-secondary">{total} itens</span>
                                                    <span className="text-sm font-bold text-accent">{progress}%</span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-surface rounded-full h-2 mb-3 overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-green-400 via-blue-400 to-orange-400 rounded-full transition-all"
                                                    style={{ width: `${progress}%` }}
                                                    role="progressbar"
                                                    aria-valuenow={progress}
                                                    aria-valuemin={0}
                                                    aria-valuemax={100}
                                                />
                                            </div>
                                            <div className="flex flex-wrap gap-3 text-xs">
                                                {completed > 0 && (
                                                    <span className="text-green-400">✅ {completed} concluído{completed > 1 ? 's' : ''}</span>
                                                )}
                                                {inProgress > 0 && (
                                                    <span className="text-blue-400">🔄 {inProgress} em progresso</span>
                                                )}
                                                {planned > 0 && (
                                                    <span className="text-orange-400">📋 {planned} planejado{planned > 1 ? 's' : ''}</span>
                                                )}
                                                {future > 0 && (
                                                    <span className="text-gray-400">🔮 {future} futuro{future > 1 ? 's' : ''}</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                });
                        }, [])}
                    </div>
                </Card>

            {/* Estatísticas por Categoria */}
                <div className="p-6 bg-surface border border-surface-border rounded-xl">
                    <h3 className="heading-card text-text-primary mb-6">📊 Estatísticas por Categoria</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {stats?.byCategory && Object.entries(stats.byCategory).map(([category, count]) => {
                            const categoryPercentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                            return (
                                <div key={category} className="text-center p-4 bg-surface-hover rounded-lg border border-surface-border hover:border-accent/30 transition-all">
                                    <div className="data-value text-2xl mb-1">{count}</div>
                                    <div className="data-label text-xs mb-2">{getCategoryLabel(category as RoadmapItem['category'])}</div>
                                    <div className="w-full bg-surface rounded-full h-1.5 overflow-hidden">
                                        <div 
                                            className="h-full bg-accent rounded-full transition-all"
                                            style={{ width: `${categoryPercentage}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-text-tertiary mt-1">{categoryPercentage}%</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Estatísticas por Prioridade */}
                <div className="p-6 bg-surface border border-surface-border rounded-xl">
                    <h3 className="heading-card text-text-primary mb-6">🎯 Estatísticas por Prioridade</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {stats?.byPriority && Object.entries(stats.byPriority).map(([priority, count]) => {
                            const priorityPercentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                            const priorityColor = priority === 'high' ? 'text-red-400' : priority === 'medium' ? 'text-yellow-400' : 'text-green-400';
                            return (
                                <div key={priority} className="text-center p-5 bg-surface-hover rounded-lg border border-surface-border">
                                    <div className={`data-value text-3xl mb-2 ${priorityColor}`}>{count}</div>
                                    <div className="data-label mb-3">
                                        {getPriorityIcon(priority as RoadmapItem['priority'])} {priority === 'high' ? 'Alta' : priority === 'medium' ? 'Média' : 'Baixa'}
                                    </div>
                                    <div className="w-full bg-surface rounded-full h-2 overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all ${
                                                priority === 'high' ? 'bg-red-400' : priority === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                                            }`}
                                            style={{ width: `${priorityPercentage}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-text-tertiary mt-2">{priorityPercentage}% do total</div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Métricas de Velocidade */}
                <div className="p-6 bg-surface border border-surface-border rounded-xl">
                    <h3 className="heading-card text-text-primary mb-6">⚡ Métricas de Velocidade</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-surface-hover rounded-lg border border-surface-border">
                            <div className="text-sm text-text-secondary mb-2">Taxa de Conclusão</div>
                            <div className="data-value text-2xl text-green-400 mb-1">{Math.round(completionPercentage)}%</div>
                            <div className="text-xs text-text-tertiary">
                                {stats.completed} de {stats.total} itens concluídos
                            </div>
                        </div>
                        <div className="p-4 bg-surface-hover rounded-lg border border-surface-border">
                            <div className="text-sm text-text-secondary mb-2">Em Desenvolvimento</div>
                            <div className="data-value text-2xl text-blue-400 mb-1">{stats.inProgress}</div>
                            <div className="text-xs text-text-tertiary">
                                Itens ativos no momento
                            </div>
                        </div>
                        <div className="p-4 bg-surface-hover rounded-lg border border-surface-border">
                            <div className="text-sm text-text-secondary mb-2">Backlog</div>
                            <div className="data-value text-2xl text-orange-400 mb-1">{stats.planned + stats.future}</div>
                            <div className="text-xs text-text-tertiary">
                                Itens planejados e futuros
                            </div>
                        </div>
                    </div>
            </div>
            </div>
        </div>
    );
};
