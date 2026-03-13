import React from 'react';
import { FileText, TestTube, Compass, File } from 'lucide-react';
import { cn } from '../../utils/cn';

const CATEGORIES = [
  { id: 'requisitos', label: 'REQUISITOS', bgClass: 'bg-brand-purple', icon: FileText },
  { id: 'testes', label: 'TESTES', bgClass: 'bg-brand-orange', icon: TestTube },
  { id: 'arquitetura', label: 'ARQUITETURA', bgClass: 'bg-brand-blue', icon: Compass },
  { id: 'outros', label: 'OUTROS', bgClass: 'bg-slate-500 dark:bg-slate-600', icon: File },
] as const;

export interface DocumentStatsCardsProps {
  categoryCounts: Record<string, number>;
  /** Categoria atualmente selecionada no filtro; quando igual ao id do card, destaca o card */
  selectedCategory?: string;
  /** Ao clicar no card, aplica filtro por essa categoria (id ou 'all' para limpar) */
  onCategorySelect?: (categoryId: string) => void;
}

export const DocumentStatsCards: React.FC<DocumentStatsCardsProps> = ({
  categoryCounts,
  selectedCategory = 'all',
  onCategorySelect,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" role="list" aria-label="Contagem de documentos por categoria">
      {CATEGORIES.map(({ id, label, bgClass, icon: Icon }) => {
        const count = categoryCounts[id] ?? 0;
        const isSelected = selectedCategory === id;
        const isClickable = !!onCategorySelect;
        return (
          <div
            key={id}
            role={isClickable ? 'button' : 'listitem'}
            tabIndex={isClickable ? 0 : undefined}
            onClick={isClickable ? () => onCategorySelect(isSelected ? 'all' : id) : undefined}
            onKeyDown={isClickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCategorySelect?.(isSelected ? 'all' : id); } } : undefined}
            className={cn(
              `${bgClass} p-6 rounded-[12px] text-white relative overflow-hidden group transition-all`,
              isClickable && 'cursor-pointer hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white/50',
              isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-base-100'
            )}
            aria-label={`${label}: ${count} documento(s)${isClickable ? '. Clique para filtrar.' : ''}`}
            aria-pressed={isClickable ? isSelected : undefined}
          >
            <div className="relative z-10">
              <p className="text-[10px] font-bold tracking-widest uppercase opacity-80">{label}</p>
              <p className="text-4xl font-bold mt-1">{count}</p>
            </div>
            <Icon
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 opacity-20 transition-transform group-hover:scale-110"
              aria-hidden
            />
          </div>
        );
      })}
    </div>
  );
};
