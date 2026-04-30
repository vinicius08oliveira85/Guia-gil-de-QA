import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  /** Exibe “Início” como primeiro item (requer `onHomeClick`). */
  showHome?: boolean;
  onHomeClick?: () => void;
  dense?: boolean;
  align?: 'left' | 'center' | 'right';
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className,
  showHome = false,
  onHomeClick,
  dense,
  align = 'left',
}) => {
  const list: BreadcrumbItem[] =
    showHome && onHomeClick
      ? [{ label: 'Início', icon: <Home className="h-3.5 w-3.5" aria-hidden />, onClick: onHomeClick }, ...items]
      : items;

  return (
    <nav
      className={cn(
        'min-w-0',
        align === 'center' && 'flex justify-center',
        align === 'right' && 'flex justify-end',
        className
      )}
      aria-label="Trilha de navegação"
    >
      <ol
        className={cn(
          'flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-sm',
          dense && 'text-xs',
          align === 'left' && 'justify-start'
        )}
        itemScope
        itemType="https://schema.org/BreadcrumbList"
      >
        {list.map((item, index) => (
          <li
            key={`${item.label}-${index}`}
            className="flex min-w-0 items-center gap-1"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            {index > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-base-content/40" aria-hidden />}
            {item.onClick ? (
              <button
                type="button"
                onClick={item.onClick}
                className={cn(
                  'inline-flex min-h-[44px] max-w-full min-w-0 items-center gap-1 rounded-lg px-1.5 py-1 text-left font-medium text-base-content/80 underline-offset-2 transition-colors hover:bg-base-200/70 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:min-h-0 sm:py-0.5',
                  dense && 'font-normal'
                )}
                itemProp="item"
              >
                {item.icon}
                <span className="truncate" itemProp="name">
                  {item.label}
                </span>
              </button>
            ) : (
              <span
                className={cn(
                  'inline-flex max-w-full min-w-0 items-center gap-1 truncate px-1.5 font-semibold text-base-content',
                  dense && 'font-medium'
                )}
                itemProp="name"
                aria-current="page"
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </span>
            )}
            <meta itemProp="position" content={String(index + 1)} />
          </li>
        ))}
      </ol>
    </nav>
  );
};
