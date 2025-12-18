import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../common/Modal';
import { Project, JiraTask, TestCase } from '../../types';
import { generateFailedTestsReport, FailedTestsReportFormat } from '../../utils/failedTestsReportGenerator';
import { downloadFile } from '../../utils/exportService';
import { Badge } from '../common/Badge';
import { logger } from '../../utils/logger';
import { generateFailedTestsAnalysisForPO } from '../../services/ai/failedTestsAnalysisService';
import { generateFailedTestsPDF } from '../../utils/failedTestsPDFGenerator';
import toast from 'react-hot-toast';

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

  // Aplicar filtros
  const filteredTests = useMemo(() => {
    let filtered = allFailedTests;
    
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
    
    return filtered;
  }, [allFailedTests, filters]);

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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Relatório de Testes Reprovados" size="xl">
      <div className="h-full flex flex-col min-h-0 space-y-md max-h-[90vh] overflow-y-auto">
        {/* Botões de ação */}
        <div className="flex-shrink-0 space-y-sm">
          <p className="text-sm text-base-content/70">
            Selecione os testes reprovados e copie o relatório para colar em outras plataformas
          </p>
          <div className="flex flex-wrap items-center justify-end gap-md pb-2 border-b border-base-300">
            <button
              type="button"
              onClick={handleGenerateAIAnalysis}
              disabled={isGeneratingAnalysis || filteredTests.length === 0}
              className="btn btn-accent btn-md flex items-center gap-2 disabled:opacity-50"
            >
              {isGeneratingAnalysis ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  <span>Gerando Análise IA...</span>
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
            <button
              type="button"
              onClick={handleDownload}
              className="btn btn-secondary btn-md flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16h16M8 12h8m-8 4h5" />
              </svg>
              <span>Baixar .{format === 'markdown' ? 'md' : 'txt'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className={`
                btn btn-primary btn-md
                flex items-center gap-2
                ${copied ? '!bg-green-500 hover:!bg-green-600' : ''}
              `}
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
          </div>
        </div>

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
                className="radio radio-primary"
              />
              <span>Projeto</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="scope"
                value="task"
                checked={scope === 'task'}
                onChange={() => setScope('task')}
                className="radio radio-primary"
              />
              <span>Tarefa</span>
            </label>
          </div>
        </div>

        {/* Seletor de tarefa (se escopo = tarefa) */}
        {scope === 'task' && (
          <div className="flex-shrink-0 flex flex-col gap-sm">
            <p className="text-xs uppercase tracking-wide text-base-content/70 font-semibold">Tarefa</p>
            <select
              value={selectedTaskId || ''}
              onChange={(e) => setSelectedTaskId(e.target.value || undefined)}
              className="select select-bordered w-full"
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

        {/* Filtros */}
        <div className="flex-shrink-0 flex flex-col gap-sm">
          <p className="text-xs uppercase tracking-wide text-base-content/70 font-semibold">Filtros</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            {/* Prioridade */}
            {availablePriorities.length > 0 && (
              <div className="flex flex-col gap-xs">
                <p className="text-xs font-medium text-base-content/70">Prioridade</p>
                <div className="flex flex-wrap gap-xs">
                  {availablePriorities.map(priority => (
                    <label key={priority} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.priorities.includes(priority)}
                        onChange={() => handleTogglePriority(priority)}
                        className="checkbox checkbox-xs"
                      />
                      <span className="text-xs">{priority}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Ambiente */}
            {availableEnvironments.length > 0 && (
              <div className="flex flex-col gap-xs">
                <p className="text-xs font-medium text-base-content/70">Ambiente</p>
                <div className="flex flex-wrap gap-xs">
                  {availableEnvironments.map(env => (
                    <label key={env} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.environments.includes(env)}
                        onChange={() => handleToggleEnvironment(env)}
                        className="checkbox checkbox-xs"
                      />
                      <span className="text-xs">{env}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Suite */}
            {availableSuites.length > 0 && (
              <div className="flex flex-col gap-xs">
                <p className="text-xs font-medium text-base-content/70">Suite</p>
                <div className="flex flex-wrap gap-xs">
                  {availableSuites.map(suite => (
                    <label key={suite} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.suites.includes(suite)}
                        onChange={() => handleToggleSuite(suite)}
                        className="checkbox checkbox-xs"
                      />
                      <span className="text-xs">{suite}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Seleção de testes */}
        <div className="flex-shrink-0 flex flex-col gap-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-base-content/70 font-semibold">
              Testes Reprovados ({filteredTests.length})
            </p>
            <div className="flex gap-xs">
              <button
                type="button"
                onClick={handleSelectAll}
                disabled={filteredTests.length === 0}
                className="btn btn-xs btn-ghost"
              >
                Selecionar Todos
              </button>
              <button
                type="button"
                onClick={handleDeselectAll}
                disabled={selectedTestIds.size === 0}
                className="btn btn-xs btn-ghost"
              >
                Desselecionar Todos
              </button>
            </div>
          </div>
          {filteredTests.length > 0 ? (
            <div className="max-h-48 overflow-y-auto space-y-sm border border-base-300 rounded-lg p-sm">
              {filteredTests.map((failedTest) => {
                const isSelected = selectedTestIds.has(failedTest.testCase.id);
                return (
                  <label
                    key={failedTest.testCase.id}
                    className={`
                      flex items-start gap-2 p-sm rounded cursor-pointer
                      ${isSelected ? 'bg-primary/10 border border-primary' : 'border border-base-300 hover:bg-base-200'}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleTest(failedTest.testCase.id)}
                      className="checkbox checkbox-sm mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-base-content">
                        {failedTest.testCase.description || 'Sem descrição'}
                      </p>
                      <p className="text-xs text-base-content/70">
                        {failedTest.task.id} - {failedTest.task.title || 'Sem título'}
                      </p>
                      {failedTest.testCase.priority && (
                        <Badge variant="default" size="sm" className="mt-1">
                          {failedTest.testCase.priority}
                        </Badge>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-base-content/70 p-sm border border-base-300 rounded-lg">
              Nenhum teste reprovado encontrado com os filtros aplicados.
            </p>
          )}
        </div>

        {/* Formato do relatório */}
        <div className="flex-shrink-0 flex flex-col gap-sm">
          <p className="text-xs uppercase tracking-wide text-base-content/70 font-semibold">Formato do relatório</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            {formatOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormat(option.value)}
                className={`
                  border rounded-lg p-card text-left transition-all duration-200
                  ${format === option.value
                    ? 'border-primary bg-primary/10 text-base-content shadow-md ring-2 ring-primary/20'
                    : 'border-base-300 text-base-content/70 hover:text-base-content hover:border-primary/30 hover:bg-base-200'}
                `}
              >
                <p className="font-medium">{option.label}</p>
                <p className="text-sm text-base-content/70">{option.description}</p>
              </button>
            ))}
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

        {/* Textarea do relatório */}
        <div className="relative flex-1 min-h-0 flex flex-col">
          <p className="text-xs uppercase tracking-wide text-base-content/70 font-semibold mb-sm">
            Relatório Manual
          </p>
          <textarea
            value={reportText}
            readOnly
            className={`
              w-full flex-1 min-h-[200px]
              bg-base-100 border border-base-300 rounded-lg
              p-card text-sm text-base-content
              font-mono
              resize-none
              focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary
              transition-all duration-200
            `}
            onClick={(e) => {
              (e.target as HTMLTextAreaElement).select();
            }}
          />
        </div>

        {/* Botão Fechar */}
        <div className="flex-shrink-0 flex justify-end gap-md pt-2 border-t border-base-300">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-md"
          >
            Fechar
          </button>
        </div>
      </div>
    </Modal>
  );
};

