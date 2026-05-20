import React from 'react';
import { Search } from 'lucide-react';
import type { BusinessRuleSortKey } from '../../utils/businessRulesSort';
import { searchInputClass } from '../common/viewUi';

export type BusinessRulesFiltersToolbarProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  categoryScope: 'all' | string;
  onCategoryScopeChange: (value: string) => void;
  uniqueCategories: string[];
  sortBy: BusinessRuleSortKey;
  onSortByChange: (value: BusinessRuleSortKey) => void;
  onManageCategoriesClick?: () => void;
};

const selectClass =
  'select select-bordered h-10 min-h-0 w-full rounded-lg border-base-300/80 bg-base-100 text-sm text-base-content shadow-sm';

export const BusinessRulesFiltersToolbar: React.FC<BusinessRulesFiltersToolbarProps> = ({
  searchQuery,
  onSearchQueryChange,
  categoryScope,
  onCategoryScopeChange,
  uniqueCategories,
  sortBy,
  onSortByChange,
  onManageCategoriesClick,
}) => (
  <div className="flex flex-col gap-3 rounded-[var(--rounded-box)] border border-base-300/60 bg-base-200/30 p-3 sm:flex-row sm:flex-wrap sm:items-end lg:gap-4">
    <div className="relative min-w-0 flex-1 lg:min-w-[220px]">
      <span className="mb-1.5 block text-xs font-medium text-base-content/65">Buscar</span>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-base-content/45"
          aria-hidden
        />
        <input
          type="search"
          value={searchQuery}
          onChange={e => onSearchQueryChange(e.target.value)}
          placeholder="Título, descrição ou categoria…"
          className={searchInputClass}
          aria-label="Filtrar regras de negócio"
        />
      </div>
    </div>
    <label className="flex w-full flex-col gap-1 sm:min-w-[180px] lg:w-auto">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-base-content/65">Categoria</span>
        {onManageCategoriesClick ? (
          <button
            type="button"
            className="shrink-0 text-xs font-semibold text-[var(--brand-cta)] hover:underline"
            onClick={onManageCategoriesClick}
            aria-label="Gerenciar categorias de regras de negócio"
          >
            Gerenciar
          </button>
        ) : null}
      </div>
      <select
        value={categoryScope}
        onChange={e => onCategoryScopeChange(e.target.value)}
        className={selectClass}
        aria-label="Filtrar por categoria"
      >
        <option value="all">Todas</option>
        {uniqueCategories.map(c => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </label>
    <label className="flex w-full flex-col gap-1 sm:min-w-[200px] lg:w-auto">
      <span className="text-xs font-medium text-base-content/65">Ordenar por</span>
      <select
        value={sortBy}
        onChange={e => onSortByChange(e.target.value as BusinessRuleSortKey)}
        className={selectClass}
        aria-label="Ordenar lista de regras"
      >
        <option value="created_desc">Mais recentes</option>
        <option value="created_asc">Mais antigas</option>
        <option value="title_asc">Título (A–Z)</option>
        <option value="title_desc">Título (Z–A)</option>
        <option value="category_asc">Categoria (A–Z)</option>
        <option value="category_desc">Categoria (Z–A)</option>
      </select>
    </label>
  </div>
);
