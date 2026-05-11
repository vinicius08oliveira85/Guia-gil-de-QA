import React from 'react';
import { Search } from 'lucide-react';
import type { BusinessRuleSortKey } from '../../utils/businessRulesSort';
import { Button } from '../common/Button';

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
    <div className="relative min-w-0 flex-1 lg:min-w-[200px]">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-base-content/55">
        Buscar
      </span>
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
    <label className="flex w-full flex-col gap-1 sm:min-w-[180px] lg:w-auto">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-widest text-base-content/55">
          Categoria
        </span>
        {onManageCategoriesClick ? (
          <Button
            type="button"
            variant="ghost"
            size="panelXs"
            className="min-h-0 shrink-0 px-2 py-0 text-xs font-semibold text-primary"
            onClick={onManageCategoriesClick}
            aria-label="Gerenciar categorias de regras de negócio"
          >
            Gerenciar
          </Button>
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
    <label className="flex w-full flex-col gap-1 sm:min-w-[200px] lg:w-auto">
      <span className="text-[10px] font-bold uppercase tracking-widest text-base-content/55">
        Ordenar por
      </span>
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
