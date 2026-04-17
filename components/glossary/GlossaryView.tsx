import React, { useState, useMemo } from 'react';
import { glossaryTerms, searchGlossaryTerms, getTermsByCategory, GlossaryTerm } from '../../utils/glossaryTerms';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../common/Modal';
import { SectionHeader } from '../common/SectionHeader';

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

    const categoryBadgeClass = (category: GlossaryTerm['category']): string => {
        const map: Record<GlossaryTerm['category'], string> = {
            Geral: 'badge-primary badge-outline',
            Testes: 'badge-success badge-outline',
            Metodologias: 'badge-secondary badge-outline',
            Ferramentas: 'badge-accent badge-outline',
            Métricas: 'badge-info badge-outline',
            Processos: 'badge-warning badge-outline',
            Técnicas: 'badge-neutral badge-outline',
            Padrões: 'badge-error badge-outline',
        };
        return map[category] ?? 'badge-ghost badge-outline border-base-300';
    };

    const categoryGradientClass = (category: GlossaryTerm['category']): string => {
        const map: Record<GlossaryTerm['category'], string> = {
            Geral: 'from-primary/15 via-primary/5 to-transparent',
            Testes: 'from-success/15 via-success/5 to-transparent',
            Metodologias: 'from-secondary/15 via-secondary/5 to-transparent',
            Ferramentas: 'from-accent/15 via-accent/5 to-transparent',
            Métricas: 'from-info/15 via-info/5 to-transparent',
            Processos: 'from-warning/15 via-warning/5 to-transparent',
            Técnicas: 'from-neutral/15 via-neutral/5 to-transparent',
            Padrões: 'from-error/15 via-error/5 to-transparent',
        };
        return map[category] ?? 'from-base-300/30 to-transparent';
    };

    return (
        <div className="py-8 md:py-10 lg:py-12">
            <div className="mb-8 flex flex-col gap-6">
                <SectionHeader
                    as="h1"
                    align="left"
                    fullWidth
                    titleSize="page"
                    density="dense"
                    title="Glossário de Termos de QA"
                    description={
                        <>
                            Explore mais de{' '}
                            <strong className="text-primary">{glossaryTerms.length} termos</strong> relacionados a
                            Quality Assurance, testes de software, metodologias ágeis e muito mais.
                        </>
                    }
                    className="max-w-2xl"
                />

                <div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar termos…"
                        className="input input-bordered w-full rounded-xl border-base-300 bg-base-100 text-base-content placeholder:text-base-content/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                <div className="flex flex-wrap gap-2">
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

            <motion.div 
                className="grid grid-cols-1 gap-4 lg:grid-cols-2"
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
                                className="group relative cursor-pointer overflow-hidden rounded-xl border border-base-300 bg-base-100 p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
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
                                whileHover={{ y: -2 }}
                            >
                                <div
                                    className={`pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${categoryGradientClass(term.category)}`}
                                />
                                
                                <div className="relative z-10">
                                    <div className="flex items-start justify-between mb-3">
                                        <h3 className="text-lg font-semibold text-base-content flex-1 group-hover:text-primary transition-colors duration-200">
                                            {term.term}
                                        </h3>
                                        <motion.span
                                            className={`badge badge-sm ${categoryBadgeClass(term.category)}`}
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
            <Modal
                isOpen={!!selectedTerm}
                onClose={() => setSelectedTerm(null)}
                title={
                    selectedTerm ? (
                        <div className="flex-1">
                            <h2 className="text-2xl font-bold text-base-content mb-2">{selectedTerm.term}</h2>
                            <span className={`badge ${categoryBadgeClass(selectedTerm.category)}`}>
                                {selectedTerm.category}
                            </span>
                        </div>
                    ) : ''
                }
                size="6xl"
                footer={
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedTerm(null)}
                            className="btn btn-primary rounded-full px-6"
                        >
                            Fechar
                        </button>
                    </div>
                }
            >
                {selectedTerm && (
                    <div className="prose max-w-none">
                        <h3 className="text-sm font-semibold text-base-content/70 mb-2 uppercase tracking-wider">Definição</h3>
                        <p className="text-base-content leading-relaxed">{selectedTerm.definition}</p>

                        {selectedTerm.relatedTerms && selectedTerm.relatedTerms.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-sm font-semibold text-base-content/70 mb-2 uppercase tracking-wider">Termos Relacionados</h3>
                                <div className="flex flex-wrap gap-2">
                                    {selectedTerm.relatedTerms.map((related, idx) => (
                                        <span
                                            key={idx}
                                            className="badge badge-outline badge-sm text-primary hover:bg-primary/10 cursor-pointer transition-colors"
                                            onClick={() => {
                                                const relatedTerm = glossaryTerms.find(t => (t.term || '').toLowerCase() === (related || '').toLowerCase());
                                                if (relatedTerm) setSelectedTerm(relatedTerm);
                                            }}
                                        >
                                            {related}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Estatísticas */}
            <motion.div 
                className="mt-8 rounded-xl border border-base-300 bg-base-100 p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg"
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
