import React, { useState, useEffect } from 'react';

interface TocItem {
  id: string;
  label: string;
  level: number;
}

interface TableOfContentsProps {
  items: TocItem[];
  className?: string;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ items, className = '' }) => {
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -80% 0px' }
    );

    items.forEach(item => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav className={`mica p-4 rounded-lg sticky top-24 ${className}`} aria-label="Sumário">
      <h3 className="text-sm font-semibold text-text-primary mb-3">Sumário</h3>
      <ol className="space-y-1 text-sm">
        {items.map(item => (
          <li key={item.id} style={{ paddingLeft: `${(item.level - 1) * 1}rem` }}>
            <a
              href={`#${item.id}`}
              onClick={e => {
                e.preventDefault();
                document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`block py-1 px-2 rounded transition-colors ${
                activeId === item.id
                  ? 'text-accent bg-accent/10'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
              }`}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
};
