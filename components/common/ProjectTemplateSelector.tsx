import React, { useState } from 'react';
import { PROJECT_TEMPLATES } from '../../utils/projectTemplates';
import { cn } from '../../utils/cn';

interface ProjectTemplateSelectorProps {
  onSelectTemplate: (templateId: string) => void;
  onClose: () => void;
}

export const ProjectTemplateSelector: React.FC<ProjectTemplateSelectorProps> = ({
  onSelectTemplate,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const categories = ['all', ...Array.from(new Set(PROJECT_TEMPLATES.map(t => t.category)))];

  const filteredTemplates =
    selectedCategory === 'all'
      ? PROJECT_TEMPLATES
      : PROJECT_TEMPLATES.filter(t => t.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      Web: '🌐',
      Mobile: '📱',
      API: '🔌',
      E2E: '🔄',
      Performance: '⚡',
      Segurança: '🔒',
      Geral: '📦',
    };
    return icons[category] || '📋';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            type="button"
            className={cn(
              'btn btn-sm',
              selectedCategory === category ? 'btn-primary' : 'btn-outline'
            )}
          >
            {category === 'all' ? 'Todos' : `${getCategoryIcon(category)} ${category}`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
        {filteredTemplates.map(template => (
          <button
            key={template.id}
            onClick={() => {
              onSelectTemplate(template.id);
              onClose();
            }}
            type="button"
            className={cn(
              'text-left p-4',
              'bg-base-100 border border-base-300',
              'rounded-[var(--rounded-box)]',
              'transition-all hover:shadow-md hover:border-primary/30',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20'
            )}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-base-content">{template.name}</h3>
              <span className="text-2xl">{getCategoryIcon(template.category)}</span>
            </div>
            <p className="text-sm text-base-content/70 mb-3">{template.description}</p>
            <div className="flex flex-wrap gap-2 min-w-0">
              {template.defaultTasks.slice(0, 3).map((task, idx) => (
                <span
                  key={idx}
                  className="badge badge-outline badge-sm max-w-[calc(100%-0.5rem)] truncate whitespace-nowrap"
                  title={task.title}
                >
                  {task.title}
                </span>
              ))}
              {template.defaultTasks.length > 3 && (
                <span className="badge badge-outline badge-sm whitespace-nowrap">
                  +{template.defaultTasks.length - 3} mais
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
