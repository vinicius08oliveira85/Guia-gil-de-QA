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
            {/* Header v0-like */}
            <div className="flex flex-col gap-4 mb-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-shrink-0">
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Glossário de Termos de QA</h1>
                        <p className="text-base-content/70 text-sm max-w-2xl">
                            Explore mais de <strong className="text-primary">{glossaryTerms.length} termos</strong> relacionados a Quality Assurance, Testes de Software, Metodologias Ágeis e muito mais.
                        </p>
                    </div>
                </div>

                {/* Busca */}
                <div className="mb-6">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="🔍 Buscar termos..."
                        className="input input-bordered w-full bg-base-100 border-base-300 text-base-content placeholder:text-base-content/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                </div>

                {/* Filtros por categoria */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        type="button"
                        onClick={() => setSelectedCategory('Todos')}
                        className={`btn btn-sm rounded-full transition-colors ${
                            selectedCategory === 'Todos'
                                ? 'btn-primary'
                                : 'btn-outline'
                        }`}
                    >
                        Todos ({glossaryTerms.length})
                    </button>
                    {categories.map(category => {
                        const count = getTermsByCategory(category).length;
                        return (
                            <button
                                key={category}
                                type="button"
                                onClick={() => setSelectedCategory(category)}
                                className={`btn btn-sm rounded-full transition-colors ${
                                    selectedCategory === category
                                        ? 'btn-primary'
                                        : 'btn-outline'
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
                            className="p-5 bg-base-100 border border-base-300 rounded-xl hover:border-primary/30 cursor-pointer transition-all hover:shadow-lg"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h3 className="text-lg font-semibold text-base-content flex-1">{term.term}</h3>
                                <span className={`badge badge-outline badge-sm ${getCategoryColor(term.category)}`}>
                                    {term.category}
                                </span>
                            </div>
                            <p className="text-base-content/70 text-sm line-clamp-2">{term.definition}</p>
                            {term.relatedTerms && term.relatedTerms.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {term.relatedTerms.slice(0, 3).map((related, idx) => (
                                        <span key={idx} className="text-xs text-primary">#{related}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="col-span-2 text-center py-12">
                        <div className="text-6xl mb-4">🔍</div>
                        <h3 className="text-xl font-semibold text-base-content mb-2">Nenhum termo encontrado</h3>
                        <p className="text-base-content/70">Tente buscar com outras palavras ou selecione uma categoria diferente.</p>
                    </div>
                )}
            </div>

            {/* Modal de detalhes */}
            {selectedTerm && (
                <div
                    className="modal modal-open"
                    onClick={() => setSelectedTerm(null)}
                >
                    <div
                        className="modal-box max-w-2xl max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-base-content mb-2">{selectedTerm.term}</h2>
                                <span className={`badge badge-outline ${getCategoryColor(selectedTerm.category)}`}>
                                    {selectedTerm.category}
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedTerm(null)}
                                className="btn btn-sm btn-circle btn-ghost"
                            >
                                ×
                            </button>
                        </div>

                        <div className="mb-4">
                            <h3 className="text-sm font-semibold text-base-content/70 mb-2">Definição</h3>
                            <p className="text-base-content leading-relaxed">{selectedTerm.definition}</p>
                        </div>

                        {selectedTerm.relatedTerms && selectedTerm.relatedTerms.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-base-content/70 mb-2">Termos Relacionados</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedTerm.relatedTerms.map((related, idx) => (
                                        <span
                                            key={idx}
                                            className="badge badge-outline badge-sm text-primary hover:bg-primary/10 cursor-pointer transition-colors"
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

                        <div className="modal-action">
                            <button
                                type="button"
                                onClick={() => setSelectedTerm(null)}
                                className="btn btn-primary"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Estatísticas */}
            <div className="mt-8 p-5 bg-base-100 border border-base-300 rounded-xl">
                <h3 className="text-lg font-semibold text-base-content mb-4">📊 Estatísticas do Glossário</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {categories.map(category => {
                        const count = getTermsByCategory(category).length;
                        return (
                            <div key={category} className="text-center p-3 bg-base-200 rounded-lg">
                                <div className="text-2xl font-bold text-primary">{count}</div>
                                <div className="text-sm text-base-content/70">{category}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
