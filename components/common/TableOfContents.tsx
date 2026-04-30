import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/cn';

export interface TocItem {
  id: string;
  label: string;
  level: number;
}

export interface TableOfContentsProps {
  items: TocItem[];
  className?: string;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ items, className }) => {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -80% 0px' }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav
      className={cn(
        'sticky top-24 rounded-xl border border-base-300/60 bg-base-100/90 p-4 shadow-sm backdrop-blur-sm',
        className
      )}
      aria-label="Sumário da página"
    >
      <h3 className="mb-3 text-sm font-semibold text-base-content">Sumário</h3>
      <ol className="space-y-1 text-sm">
        {items.map((item) => (
          <li key={item.id} style={{ paddingLeft: `${Math.max(0, item.level - 1) * 0.75}rem` }}>
            <a
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={cn(
                'block rounded-lg px-2 py-1 transition-colors',
                activeId === item.id
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-base-content/70 hover:bg-base-200/80 hover:text-base-content'
              )}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
};
