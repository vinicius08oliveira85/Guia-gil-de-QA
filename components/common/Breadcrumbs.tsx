import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../utils/windows12Styles';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  onHomeClick?: () => void;
}

/**
 * Componente Breadcrumbs para navegação hierárquica
 * 
 * @example
 * ```tsx
 * <Breadcrumbs 
 *   items={[
 *     { label: 'Projetos', onClick: () => navigate('/') },
 *     { label: 'Meu Projeto', onClick: () => navigate('/project/1') },
 *     { label: 'Tarefas' }
 *   ]}
 * />
 * ```
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = React.memo(({ 
  items, 
  className,
  showHome = true,
  onHomeClick
}) => {
  return (
    <nav 
      className={cn("flex items-center gap-2 text-sm", className)}
      aria-label="Breadcrumb"
    >
      {showHome && (
        <>
          <button
            onClick={onHomeClick}
            className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-surface-hover transition-colors text-text-secondary hover:text-text-primary"
            aria-label="Início"
          >
            <Home className="w-4 h-4" />
          </button>
          {items.length > 0 && (
            <ChevronRight className="w-4 h-4 text-text-tertiary" aria-hidden="true" />
          )}
        </>
      )}
      
      <ol className="flex items-center gap-2 flex-wrap">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li key={index} className="flex items-center gap-2">
              {item.href ? (
                <a
                  href={item.href}
                  className={cn(
                    "transition-colors",
                    isLast 
                      ? "text-text-primary font-medium" 
                      : "text-text-secondary hover:text-text-primary"
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </a>
              ) : item.onClick ? (
                <button
                  onClick={item.onClick}
                  className={cn(
                    "transition-colors",
                    isLast 
                      ? "text-text-primary font-medium" 
                      : "text-text-secondary hover:text-text-primary"
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </button>
              ) : (
                <span
                  className={cn(
                    isLast 
                      ? "text-text-primary font-medium" 
                      : "text-text-secondary"
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
              
              {!isLast && (
                <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
});

Breadcrumbs.displayName = 'Breadcrumbs';

