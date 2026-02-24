import React from 'react';
import { SUGGESTED_TOOLS, SuggestedTool } from '../../types';
import { CheckIcon } from '../common/Icons';

interface ToolsSelectorProps {
  selectedTools: string[];
  onToolsChange: (tools: string[]) => void;
  label?: string;
  compact?: boolean;
}

const toolDescriptions: Record<SuggestedTool, string> = {
  Postman: 'API Testing',
  Insomnia: 'API Testing',
  DBeaver: 'para acesso ao banco de dados',
  Kibana: 'para análise de logs',
};

export const ToolsSelector: React.FC<ToolsSelectorProps> = ({
  selectedTools,
  onToolsChange,
  label = 'Ferramentas Utilizadas',
  compact = false,
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
      {label ? (
        <label
          className={`block font-semibold text-base-content/70 ${compact ? 'text-xs' : 'text-sm'}`}
        >
          {label}
        </label>
      ) : null}

      {/* Ferramentas Sugeridas */}
      <div className={`flex flex-wrap gap-2 ${compact ? 'gap-1.5' : ''}`}>
        {SUGGESTED_TOOLS.map(tool => {
          const isSelected = selectedTools.includes(tool);
          return (
            <button
              key={tool}
              type="button"
              onClick={() => handleToolToggle(tool)}
              className={`
                rounded-lg font-semibold border transition-all flex items-center gap-1.5
                ${compact ? 'px-2 py-0.5 text-[10px] gap-1' : 'px-3 py-1.5 text-xs'}
                ${
                  isSelected
                    ? 'bg-primary text-primary-content border-primary shadow-sm'
                    : 'bg-base-200 text-base-content border-base-300 hover:border-primary/30 hover:bg-base-200'
                }
              `}
              title={toolDescriptions[tool]}
            >
              {isSelected && <CheckIcon className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} />}
              <span>{tool}</span>
              {toolDescriptions[tool] && (
                <span className={compact ? 'text-[9px] opacity-75' : 'text-[10px] opacity-75'}>
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
          <p className="text-xs text-base-content/70">Ferramentas customizadas:</p>
          <div className={`flex flex-wrap gap-2 ${compact ? 'gap-1.5' : ''}`}>
            {customTools.map(tool => (
              <div
                key={tool}
                className={`
                  rounded-lg font-semibold bg-primary/10 text-primary border border-primary/20
                  flex items-center gap-2 transition-all
                  ${compact ? 'px-2 py-0.5 text-[10px] gap-1' : 'px-3 py-1.5 text-xs'}
                `}
              >
                <span>{tool}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTool(tool)}
                  className="btn btn-ghost btn-xs btn-circle hover:text-error"
                  title="Remover"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
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
          onKeyDown={e => {
            if (e.key === 'Enter') {
              handleCustomToolAdd(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
          onBlur={e => {
            if (e.target.value.trim()) {
              handleCustomToolAdd(e.target.value);
              e.target.value = '';
            }
          }}
          className={`input input-bordered w-full bg-base-100 border-base-300 text-base-content focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${compact ? 'text-xs py-1.5' : ''}`}
        />
        <p className="text-[0.65rem] text-base-content/70 mt-1">
          Pressione Enter ou clique fora para adicionar
        </p>
      </div>
    </div>
  );
};
