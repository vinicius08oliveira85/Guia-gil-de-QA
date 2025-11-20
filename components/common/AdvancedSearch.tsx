import React, { useState, useMemo } from 'react';
import { Project } from '../../types';
import { useSearch } from '../../hooks/useSearch';
import { SearchBar } from './SearchBar';

interface AdvancedSearchProps {
  projects: Project[];
  onResultSelect: (result: { type: string; id: string; projectId?: string }) => void;
  onClose: () => void;
}

export const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  projects,
  onResultSelect,
  onClose
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { searchResults } = useSearch(projects);
  
  // Filtrar resultados baseado na query
  const filteredResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const operators = {
      'status:': (result: any) => {
        const status = query.split('status:')[1]?.split(' ')[0];
        return result.type === 'task' && result.status?.toLowerCase().includes(status);
      },
      'type:': (result: any) => {
        const type = query.split('type:')[1]?.split(' ')[0];
        return result.type === type.toLowerCase();
      },
      'tag:': (result: any) => {
        const tag = query.split('tag:')[1]?.split(' ')[0];
        return result.tags?.some((t: string) => t.toLowerCase().includes(tag));
      },
      'project:': (result: any) => {
        const projectName = query.split('project:')[1]?.split(' ')[0];
        return result.projectName?.toLowerCase().includes(projectName);
      }
    };
    
    // Verificar se há operadores
    const hasOperator = Object.keys(operators).some(op => query.includes(op));
    
    if (hasOperator) {
      return searchResults.filter(result => {
        return Object.entries(operators).some(([op, fn]) => 
          query.includes(op) && fn(result)
        );
      });
    }
    
    // Busca normal
    return searchResults.filter(result =>
      result.title?.toLowerCase().includes(query) ||
      result.description?.toLowerCase().includes(query) ||
      result.id?.toLowerCase().includes(query)
    );
  }, [searchQuery, searchResults]);

    return (
      <div className="glass-overlay fixed inset-0 z-50 flex items-start justify-center pt-20 p-4">
        <div className="w-full max-w-3xl mica rounded-2xl shadow-[0_35px_90px_rgba(3,7,23,0.55)]">
        <div className="p-4 border-b border-surface-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-text-primary">Busca Avançada</h2>
            <button
              onClick={onClose}
                className="win-icon-button text-lg"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar... (use: status:, type:, tag:, project:)"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/40"
              autoFocus
            />
            
            <div className="text-xs text-text-secondary space-y-1">
              <div><strong>Operadores disponíveis:</strong></div>
                <div>• <code className="bg-white/10 px-1.5 py-0.5 rounded-md text-text-primary">status:done</code> - Filtrar por status</div>
                <div>• <code className="bg-white/10 px-1.5 py-0.5 rounded-md text-text-primary">type:bug</code> - Filtrar por tipo</div>
                <div>• <code className="bg-white/10 px-1.5 py-0.5 rounded-md text-text-primary">tag:crítico</code> - Filtrar por tag</div>
                <div>• <code className="bg-white/10 px-1.5 py-0.5 rounded-md text-text-primary">project:nome</code> - Filtrar por projeto</div>
            </div>
          </div>
        </div>
        
        <div className="p-4 max-h-96 overflow-y-auto">
          {filteredResults.length > 0 ? (
            <div className="space-y-2">
              {filteredResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => {
                    onResultSelect(result);
                    onClose();
                  }}
                    className="w-full text-left p-3 rounded-xl border border-white/10 bg-white/5 hover:border-accent/50 hover:bg-white/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{result.icon}</span>
                        <span className="font-semibold text-text-primary">{result.title}</span>
                        {result.type && (
                          <span className="text-xs px-2 py-0.5 bg-accent/20 text-accent rounded">
                            {result.type}
                          </span>
                        )}
                      </div>
                      {result.description && (
                        <p className="text-sm text-text-secondary mt-1 line-clamp-1">
                          {result.description}
                        </p>
                      )}
                      {result.projectName && (
                        <p className="text-xs text-text-secondary mt-1">
                          Projeto: {result.projectName}
                        </p>
                      )}
                    </div>
                    <span className="text-text-secondary">→</span>
                  </div>
                </button>
              ))}
            </div>
          ) : searchQuery.trim() ? (
            <div className="text-center py-8 text-text-secondary">
              Nenhum resultado encontrado
            </div>
          ) : (
            <div className="text-center py-8 text-text-secondary">
              Digite para buscar...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

