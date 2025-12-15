import React, { useState } from 'react';
import { cn } from '../../utils/cn';

interface AnalysisSectionProps {
  title: string;
  icon?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  actions?: React.ReactNode;
  viewMode?: 'list' | 'grid' | 'detailed';
  onViewModeChange?: (mode: 'list' | 'grid' | 'detailed') => void;
  filters?: React.ReactNode;
  emptyState?: {
    icon: string;
    title: string;
    description: string;
  };
  count?: number;
}

export const AnalysisSection: React.FC<AnalysisSectionProps> = ({
  title,
  icon,
  children,
  defaultExpanded = true,
  actions,
  viewMode = 'grid',
  onViewModeChange,
  filters,
  emptyState,
  count
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [showFilters, setShowFilters] = useState(false);

  const hasContent = React.Children.count(children) > 0;

  return (
    <div className="p-6 bg-base-100 border border-base-300 rounded-xl transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-4 flex-1 text-left hover:opacity-80 transition-all"
        >
          {icon && <span className="text-3xl">{icon}</span>}
          <div>
            <h3 className="text-2xl font-bold tracking-tight text-base-content mb-1">{title}</h3>
            {count !== undefined && (
              <p className="text-base text-base-content/70">
                {count} {count === 1 ? 'item' : 'itens'}
              </p>
            )}
          </div>
        </button>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          {onViewModeChange && hasContent && (
            <div className="flex items-center gap-1 p-1 bg-base-200 rounded-full border border-base-300 transition-all">
              <button
                type="button"
                onClick={() => onViewModeChange('list')}
                className={`btn btn-ghost btn-xs rounded-full ${viewMode === 'list' ? 'bg-primary/10 text-primary' : ''}`}
                title="Visualização em lista"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('grid')}
                className={`btn btn-ghost btn-xs rounded-full ${viewMode === 'grid' ? 'bg-primary/10 text-primary' : ''}`}
                title="Visualização em grade"
              >
                <span className="emoji-sticker">🔲</span>
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('detailed')}
                className={`btn btn-ghost btn-xs rounded-full ${viewMode === 'detailed' ? 'bg-primary/10 text-primary' : ''}`}
                title="Visualização detalhada"
              >
                <span className="emoji-sticker">📋</span>
              </button>
            </div>
          )}

          {/* Filters Toggle */}
          {filters && (
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-ghost btn-sm btn-circle"
              title="Filtros"
            >
              <span className="emoji-sticker">🔽</span>
            </button>
          )}

          {/* Actions */}
          {actions}

          {/* Expand/Collapse */}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <svg
              className={`w-5 h-5 text-base-content/70 transition-transform ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && filters && (
        <div className="mb-6 p-5 bg-base-200 rounded-xl border border-base-300 transition-all">
          {filters}
        </div>
      )}

      {/* Content */}
      {expanded && (
        <>
          {hasContent ? (
            <div
              className={cn(
                "transition-all",
                viewMode === 'grid'
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : viewMode === 'list'
                  ? "space-y-4"
                  : "space-y-6"
              )}
            >
              {children}
            </div>
          ) : (
            emptyState && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-7xl mb-6">{emptyState.icon}</span>
                <h4 className="text-xl font-semibold text-base-content mb-3">
                  {emptyState.title}
                </h4>
                <p className="text-base text-base-content/70 max-w-md leading-relaxed">
                  {emptyState.description}
                </p>
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};

