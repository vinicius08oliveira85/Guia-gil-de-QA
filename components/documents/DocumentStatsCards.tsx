import React, { useMemo } from 'react';
import { FileText, TestTube, Compass, File } from 'lucide-react';
import {
  GlassIndicatorCards,
  type IndicatorColorTheme,
  type SmallIndicatorItem,
} from '../dashboard/GlassIndicatorCards';

const CATEGORIES: {
  id: string;
  label: string;
  icon: typeof FileText;
  colorTheme: IndicatorColorTheme;
}[] = [
  { id: 'requisitos', label: 'Requisitos', icon: FileText, colorTheme: 'primary' },
  { id: 'testes', label: 'Testes', icon: TestTube, colorTheme: 'success' },
  { id: 'arquitetura', label: 'Arquitetura', icon: Compass, colorTheme: 'info' },
  { id: 'outros', label: 'Outros', icon: File, colorTheme: 'neutral' },
];

function formatCategoryModifier(count: number, total: number, isSelected: boolean): string {
  if (isSelected) return 'filtro ativo';
  if (total <= 0) return count === 1 ? 'documento' : 'documentos';
  return `${Math.round((count / total) * 100)}% do total`;
}

export interface DocumentStatsCardsProps {
  categoryCounts: Record<string, number>;
  selectedCategory?: string;
  onCategorySelect?: (categoryId: string) => void;
  /** Total de documentos (para % no rodapé do card). */
  totalDocuments?: number;
}

export const DocumentStatsCards: React.FC<DocumentStatsCardsProps> = ({
  categoryCounts,
  selectedCategory = 'all',
  onCategorySelect,
  totalDocuments = 0,
}) => {
  const total =
    totalDocuments > 0
      ? totalDocuments
      : CATEGORIES.reduce((sum, { id }) => sum + (categoryCounts[id] ?? 0), 0);

  const items = useMemo((): SmallIndicatorItem[] => {
    return CATEGORIES.map(({ id, label, icon, colorTheme }) => {
      const count = categoryCounts[id] ?? 0;
      const isSelected = selectedCategory === id;
      const isClickable = !!onCategorySelect;

      return {
        label,
        value: count,
        modifier: formatCategoryModifier(count, total, isSelected),
        icon,
        colorTheme,
        isActive: isSelected,
        onClick: isClickable
          ? () => onCategorySelect!(isSelected ? 'all' : id)
          : undefined,
      };
    });
  }, [categoryCounts, selectedCategory, onCategorySelect, total]);

  return (
    <div role="list" aria-label="Contagem de documentos por categoria">
      <GlassIndicatorCards items={items} columns={4} />
    </div>
  );
};
