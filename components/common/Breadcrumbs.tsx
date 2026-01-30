import React from 'react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  icon?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items, className = '' }) => {
  return (
    <nav
      className={`flex items-center gap-2 text-sm ${className}`}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center gap-2" itemScope itemType="https://schema.org/BreadcrumbList">
        {items.map((item, index) => (
          <li
            key={index}
            className="flex items-center gap-2"
            itemProp="itemListElement"
            itemScope
            itemType="https://schema.org/ListItem"
          >
            {index > 0 && (
              <span className="text-text-tertiary" aria-hidden="true">
                /
              </span>
            )}
            {item.onClick ? (
              <button
                onClick={item.onClick}
                className="text-text-secondary hover:text-accent transition-colors flex items-center gap-1"
                itemProp="item"
              >
                {item.icon && <span>{item.icon}</span>}
                <span itemProp="name">{item.label}</span>
              </button>
            ) : (
              <span className="text-text-primary flex items-center gap-1" itemProp="name">
                {item.icon && <span>{item.icon}</span>}
                {item.label}
              </span>
            )}
            <meta itemProp="position" content={String(index + 1)} />
          </li>
        ))}
      </ol>
    </nav>
  );
};