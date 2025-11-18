import React, { useState } from 'react';
import { PROJECT_TEMPLATES, ProjectTemplate } from '../../utils/projectTemplates';

interface ProjectTemplateSelectorProps {
  onSelectTemplate: (templateId: string) => void;
  onClose: () => void;
}

export const ProjectTemplateSelector: React.FC<ProjectTemplateSelectorProps> = ({
  onSelectTemplate,
  onClose
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const categories = ['all', ...Array.from(new Set(PROJECT_TEMPLATES.map(t => t.category)))];

  const filteredTemplates = selectedCategory === 'all'
    ? PROJECT_TEMPLATES
    : PROJECT_TEMPLATES.filter(t => t.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Web': '🌐',
      'Mobile': '📱',
      'API': '🔌',
      'E2E': '🔄',
      'Performance': '⚡',
      'Segurança': '🔒',
      'Geral': '📦'
    };
    return icons[category] || '📋';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 rounded-md text-sm transition-colors ${
              selectedCategory === category
                ? 'bg-accent text-white'
                : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover'
            }`}
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
            className="text-left p-4 bg-surface border border-surface-border rounded-lg hover:border-accent transition-all hover:shadow-lg"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-text-primary">{template.name}</h3>
              <span className="text-2xl">{getCategoryIcon(template.category)}</span>
            </div>
            <p className="text-sm text-text-secondary mb-3">{template.description}</p>
            <div className="flex flex-wrap gap-2">
              {template.defaultTasks.slice(0, 3).map((task, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-1 bg-black/20 rounded text-text-secondary"
                >
                  {task.title}
                </span>
              ))}
              {template.defaultTasks.length > 3 && (
                <span className="text-xs px-2 py-1 bg-black/20 rounded text-text-secondary">
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

