import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  onHomeClick?: () => void;
  align?: 'left' | 'center';
  /**
   * Quando true, renderiza sem `<nav>` e com `aria-hidden` — use só para réplica visual
   * junto ao título (o landmark real permanece no Header).
   */
  presentation?: boolean;
}

const linkBase =
  'inline-flex min-h-[44px] max-w-full items-center gap-1.5 rounded-lg px-1.5 text-left font-heading text-sm font-medium text-[color:var(--color-primary-deep)] transition-all duration-200 hover:bg-base-200/50 hover:text-[color:var(--color-primary)] active:scale-[0.99] sm:min-h-0 sm:px-1';

const currentBase =
  'inline-flex min-h-[44px] max-w-full items-center gap-1.5 truncate rounded-lg px-1.5 font-heading text-sm font-semibold text-base-content sm:min-h-0 sm:px-1';

const listContent = (
  items: BreadcrumbItem[],
  showHome: boolean | undefined,
  onHomeClick: (() => void) | undefined,
  align: 'left' | 'center'
) => (
  <ol
    className={cn(
      'flex min-w-0 flex-wrap items-center gap-x-0.5 gap-y-0.5 text-balance text-sm leading-snug text-base-content/70',
      align === 'center' && 'justify-center'
    )}
  >
    {showHome && (
      <li className="flex min-w-0 items-center">
        <button
          type="button"
          onClick={onHomeClick}
          className="win-icon-button h-11 w-11 min-h-[44px] min-w-[44px] rounded-full border border-transparent text-[color:var(--color-primary-deep)] transition-all duration-200 hover:bg-base-200/70 hover:text-[color:var(--color-primary)]"
          aria-label="Início"
        >
          <Home className="h-4 w-4 shrink-0" aria-hidden />
        </button>
        {items.length > 0 && (
          <span className="mx-0.5 flex shrink-0 text-base-content/30" aria-hidden>
            <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </li>
    )}

    {items.map((item, index) => {
      const isLast = index === items.length - 1;

      return (
        <li key={`${item.label}-${index}`} className="flex min-w-0 max-w-full items-center">
          {index > 0 && (
            <span className="mx-0.5 flex shrink-0 text-base-content/30" aria-hidden>
              <ChevronRight className="h-4 w-4" />
            </span>
          )}
          {item.href && !isLast ? (
            <a href={item.href} className={linkBase} aria-current={undefined}>
              {item.icon}
              <span className="truncate">{item.label}</span>
            </a>
          ) : item.onClick && !isLast ? (
            <button type="button" onClick={item.onClick} className={linkBase}>
              {item.icon}
              <span className="truncate">{item.label}</span>
            </button>
          ) : (
            <span className={currentBase} aria-current={isLast ? 'page' : undefined}>
              {item.icon}
              <span className="truncate">{item.label}</span>
            </span>
          )}
        </li>
      );
    })}
  </ol>
);

/**
 * Breadcrumbs com separadores Lucide, tipografia Poppins e alvo de toque ≥44px (mobile).
 */
export const Breadcrumbs: React.FC<BreadcrumbsProps> = React.memo(
  ({ items, className, showHome = true, onHomeClick, align: alignProp = 'left', presentation = false }) => {
    const align: 'left' | 'center' = alignProp === 'center' ? 'center' : 'left';
    const inner = listContent(items, showHome, onHomeClick, align);

    if (presentation) {
      return (
        <div className={cn('min-w-0 font-heading', className)} aria-hidden="true">
          {inner}
        </div>
      );
    }

    return (
      <nav className={cn('min-w-0 font-heading', className)} aria-label="Breadcrumb">
        {inner}
      </nav>
    );
  }
);

Breadcrumbs.displayName = 'Breadcrumbs';
