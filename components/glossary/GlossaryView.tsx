import React, { useState, useMemo } from 'react';
import {
  glossaryTerms,
  searchGlossaryTerms,
  getTermsByCategory,
  GlossaryTerm,
} from '../../utils/glossaryTerms';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../common/Modal';
import {
  leveGlossaryCardClass,
  leveGlossaryCardDescClass,
  leveGlossaryCardFooterClass,
  leveGlossaryCardTitleClass,
  leveGlossaryCategoryBadgeBaseClass,
  leveGlossaryHashtagClass,
  leveGlossaryRelatedTermClass,
  leveGlossaryShellClass,
  leveGlossaryStatsItemClass,
  leveGlossaryStatsPanelClass,
  leveGlossaryToolbarClass,
  leveSettingsHeadingSmClass,
  leveSettingsMutedTextClass,
  leveViewFilterPillClass,
  leveViewPageSubtitleClass,
  leveViewPageTitleClass,
  leveViewPrimaryBtnClass,
  leveViewSearchInputClass,
  workspaceDaisyStatLabelClass,
  workspaceDaisyStatValueClass,
} from '../common/projectCardUi';
import { cn } from '../../utils/cn';

const categoryBadgeTone: Record<GlossaryTerm['category'], string> = {
  Geral:
    'border-[color-mix(in_srgb,var(--leve-header-text)_22%,transparent)] bg-[color-mix(in_srgb,var(--leve-header-text)_8%,var(--leve-header-bg))] text-[var(--leve-header-text)]',
  Testes:
    'border-[color-mix(in_srgb,#22c55e_28%,transparent)] bg-[color-mix(in_srgb,#22c55e_10%,var(--leve-header-bg))] text-[#166534]',
  Metodologias:
    'border-[color-mix(in_srgb,var(--leve-header-text)_18%,transparent)] bg-[color-mix(in_srgb,var(--leve-header-text)_6%,var(--leve-header-cream))] text-[var(--leve-header-text)]',
  Ferramentas:
    'border-[color-mix(in_srgb,var(--leve-header-accent)_35%,transparent)] bg-[color-mix(in_srgb,var(--leve-header-accent)_10%,var(--leve-header-bg))] text-[var(--leve-header-accent)]',
  Métricas:
    'border-[color-mix(in_srgb,#3b82f6_28%,transparent)] bg-[color-mix(in_srgb,#3b82f6_10%,var(--leve-header-bg))] text-[#1d4ed8]',
  Processos:
    'border-[color-mix(in_srgb,var(--leve-header-accent)_30%,transparent)] bg-[color-mix(in_srgb,var(--leve-header-accent)_8%,var(--leve-header-cream))] text-[#9a3412]',
  Técnicas:
    'border-[color-mix(in_srgb,#78716c_25%,transparent)] bg-[color-mix(in_srgb,#78716c_8%,var(--leve-header-bg))] text-[#44403c]',
  Padrões:
    'border-[color-mix(in_srgb,var(--leve-header-text)_25%,transparent)] bg-[color-mix(in_srgb,var(--leve-header-text)_12%,var(--leve-header-cream))] text-[var(--leve-header-text)]',
};

const categoryBadgeClass = (category: GlossaryTerm['category']) =>
  cn(leveGlossaryCategoryBadgeBaseClass, categoryBadgeTone[category]);

