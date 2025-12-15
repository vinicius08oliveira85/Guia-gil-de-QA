import React, { useState } from 'react';
import { TEST_CASE_TEMPLATES } from '../../utils/testCaseTemplates';
import { JiraTask } from '../../types';

interface TestCaseTemplateSelectorProps {
  onSelectTemplate: (templateId: string, taskId?: string) => void;
  onClose: () => void;
  selectedTaskId?: string | null;
  availableTasks?: JiraTask[];
  onSelectTask?: (taskId: string) => void;
}

export const TestCaseTemplateSelector: React.FC<TestCaseTemplateSelectorProps> = ({
  onSelectTemplate,
  onClose,
  selectedTaskId,
  availableTasks = [],
  onSelectTask
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const categories = ['all', ...Array.from(new Set(TEST_CASE_TEMPLATES.map(t => t.category)))];

  const filteredTemplates = selectedCategory === 'all'
    ? TEST_CASE_TEMPLATES
    : TEST_CASE_TEMPLATES.filter(t => t.category === selectedCategory);

  const needsTaskSelection = !selectedTaskId && availableTasks.length > 0 && onSelectTask;

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
      {/* Seletor de Tarefa - Mostrar apenas se não houver tarefa selecionada */}
      {needsTaskSelection && (
        <div className="mb-4 rounded-2xl border border-base-300 bg-base-100 p-4">
          <label className="block text-sm font-semibold text-text-primary mb-2">
            Selecione a tarefa para adicionar o template:
          </label>
          <div className="max-h-40 overflow-y-auto space-y-2">
            {availableTasks.map(task => (
              <button
                key={task.id}
                onClick={() => onSelectTask?.(task.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedTaskId === task.id
                    ? 'bg-accent/10 border-accent text-accent'
                    : 'bg-surface border-surface-border hover:border-accent/30 hover:bg-surface-hover'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-text-primary">{task.id}</p>
                    <p className="text-sm text-text-secondary truncate">{task.title}</p>
                  </div>
                  {selectedTaskId === task.id && (
                    <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mostrar tarefa selecionada */}
      {selectedTaskId && !needsTaskSelection && (
        <div className="mb-4 p-3 bg-accent/10 border border-accent/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-secondary mb-1">Tarefa selecionada:</p>
              <p className="text-sm font-semibold text-accent">
                {availableTasks.find(t => t.id === selectedTaskId)?.id || selectedTaskId}
              </p>
            </div>
            {onSelectTask && (
              <button
                onClick={() => onSelectTask('')}
                className="text-xs text-text-secondary hover:text-accent transition-colors"
              >
                Alterar
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedCategory === category
                ? 'bg-accent text-white shadow-md shadow-accent/30'
                : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover hover:border-accent/30'
            }`}
          >
            {category === 'all' ? 'Todos' : `${getCategoryIcon(category)} ${category}`}
          </button>
        ))}
      </div>

      {needsTaskSelection && !selectedTaskId && (
        <div className="p-4 bg-surface-hover/50 border border-surface-border rounded-lg text-center">
          <p className="text-sm text-text-secondary">
            Selecione uma tarefa acima para adicionar o template
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
        {filteredTemplates.map(template => (
          <button
            key={template.id}
            onClick={() => {
              if (needsTaskSelection && !selectedTaskId) {
                return; // Não permitir seleção sem tarefa
              }
              onSelectTemplate(template.id, selectedTaskId || undefined);
              if (selectedTaskId) {
                onClose();
              }
            }}
            disabled={needsTaskSelection && !selectedTaskId}
            className={`text-left p-4 bg-surface border border-surface-border rounded-lg transition-all ${
              needsTaskSelection && !selectedTaskId
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:border-accent hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary mb-1">{template.name}</h3>
                <p className="text-xs text-text-secondary mb-2">{template.description}</p>
              </div>
              <div className="ml-3 p-2 bg-surface-hover rounded-lg">
                <span className="text-xl">{getCategoryIcon(template.category)}</span>
              </div>
            </div>
            <div className="text-xs text-text-secondary space-y-1 mb-3">
              <p><strong className="text-text-primary">Descrição do teste:</strong> {template.testCase.description}</p>
              <p><strong className="text-text-primary">Passos:</strong> {template.testCase.steps.length} passos</p>
              {template.testCase.expectedResult && (
                <p><strong className="text-text-primary">Resultado esperado:</strong> {template.testCase.expectedResult}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-surface-border">
              {template.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 bg-surface-hover rounded-full text-text-secondary border border-surface-border"
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

