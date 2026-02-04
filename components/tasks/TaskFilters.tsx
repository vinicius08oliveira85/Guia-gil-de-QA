import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, X, ChevronDown, Check, 
  User, Tag, AlertCircle, Layers, 
  Briefcase, Bookmark, Activity, Filter,
  ListFilter
} from 'lucide-react';
import { JiraTask, JiraTaskType, TaskPriority, BugSeverity, TaskTestStatus } from '../../types';
import { getDisplayStatus } from '../../utils/taskHelpers';

export interface TaskFilterState {
  search: string;
  types: JiraTaskType[];
  status: string[];
  testStatus: TaskTestStatus[];
  priorities: TaskPriority[];
  severities: BugSeverity[];
  assignees: string[];
  tags: string[];
}

interface TaskFiltersProps {
  tasks: JiraTask[];
  onFilterChange: (filters: TaskFilterState) => void;
  className?: string;
}

interface FilterDropdownProps<T> {
  label: string;
  icon: React.ElementType;
  options: { value: T; label: string; count: number }[];
  selected: T[];
  onChange: (selected: T[]) => void;
  colorClass?: string;
}

function FilterDropdown<T extends string>({ 
  label, 
  icon: Icon, 
  options, 
  selected, 
  onChange,
  colorClass = "btn-ghost"
}: FilterDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (value: T) => {
    const newSelected = selected.includes(value)
      ? selected.filter(item => item !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const isActive = selected.length > 0;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`btn btn-sm ${isActive ? 'btn-active btn-primary text-white' : colorClass} gap-2 font-normal border-base-300`}
        title={label}
      >
        <Icon className="w-4 h-4" />
        <span className="hidden sm:inline">{label}</span>
        {isActive && (
          <span className="badge badge-sm badge-white text-primary border-none w-5 h-5 p-0 flex items-center justify-center">
            {selected.length}
          </span>
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''} opacity-50`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-[100] w-64 bg-base-100 rounded-lg shadow-xl border border-base-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-base-200 bg-base-50/50 flex justify-between items-center">
            <span className="text-xs font-semibold text-base-content/70 uppercase tracking-wider">{label}</span>
            {isActive && (
              <button 
                onClick={() => onChange([])}
                className="text-xs text-primary hover:underline"
              >
                Limpar
              </button>
            )}
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {options.length === 0 ? (
              <div className="p-3 text-center text-sm text-base-content/50">
                Nenhuma opção disponível
              </div>
            ) : (
              options.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <button
                    key={String(option.value)}
                    onClick={() => toggleOption(option.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                      isSelected 
                        ? 'bg-primary/10 text-primary font-medium' 
                        : 'hover:bg-base-200 text-base-content'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-primary border-primary' : 'border-base-content/30'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className="truncate">{option.label}</span>
                    </div>
                    <span className="text-xs text-base-content/40 ml-2">{option.count}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({ tasks, onFilterChange, className = '' }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<JiraTaskType[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedTestStatuses, setSelectedTestStatuses] = useState<TaskTestStatus[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<TaskPriority[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<BugSeverity[]>([]);
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Notificar mudanças
  useEffect(() => {
    onFilterChange({
      search: searchTerm,
      types: selectedTypes,
      status: selectedStatuses,
      testStatus: selectedTestStatuses,
      priorities: selectedPriorities,
      severities: selectedSeverities,
      assignees: selectedAssignees,
      tags: selectedTags
    });
  }, [searchTerm, selectedTypes, selectedStatuses, selectedTestStatuses, selectedPriorities, selectedSeverities, selectedAssignees, selectedTags, onFilterChange]);

  // Calcular contagens e opções dinâmicas
  const options = useMemo(() => {
    const counts = {
      types: {} as Record<string, number>,
      statuses: {} as Record<string, number>,
      testStatuses: {} as Record<string, number>,
      priorities: {} as Record<string, number>,
      severities: {} as Record<string, number>,
      assignees: {} as Record<string, number>,
      tags: {} as Record<string, number>,
    };

    (tasks || []).forEach(task => {
      // Types
      counts.types[task.type] = (counts.types[task.type] || 0) + 1;
      
      // Status (Display Status)
      const displayStatus = getDisplayStatus(task) || task.status;
      counts.statuses[displayStatus] = (counts.statuses[displayStatus] || 0) + 1;

      // Test Status
      if (task.testStatus) {
        counts.testStatuses[task.testStatus] = (counts.testStatuses[task.testStatus] || 0) + 1;
      }

      // Priority
      if (task.priority) {
        counts.priorities[task.priority] = (counts.priorities[task.priority] || 0) + 1;
      }

      // Severity
      if (task.severity) {
        counts.severities[task.severity] = (counts.severities[task.severity] || 0) + 1;
      }

      // Assignee
      if (task.assignee) {
        counts.assignees[task.assignee] = (counts.assignees[task.assignee] || 0) + 1;
      }

      // Tags
      task.tags?.forEach(tag => {
        counts.tags[tag] = (counts.tags[tag] || 0) + 1;
      });
    });

    return {
      types: Object.entries(counts.types).map(([value, count]) => ({ value: value as JiraTaskType, label: value, count })),
      statuses: Object.entries(counts.statuses).map(([value, count]) => ({ value, label: value, count })),
      testStatuses: Object.entries(counts.testStatuses).map(([value, count]) => {
        const labels: Record<string, string> = {
          'testar': 'Testar',
          'testando': 'Testando',
          'pendente': 'Pendente',
          'teste_concluido': 'Concluído'
        };
        return { value: value as TaskTestStatus, label: labels[value] || value, count };
      }),
      priorities: Object.entries(counts.priorities).map(([value, count]) => ({ value: value as TaskPriority, label: value, count })),
      severities: Object.entries(counts.severities).map(([value, count]) => ({ value: value as BugSeverity, label: value, count })),
      assignees: Object.entries(counts.assignees).map(([value, count]) => ({ value, label: value, count })),
      tags: Object.entries(counts.tags).map(([value, count]) => ({ value, label: value, count })),
    };
  }, [tasks]);

  const hasActiveFilters = 
    selectedTypes.length > 0 || 
    selectedStatuses.length > 0 || 
    selectedTestStatuses.length > 0 || 
    selectedPriorities.length > 0 || 
    selectedSeverities.length > 0 || 
    selectedAssignees.length > 0 || 
    selectedTags.length > 0 ||
    searchTerm.length > 0;

  const clearAll = () => {
    setSearchTerm('');
    setSelectedTypes([]);
    setSelectedStatuses([]);
    setSelectedTestStatuses([]);
    setSelectedPriorities([]);
    setSelectedSeverities([]);
    setSelectedAssignees([]);
    setSelectedTags([]);
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-2">
        {/* Busca */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/50" />
          <input
            type="text"
            placeholder="Buscar tarefas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input input-sm input-bordered w-full pl-9 rounded-lg focus:input-primary"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="h-6 w-px bg-base-300 mx-1 hidden sm:block"></div>

        {/* Filtros Dropdown */}
        <FilterDropdown
          label="Tipo"
          icon={Layers}
          options={options.types}
          selected={selectedTypes}
          onChange={setSelectedTypes}
        />

        <FilterDropdown
          label="Status"
          icon={Activity}
          options={options.statuses}
          selected={selectedStatuses}
          onChange={setSelectedStatuses}
        />

        <FilterDropdown
          label="Testes"
          icon={ListFilter}
          options={options.testStatuses}
          selected={selectedTestStatuses}
          onChange={setSelectedTestStatuses}
        />

        <FilterDropdown
          label="Prioridade"
          icon={Bookmark}
          options={options.priorities}
          selected={selectedPriorities}
          onChange={setSelectedPriorities}
        />

        {options.severities.length > 0 && (
          <FilterDropdown
            label="Severidade"
            icon={AlertCircle}
            options={options.severities}
            selected={selectedSeverities}
            onChange={setSelectedSeverities}
          />
        )}

        <FilterDropdown
          label="Responsável"
          icon={User}
          options={options.assignees}
          selected={selectedAssignees}
          onChange={setSelectedAssignees}
        />

        <FilterDropdown
          label="Tags"
          icon={Tag}
          options={options.tags}
          selected={selectedTags}
          onChange={setSelectedTags}
        />

        {/* Botão Limpar */}
        {hasActiveFilters && (
          <button 
            onClick={clearAll}
            className="btn btn-ghost btn-sm text-error gap-1 ml-auto sm:ml-0"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Limpar</span>
          </button>
        )}
      </div>
    </div>
  );
};