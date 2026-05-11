import React from 'react';
import { FileText, TestTube, Compass, File } from 'lucide-react';
import { cn } from '../../utils/cn';

const CATEGORIES = [
  {
    id: 'requisitos',
    label: 'Requisitos',
    icon: FileText,
    borderLeft: 'border-l-purple-500',
    titleColor: 'text-purple-600 dark:text-purple-400',
    iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  },
  {
    id: 'testes',
    label: 'Testes',
    icon: TestTube,
    borderLeft: 'border-l-emerald-500',
    titleColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'arquitetura',
    label: 'Arquitetura',
    icon: Compass,
    borderLeft: 'border-l-sky-500',
    titleColor: 'text-sky-600 dark:text-sky-400',
    iconBg: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  },
  {
    id: 'outros',
    label: 'Outros',
    icon: File,
    borderLeft: 'border-l-base-content/35',
    titleColor: 'text-base-content/80',
    iconBg: 'bg-base-300/50 text-base-content/70',
  },
] as const;

export interface DocumentStatsCardsProps {
  categoryCounts: Record<string, number>;
  selectedCategory?: string;
  onCategorySelect?: (categoryId: string) => void;
}

/** Cards de contagem alinhados ao painel Tarefas/Dashboard: borda, sombra suave, base-100. */
export const DocumentStatsCards: React.FC<DocumentStatsCardsProps> = ({
  categoryCounts,
  selectedCategory = 'all',
  onCategorySelect,
}) => {
  return (
    <div
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4"
      role="list"
      aria-label="Contagem de documentos por categoria"
    >
      {CATEGORIES.map(({ id, label, icon: Icon, borderLeft, titleColor, iconBg }) => {
        const count = categoryCounts[id] ?? 0;
        const isSelected = selectedCategory === id;
        const isClickable = !!onCategorySelect;
        return (
          <div
            key={id}
            role={isClickable ? 'button' : 'listitem'}
            tabIndex={isClickable ? 0 : undefined}
            onClick={isClickable ? () => onCategorySelect(isSelected ? 'all' : id) : undefined}
            onKeyDown={
              isClickable
                ? e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onCategorySelect?.(isSelected ? 'all' : id);
                    }
                  }
                : undefined
            }
            className={cn(
              'relative overflow-hidden rounded-xl border border-base-300/80 bg-base-100/95 p-4 shadow-sm backdrop-blur-sm transition-all duration-200',
              'border-l-4',
              borderLeft,
              isClickable &&
                'cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:border-primary/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
              isSelected && 'ring-2 ring-primary/40 shadow-md'
            )}
            aria-label={`${label}: ${count} documento(s)${isClickable ? '. Clique para filtrar.' : ''}`}
            aria-pressed={isClickable ? isSelected : undefined}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p
                  className={cn(
                    'text-[10px] font-bold uppercase tracking-widest text-base-content/55',
                    titleColor
                  )}
                >
                  {label}
                </p>
                <p className="mt-1 text-3xl font-bold tabular-nums text-base-content">{count}</p>
              </div>
              <div
                className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-base-200',
                  iconBg
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
