import React, { useState } from 'react';
import { useIsMobile } from '../../hooks/useIsMobile';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  onClick: () => void;
  badge?: number;
}

interface NavigationMenuProps {
  items: NavItem[];
  currentPath?: string;
}

export const NavigationMenu: React.FC<NavigationMenuProps> = ({ items, currentPath }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="win-icon-button"
          aria-label="Abrir menu de navegação"
          aria-expanded={isOpen}
        >
          <span className="text-xl">☰</span>
        </button>
        {isOpen && (
          <div className="fixed inset-0 z-50 glass-overlay animate-fade-in" style={{ animationDuration: '300ms' }} onClick={() => setIsOpen(false)}>
            <nav
              className="mica w-80 h-full p-6 overflow-y-auto animate-slide-in-from-left"
              onClick={(e) => e.stopPropagation()}
              role="navigation"
              aria-label="Menu principal"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="heading-section">Navegação</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="win-icon-button"
                  aria-label="Fechar menu"
                >
                  ✕
                </button>
              </div>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => {
                        item.onClick();
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                        currentPath === item.id
                          ? 'bg-accent/20 text-accent border border-accent/50'
                          : 'hover:bg-surface-hover text-text-secondary hover:text-text-primary'
                      }`}
                      aria-current={currentPath === item.id ? 'page' : undefined}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{item.icon}</span>
                          <span className="font-medium">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="bg-accent text-white text-xs px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}
      </>
    );
  }

  return (
    <nav className="flex items-center gap-2" role="navigation" aria-label="Menu principal">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={item.onClick}
          className={`tab-pill ${currentPath === item.id ? 'tab-pill--active' : ''}`}
          aria-current={currentPath === item.id ? 'page' : undefined}
        >
          <span className="mr-2">{item.icon}</span>
          {item.label}
          {item.badge && (
            <span className="ml-2 bg-accent text-white text-xs px-1.5 py-0.5 rounded-full">
              {item.badge}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
};