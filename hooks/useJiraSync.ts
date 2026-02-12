import { useState, useCallback } from 'react';
import { Project } from '../types';
import type { TestCase } from '../types';
import { syncJiraProject, getJiraConfig, getJiraProjects, type JiraConfig } from '../services/jiraService';
import { useProjectsStore } from '../store/projectsStore';
import { useErrorHandler } from './useErrorHandler';
import { logger } from '../utils/logger';

type OnUpdateProject = (project: Project, options?: { silent?: boolean }) => Promise<void>;

export function useJiraSync(project: Project | null, onUpdateProject: OnUpdateProject) {
    const { handleError, handleSuccess } = useErrorHandler();
    const [isSyncingJira, setIsSyncingJira] = useState(false);
    const [showJiraProjectSelector, setShowJiraProjectSelector] = useState(false);
    const [availableJiraProjects, setAvailableJiraProjects] = useState<Array<{ key: string; name: string }>>([]);
    const [selectedJiraProjectKey, setSelectedJiraProjectKey] = useState<string>('');

    const extractJiraProjectKey = useCallback((): string | null => {
        if (!project?.tasks?.length) return null;
        const firstTaskId = project.tasks[0].id;
        const match = firstTaskId.match(/^([A-Z]+)-\d+/);
        return match?.[1] ?? null;
    }, [project?.tasks]);

    const performSync = useCallback(
        async (config: JiraConfig, jiraProjectKey: string) => {
            if (!project) return;
            setIsSyncingJira(true);
            try {
                const { projects, updateProject: saveProject } = useProjectsStore.getState();
                const latestProjectFromStore = projects.find((p) => p.id === project.id);
                let projectToSync = latestProjectFromStore || project;

                logger.debug('Buscando projeto mais recente do store antes de sincronizar', 'useJiraSync', {
                    projectId: project.id,
                    temProjetoNoStore: !!latestProjectFromStore,
                });

                try {
                    await saveProject(projectToSync, { silent: true });
                    logger.debug('Projeto salvo no Supabase antes de sincronizar', 'useJiraSync');
                } catch (error) {
                    logger.warn('Erro ao salvar projeto no Supabase antes de sincronizar (continuando mesmo assim)', 'useJiraSync', { error });
                }

                await new Promise((resolve) => setTimeout(resolve, 100));

                const { projects: updatedProjects } = useProjectsStore.getState();
                const finalProjectFromStore = updatedProjects.find((p) => p.id === project.id);
                if (finalProjectFromStore) {
                    projectToSync = finalProjectFromStore;
                    logger.debug('Usando projeto atualizado do store após delay', 'useJiraSync');
                }

                const projectTestStatuses = projectToSync.tasks.flatMap((t) =>
                    (t.testCases || []).filter((tc) => tc.status !== 'Not Run').map((tc) => ({ taskId: t.id, testCaseId: tc.id, status: tc.status }))
                );
                logger.info('Iniciando sincronização com Jira usando projeto mais recente do store', 'useJiraSync', {
                    projectId: projectToSync.id,
                    testCasesComStatus: projectTestStatuses.length,
                    statusDetalhes: projectTestStatuses.slice(0, 10),
                });

                const updatedProject = await syncJiraProject(config, projectToSync, jiraProjectKey);

                const currentTaskIds = new Set(projectToSync.tasks.map((t) => t.id));
                const updatedTaskIds = new Set(updatedProject.tasks.map((t) => t.id));
                const missingTaskIds = projectToSync.tasks.filter((t) => !updatedTaskIds.has(t.id)).map((t) => t.id);

                if (missingTaskIds.length > 0) {
                    const allProjects = useProjectsStore.getState().projects;
                    const otherProjects = allProjects.filter((p) => p.id !== project.id);
                    const linkedTaskIds = new Set<string>();
                    otherProjects.forEach((p) => {
                        p.tasks.forEach((t) => {
                            if (missingTaskIds.includes(t.id)) linkedTaskIds.add(t.id);
                        });
                    });
                    if (linkedTaskIds.size > 0) {
                        const tasksToRestore = projectToSync.tasks.filter((t) => linkedTaskIds.has(t.id));
                        updatedProject.tasks.push(...tasksToRestore);
                        logger.info(`Restauradas ${tasksToRestore.length} tarefas vinculadas que seriam excluídas pela sincronização`, 'useJiraSync');
                    }
                }

                logger.info('Iniciando validação final de status antes de atualizar projeto', 'useJiraSync', {
                    projectId: project.id,
                    totalStatusNoUpdatedProject: updatedProject.tasks.flatMap((t) => (t.testCases || []).filter((tc) => tc.status !== 'Not Run')).length,
                });

                const { projects: finalProjects } = useProjectsStore.getState();
                const latestProjectAfterSync = finalProjects.find((p) => p.id === project.id);

                if (latestProjectAfterSync) {
                    const storeStatusMap = new Map<string, TestCase['status']>();
                    latestProjectAfterSync.tasks.forEach((task) => {
                        (task.testCases || []).forEach((tc) => {
                            if (tc.id && tc.status !== 'Not Run') storeStatusMap.set(`${task.id}-${tc.id}`, tc.status);
                        });
                    });
                    let statusPerdidos = 0;
                    const restoredTasks = updatedProject.tasks.map((task) => {
                        const restoredTestCases = (task.testCases || []).map((tc) => {
                            const storeStatus = storeStatusMap.get(`${task.id}-${tc.id}`);
                            if (storeStatus && tc.status === 'Not Run') {
                                statusPerdidos++;
                                logger.warn(`Status perdido detectado em useJiraSync: taskId=${task.id}, testCaseId=${tc.id}. Restaurando status "${storeStatus}" do store`, 'useJiraSync', {
                                    taskId: task.id,
                                    testCaseId: tc.id,
                                });
                                return { ...tc, status: storeStatus };
                            }
                            return tc;
                        });
                        return { ...task, testCases: restoredTestCases };
                    });
                    if (statusPerdidos > 0) {
                        logger.warn(`VALIDAÇÃO FINAL EM useJiraSync: ${statusPerdidos} status foram perdidos e restaurados do store`, 'useJiraSync', {
                            statusRestaurados: statusPerdidos,
                        });
                        await onUpdateProject({ ...updatedProject, tasks: restoredTasks });
                    } else {
                        logger.debug('Chamando onUpdateProject com updatedProject (sem perda de status)', 'useJiraSync');
                        await onUpdateProject(updatedProject);
                    }
                } else {
                    logger.warn('VALIDAÇÃO FINAL EM useJiraSync: Projeto não encontrado no store após sincronização', 'useJiraSync', { projectId: project.id });
                    await onUpdateProject(updatedProject);
                }

                const existingTaskIds = new Set(project.tasks.map((t) => t.id));
                const newTasks = updatedProject.tasks.filter((t) => !existingTaskIds.has(t.id));
                const updatedTasks = updatedProject.tasks.filter((t) => {
                    if (!existingTaskIds.has(t.id)) return false;
                    const oldTask = project.tasks.find((ot) => ot.id === t.id);
                    if (!oldTask) return false;
                    return (
                        oldTask.title !== t.title ||
                        oldTask.description !== t.description ||
                        oldTask.status !== t.status ||
                        oldTask.jiraStatus !== t.jiraStatus ||
                        oldTask.priority !== t.priority ||
                        oldTask.severity !== t.severity ||
                        JSON.stringify(oldTask.tags || []) !== JSON.stringify(t.tags || []) ||
                        oldTask.completedAt !== t.completedAt ||
                        oldTask.dueDate !== t.dueDate ||
                        oldTask.parentId !== t.parentId ||
                        oldTask.epicKey !== t.epicKey
                    );
                });
                const messages: string[] = [];
                if (newTasks.length > 0) messages.push(`${newTasks.length} nova(s) tarefa(s) adicionada(s)`);
                if (updatedTasks.length > 0) messages.push(`${updatedTasks.length} tarefa(s) atualizada(s)`);
                if (messages.length > 0) {
                    handleSuccess(`Sincronização concluída: ${messages.join(' e ')} do Jira!`);
                } else {
                    handleSuccess('Sincronização concluída. Nenhuma alteração encontrada no Jira.');
                }
            } catch (error) {
                handleError(error instanceof Error ? error : new Error('Erro ao sincronizar com Jira'), 'Sincronizar com Jira');
            } finally {
                setIsSyncingJira(false);
            }
        },
        [project, onUpdateProject, handleSuccess, handleError]
    );

    const handleSyncJira = useCallback(async () => {
        if (!project) return;
        const config = getJiraConfig();
        if (!config) {
            handleError(new Error('Jira não configurado. Configure a conexão com Jira nas Configurações primeiro.'), 'Sincronizar com Jira');
            return;
        }
        const jiraProjectKey = extractJiraProjectKey();
        if (!jiraProjectKey) {
            try {
                setIsSyncingJira(true);
                const projects = await getJiraProjects(config);
                setAvailableJiraProjects(projects.map((p) => ({ key: p.key, name: p.name })));
                setShowJiraProjectSelector(true);
            } catch (error) {
                handleError(error instanceof Error ? error : new Error('Erro ao buscar projetos do Jira'), 'Sincronizar com Jira');
            } finally {
                setIsSyncingJira(false);
            }
            return;
        }
        await performSync(config, jiraProjectKey);
    }, [project, extractJiraProjectKey, handleError, performSync]);

    const handleConfirmJiraProject = useCallback(async () => {
        if (!selectedJiraProjectKey) {
            handleError(new Error('Selecione um projeto do Jira'), 'Sincronizar com Jira');
            return;
        }
        const config = getJiraConfig();
        if (!config) {
            handleError(new Error('Jira não configurado'), 'Sincronizar com Jira');
            return;
        }
        setShowJiraProjectSelector(false);
        await performSync(config, selectedJiraProjectKey);
        setSelectedJiraProjectKey('');
    }, [selectedJiraProjectKey, performSync, handleError]);

    return {
        handleSyncJira,
        isSyncingJira,
        showJiraProjectSelector,
        setShowJiraProjectSelector,
        availableJiraProjects,
        selectedJiraProjectKey,
        setSelectedJiraProjectKey,
        handleConfirmJiraProject,
    };
}