export const GlossaryView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GlossaryTerm['category'] | 'Todos'>(
    'Todos'
  );
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);

  const categories: GlossaryTerm['category'][] = [
    'Geral',
    'Testes',
    'Metodologias',
    'Ferramentas',
    'Métricas',
    'Processos',
    'Técnicas',
    'Padrões',
  ];

  const filteredTerms = useMemo(() => {
    let terms = glossaryTerms;

    if (selectedCategory !== 'Todos') {
      terms = getTermsByCategory(selectedCategory);
    }

    if (searchQuery.trim()) {
      terms = searchGlossaryTerms(searchQuery).filter(
        term => selectedCategory === 'Todos' || term.category === selectedCategory
      );
    }

    return terms.sort((a, b) => a.term.localeCompare(b.term));
  }, [searchQuery, selectedCategory]);

  return (
    <div className={leveGlossaryShellClass}>
      <div className={leveGlossaryToolbarClass}>
        <div className="max-w-2xl">
          <h2 className={leveViewPageTitleClass}>Glossário de Termos de QA</h2>
          <p className={cn(leveViewPageSubtitleClass, 'mt-2')}>
            Explore mais de{' '}
            <strong className="font-semibold text-[var(--leve-header-accent)]">
              {glossaryTerms.length} termos
            </strong>{' '}
            relacionados a Quality Assurance, testes de software, metodologias ágeis e muito mais.
          </p>
        </div>

        <div>
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar termos…"
            className={cn(leveViewSearchInputClass, 'pl-4')}
            aria-label="Buscar termos no glossário"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('Todos')}
            className={leveViewFilterPillClass(selectedCategory === 'Todos')}
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
                className={leveViewFilterPillClass(selectedCategory === category)}
              >
                {category} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
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
                className={leveGlossaryCardClass}
                variants={{
                  hidden: { opacity: 0, y: 20, scale: 0.98 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1.0,
                    transition: {
                      duration: 0.3,
                      ease: [0.16, 1, 0.3, 1],
                    },
                  },
                }}
                whileHover={{
                  y: -2,
                  transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className={leveGlossaryCardTitleClass}>{term.term}</h3>
                  <span className={categoryBadgeClass(term.category)}>{term.category}</span>
                </div>
                <p className={leveGlossaryCardDescClass}>{term.definition}</p>
                {term.relatedTerms && term.relatedTerms.length > 0 && (
                  <div className={leveGlossaryCardFooterClass}>
                    {term.relatedTerms.slice(0, 3).map((related, idx) => (
                      <span key={idx} className={leveGlossaryHashtagClass}>
                        #{related}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))
          ) : (
            <motion.div
              className="col-span-full py-12 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-4 text-6xl" aria-hidden>
                🔍
              </div>
              <h3 className={leveSettingsHeadingSmClass}>Nenhum termo encontrado</h3>
              <p className={leveSettingsMutedTextClass}>
                Tente buscar com outras palavras ou selecione uma categoria diferente.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <Modal
        isOpen={!!selectedTerm}
        onClose={() => setSelectedTerm(null)}
        title={
          selectedTerm ? (
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-sans text-2xl font-bold text-[var(--leve-header-text)]">
                {selectedTerm.term}
              </h2>
              <span className={categoryBadgeClass(selectedTerm.category)}>
                {selectedTerm.category}
              </span>
            </div>
          ) : (
            ''
          )
        }
        size="6xl"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setSelectedTerm(null)} className={leveViewPrimaryBtnClass}>
              Fechar
            </button>
          </div>
        }
      >
        {selectedTerm && (
          <div className="max-w-none font-sans">
            <h3 className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-[var(--leve-header-text-muted)]">
              Definição
            </h3>
            <p className="leading-relaxed text-[var(--leve-header-text)]">{selectedTerm.definition}</p>

            {selectedTerm.relatedTerms && selectedTerm.relatedTerms.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 font-sans text-xs font-semibold uppercase tracking-wider text-[var(--leve-header-text-muted)]">
                  Termos Relacionados
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedTerm.relatedTerms.map((related, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={leveGlossaryRelatedTermClass}
                      onClick={() => {
                        const relatedTerm = glossaryTerms.find(
                          t => (t.term || '').toLowerCase() === (related || '').toLowerCase()
                        );
                        if (relatedTerm) setSelectedTerm(relatedTerm);
                      }}
                    >
                      {related}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <motion.div
        className={leveGlossaryStatsPanelClass}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className={cn(leveSettingsHeadingSmClass, 'mb-5 flex items-center gap-2')}>
          <span aria-hidden>📊</span>
          Estatísticas do Glossário
        </h3>
        <motion.div
          className="grid grid-cols-2 gap-4 md:grid-cols-4"
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
                className={leveGlossaryStatsItemClass}
                variants={{
                  hidden: { opacity: 0, scale: 0.9 },
                  visible: { opacity: 1, scale: 1 },
                }}
              >
                <div className={workspaceDaisyStatValueClass}>{count}</div>
                <div className={workspaceDaisyStatLabelClass}>{category}</div>
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
};
