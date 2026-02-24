import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Project, JiraTask, TestCase } from '../../types';
import { generateFailedTestsReport, FailedTestsReportFormat } from '../../utils/failedTestsReportGenerator';
import { downloadFile } from '../../utils/exportService';
import { Badge } from '../common/Badge';
import { logger } from '../../utils/logger';
import { generateFailedTestsAnalysisForPO } from '../../services/ai/failedTestsAnalysisService';
import { generateFailedTestsPDF } from '../../utils/failedTestsPDFGenerator';
import toast from 'react-hot-toast';
import { FailedTestsReportHeader } from './FailedTestsReportHeader';
import { FilterBuilder } from './FilterBuilder';
import { SearchBar } from './SearchBar';
import { TestCard } from './TestCard';
import { BulkActionsToolbar } from './BulkActionsToolbar';
import { EmptyState } from './EmptyState';
import { ReportPreview } from './ReportPreview';
import { ActionMenu } from './ActionMenu';

interface FailedTestWithTask {
  testCase: TestCase;
  task: JiraTask;
}

interface FailedTestsReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  initialTaskId?: string;
}

export const FailedTestsReportModal: React.FC<FailedTestsReportModalProps> = ({
  isOpen,
  onClose,
  project,
  initialTaskId
}) => {
  const [reportText, setReportText] = useState('');
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<FailedTestsReportFormat>('text');
  const [generationDate, setGenerationDate] = useState<Date | null>(null);
  const [scope, setScope] = useState<'project' | 'task'>('project');
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(initialTaskId);
  const [selectedTestIds, setSelectedTestIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<{
    priorities: string[];
    environments: string[];
    suites: string[];
  }>({
    priorities: [],
    environments: [],
    suites: []
  });
  const [aiAnalysisText, setAiAnalysisText] = useState('');
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);
  const [aiAnalysisCopied, setAiAnalysisCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const testListRef = useRef<HTMLDivElement>(null);
  const [focusedTestIndex, setFocusedTestIndex] = useState<number | null>(null);

  // Coletar todos os testes reprovados
  const allFailedTests = useMemo((): FailedTestWithTask[] => {
    const failedTests: FailedTestWithTask[] = [];
    const tasks = scope === 'task' && selectedTaskId
      ? project.tasks.filter(t => t.id === selectedTaskId)
      : project.tasks;
    
    tasks.forEach(task => {
      const failedTestCases = (task.testCases || []).filter(
        tc => tc.status === 'Failed'
      );
      
      failedTestCases.forEach(testCase => {
        failedTests.push({ testCase, task });
      });
    });
    
    return failedTests;
  }, [project, scope, selectedTaskId]);

  // Aplicar filtros e busca
  const filteredTests = useMemo(() => {
    let filtered = allFailedTests;
    
    // Aplicar filtros
    if (filters.priorities.length > 0) {
      filtered = filtered.filter(ft => 
        ft.testCase.priority && filters.priorities.includes(ft.testCase.priority)
      );
    }
    
    if (filters.environments.length > 0) {
      filtered = filtered.filter(ft => 
        ft.testCase.testEnvironment && filters.environments.includes(ft.testCase.testEnvironment)
      );
    }
    
    if (filters.suites.length > 0) {
      filtered = filtered.filter(ft => 
        ft.testCase.testSuite && filters.suites.includes(ft.testCase.testSuite)
      );
    }
    
    // Aplicar busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(ft => {
        const description = (ft.testCase.description || '').toLowerCase();
        const taskTitle = (ft.task.title || '').toLowerCase();
        const taskId = (ft.task.id || '').toLowerCase();
        const observedResult = (ft.testCase.observedResult || '').toLowerCase();
        
        return description.includes(query) ||
               taskTitle.includes(query) ||
               taskId.includes(query) ||
               observedResult.includes(query);
      });
    }
    
    return filtered;
  }, [allFailedTests, filters, searchQuery]);

  // Opções únicas para filtros
  const availablePriorities = useMemo(() => {
    const priorities = new Set<string>();
    allFailedTests.forEach(ft => {
      if (ft.testCase.priority) {
        priorities.add(ft.testCase.priority);
      }
    });
    return Array.from(priorities).sort();
  }, [allFailedTests]);

  const availableEnvironments = useMemo(() => {
    const environments = new Set<string>();
    allFailedTests.forEach(ft => {
      if (ft.testCase.testEnvironment) {
        environments.add(ft.testCase.testEnvironment);
      }
    });
    return Array.from(environments).sort();
  }, [allFailedTests]);

  const availableSuites = useMemo(() => {
    const suites = new Set<string>();
    allFailedTests.forEach(ft => {
      if (ft.testCase.testSuite) {
        suites.add(ft.testCase.testSuite);
      }
    });
    return Array.from(suites).sort();
  }, [allFailedTests]);

  // Tarefas com testes reprovados
  const tasksWithFailedTests = useMemo(() => {
    const taskMap = new Map<string, JiraTask>();
    allFailedTests.forEach(ft => {
      if (!taskMap.has(ft.task.id)) {
        taskMap.set(ft.task.id, ft.task);
      }
    });
    return Array.from(taskMap.values());
  }, [allFailedTests]);

  // Selecionar todos os testes filtrados
  const handleSelectAll = () => {
    const allIds = new Set(filteredTests.map(ft => ft.testCase.id));
    setSelectedTestIds(allIds);
  };

  // Desselecionar todos
  const handleDeselectAll = () => {
    setSelectedTestIds(new Set());
  };

  // Toggle seleção de um teste
  const handleToggleTest = (testId: string) => {
    const newSelected = new Set(selectedTestIds);
    if (newSelected.has(testId)) {
      newSelected.delete(testId);
    } else {
      newSelected.add(testId);
    }
    setSelectedTestIds(newSelected);
  };

  // Toggle filtro de prioridade
  const handleTogglePriority = (priority: string) => {
    setFilters(prev => ({
      ...prev,
      priorities: prev.priorities.includes(priority)
        ? prev.priorities.filter(p => p !== priority)
        : [...prev.priorities, priority]
    }));
  };

  // Toggle filtro de ambiente
  const handleToggleEnvironment = (env: string) => {
    setFilters(prev => ({
      ...prev,
      environments: prev.environments.includes(env)
        ? prev.environments.filter(e => e !== env)
        : [...prev.environments, env]
    }));
  };

  // Toggle filtro de suite
  const handleToggleSuite = (suite: string) => {
    setFilters(prev => ({
      ...prev,
      suites: prev.suites.includes(suite)
        ? prev.suites.filter(s => s !== suite)
        : [...prev.suites, suite]
    }));
  };

  // Gerar relatório
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const now = new Date();
    setGenerationDate(now);

    const selectedIds = selectedTestIds.size > 0
      ? Array.from(selectedTestIds)
      : undefined;

    const report = generateFailedTestsReport(
      project,
      now,
      {
        format,
        selectedTestIds: selectedIds,
        filters: {
          taskId: scope === 'task' ? selectedTaskId : undefined,
          priorities: filters.priorities.length > 0 ? filters.priorities : undefined,
          environments: filters.environments.length > 0 ? filters.environments : undefined,
          suites: filters.suites.length > 0 ? filters.suites : undefined
        }
      }
    );

    setReportText(report);
    setCopied(false);
  }, [isOpen, project, format, scope, selectedTaskId, selectedTestIds, filters]);

  // Reset ao abrir
  useEffect(() => {
    if (isOpen) {
      if (initialTaskId) {
        setScope('task');
        setSelectedTaskId(initialTaskId);
      } else {
        setScope('project');
        setSelectedTaskId(undefined);
      }
      setSelectedTestIds(new Set());
      setFilters({ priorities: [], environments: [], suites: [] });
      setAiAnalysisText('');
      setAiAnalysisCopied(false);
      setSearchQuery('');
      setFocusedTestIndex(null);
    }
  }, [isOpen, initialTaskId]);

  // Gerar análise IA
  const handleGenerateAIAnalysis = async () => {
    const testsToAnalyze = selectedTestIds.size > 0
      ? filteredTests.filter(ft => selectedTestIds.has(ft.testCase.id))
      : filteredTests;

    if (testsToAnalyze.length === 0) {
      toast.error('Selecione pelo menos um teste reprovado para análise');
      return;
    }

    setIsGeneratingAnalysis(true);
    try {
      const analysis = await generateFailedTestsAnalysisForPO(project, testsToAnalyze);
      setAiAnalysisText(analysis);
      toast.success('Análise gerada com sucesso!');
    } catch (error) {
      logger.error('Erro ao gerar análise IA', 'FailedTestsReportModal', error);
      toast.error('Erro ao gerar análise. Tente novamente.');
    } finally {
      setIsGeneratingAnalysis(false);
    }
  };

  // Copiar análise IA
  const handleCopyAIAnalysis = async () => {
    try {
      await navigator.clipboard.writeText(aiAnalysisText);
      setAiAnalysisCopied(true);
      setTimeout(() => setAiAnalysisCopied(false), 2000);
      toast.success('Análise copiada!');
    } catch (error) {
      logger.error('Erro ao copiar análise', 'FailedTestsReportModal', error);
      toast.error('Erro ao copiar. Tente novamente.');
    }
  };

  // Salvar análise IA
  const handleSaveAIAnalysis = () => {
    const fileName = scope === 'task' && selectedTaskId
      ? `${selectedTaskId}-analise-bugs.txt`
      : `${project.id}-analise-bugs.txt`;
    
    downloadFile(aiAnalysisText, fileName, 'text/plain');
    toast.success('Análise salva!');
  };

  // Gerar PDF da análise IA
  const handleGeneratePDF = async () => {
    const testsToInclude = selectedTestIds.size > 0
      ? filteredTests.filter(ft => selectedTestIds.has(ft.testCase.id))
      : filteredTests;

    if (testsToInclude.length === 0) {
      toast.error('Selecione pelo menos um teste reprovado para gerar PDF');
      return;
    }

    try {
      await generateFailedTestsPDF(
        project,
        aiAnalysisText || reportText,
        testsToInclude.map(ft => ({
          testCase: {
            id: ft.testCase.id,
            description: ft.testCase.description,
            steps: ft.testCase.steps || [],
            expectedResult: ft.testCase.expectedResult,
            observedResult: ft.testCase.observedResult,
            priority: ft.testCase.priority,
            testEnvironment: ft.testCase.testEnvironment
          },
          task: {
            id: ft.task.id,
            title: ft.task.title || ''
          }
        })),
        generationDate || new Date()
      );
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      logger.error('Erro ao gerar PDF', 'FailedTestsReportModal', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error('Erro ao copiar', 'FailedTestsReportModal', error);
      const textArea = document.createElement('textarea');
      textArea.value = reportText;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        logger.error('Fallback copy failed', 'FailedTestsReportModal', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleDownload = () => {
    const extension = format === 'markdown' ? 'md' : 'txt';
    const mimeType = format === 'markdown' ? 'text/markdown' : 'text/plain';
    const fileName = scope === 'task' && selectedTaskId
      ? `${selectedTaskId}-testes-reprovados.${extension}`
      : `${project.id}-testes-reprovados.${extension}`;
    
    downloadFile(reportText, fileName, mimeType);
  };

  const formatOptions: Array<{ label: string; value: FailedTestsReportFormat; description: string }> = [
    { label: 'Texto estruturado', value: 'text', description: 'Formato ideal para colar em campos comuns.' },
    { label: 'Markdown', value: 'markdown', description: 'Melhor para docs e wikis com formatação.' }
  ];

  const allFilteredSelected = filteredTests.length > 0 && 
    filteredTests.every(ft => selectedTestIds.has(ft.testCase.id));
  const someFilteredSelected = filteredTests.some(ft => selectedTestIds.has(ft.testCase.id));

  // Estatísticas para o header
  const criticalTests = useMemo(() => {
    return filteredTests.filter(ft => ft.testCase.priority === 'Urgente').length;
  }, [filteredTests]);

  const uniqueEnvironments = useMemo(() => {
    const envs = new Set<string>();
    filteredTests.forEach(ft => {
      if (ft.testCase.testEnvironment) {
        envs.add(ft.testCase.testEnvironment);
      }
    });
    return envs.size;
  }, [filteredTests]);

  // Atalhos de teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+A para selecionar todos
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();
        if (filteredTests.length > 0) {
          const allIds = new Set(filteredTests.map(ft => ft.testCase.id));
          setSelectedTestIds(allIds);
        }
      }

      // Escape para desselecionar todos (se não estiver fechando modal)
      if (e.key === 'Escape' && selectedTestIds.size > 0) {
        e.preventDefault();
        setSelectedTestIds(new Set());
      }

      // Navegação com setas
      if (focusedTestIndex !== null && testListRef.current) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setFocusedTestIndex(prev => 
            prev !== null && prev < filteredTests.length - 1 ? prev + 1 : prev
          );
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setFocusedTestIndex(prev => prev !== null && prev > 0 ? prev - 1 : null);
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (focusedTestIndex !== null && filteredTests[focusedTestIndex]) {
            const testId = filteredTests[focusedTestIndex].testCase.id;
            const newSelected = new Set(selectedTestIds);
            if (newSelected.has(testId)) {
              newSelected.delete(testId);
            } else {
              newSelected.add(testId);
            }
            setSelectedTestIds(newSelected);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredTests, selectedTestIds, focusedTestIndex]);

  // Limpar busca ao fechar
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setFocusedTestIndex(null);
    }
  }, [isOpen]);

  // Limpar todos os filtros
  const handleClearAllFilters = () => {
    setFilters({ priorities: [], environments: [], suites: [] });
    setSearchQuery('');
  };

  const hasActiveFilters = filters.priorities.length > 0 || 
                          filters.environments.length > 0 || 
                          filters.suites.length > 0 ||
                          searchQuery.trim().length > 0;

  // Preparar opções de filtros com cores
  const priorityOptions = availablePriorities.map(priority => ({
    value: priority,
    label: priority,
    color: priority === 'Urgente' ? 'error' as const : 
           priority === 'Alta' ? 'warning' as const :
           priority === 'Média' ? 'info' as const : 'success' as const
  }));

  const environmentOptions = availableEnvironments.map(env => ({
    value: env,
    label: env,
    color: 'default' as const
  }));

  const suiteOptions = availableSuites.map(suite => ({
    value: suite,
    label: suite,
    color: 'default' as const
  }));

  // Menu de ações adicionais
  const actionMenuItems = [
    {
      label: 'Exportar como PDF',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      onClick: handleGeneratePDF
    },
    {
      label: 'Exportar como CSV',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16h16M8 12h8m-8 4h5" />
        </svg>
      ),
      onClick: () => {
        // TODO: Implementar exportação CSV
        toast('Exportação CSV em desenvolvimento', { icon: 'ℹ️' });
      }
    }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Relatório de Testes Reprovados" size="full">
      <div className="h-full flex flex-col min-h-0 max-h-[calc(100dvh-4rem)] sm:max-h-[90vh]">
        {/* Header sticky com estatísticas */}
        <FailedTestsReportHeader
          totalTests={allFailedTests.length}
          selectedTests={selectedTestIds.size}
          filteredTests={filteredTests.length}
          criticalTests={criticalTests}
          environments={uniqueEnvironments}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          hasSelectedTests={selectedTestIds.size > 0}
          canSelectAll={filteredTests.length > 0 && !allFilteredSelected}
        />

        {/* Toolbar de ações em massa */}
        {selectedTestIds.size > 0 && (
          <BulkActionsToolbar
            selectedCount={selectedTestIds.size}
            onCopySelected={() => {
              const selectedTests = filteredTests.filter(ft => selectedTestIds.has(ft.testCase.id));
              const selectedReport = generateFailedTestsReport(
                project,
                generationDate || new Date(),
                {
                  format,
                  selectedTestIds: Array.from(selectedTestIds),
                  filters: {
                    taskId: scope === 'task' ? selectedTaskId : undefined,
                    priorities: filters.priorities.length > 0 ? filters.priorities : undefined,
                    environments: filters.environments.length > 0 ? filters.environments : undefined,
                    suites: filters.suites.length > 0 ? filters.suites : undefined
                  }
                }
              );
              navigator.clipboard.writeText(selectedReport).then(() => {
                toast.success('Testes selecionados copiados!');
              });
            }}
            onExportSelected={handleDownload}
            onClearSelection={handleDeselectAll}
          />
        )}

        {/* Layout principal - Grid responsivo */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-md overflow-hidden">
          {/* Painel esquerdo: Filtros e Escopo */}
          <div className={`${showFilters ? 'flex' : 'hidden'} lg:flex flex-col gap-md overflow-y-auto border-r border-base-300 pr-md`}>
            {/* Seletor de escopo */}
            <div className="flex-shrink-0 flex flex-col gap-sm">
              <p className="text-xs uppercase tracking-wide text-base-content/70 font-semibold">Escopo</p>
              <div className="flex gap-md">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    value="project"
                    checked={scope === 'project'}
                    onChange={() => {
                      setScope('project');
                      setSelectedTaskId(undefined);
                    }}
                    className="radio radio-primary radio-sm"
                  />
                  <span className="text-sm">Projeto</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="scope"
                    value="task"
                    checked={scope === 'task'}
                    onChange={() => setScope('task')}
                    className="radio radio-primary radio-sm"
                  />
                  <span className="text-sm">Tarefa</span>
                </label>
              </div>
            </div>

            {/* Seletor de tarefa */}
            {scope === 'task' && (
              <div className="flex-shrink-0 flex flex-col gap-sm">
                <p className="text-xs uppercase tracking-wide text-base-content/70 font-semibold">Tarefa</p>
                <select
                  value={selectedTaskId || ''}
                  onChange={(e) => setSelectedTaskId(e.target.value || undefined)}
                  className="select select-bordered select-sm w-full"
                >
                  <option value="">Selecione uma tarefa</option>
                  {tasksWithFailedTests.map(task => (
                    <option key={task.id} value={task.id}>
                      {task.id} - {task.title || 'Sem título'}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Barra de busca */}
            <div className="flex-shrink-0">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Buscar testes por descrição, tarefa ou erro..."
              />
            </div>

            {/* Filtros com chips */}
            <div className="flex-shrink-0 flex flex-col gap-md">
              {hasActiveFilters && (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-base-content/70">
                    Filtros Ativos ({filters.priorities.length + filters.environments.length + filters.suites.length + (searchQuery.trim() ? 1 : 0)})
                  </span>
                  <button
                    type="button"
                    onClick={handleClearAllFilters}
                    className="btn btn-xs btn-ghost"
                  >
                    Limpar Todos
                  </button>
                </div>
              )}

              {priorityOptions.length > 0 && (
                <FilterBuilder
                  title="Prioridade"
                  options={priorityOptions}
                  selectedValues={filters.priorities}
                  onToggle={handleTogglePriority}
                  onClear={() => setFilters(prev => ({ ...prev, priorities: [] }))}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  }
                />
              )}

              {environmentOptions.length > 0 && (
                <FilterBuilder
                  title="Ambiente"
                  options={environmentOptions}
                  selectedValues={filters.environments}
                  onToggle={handleToggleEnvironment}
                  onClear={() => setFilters(prev => ({ ...prev, environments: [] }))}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  }
                />
              )}

              {suiteOptions.length > 0 && (
                <FilterBuilder
                  title="Suite"
                  options={suiteOptions}
                  selectedValues={filters.suites}
                  onToggle={handleToggleSuite}
                  onClear={() => setFilters(prev => ({ ...prev, suites: [] }))}
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  }
                />
              )}
            </div>
          </div>

          {/* Painel central: Lista de testes */}
          <div className="flex flex-col gap-md overflow-y-auto min-h-0">
            {/* Formato do relatório - compacto */}
            <div className="flex-shrink-0 flex items-center justify-between gap-sm">
              <p className="text-xs uppercase tracking-wide text-base-content/70 font-semibold">
                Formato
              </p>
              <div className="flex gap-xs">
                {formatOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormat(option.value)}
                    className={`
                      btn btn-xs
                      ${format === option.value ? 'btn-primary' : 'btn-ghost'}
                    `}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Lista de testes */}
            <div className="flex-1 min-h-0 flex flex-col gap-sm">
              {filteredTests.length > 0 ? (
                <div ref={testListRef} className="space-y-sm flex-1 overflow-y-auto">
                  {filteredTests.map((failedTest, index) => (
                    <TestCard
                      key={failedTest.testCase.id}
                      testCase={failedTest.testCase}
                      task={failedTest.task}
                      isSelected={selectedTestIds.has(failedTest.testCase.id)}
                      onToggle={() => handleToggleTest(failedTest.testCase.id)}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Nenhum teste encontrado"
                  message="Não há testes reprovados que correspondam aos filtros aplicados."
                  suggestions={[
                    'Tente remover alguns filtros',
                    'Verifique se há testes reprovados no escopo selecionado',
                    'Use a busca para encontrar testes específicos'
                  ]}
                />
              )}
            </div>

            {/* Ações principais */}
            <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-md pt-md border-t border-base-300">
              <div className="flex items-center gap-xs">
                <button
                  type="button"
                  onClick={handleGenerateAIAnalysis}
                  disabled={isGeneratingAnalysis || filteredTests.length === 0}
                  className="btn btn-primary btn-md flex items-center gap-2 disabled:opacity-50"
                >
                  {isGeneratingAnalysis ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Gerando...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span>Análise IA</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-xs">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="btn btn-ghost btn-md flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16h16M8 12h8m-8 4h5" />
                  </svg>
                  <span>Baixar</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`btn btn-ghost btn-md flex items-center gap-2 ${copied ? '!bg-success !text-success-content' : ''}`}
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copiar</span>
                    </>
                  )}
                </button>
                <ActionMenu items={actionMenuItems} />
              </div>
            </div>
          </div>

          {/* Painel direito: Preview do relatório */}
          <div className={`${showPreview ? 'flex' : 'hidden'} lg:flex flex-col gap-md overflow-hidden border-l border-base-300 pl-md`}>
            <div className="flex items-center justify-between flex-shrink-0">
              <p className="text-xs uppercase tracking-wide text-base-content/70 font-semibold">
                Preview do Relatório
              </p>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="btn btn-xs btn-ghost lg:hidden"
                aria-label={showPreview ? 'Ocultar preview' : 'Mostrar preview'}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {showPreview ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  )}
                </svg>
              </button>
            </div>
            <div className="flex-1 min-h-0">
              <ReportPreview
                reportText={reportText}
                format={format}
                onFormatChange={setFormat}
              />
            </div>
          </div>
        </div>


        {/* Seção de Análise IA */}
        {aiAnalysisText && (
          <div className="flex-shrink-0 flex flex-col gap-sm border-t border-base-300 pt-md">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide text-base-content/70 font-semibold">
                Análise IA - Relatório para PO
              </p>
              <div className="flex gap-xs">
                <button
                  type="button"
                  onClick={handleCopyAIAnalysis}
                  className={`
                    btn btn-sm btn-ghost
                    ${aiAnalysisCopied ? '!bg-green-500 hover:!bg-green-600 text-white' : ''}
                  `}
                >
                  {aiAnalysisCopied ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copiar</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleSaveAIAnalysis}
                  className="btn btn-sm btn-ghost"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16h16M8 12h8m-8 4h5" />
                  </svg>
                  <span>Salvar</span>
                </button>
                <button
                  type="button"
                  onClick={handleGeneratePDF}
                  className="btn btn-sm btn-error"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>Gerar PDF</span>
                </button>
              </div>
            </div>
            <textarea
              value={aiAnalysisText}
              readOnly
              className={`
                w-full min-h-[200px] max-h-[400px]
                bg-base-100 border border-base-300 rounded-lg
                p-card text-sm text-base-content
                font-mono
                resize-none
                overflow-y-auto
                focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
                transition-all duration-200
              `}
              onClick={(e) => {
                (e.target as HTMLTextAreaElement).select();
              }}
            />
          </div>
        )}

      </div>
    </Modal>
  );
};
