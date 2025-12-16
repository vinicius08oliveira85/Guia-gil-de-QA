import React, { useState, useMemo } from 'react';
import { glossaryTerms, searchGlossaryTerms, getTermsByCategory, GlossaryTerm } from '../../utils/glossaryTerms';
import { motion, AnimatePresence } from 'framer-motion';

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

    const getCategoryGradient = (category: GlossaryTerm['category']): string => {
        const gradients: Record<GlossaryTerm['category'], string> = {
            'Geral': 'from-blue-500/10 via-blue-500/5 to-transparent',
            'Testes': 'from-green-500/10 via-green-500/5 to-transparent',
            'Metodologias': 'from-purple-500/10 via-purple-500/5 to-transparent',
            'Ferramentas': 'from-orange-500/10 via-orange-500/5 to-transparent',
            'Métricas': 'from-teal-500/10 via-teal-500/5 to-transparent',
            'Processos': 'from-pink-500/10 via-pink-500/5 to-transparent',
            'Técnicas': 'from-yellow-500/10 via-yellow-500/5 to-transparent',
            'Padrões': 'from-red-500/10 via-red-500/5 to-transparent'
        };
        return gradients[category] || 'from-gray-500/10 via-gray-500/5 to-transparent';
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
            <motion.div 
                className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                initial="hidden"
                animate="visible"
                variants={{
                    visible: {
                        transition: {
                            staggerChildren: 0.06,
                        },
                    },
                }}
            >
                <AnimatePresence mode="wait">
                    {filteredTerms.length > 0 ? (
                        filteredTerms.map((term, index) => (
                            <motion.div
                                key={`${term.term}-${index}`}
                                onClick={() => setSelectedTerm(term)}
                                className="p-5 bg-base-100 border border-base-300 rounded-xl hover:border-primary/40 cursor-pointer transition-all duration-300 hover:shadow-xl relative overflow-hidden group"
                                variants={{
                                    hidden: { opacity: 0, y: 20, scale: 0.95 },
                                    visible: { 
                                        opacity: 1, 
                                        y: 0, 
                                        scale: 1,
                                        transition: {
                                            duration: 0.3,
                                            ease: 'easeOut',
                                        },
                                    },
                                }}
                                whileHover={{ y: -4 }}
                            >
                                {/* Gradiente baseado na categoria */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${getCategoryGradient(term.category)} opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none`} />
                                
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-lg font-semibold text-base-content flex-1 group-hover:text-primary transition-colors duration-200">
                                            {term.term}
                                        </h3>
                                        <motion.span 
                                            className={`badge badge-outline badge-sm rounded-full px-2.5 py-1 ${getCategoryColor(term.category)}`}
                                            whileHover={{ scale: 1.05 }}
                                        >
                                            {term.category}
                                        </motion.span>
                                    </div>
                                    <p className="text-base-content/70 text-sm line-clamp-2 leading-relaxed mb-3">
                                        {term.definition}
                                    </p>
                                    {term.relatedTerms && term.relatedTerms.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-1.5 pt-3 border-t border-base-300/50">
                                            {term.relatedTerms.slice(0, 3).map((related, idx) => (
                                                <span 
                                                    key={idx} 
                                                    className="text-xs text-primary font-medium hover:text-primary-focus transition-colors"
                                                >
                                                    #{related}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <motion.div 
                            className="col-span-2 text-center py-12"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="text-6xl mb-4">🔍</div>
                            <h3 className="text-xl font-semibold text-base-content mb-2">Nenhum termo encontrado</h3>
                            <p className="text-base-content/70">Tente buscar com outras palavras ou selecione uma categoria diferente.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

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
            <motion.div 
                className="mt-8 p-6 bg-base-100 border border-base-300 rounded-xl hover:border-primary/30 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h3 className="text-lg font-semibold text-base-content mb-5 flex items-center gap-2">
                    <span>📊</span>
                    Estatísticas do Glossário
                </h3>
                <motion.div 
                    className="grid grid-cols-2 md:grid-cols-4 gap-4"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        visible: {
                            transition: {
                                staggerChildren: 0.1,
                            },
                        },
                    }}
                >
                    {categories.map(category => {
                        const count = getTermsByCategory(category).length;
                        return (
                            <motion.div 
                                key={category} 
                                className="text-center p-4 bg-base-200/50 rounded-xl hover:bg-base-200 transition-colors duration-200 border border-base-300/50 hover:border-primary/30 group"
                                variants={{
                                    hidden: { opacity: 0, scale: 0.9 },
                                    visible: { opacity: 1, scale: 1 },
                                }}
                                whileHover={{ scale: 1.05 }}
                            >
                                <div className="text-3xl font-bold text-primary mb-1">{count}</div>
                                <div className="text-sm font-medium text-base-content/70 uppercase tracking-wider">{category}</div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            </motion.div>
        </div>
    );
};
