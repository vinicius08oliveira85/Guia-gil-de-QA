import { useEffect, useRef, useCallback } from 'react';
import { Project } from '../types';
import { useProjectsStore } from '../store/projectsStore';
import { logger } from '../utils/logger';

interface UseAutoSaveOptions {
  project: Project;
  /**
   * Tempo de debounce em ms antes de salvar após mudanças não críticas
   * Mudanças críticas (status, análises) são salvas imediatamente
   */
  debounceMs?: number;
  /**
   * Se true, desabilita o auto-save (útil para desabilitar temporariamente)
   */
  disabled?: boolean;
}

/**
 * Hook que monitora mudanças no projeto e salva automaticamente no Supabase
 * 
 * Mudanças críticas (status de tarefas/testes, análises) são salvas imediatamente
 * Outras mudanças aguardam o debounce antes de salvar
 */
export const useAutoSave = ({
  project,
  debounceMs = 300,
  disabled = false,
}: UseAutoSaveOptions) => {
  const { updateProject } = useProjectsStore();
  const previousProjectRef = useRef<string>('');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSavingRef = useRef(false);

  /**
   * Verifica se uma mudança é crítica e deve ser salva imediatamente
   */
  const isCriticalChange = useCallback((oldProject: Project, newProject: Project): boolean => {
    // Mudanças em status de tarefas
    const oldTaskStatuses = oldProject.tasks.map(t => ({ id: t.id, status: t.status }));
    const newTaskStatuses = newProject.tasks.map(t => ({ id: t.id, status: t.status }));
    if (JSON.stringify(oldTaskStatuses) !== JSON.stringify(newTaskStatuses)) {
      return true;
    }

    // Mudanças em status de casos de teste
    const oldTestStatuses = oldProject.tasks.flatMap(t => 
      (t.testCases || []).map(tc => ({ taskId: t.id, testCaseId: tc.id, status: tc.status }))
    );
    const newTestStatuses = newProject.tasks.flatMap(t => 
      (t.testCases || []).map(tc => ({ taskId: t.id, testCaseId: tc.id, status: tc.status }))
    );
    if (JSON.stringify(oldTestStatuses) !== JSON.stringify(newTestStatuses)) {
      return true;
    }

    // Mudanças em análises
    if (oldProject.shiftLeftAnalysis !== newProject.shiftLeftAnalysis ||
        oldProject.testPyramidAnalysis !== newProject.testPyramidAnalysis ||
        oldProject.generalIAAnalysis !== newProject.generalIAAnalysis ||
        oldProject.dashboardOverviewAnalysis !== newProject.dashboardOverviewAnalysis ||
        oldProject.dashboardInsightsAnalysis !== newProject.dashboardInsightsAnalysis ||
        oldProject.sdlcPhaseAnalysis !== newProject.sdlcPhaseAnalysis) {
      return true;
    }

    // Mudanças em análises de tarefas
    const oldTaskAnalyses = oldProject.tasks.map(t => ({ id: t.id, iaAnalysis: t.iaAnalysis }));
    const newTaskAnalyses = newProject.tasks.map(t => ({ id: t.id, iaAnalysis: t.iaAnalysis }));
    if (JSON.stringify(oldTaskAnalyses) !== JSON.stringify(newTaskAnalyses)) {
      return true;
    }

    return false;
  }, []);

  /**
   * Salva o projeto no Supabase
   */
  const saveProject = useCallback(async (projectToSave: Project) => {
    if (isSavingRef.current) {
      logger.debug('Salvamento já em progresso, aguardando...', 'useAutoSave');
      return;
    }

    try {
      isSavingRef.current = true;
      logger.debug(`Auto-save: salvando projeto "${projectToSave.name}"`, 'useAutoSave');
      await updateProject(projectToSave, { silent: true });
      logger.debug(`Auto-save: projeto "${projectToSave.name}" salvo com sucesso`, 'useAutoSave');
    } catch (error) {
      logger.warn('Erro no auto-save (projeto salvo localmente)', 'useAutoSave', error);
      // Não lançar erro - projeto já está salvo localmente
    } finally {
      isSavingRef.current = false;
    }
  }, [updateProject]);

  /**
   * Efeito que monitora mudanças no projeto
   */
  useEffect(() => {
    if (disabled) {
      return;
    }

    // Serializar projeto atual para comparação
    const currentProjectString = JSON.stringify(project);
    
    // Se não há projeto anterior, apenas armazenar e retornar
    if (previousProjectRef.current === '') {
      previousProjectRef.current = currentProjectString;
      return;
    }

    // Se não houve mudança, retornar
    if (previousProjectRef.current === currentProjectString) {
      return;
    }

    // Parse do projeto anterior para verificar mudanças críticas
    let oldProject: Project | null = null;
    try {
      oldProject = JSON.parse(previousProjectRef.current) as Project;
    } catch {
      // Se não conseguir fazer parse, tratar como mudança normal
    }

    // Verificar se é mudança crítica
    const isCritical = oldProject ? isCriticalChange(oldProject, project) : false;

    // Limpar timeout anterior se existir
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    if (isCritical) {
      // Mudança crítica - salvar imediatamente
      logger.debug('Mudança crítica detectada, salvando imediatamente', 'useAutoSave');
      saveProject(project);
    } else {
      // Mudança não crítica - aguardar debounce
      saveTimeoutRef.current = setTimeout(() => {
        saveProject(project);
        saveTimeoutRef.current = null;
      }, debounceMs);
    }

    // Atualizar referência do projeto anterior
    previousProjectRef.current = currentProjectString;
  }, [project, disabled, debounceMs, isCriticalChange, saveProject]);

  // Cleanup: salvar antes de desmontar
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        // Salvar imediatamente antes de desmontar
        if (previousProjectRef.current !== '') {
          try {
            const projectToSave = JSON.parse(previousProjectRef.current) as Project;
            saveProject(projectToSave);
          } catch {
            // Ignorar erros no cleanup
          }
        }
      }
    };
  }, [saveProject]);
};

