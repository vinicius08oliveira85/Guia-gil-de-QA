import React, { useState, useMemo } from 'react';
import { glossaryTerms, searchGlossaryTerms, getTermsByCategory, GlossaryTerm } from '../../utils/glossaryTerms';

export const GlossaryView: React.FC = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<GlossaryTerm['category'] | 'Todos'>('Todos');
    const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);

    const categories: GlossaryTerm['category'][] = ['Geral', 'Testes', 'Metodologias', 'Ferramentas', 'Métricas', 'Processos', 'Técnicas', 'Padrões'];

    const filteredTerms = useMemo(() => {
        let terms = glossaryTerms;

        // Filtrar por categoria
        if (selectedCategory !== 'Todos') {
            terms = getTermsByCategory(selectedCategory);
        }

        // Filtrar por busca
        if (searchQuery.trim()) {
            terms = searchGlossaryTerms(searchQuery).filter(term =>
                selectedCategory === 'Todos' || term.category === selectedCategory
            );
        }

        return terms.sort((a, b) => a.term.localeCompare(b.term));
    }, [searchQuery, selectedCategory]);

    const getCategoryColor = (category: GlossaryTerm['category']): string => {
        const colors: Record<GlossaryTerm['category'], string> = {
            'Geral': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            'Testes': 'bg-green-500/20 text-green-400 border-green-500/30',
            'Metodologias': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            'Ferramentas': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
            'Métricas': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
            'Processos': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
            'Técnicas': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'Padrões': 'bg-red-500/20 text-red-400 border-red-500/30'
        };
        return colors[category] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 md:p-8">
            <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">📚 Glossário de Termos de QA</h1>
                <p className="text-text-secondary mb-6">
                    Explore mais de <strong className="text-accent">{glossaryTerms.length} termos</strong> relacionados a Quality Assurance, Testes de Software, Metodologias Ágeis e muito mais.
                </p>

                {/* Busca */}
                <div className="mb-6">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="🔍 Buscar termos..."
                        className="w-full px-4 py-3 bg-surface border border-surface-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                </div>

                {/* Filtros por categoria */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        onClick={() => setSelectedCategory('Todos')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            selectedCategory === 'Todos'
                                ? 'bg-accent text-white'
                                : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover'
                        }`}
                    >
                        Todos ({glossaryTerms.length})
                    </button>
                    {categories.map(category => {
                        const count = getTermsByCategory(category).length;
                        return (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                    selectedCategory === category
                                        ? 'bg-accent text-white'
                                        : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover'
                                }`}
                            >
                                {category} ({count})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Lista de termos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredTerms.length > 0 ? (
                    filteredTerms.map((term, index) => (
                        <div
                            key={index}
                            onClick={() => setSelectedTerm(term)}
                            className="p-4 bg-surface border border-surface-border rounded-lg hover:border-accent cursor-pointer transition-all hover:shadow-lg"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="text-lg font-semibold text-text-primary flex-1">{term.term}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(term.category)}`}>
                                    {term.category}
                                </span>
                            </div>
                            <p className="text-text-secondary text-sm line-clamp-2">{term.definition}</p>
                            {term.relatedTerms && term.relatedTerms.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {term.relatedTerms.slice(0, 3).map((related, idx) => (
                                        <span key={idx} className="text-xs text-accent">#{related}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="col-span-2 text-center py-12">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold text-text-primary mb-2">Nenhum termo encontrado</h3>
                        <p className="text-text-secondary">Tente buscar com outras palavras ou selecione uma categoria diferente.</p>
                    </div>
                )}
            </div>

            {/* Modal de detalhes */}
            {selectedTerm && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setSelectedTerm(null)}
                >
                    <div
                        className="bg-surface border border-surface-border rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-text-primary mb-2">{selectedTerm.term}</h2>
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getCategoryColor(selectedTerm.category)}`}>
                                        {selectedTerm.category}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSelectedTerm(null)}
                                    className="text-text-secondary hover:text-text-primary text-2xl"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="mb-4">
                                <h3 className="text-sm font-semibold text-text-secondary mb-2">Definição</h3>
                                <p className="text-text-primary leading-relaxed">{selectedTerm.definition}</p>
                            </div>

                            {selectedTerm.relatedTerms && selectedTerm.relatedTerms.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-text-secondary mb-2">Termos Relacionados</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedTerm.relatedTerms.map((related, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-surface-hover border border-surface-border rounded-md text-sm text-accent hover:bg-accent/20 cursor-pointer transition-colors"
                                                onClick={() => {
                                                    const relatedTerm = glossaryTerms.find(t => 
                                                        t.term.toLowerCase().includes(related.toLowerCase()) ||
                                                        related.toLowerCase().includes(t.term.toLowerCase())
                                                    );
                                                    if (relatedTerm) setSelectedTerm(relatedTerm);
                                                }}
                                            >
                                                {related}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-6 pt-4 border-t border-surface-border">
                                <button
                                    onClick={() => setSelectedTerm(null)}
                                    className="w-full btn btn-primary"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Estatísticas */}
            <div className="mt-8 p-4 bg-surface border border-surface-border rounded-lg">
                <h3 className="text-lg font-semibold text-text-primary mb-4">📊 Estatísticas do Glossário</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {categories.map(category => {
                        const count = getTermsByCategory(category).length;
                        return (
                            <div key={category} className="text-center">
                                <div className="text-2xl font-bold text-accent">{count}</div>
                                <div className="text-sm text-text-secondary">{category}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
