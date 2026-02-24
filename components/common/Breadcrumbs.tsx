import React from 'react';
import { Home } from 'lucide-react';
import { cn } from '../../utils/cn';

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
export const Breadcrumbs: React.FC<BreadcrumbsProps> = React.memo(
  ({ items, className, showHome = true, onHomeClick }) => {
    return (
      <nav className={cn('breadcrumbs text-sm', className)} aria-label="Breadcrumb">
        <ul className="text-base-content/70">
          {showHome && (
            <li>
              <button
                onClick={onHomeClick}
                className="btn btn-ghost btn-xs btn-circle"
                aria-label="Início"
                type="button"
              >
                <Home className="w-4 h-4" />
              </button>
            </li>
          )}

          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const baseClass = cn(
              'transition-colors',
              isLast ? 'text-base-content font-medium' : 'hover:text-base-content'
            );

            return (
              <li key={index}>
                {item.href ? (
                  <a
                    href={item.href}
                    className={baseClass}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {item.label}
                  </a>
                ) : item.onClick ? (
                  <button
                    onClick={item.onClick}
                    className={baseClass}
                    aria-current={isLast ? 'page' : undefined}
                    type="button"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className={baseClass} aria-current={isLast ? 'page' : undefined}>
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }
);

Breadcrumbs.displayName = 'Breadcrumbs';
