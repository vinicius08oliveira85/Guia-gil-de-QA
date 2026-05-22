import React from 'react';
import { FileText, TestTube, Compass, File } from 'lucide-react';
import { cn } from '../../utils/cn';
import { documentCategoryCardClass } from '../common/projectCardUi';

const CATEGORIES = [
  {
    id: 'requisitos',
    label: 'Requisitos',
    icon: FileText,
    tile: 'border-[color-mix(in_srgb,var(--brand-highlight)_28%,transparent)] bg-[color-mix(in_srgb,var(--brand-highlight)_8%,var(--brand-surface-strong))]',
    labelColor: 'text-[var(--brand-highlight)]',
    iconBg: 'bg-[color-mix(in_srgb,var(--brand-highlight)_16%,transparent)] text-[var(--brand-highlight)]',
  },
  {
    id: 'testes',
    label: 'Testes',
    icon: TestTube,
    tile: 'border-[color-mix(in_srgb,#10b981_25%,transparent)] bg-[color-mix(in_srgb,#10b981_8%,var(--brand-surface-strong))]',
    labelColor: 'text-success',
    iconBg: 'bg-[color-mix(in_srgb,#10b981_14%,transparent)] text-success',
  },
  {
    id: 'arquitetura',
    label: 'Arquitetura',
    icon: Compass,
    tile: 'border-[color-mix(in_srgb,var(--brand-cta)_22%,transparent)] bg-[color-mix(in_srgb,var(--brand-cta)_7%,var(--brand-surface-strong))]',
    labelColor: 'text-[var(--brand-cta)]',
    iconBg: 'bg-[color-mix(in_srgb,var(--brand-cta)_14%,transparent)] text-[var(--brand-cta)]',
  },
  {
    id: 'outros',
    label: 'Outros',
    icon: File,
    tile: 'border-[var(--brand-surface-border)] bg-[var(--brand-chip)]',
    labelColor: 'text-[var(--brand-text-muted)]',
    iconBg: 'bg-[color-mix(in_srgb,var(--brand-text-muted)_10%,transparent)] text-[var(--brand-text-muted)]',
  },
] as const;

export interface DocumentStatsCardsProps {
  categoryCounts: Record<string, number>;
  selectedCategory?: string;
  onCategorySelect?: (categoryId: string) => void;
}

export const DocumentStatsCards: React.FC<DocumentStatsCardsProps> = ({
  categoryCounts,
  selectedCategory = 'all',
  onCategorySelect,
}) => {
  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5"
      role="list"
      aria-label="Contagem de documentos por categoria"
    >
      {CATEGORIES.map(({ id, label, icon: Icon, tile, labelColor, iconBg }) => {
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
              documentCategoryCardClass,
              tile,
              isClickable &&
                'cursor-pointer hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--brand-cta)_35%,transparent)] hover:shadow-[0_10px_24px_-14px_var(--brand-surface-shadow)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--brand-cta)_30%,transparent)] motion-reduce:hover:translate-y-0',
              isSelected &&
                'ring-2 ring-[color-mix(in_srgb,var(--brand-cta)_40%,transparent)] border-[color-mix(in_srgb,var(--brand-cta)_30%,transparent)]'
            )}
            aria-label={`${label}: ${count} documento(s)${isClickable ? '. Clique para filtrar.' : ''}`}
            aria-pressed={isClickable ? isSelected : undefined}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className={cn('text-[10px] font-bold uppercase tracking-wider', labelColor)}>{label}</p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums text-[var(--brand-text-strong)] sm:text-3xl">
                  {count}
                </p>
              </div>
              <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', iconBg)}>
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
