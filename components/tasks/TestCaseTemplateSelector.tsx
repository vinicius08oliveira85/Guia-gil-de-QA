import React, { useState } from 'react';
import { TEST_CASE_TEMPLATES, TestCaseTemplate } from '../../utils/testCaseTemplates';

interface TestCaseTemplateSelectorProps {
  onSelectTemplate: (templateId: string) => void;
  onClose: () => void;
}

export const TestCaseTemplateSelector: React.FC<TestCaseTemplateSelectorProps> = ({
  onSelectTemplate,
  onClose
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const categories = ['all', ...Array.from(new Set(TEST_CASE_TEMPLATES.map(t => t.category)))];

  const filteredTemplates = selectedCategory === 'all'
    ? TEST_CASE_TEMPLATES
    : TEST_CASE_TEMPLATES.filter(t => t.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Functional': '⚙️',
      'Integration': '🔌',
      'Performance': '⚡',
      'Security': '🔒',
      'Usability': '👤',
      'Regression': '🔄',
      'Smoke': '💨',
      'E2E': '🎯'
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

      <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
        {filteredTemplates.map(template => (
          <button
            key={template.id}
            onClick={() => {
              onSelectTemplate(template.id);
              onClose();
            }}
            className="text-left p-4 bg-surface border border-surface-border rounded-lg hover:border-accent transition-all"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-text-primary">{template.name}</h3>
              <span className="text-xl">{getCategoryIcon(template.category)}</span>
            </div>
            <p className="text-sm text-text-secondary mb-2">{template.description}</p>
            <div className="text-xs text-text-secondary">
              <p className="mb-1"><strong>Descrição:</strong> {template.testCase.description}</p>
              <p><strong>Passos:</strong> {template.testCase.steps.length} passos</p>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {template.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 bg-black/20 rounded text-text-secondary"
                >
                  {tag}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

