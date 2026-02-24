import { useEffect, useRef } from 'react';
import { Project, JiraTask } from '../types';

interface UseAnalysisSyncOptions {
  project: Project;
  onUpdateProject: (project: Project) => void;
  autoMarkOutdated?: boolean; // Se true, marca análises como desatualizadas quando há mudanças
}

/**
 * Hook para sincronizar análises de IA automaticamente quando tarefas ou testes mudam
 */
export const useAnalysisSync = ({
  project,
  onUpdateProject,
  autoMarkOutdated = true,
}: UseAnalysisSyncOptions) => {
  const previousTasksRef = useRef<string>('');
  const previousTestsRef = useRef<string>('');

  useEffect(() => {
    // Serializar estado atual de tarefas e testes para comparação
    const tasksSnapshot = JSON.stringify(
      project.tasks.map(t => ({
        id: t.id,
        status: t.status,
        testCasesCount: t.testCases?.length || 0,
        testCasesStatus: t.testCases?.map(tc => ({ id: tc.id, status: tc.status })) || [],
      }))
    );

    const testsSnapshot = JSON.stringify(
      project.tasks.flatMap(t =>
        (t.testCases || []).map(tc => ({
          id: tc.id,
          status: tc.status,
          taskId: t.id,
        }))
      )
    );

    // Verificar se houve mudanças
    const tasksChanged =
      previousTasksRef.current !== '' && previousTasksRef.current !== tasksSnapshot;
    const testsChanged =
      previousTestsRef.current !== '' && previousTestsRef.current !== testsSnapshot;

    if ((tasksChanged || testsChanged) && autoMarkOutdated) {
      // Marcar análises como desatualizadas
      const updatedProject: Project = {
        ...project,
        generalIAAnalysis: project.generalIAAnalysis
          ? {
              ...project.generalIAAnalysis,
              isOutdated: true,
            }
          : undefined,
        tasks: project.tasks.map(task => ({
          ...task,
          iaAnalysis: task.iaAnalysis
            ? {
                ...task.iaAnalysis,
                isOutdated: true,
              }
            : undefined,
        })),
      };

      // Só atualiza se realmente mudou algo
      if (JSON.stringify(project) !== JSON.stringify(updatedProject)) {
        onUpdateProject(updatedProject);
      }
    }

    // Atualizar referências
    previousTasksRef.current = tasksSnapshot;
    previousTestsRef.current = testsSnapshot;
  }, [project.tasks, project.generalIAAnalysis, autoMarkOutdated, onUpdateProject]);

  /**
   * Marca uma análise específica de tarefa como desatualizada
   */
  const markTaskAnalysisOutdated = (taskId: string) => {
    const updatedTasks = project.tasks.map(task =>
      task.id === taskId && task.iaAnalysis
        ? { ...task, iaAnalysis: { ...task.iaAnalysis, isOutdated: true } }
        : task
    );

    onUpdateProject({
      ...project,
      tasks: updatedTasks,
    });
  };

  /**
   * Marca a análise geral como desatualizada
   */
  const markGeneralAnalysisOutdated = () => {
    if (project.generalIAAnalysis) {
      onUpdateProject({
        ...project,
        generalIAAnalysis: {
          ...project.generalIAAnalysis,
          isOutdated: true,
        },
      });
    }
  };

  /**
   * Verifica se uma tarefa específica precisa de re-análise
   */
  const needsReanalysis = (task: JiraTask): boolean => {
    if (!task.iaAnalysis) return true;
    if (task.iaAnalysis.isOutdated) return true;

    // Verificar se houve mudanças significativas desde a última análise
    const analysisDate = new Date(task.iaAnalysis.generatedAt);
    const now = new Date();
    const daysSinceAnalysis = (now.getTime() - analysisDate.getTime()) / (1000 * 60 * 60 * 24);

    // Se passou mais de 7 dias, considerar desatualizada
    if (daysSinceAnalysis > 7) return true;

    // Se status mudou significativamente
    if (task.status === 'Done' && task.iaAnalysis.generatedAt < (task.completedAt || '')) {
      return true;
    }

    return false;
  };

  /**
   * Verifica se a análise geral precisa de atualização
   */
  const needsGeneralReanalysis = (): boolean => {
    if (!project.generalIAAnalysis) return true;
    if (project.generalIAAnalysis.isOutdated) return true;

    // Verificar se há tarefas novas sem análise
    const tasksWithoutAnalysis = project.tasks.filter(t => !t.iaAnalysis);
    if (tasksWithoutAnalysis.length > 0) return true;

    // Verificar se passou muito tempo desde a última análise
    const analysisDate = new Date(project.generalIAAnalysis.generatedAt);
    const now = new Date();
    const daysSinceAnalysis = (now.getTime() - analysisDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceAnalysis > 7) return true;

    return false;
  };

  return {
    markTaskAnalysisOutdated,
    markGeneralAnalysisOutdated,
    needsReanalysis,
    needsGeneralReanalysis,
  };
};
