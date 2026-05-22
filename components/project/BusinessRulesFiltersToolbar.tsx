import React from 'react';
import { Search } from 'lucide-react';
import type { BusinessRuleSortKey } from '../../utils/businessRulesSort';
import {
  leveViewFilterLabelClass,
  leveViewFilterSelectClass,
  leveViewFiltersBarClass,
  leveViewManageLinkClass,
  leveViewSearchInputClass,
} from '../common/projectCardUi';

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
  <div className={leveViewFiltersBarClass}>
    <div className="relative min-w-0 flex-1 lg:min-w-[220px]">
      <span className={leveViewFilterLabelClass}>Buscar</span>
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--leve-header-text-muted)]"
          aria-hidden
        />
        <input
          type="search"
          value={searchQuery}
          onChange={e => onSearchQueryChange(e.target.value)}
          placeholder="Título, descrição ou categoria…"
          className={leveViewSearchInputClass}
          aria-label="Filtrar regras de negócio"
        />
      </div>
    </div>
    <label className="flex w-full flex-col gap-1 sm:min-w-[180px] lg:w-auto">
      <div className="flex items-center justify-between gap-2">
        <span className={leveViewFilterLabelClass}>Categoria</span>
        {onManageCategoriesClick ? (
          <button
            type="button"
            className={leveViewManageLinkClass}
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
        className={leveViewFilterSelectClass}
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
      <span className={leveViewFilterLabelClass}>Ordenar por</span>
      <select
        value={sortBy}
        onChange={e => onSortByChange(e.target.value as BusinessRuleSortKey)}
        className={leveViewFilterSelectClass}
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
