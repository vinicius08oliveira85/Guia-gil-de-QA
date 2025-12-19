import React, { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  icon?: React.ReactNode;
}

/**
 * Seção colapsável reutilizável
 */
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = true,
  icon
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-base-300 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-sm py-xs bg-base-200 hover:bg-base-300 transition-colors"
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? 'Colapsar' : 'Expandir'} seção ${title}`}
      >
        <div className="flex items-center gap-xs">
          {icon && <span className="text-base-content/70">{icon}</span>}
          <span className="text-sm font-semibold text-base-content">{title}</span>
        </div>
        <svg
          className={`w-4 h-4 text-base-content/70 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="p-sm">
          {children}
        </div>
      )}
    </div>
  );
};

