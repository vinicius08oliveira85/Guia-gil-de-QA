import React from 'react';
import { SUGGESTED_TOOLS, SuggestedTool } from '../../types';
import { windows12Styles } from '../../utils/windows12Styles';
import { CheckIcon } from '../common/Icons';

interface ToolsSelectorProps {
  selectedTools: string[];
  onToolsChange: (tools: string[]) => void;
  label?: string;
  compact?: boolean;
}

const toolDescriptions: Record<SuggestedTool, string> = {
  'Postman': 'API Testing',
  'Insomnia': 'API Testing',
  'DBeaver': 'para acesso ao banco de dados',
  'Kibana': 'para análise de logs'
};

export const ToolsSelector: React.FC<ToolsSelectorProps> = ({
  selectedTools,
  onToolsChange,
  label = 'Ferramentas Utilizadas',
  compact = false
}) => {
  const handleToolToggle = (tool: string) => {
    if (selectedTools.includes(tool)) {
      onToolsChange(selectedTools.filter(t => t !== tool));
    } else {
      onToolsChange([...selectedTools, tool]);
    }
  };

  const handleCustomToolAdd = (value: string) => {
    if (value.trim() && !selectedTools.includes(value.trim())) {
      onToolsChange([...selectedTools, value.trim()]);
    }
  };

  const handleRemoveTool = (tool: string) => {
    onToolsChange(selectedTools.filter(t => t !== tool));
  };

  const customTools = selectedTools.filter(t => !SUGGESTED_TOOLS.includes(t as SuggestedTool));

  return (
    <div className={`space-y-3 ${compact ? 'space-y-2' : ''}`}>
      <label className={`block font-semibold text-text-secondary ${compact ? 'text-xs' : 'text-sm'}`}>
        {label}
      </label>
      
      {/* Ferramentas Sugeridas */}
      <div className="flex flex-wrap gap-2">
        {SUGGESTED_TOOLS.map(tool => {
          const isSelected = selectedTools.includes(tool);
          return (
            <button
              key={tool}
              type="button"
              onClick={() => handleToolToggle(tool)}
              className={`
                px-3 py-1.5 rounded-lg text-xs font-semibold border
                ${windows12Styles.transition.fast}
                flex items-center gap-1.5
                ${
                  isSelected
                    ? 'bg-accent text-white border-accent shadow-md shadow-accent/20'
                    : 'bg-surface-hover text-text-primary border-surface-border hover:border-accent/50 hover:bg-surface'
                }
              `}
              title={toolDescriptions[tool]}
            >
              {isSelected && <CheckIcon className="w-3 h-3" />}
              <span>{tool}</span>
              {toolDescriptions[tool] && (
                <span className="text-[10px] opacity-75">
                  ({toolDescriptions[tool]})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Ferramentas Customizadas */}
      {customTools.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-text-secondary">Ferramentas customizadas:</p>
          <div className="flex flex-wrap gap-2">
            {customTools.map(tool => (
              <div
                key={tool}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-semibold
                  bg-accent/20 text-accent-light border border-accent/30
                  flex items-center gap-2
                  ${windows12Styles.transition.fast}
                `}
              >
                <span>{tool}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTool(tool)}
                  className="hover:text-red-400 transition-colors"
                  title="Remover"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campo para adicionar ferramenta customizada */}
      <div>
        <input
          type="text"
          placeholder="Adicionar ferramenta customizada..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleCustomToolAdd(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
          onBlur={(e) => {
            if (e.target.value.trim()) {
              handleCustomToolAdd(e.target.value);
              e.target.value = '';
            }
          }}
          className={`
            w-full bg-surface-hover border border-surface-border rounded-lg
            px-3 py-2 text-sm text-text-primary
            focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent
            ${windows12Styles.transition.fast}
            ${compact ? 'text-xs py-1.5' : ''}
          `}
        />
        <p className="text-[0.65rem] text-text-secondary mt-1">
          Pressione Enter ou clique fora para adicionar
        </p>
      </div>
    </div>
  );
};

