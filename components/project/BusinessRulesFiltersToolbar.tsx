import React from 'react';
import { Search } from 'lucide-react';
import type { BusinessRuleSortKey } from '../../utils/businessRulesSort';

export type BusinessRulesFiltersToolbarProps = {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  categoryScope: 'all' | string;
  onCategoryScopeChange: (value: string) => void;
  uniqueCategories: string[];
  sortBy: BusinessRuleSortKey;
  onSortByChange: (value: BusinessRuleSortKey) => void;
  /** Abre gestão de nomes de categoria (presets do projeto). */
  onManageCategoriesClick?: () => void;
};

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
  <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:flex-wrap">
    <div className="relative flex-1 min-w-0 lg:min-w-[200px]">
      <span className="text-xs font-medium text-base-content/60 mb-1 block">Buscar</span>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40 pointer-events-none"
          aria-hidden
        />
        <input
          type="search"
          value={searchQuery}
          onChange={e => onSearchQueryChange(e.target.value)}
          placeholder="Título, descrição ou categoria..."
          className="input input-bordered w-full pl-10 bg-base-100 border-base-300 text-base-content min-h-[44px] rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Filtrar regras de negócio"
        />
      </div>
    </div>
    <label className="flex flex-col gap-1 w-full sm:min-w-[180px] lg:w-auto">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-base-content/60">Categoria</span>
        {onManageCategoriesClick ? (
          <button
            type="button"
            onClick={onManageCategoriesClick}
            className="btn btn-ghost btn-xs h-7 min-h-0 px-2 text-xs font-medium text-primary shrink-0"
            aria-label="Gerenciar categorias de regras de negócio"
          >
            Gerenciar
          </button>
        ) : null}
      </div>
      <select
        value={categoryScope}
        onChange={e => onCategoryScopeChange(e.target.value)}
        className="select select-bordered w-full bg-base-100 border-base-300 text-base-content min-h-[44px] rounded-xl text-sm"
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
    <label className="flex flex-col gap-1 w-full sm:min-w-[200px] lg:w-auto">
      <span className="text-xs font-medium text-base-content/60">Ordenar por</span>
      <select
        value={sortBy}
        onChange={e => onSortByChange(e.target.value as BusinessRuleSortKey)}
        className="select select-bordered w-full bg-base-100 border-base-300 text-base-content min-h-[44px] rounded-xl text-sm"
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
