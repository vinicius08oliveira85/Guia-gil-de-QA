import React, { useState } from 'react';
import { windows12Styles } from '../../utils/windows12Styles';

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
    <div className={`
      ${windows12Styles.card}
      ${windows12Styles.spacing.lg}
      ${windows12Styles.transition.normal}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setExpanded(!expanded)}
          className={`
            flex items-center gap-4 flex-1 text-left
            hover:opacity-80
            ${windows12Styles.transition.fast}
          `}
        >
          {icon && <span className="text-3xl">{icon}</span>}
          <div>
            <h3 className="text-2xl font-bold text-text-primary mb-1">{title}</h3>
            {count !== undefined && (
              <p className="text-base text-text-secondary">
                {count} {count === 1 ? 'item' : 'itens'}
              </p>
            )}
          </div>
        </button>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          {onViewModeChange && hasContent && (
            <div className={`
              flex items-center gap-1 p-1 bg-surface-hover rounded-lg border border-surface-border
              ${windows12Styles.transition.normal}
            `}>
              <button
                onClick={() => onViewModeChange('list')}
                className={`
                  p-1.5 rounded
                  ${windows12Styles.transition.fast}
                  ${viewMode === 'list'
                    ? 'bg-accent/20 text-accent-light'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }
                `}
                title="Visualização em lista"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => onViewModeChange('grid')}
                className={`
                  p-1.5 rounded
                  ${windows12Styles.transition.fast}
                  ${viewMode === 'grid'
                    ? 'bg-accent/20 text-accent-light'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }
                `}
                title="Visualização em grade"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => onViewModeChange('detailed')}
                className={`
                  p-1.5 rounded
                  ${windows12Styles.transition.fast}
                  ${viewMode === 'detailed'
                    ? 'bg-accent/20 text-accent-light'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                  }
                `}
                title="Visualização detalhada"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            </div>
          )}

          {/* Filters Toggle */}
          {filters && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                p-2 rounded-lg hover:bg-surface-hover
                ${windows12Styles.transition.fast}
              `}
              title="Filtros"
            >
              <svg className="w-5 h-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </button>
          )}

          {/* Actions */}
          {actions}

          {/* Expand/Collapse */}
          <button
            onClick={() => setExpanded(!expanded)}
            className={`
              p-2 rounded-lg hover:bg-surface-hover
              ${windows12Styles.transition.fast}
            `}
          >
            <svg
              className={`
                w-5 h-5 text-text-secondary
                ${windows12Styles.transition.normal}
                ${expanded ? 'rotate-180' : ''}
              `}
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
        <div className={`
          mb-6 p-5 bg-surface-hover rounded-lg border border-surface-border
          ${windows12Styles.transition.normal}
          ${windows12Styles.spacing.md}
        `}>
          {filters}
        </div>
      )}

      {/* Content */}
      {expanded && (
        <>
          {hasContent ? (
            <div
              className={`
                ${windows12Styles.transition.normal}
                ${
                  viewMode === 'grid'
                    ? windows12Styles.grid.responsive
                    : viewMode === 'list'
                    ? windows12Styles.grid.list
                    : 'space-y-6'
                }
              `}
            >
              {children}
            </div>
          ) : (
            emptyState && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-7xl mb-6">{emptyState.icon}</span>
                <h4 className="text-xl font-semibold text-text-primary mb-3">
                  {emptyState.title}
                </h4>
                <p className="text-base text-text-secondary max-w-md leading-relaxed">
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

