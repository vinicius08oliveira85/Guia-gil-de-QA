import React, { useState, useMemo } from 'react';
import { roadmapItems, getRoadmapStats, RoadmapItem } from '../../utils/roadmapData';
import { Badge } from '../common/Badge';
import { ProgressIndicator } from '../common/ProgressIndicator';
import { Modal } from '../common/Modal';

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
                <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">🗺️ Trilha de Evolução do Aplicativo</h1>
                <p className="text-text-secondary mb-6">
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
                <div className="p-4 bg-surface border border-surface-border rounded-lg mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-text-secondary font-semibold">Progresso Geral</span>
                        <span className="text-text-primary font-bold">{Math.round(completionPercentage)}%</span>
                    </div>
                    <ProgressIndicator
                        value={stats.completed}
                        max={stats.total}
                        color="green"
                        size="lg"
                    />
                </div>

                {/* Busca */}
                <div className="mb-6">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="🔍 Buscar funcionalidades..."
                        className="w-full px-4 py-3 bg-surface border border-surface-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                </div>

                {/* Filtros */}
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Status</label>
                        <div className="flex flex-wrap gap-2">
                            {(['all', 'completed', 'in-progress', 'planned', 'future'] as const).map(status => (
                                <button
                                    key={status}
                                    onClick={() => setSelectedStatus(status)}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                        selectedStatus === status
                                            ? 'bg-accent text-white'
                                            : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover'
                                    }`}
                                >
                                    {status === 'all' ? 'Todos' : getStatusLabel(status as RoadmapItem['status'])}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Categoria</label>
                            <div className="flex flex-wrap gap-2">
                                {(['all', 'feature', 'improvement', 'bug-fix', 'performance', 'security', 'ux'] as const).map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                            selectedCategory === category
                                                ? 'bg-accent text-white'
                                                : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover'
                                        }`}
                                    >
                                        {category === 'all' ? 'Todas' : getCategoryLabel(category as RoadmapItem['category'])}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Prioridade</label>
                            <div className="flex flex-wrap gap-2">
                                {(['all', 'high', 'medium', 'low'] as const).map(priority => (
                                    <button
                                        key={priority}
                                        onClick={() => setSelectedPriority(priority)}
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                                            selectedPriority === priority
                                                ? 'bg-accent text-white'
                                                : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover'
                                        }`}
                                    >
                                        {priority === 'all' ? 'Todas' : `${getPriorityIcon(priority as RoadmapItem['priority'])} ${priority === 'high' ? 'Alta' : priority === 'medium' ? 'Média' : 'Baixa'}`}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de Itens */}
            <div className="space-y-4">
                {filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => setSelectedItem(item)}
                            className="p-5 bg-surface border border-surface-border rounded-lg hover:border-accent cursor-pointer transition-all hover:shadow-lg"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="text-lg font-semibold text-text-primary">{item.title}</h3>
                                        <Badge variant={getStatusColor(item.status)} size="sm">
                                            {getStatusLabel(item.status)}
                                        </Badge>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(item.category)}`}>
                                            {getCategoryLabel(item.category)}
                                        </span>
                                    </div>
                                    <p className="text-text-secondary text-sm mb-3">{item.description}</p>
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
                                        <span>{getPriorityIcon(item.priority)} Prioridade {item.priority === 'high' ? 'Alta' : item.priority === 'medium' ? 'Média' : 'Baixa'}</span>
                                        {item.estimatedRelease && (
                                            <span>📅 {item.estimatedRelease}</span>
                                        )}
                                        {item.tags && item.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {item.tags.map((tag, idx) => (
                                                    <span key={idx} className="px-2 py-0.5 bg-surface-hover rounded text-accent">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
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
                >
                    <div className="space-y-4">
                        <div>
                            <Badge variant={getStatusColor(selectedItem.status)} size="md">
                                {getStatusLabel(selectedItem.status)}
                            </Badge>
                            <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(selectedItem.category)}`}>
                                {getCategoryLabel(selectedItem.category)}
                            </span>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-text-secondary mb-2">Descrição</h4>
                            <p className="text-text-primary">{selectedItem.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-sm font-semibold text-text-secondary mb-2">Prioridade</h4>
                                <p className="text-text-primary">{getPriorityIcon(selectedItem.priority)} {selectedItem.priority === 'high' ? 'Alta' : selectedItem.priority === 'medium' ? 'Média' : 'Baixa'}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-text-secondary mb-2">Impacto</h4>
                                <p className="text-text-primary">{selectedItem.impact === 'high' ? '🔴 Alto' : selectedItem.impact === 'medium' ? '🟡 Médio' : '🟢 Baixo'}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-text-secondary mb-2">Esforço</h4>
                                <p className="text-text-primary">{selectedItem.effort === 'high' ? '🔴 Alto' : selectedItem.effort === 'medium' ? '🟡 Médio' : '🟢 Baixo'}</p>
                            </div>
                            {selectedItem.estimatedRelease && (
                                <div>
                                    <h4 className="text-sm font-semibold text-text-secondary mb-2">Release Estimada</h4>
                                    <p className="text-text-primary">📅 {selectedItem.estimatedRelease}</p>
                                </div>
                            )}
                        </div>

                        {selectedItem.dependencies && selectedItem.dependencies.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-text-secondary mb-2">Dependências</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedItem.dependencies.map(depId => {
                                        const dep = roadmapItems.find(i => i.id === depId);
                                        return dep ? (
                                            <span key={depId} className="px-2 py-1 bg-surface-hover border border-surface-border rounded text-sm">
                                                {dep.title}
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}

                        {selectedItem.tags && selectedItem.tags.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-text-secondary mb-2">Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedItem.tags.map((tag, idx) => (
                                        <span key={idx} className="px-2 py-1 bg-accent/20 text-accent rounded text-sm">
                                            #{tag}
                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* Estatísticas por Categoria */}
            <div className="mt-8 p-4 bg-surface border border-surface-border rounded-lg">
                <h3 className="text-lg font-semibold text-text-primary mb-4">📊 Estatísticas por Categoria</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {stats?.byCategory && Object.entries(stats.byCategory).map(([category, count]) => (
                        <div key={category} className="text-center">
                            <div className="text-2xl font-bold text-accent">{count}</div>
                            <div className="text-sm text-text-secondary">{getCategoryLabel(category as RoadmapItem['category'])}</div>
                    </div>
                ))}
            </div>
            </div>
        </div>
    );
};
