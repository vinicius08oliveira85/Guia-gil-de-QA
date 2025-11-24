import { useMemo, useState } from 'react';
import { Project, JiraTask, TestCase } from '../types';

export interface FilterOptions {
  status?: ('To Do' | 'In Progress' | 'Done')[];
  type?: ('Epic' | 'História' | 'Tarefa' | 'Bug')[];
  tags?: string[];
  priority?: ('Baixa' | 'Média' | 'Alta' | 'Urgente')[];
  severity?: ('Crítico' | 'Alto' | 'Médio' | 'Baixo')[];
  owner?: string[];
  assignee?: string[];
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  searchQuery?: string;
  hasTestCases?: boolean;
  hasBddScenarios?: boolean;
  isAutomated?: boolean;
  testResultStatus?: ('Aprovado' | 'Reprovado')[];
  requiredTestTypes?: string[];
}

export const useFilters = (project: Project) => {
  const [filters, setFilters] = useState<FilterOptions>({});

  const filteredTasks = useMemo(() => {
    let tasks = project.tasks;

    // Filtro por status
    if (filters.status && filters.status.length > 0) {
      tasks = tasks.filter(t => filters.status!.includes(t.status));
    }

    // Filtro por tipo
    if (filters.type && filters.type.length > 0) {
      tasks = tasks.filter(t => filters.type!.includes(t.type));
    }

    // Filtro por tags
    if (filters.tags && filters.tags.length > 0) {
      tasks = tasks.filter(t => 
        t.tags && filters.tags!.some(tag => t.tags!.includes(tag))
      );
    }

    // Filtro por prioridade
    if (filters.priority && filters.priority.length > 0) {
      tasks = tasks.filter(t => t.priority && filters.priority!.includes(t.priority));
    }

    // Filtro por severidade
    if (filters.severity && filters.severity.length > 0) {
      tasks = tasks.filter(t => t.severity && filters.severity!.includes(t.severity));
    }

    // Filtro por owner
    if (filters.owner && filters.owner.length > 0) {
      tasks = tasks.filter(t => t.owner && filters.owner!.includes(t.owner));
    }

    // Filtro por assignee
    if (filters.assignee && filters.assignee.length > 0) {
      tasks = tasks.filter(t => t.assignee && filters.assignee!.includes(t.assignee));
    }

    // Filtro por data
    if (filters.dateRange) {
      if (filters.dateRange.start) {
        tasks = tasks.filter(t => {
          if (!t.createdAt) return false;
          return new Date(t.createdAt) >= filters.dateRange!.start!;
        });
      }
      if (filters.dateRange.end) {
        tasks = tasks.filter(t => {
          if (!t.createdAt) return false;
          return new Date(t.createdAt) <= filters.dateRange!.end!;
        });
      }
    }

    // Filtro por busca
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      tasks = tasks.filter(t =>
        t.id.toLowerCase().includes(query) ||
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query)
      );
    }

    // Filtro por casos de teste
    if (filters.hasTestCases !== undefined) {
      tasks = tasks.filter(t => 
        filters.hasTestCases ? (t.testCases?.length || 0) > 0 : (t.testCases?.length || 0) === 0
      );
    }

    // Filtro por BDD scenarios
    if (filters.hasBddScenarios !== undefined) {
      tasks = tasks.filter(t => 
        filters.hasBddScenarios ? (t.bddScenarios?.length || 0) > 0 : (t.bddScenarios?.length || 0) === 0
      );
    }

    // Filtro por automação
    if (filters.isAutomated !== undefined) {
      tasks = tasks.filter(t => {
        const hasAutomated = t.testCases?.some(tc => tc.isAutomated);
        return filters.isAutomated ? hasAutomated : !hasAutomated;
      });
    }

    // Filtro por status de testes (aprovado/reprovado)
    if (filters.testResultStatus && filters.testResultStatus.length > 0) {
      tasks = tasks.filter(t => {
        const testCases = t.testCases || [];
        return filters.testResultStatus!.some(status => {
          if (status === 'Aprovado') {
            return testCases.some(tc => tc.status === 'Passed');
          }
          if (status === 'Reprovado') {
            return testCases.some(tc => tc.status === 'Failed');
          }
          return false;
        });
      });
    }

    // Filtro por tipos de teste exigidos
    if (filters.requiredTestTypes && filters.requiredTestTypes.length > 0) {
      tasks = tasks.filter(t => {
        const strategyTypes = (t.testStrategy || [])
          .map(strategy => strategy?.testType)
          .filter((type): type is string => Boolean(type));
        const testCaseTypes = (t.testCases || []).flatMap(tc => tc.strategies || []);
        const combinedTypes = new Set([...strategyTypes, ...testCaseTypes]);
        return filters.requiredTestTypes!.some(type => combinedTypes.has(type));
      });
    }

    return tasks;
  }, [project.tasks, filters]);

  const clearFilters = () => {
    setFilters({});
  };

  const updateFilter = <K extends keyof FilterOptions>(
    key: K,
    value: FilterOptions[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const removeFilter = (key: keyof FilterOptions) => {
    setFilters(prev => {
      if (!(key in prev)) return prev;
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const activeFiltersCount = Object.keys(filters).filter(
    key => {
      const value = filters[key as keyof FilterOptions];
      if (Array.isArray(value)) return value.length > 0;
      if (value && typeof value === 'object') {
        return Object.keys(value).length > 0;
      }
      return value !== undefined && value !== '';
    }
  ).length;

  return {
    filters,
    filteredTasks,
    updateFilter,
    clearFilters,
    removeFilter,
    activeFiltersCount
  };
};

