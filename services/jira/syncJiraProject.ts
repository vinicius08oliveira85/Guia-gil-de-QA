import type { Project, JiraTask, TestCase } from '../../types';
import type { JiraConfig } from './types';
import { EPIC_LINK_FIELD_KEYS } from './types';
import { getJiraIssues } from './issues';
import {
    mapJiraStatusToTaskStatus,
    mapJiraTypeToTaskType,
    mapJiraPriorityToTaskPriority,
    mapJiraSeverity,
    extractEpicLink,
    extractJiraComments,
    mergeComments,
} from './mappers';
import { loadTestStatusesByJiraKeys } from '../supabaseService';
import { mergeTestCases } from '../../utils/testCaseMerge';
import { parseJiraDescriptionHTML } from '../../utils/jiraDescriptionParser';
import { getJiraStatusColor } from '../../utils/jiraStatusColors';
import { logger } from '../../utils/logger';

export const syncJiraProject = async (
    config: JiraConfig,
    project: Project,
    jiraProjectKey: string,
    getLatestProject?: () => Project | undefined
): Promise<Project> => {
    // Buscar TODAS as issues atualizadas desde a última sincronização (sem limite)
    const jiraIssues = await getJiraIssues(config, jiraProjectKey);
    
    logger.info(`Buscadas ${jiraIssues.length} issues do Jira para projeto ${jiraProjectKey}`, 'jiraService');
    logger.info(`Tarefas existentes no projeto: ${project.tasks.length}`, 'jiraService');
    
    // Buscar status dos testes salvos no Supabase para todas as chaves Jira
    const jiraKeys = jiraIssues.map(issue => issue.key).filter(Boolean) as string[];
    const savedTestStatuses = await loadTestStatusesByJiraKeys(jiraKeys);
    
    // Contar total de testCases com status salvos
    let totalSavedTestCases = 0;
    let totalSavedWithStatus = 0;
    savedTestStatuses.forEach((testCases, key) => {
        totalSavedTestCases += testCases.length;
        totalSavedWithStatus += testCases.filter(tc => tc.status !== 'Not Run').length;
    });
    
    logger.info(`Buscando status de testes para ${jiraKeys.length} chaves Jira`, 'jiraService', {
        chavesJira: jiraKeys.length,
        testCasesSalvos: totalSavedTestCases,
        testCasesComStatus: totalSavedWithStatus,
        chavesComTestCases: savedTestStatuses.size
    });
    
    // REGRA DE OURO: SEMPRE usar o projeto do store quando disponível, IGNORANDO o projeto passado como parâmetro
    // O store sempre tem os status mais recentes porque é atualizado imediatamente quando o usuário muda um status
    let projectToUse = project;
    const latestProjectFromStore = getLatestProject?.();
    if (latestProjectFromStore) {
        // SEMPRE usar o projeto do store se disponível - ele é a fonte de verdade
        projectToUse = latestProjectFromStore;
        const statusCountStore = latestProjectFromStore.tasks.flatMap(t => (t.testCases || []).filter(tc => tc.status !== 'Not Run')).length;
        const statusCountParam = project.tasks.flatMap(t => (t.testCases || []).filter(tc => tc.status !== 'Not Run')).length;

        logger.info(`USANDO PROJETO DO STORE (ignorando parâmetro) para ${project.id}`, 'jiraService', {
            tasksStore: latestProjectFromStore.tasks.length,
            tasksStoreComStatus: statusCountStore,
            tasksParam: project.tasks.length,
            tasksParamComStatus: statusCountParam,
            diferencaStatus: statusCountStore - statusCountParam
        });
    } else {
        logger.warn(`Projeto ${project.id} não encontrado no store, usando projeto passado como parâmetro`, 'jiraService');
    }

    // Atualizar tarefas existentes e adicionar novas
    const updatedTasks = [...projectToUse.tasks];
    let updatedCount = 0;
    let newCount = 0;
    
    // Criar Map do projeto original por ID para acesso rápido aos testCases originais
    // IMPORTANTE: Usar projectToUse (que pode ser do store) para garantir que sempre obtemos os status mais recentes
    const originalTasksMap = new Map<string, JiraTask>();
    projectToUse.tasks.forEach(task => {
        if (task.id) {
            originalTasksMap.set(task.id, task);
        }
    });
    
    const totalStatusExecutados = projectToUse.tasks.flatMap(t => 
        (t.testCases || []).filter(tc => tc.status !== 'Not Run')
    ).length;
    
    logger.info(`Map de tarefas originais criado com ${originalTasksMap.size} tarefas`, 'jiraService', {
        totalTarefas: originalTasksMap.size,
        totalStatusExecutados: totalStatusExecutados,
        usandoStore: projectToUse !== project
    });

    for (const issue of jiraIssues) {
        // ATUALIZAÇÃO DINÂMICA: Atualizar originalTasksMap com dados mais recentes do store antes de processar cada tarefa
        // Isso garante que sempre usamos os status mais recentes, mesmo se o store foi atualizado durante a sincronização
        const latestProjectFromStore = getLatestProject?.();
        if (latestProjectFromStore && issue.key) {
            const latestTask = latestProjectFromStore.tasks.find(t => t.id === issue.key);
            if (latestTask) {
                originalTasksMap.set(issue.key, latestTask);
                logger.debug(`Atualizado originalTasksMap para ${issue.key} com dados mais recentes do store`, 'jiraService', {
                    testCasesCount: latestTask.testCases?.length || 0,
                    testCasesComStatus: (latestTask.testCases || []).filter(tc => tc.status !== 'Not Run').length
                });
            }
        }

        const existingIndex = updatedTasks.findIndex(t => t.id === issue.key);
        const taskType = mapJiraTypeToTaskType(issue.fields?.issuetype?.name);
        const isBug = taskType === 'Bug';

        // Buscar anexos do Jira antes de processar descrição (para mapear imagens)
        let jiraAttachments: Array<{ id: string; filename: string; size: number; created: string; author: string }> = [];
        if (issue.fields?.attachment && issue.fields.attachment.length > 0) {
            jiraAttachments = issue.fields.attachment.map((att: any) => ({
                id: att.id,
                filename: att.filename,
                size: att.size,
                created: att.created,
                author: att.author?.displayName || 'Desconhecido',
            }));
        }

        // Converter descrição do formato ADF para HTML preservando formatação rica
        // Tentar também renderedFields.description se disponível (formato HTML renderizado)
        let description = '';
        if (issue.renderedFields?.description) {
            // Se temos descrição renderizada (HTML), preservar formatação rica
            description = parseJiraDescriptionHTML(
                issue.renderedFields.description,
                config.url,
                jiraAttachments
            );
        } else if (issue.fields?.description) {
            // Caso contrário, converter a descrição raw (ADF) para HTML
            description = parseJiraDescriptionHTML(
                issue.fields.description,
                config.url,
                jiraAttachments
            );
        }
        
        // Buscar comentários do Jira
        const jiraComments = await extractJiraComments(config, issue, jiraAttachments);
        
        // Fazer merge com comentários existentes
        const existingComments = existingIndex >= 0 ? (updatedTasks[existingIndex].comments || []) : [];
        const mergedComments = mergeComments(existingComments, jiraComments);
        
        // IMPORTANTE: Sempre obter o nome exato do status do Jira
        // Se não houver status, usar string vazia (mas ainda assim definir jiraStatus para manter consistência)
        const jiraStatusName = issue.fields?.status?.name || '';
        const jiraKey = issue.key || `jira-${Date.now()}-${Math.random()}`;
        
        // Log para rastrear quando jiraStatusName está vazio (pode indicar problema)
        if (!jiraStatusName) {
            logger.warn(`Status do Jira vazio para issue ${jiraKey}`, 'jiraService', {
                issueKey: jiraKey,
                hasStatusField: !!issue.fields?.status,
                statusField: issue.fields?.status
            });
        }
        
        // Buscar testCases existentes e salvos
        // IMPORTANTE: existingTestCases sempre vêm do projeto ORIGINAL (não de updatedTasks que pode estar desatualizado)
        // Usar originalTasksMap para garantir que temos os status mais recentes
        const originalTask = jiraKey ? originalTasksMap.get(jiraKey) : undefined;
        const existingTestCases = originalTask?.testCases || [];
        const savedTestCases = savedTestStatuses.get(jiraKey) || [];
        
        logger.debug(`Obtendo existingTestCases para ${jiraKey}`, 'jiraService', {
            temOriginalTask: !!originalTask,
            existingTestCasesCount: existingTestCases.length,
            existingTestCasesComStatus: existingTestCases.filter(tc => tc.status !== 'Not Run').length
        });
        
        // Contar status não-padrão antes da mesclagem
        const existingWithStatus = existingTestCases.filter(tc => tc.status !== 'Not Run').length;
        const savedWithStatus = savedTestCases.filter(tc => tc.status !== 'Not Run').length;
        
        // Criar um Map dos status existentes para validação posterior
        const existingStatusMap = new Map<string, TestCase['status']>();
        existingTestCases.forEach(tc => {
            if (tc.id && tc.status !== 'Not Run') {
                existingStatusMap.set(tc.id, tc.status);
            }
        });
        
        // REGRA DE OURO: Se existingTestCases tem status diferentes de "Not Run", usar diretamente sem mesclar
        // Apenas adicionar testCases novos que não existem nos existentes
        let mergedTestCases: typeof existingTestCases;
        if (existingTestCases.length > 0 && existingWithStatus > 0) {
            // PROTEÇÃO FINAL: Se há status executados nos existentes, usar diretamente e apenas adicionar novos
            logger.info(`PROTEÇÃO FINAL: existingTestCases tem ${existingWithStatus} status executados para ${jiraKey}. Usando diretamente sem mesclar.`, 'jiraService');
            
            // Criar um Map dos IDs existentes para verificação rápida
            const existingIds = new Set(existingTestCases.map(tc => tc.id).filter(Boolean));
            
            // Começar com os existentes (que têm status preservados)
            mergedTestCases = [...existingTestCases];
            
            // Apenas adicionar testCases salvos que não existem nos existentes
            for (const savedTestCase of savedTestCases) {
                if (savedTestCase.id && !existingIds.has(savedTestCase.id)) {
                    mergedTestCases.push(savedTestCase);
                    logger.debug(`Adicionando testCase novo dos salvos para ${jiraKey}: ${savedTestCase.id}`, 'jiraService');
                }
            }
            
            const finalWithStatus = mergedTestCases.filter(tc => tc.status !== 'Not Run').length;
            
            logger.info(`PROTEÇÃO FINAL aplicada para ${jiraKey}`, 'jiraService', {
                existentes: existingTestCases.length,
                existentesComStatus: existingWithStatus,
                salvos: savedTestCases.length,
                salvosComStatus: savedWithStatus,
                resultado: mergedTestCases.length,
                resultadoComStatus: finalWithStatus,
                statusPreservados: finalWithStatus >= existingWithStatus,
                novosTestCasesAdicionados: mergedTestCases.length - existingTestCases.length
            });
        } else if (existingTestCases.length > 0) {
            // Há existentes mas sem status executados - mesclar normalmente
            mergedTestCases = mergeTestCases(existingTestCases, savedTestCases);
            const finalWithStatus = mergedTestCases.filter(tc => tc.status !== 'Not Run').length;
            
            logger.debug(`Mesclando testCases para ${jiraKey} (sem status executados nos existentes)`, 'jiraService', {
                existentes: existingTestCases.length,
                existentesComStatus: existingWithStatus,
                salvos: savedTestCases.length,
                salvosComStatus: savedWithStatus,
                resultado: mergedTestCases.length,
                resultadoComStatus: finalWithStatus
            });
        } else if (savedTestCases.length > 0) {
            // Não há existentes, usar os salvos
            mergedTestCases = savedTestCases;
            logger.debug(`Usando ${savedTestCases.length} testCases salvos (sem existentes) para ${jiraKey}`, 'jiraService', {
                salvosComStatus: savedWithStatus
            });
        } else {
            // Não há nem existentes nem salvos
            mergedTestCases = [];
            logger.debug(`Nenhum testCase encontrado para ${jiraKey}`, 'jiraService');
        }
        
        const task: JiraTask = {
            id: jiraKey,
            title: issue.fields?.summary || 'Sem título',
            description: description || '',
            status: mapJiraStatusToTaskStatus(jiraStatusName),
            jiraStatus: jiraStatusName, // Sempre atualizar status original do Jira
            type: taskType,
            priority: mapJiraPriorityToTaskPriority(issue.fields?.priority?.name),
            jiraPriority: issue.fields?.priority?.name,
            createdAt: issue.fields?.created || new Date().toISOString(),
            completedAt: issue.fields?.resolutiondate || undefined, // Atualizar exatamente como está no Jira
            tags: issue.fields?.labels || [],
            testCases: mergedTestCases, // Usar testCases mesclados (salvos + existentes)
            // NOTA: Este objeto task é usado apenas quando NÃO há tarefa existente (nova tarefa)
            // Quando há tarefa existente, criamos um novo objeto com finalTestCases ou mergedTestCasesNoChanges
            bddScenarios: existingIndex >= 0 ? updatedTasks[existingIndex].bddScenarios : [], // Preservar cenários BDD locais
            comments: mergedComments,
        };

        if (isBug) {
            task.severity = mapJiraSeverity(issue.fields.labels);
        }

        // Atualizar parentId exatamente como está no Jira
        if (issue.fields?.parent?.key) {
            task.parentId = issue.fields.parent.key;
        } else {
            // Se não há parent no Jira, remover se existia anteriormente
            task.parentId = undefined;
        }

        // Capturar Epic Link (para Histórias vinculadas a Epics) - sempre atualizar do Jira
        const epicKey = extractEpicLink(issue.fields);
        if (epicKey) {
            task.epicKey = epicKey;
        } else {
            // Se não há Epic Link no Jira, remover se existia anteriormente
            task.epicKey = undefined;
        }

        // Mapear assignee - sempre atualizar do Jira
        if (issue.fields?.assignee?.emailAddress) {
            const email = issue.fields.assignee.emailAddress.toLowerCase();
            if (email.includes('qa') || email.includes('test')) {
                task.assignee = 'QA';
            } else if (email.includes('dev') || email.includes('developer')) {
                task.assignee = 'Dev';
            } else {
                task.assignee = 'Product';
            }
        } else {
            task.assignee = existingIndex >= 0 ? updatedTasks[existingIndex].assignee : 'Product';
        }
        if (issue.fields?.assignee) {
            task.jiraAssignee = { displayName: issue.fields.assignee.displayName, emailAddress: issue.fields.assignee.emailAddress };
        } else {
            task.jiraAssignee = undefined;
        }

        // Mapear campos adicionais do Jira - sempre atualizar exatamente como estão no Jira
        if (issue.fields?.duedate) {
            task.dueDate = issue.fields.duedate;
        } else {
            // Se não há dueDate no Jira, remover se existia anteriormente
            task.dueDate = undefined;
        }

        // Atualizar timeTracking exatamente como está no Jira
        if (issue.fields?.timetracking) {
            task.timeTracking = {
                originalEstimate: issue.fields.timetracking.originalEstimate,
                remainingEstimate: issue.fields.timetracking.remainingEstimate,
                timeSpent: issue.fields.timetracking.timeSpent,
            };
        } else {
            // Se não há timetracking no Jira, remover se existia anteriormente
            task.timeTracking = undefined;
        }

        // Atualizar components exatamente como estão no Jira
        if (issue.fields?.components && issue.fields.components.length > 0) {
            task.components = issue.fields.components.map((comp: any) => ({
                id: comp.id,
                name: comp.name,
            }));
        } else {
            // Se não há components no Jira, remover se existiam anteriormente
            task.components = undefined;
        }

        // Atualizar fixVersions exatamente como estão no Jira
        if (issue.fields?.fixVersions && issue.fields.fixVersions.length > 0) {
            task.fixVersions = issue.fields.fixVersions.map((version: any) => ({
                id: version.id,
                name: version.name,
            }));
        } else {
            // Se não há fixVersions no Jira, remover se existiam anteriormente
            task.fixVersions = undefined;
        }

        // Atualizar environment exatamente como está no Jira
        if (issue.fields?.environment) {
            task.environment = issue.fields.environment;
        } else {
            // Se não há environment no Jira, remover se existia anteriormente
            task.environment = undefined;
        }

        // Atualizar reporter exatamente como está no Jira
        if (issue.fields?.reporter) {
            task.reporter = {
                displayName: issue.fields.reporter.displayName,
                emailAddress: issue.fields.reporter.emailAddress,
            };
        } else {
            // Se não há reporter no Jira, remover se existia anteriormente
            task.reporter = undefined;
        }

        // Atualizar watchers exatamente como estão no Jira
        if (issue.fields?.watches) {
            task.watchers = {
                watchCount: issue.fields.watches.watchCount || 0,
                isWatching: issue.fields.watches.isWatching || false,
            };
        } else {
            // Se não há watches no Jira, remover se existiam anteriormente
            task.watchers = undefined;
        }

        // Atualizar issueLinks exatamente como estão no Jira
        if (issue.fields?.issuelinks && issue.fields.issuelinks.length > 0) {
            task.issueLinks = issue.fields.issuelinks.map((link: any) => ({
                id: link.id,
                type: link.type?.name || '',
                relatedKey: link.outwardIssue?.key || link.inwardIssue?.key || '',
                direction: link.outwardIssue ? 'outward' : 'inward',
            }));
        } else {
            // Se não há issueLinks no Jira, remover se existiam anteriormente
            task.issueLinks = undefined;
        }

        // Atualizar jiraAttachments exatamente como estão no Jira
        if (issue.fields?.attachment && issue.fields.attachment.length > 0) {
            task.jiraAttachments = issue.fields.attachment.map((att: any) => ({
                id: att.id,
                filename: att.filename,
                size: att.size,
                created: att.created,
                author: att.author?.displayName || 'Desconhecido',
            }));
        } else {
            // Se não há attachments no Jira, remover se existiam anteriormente
            task.jiraAttachments = undefined;
        }

        // Mapear campos customizados - sempre atualizar exatamente como estão no Jira
        // Excluir campos de Epic Link da lista de customizados
        const standardFields = [
            'summary', 'description', 'issuetype', 'status', 'priority', 'assignee', 'reporter',
            'created', 'updated', 'resolutiondate', 'labels', 'parent', 'subtasks', 'comment',
            'duedate', 'timetracking', 'components', 'fixVersions', 'environment', 'watches',
            'issuelinks', 'attachment'
        ];
        const customFields: { [key: string]: any } = {};
        Object.keys(issue.fields).forEach((key) => {
            if (!standardFields.includes(key) && !key.startsWith('_') && !EPIC_LINK_FIELD_KEYS.includes(key)) {
                customFields[key] = issue.fields[key];
            }
        });
        if (Object.keys(customFields).length > 0) {
            task.jiraCustomFields = customFields;
        } else {
            // Se não há customFields no Jira, remover se existiam anteriormente
            task.jiraCustomFields = undefined;
        }

        if (existingIndex >= 0) {
            const oldTask = updatedTasks[existingIndex];
            
            // IMPORTANTE: Sempre verificar se o jiraStatus mudou (independente de outras mudanças)
            // O jiraStatus deve ser sempre atualizado do Jira, mesmo quando não há outras mudanças
            const jiraStatusChanged = oldTask.jiraStatus !== jiraStatusName;
            const statusMappedChanged = oldTask.status !== task.status;
            
            // Verificar se realmente houve mudanças nos campos do Jira antes de atualizar
            const hasChanges = (
                oldTask.title !== task.title ||
                oldTask.description !== task.description ||
                statusMappedChanged ||
                jiraStatusChanged ||
                oldTask.type !== task.type ||
                oldTask.priority !== task.priority ||
                oldTask.jiraPriority !== task.jiraPriority ||
                JSON.stringify(oldTask.jiraAssignee || {}) !== JSON.stringify(task.jiraAssignee || {}) ||
                JSON.stringify(oldTask.tags || []) !== JSON.stringify(task.tags || []) ||
                oldTask.severity !== task.severity ||
                oldTask.completedAt !== task.completedAt ||
                oldTask.dueDate !== task.dueDate ||
                oldTask.parentId !== task.parentId ||
                oldTask.epicKey !== task.epicKey ||
                oldTask.assignee !== task.assignee ||
                JSON.stringify(oldTask.timeTracking) !== JSON.stringify(task.timeTracking) ||
                JSON.stringify(oldTask.components || []) !== JSON.stringify(task.components || []) ||
                JSON.stringify(oldTask.fixVersions || []) !== JSON.stringify(task.fixVersions || []) ||
                oldTask.environment !== task.environment ||
                JSON.stringify(oldTask.reporter) !== JSON.stringify(task.reporter) ||
                JSON.stringify(oldTask.watchers) !== JSON.stringify(task.watchers) ||
                JSON.stringify(oldTask.issueLinks || []) !== JSON.stringify(task.issueLinks || []) ||
                JSON.stringify(oldTask.jiraAttachments || []) !== JSON.stringify(task.jiraAttachments || []) ||
                JSON.stringify(oldTask.jiraCustomFields || {}) !== JSON.stringify(task.jiraCustomFields || {})
            );
            
            if (hasChanges) {
                logger.debug(`Atualizando tarefa ${task.id}`, 'jiraService', {
                    titleChanged: oldTask.title !== task.title,
                    statusChanged: statusMappedChanged || jiraStatusChanged,
                    jiraStatusChanged: jiraStatusChanged,
                    jiraStatusOld: oldTask.jiraStatus,
                    jiraStatusNew: jiraStatusName,
                    priorityChanged: oldTask.priority !== task.priority,
                    descriptionChanged: oldTask.description !== task.description
                });
                
                if (jiraStatusChanged) {
                    logger.info(`jiraStatus atualizado (com outras mudanças) para ${task.id}: "${oldTask.jiraStatus}" → "${jiraStatusName}"`, 'jiraService');
                }
                
                // Buscar testCases salvos no Supabase para esta chave
                const savedTestCasesForTask = savedTestStatuses.get(task.id) || [];
                // IMPORTANTE: Obter existingTestCasesForTask do projeto ORIGINAL, não de oldTask que pode estar desatualizado
                const originalTaskForChanges = task.id ? originalTasksMap.get(task.id) : undefined;
                const existingTestCasesForTask = originalTaskForChanges?.testCases || [];
                
                logger.debug(`Obtendo existingTestCasesForTask para ${task.id} (com mudanças)`, 'jiraService', {
                    temOriginalTask: !!originalTaskForChanges,
                    existingTestCasesForTaskCount: existingTestCasesForTask.length,
                    existingTestCasesForTaskComStatus: existingTestCasesForTask.filter(tc => tc.status !== 'Not Run').length
                });
                
                // Contar status não-padrão antes da mesclagem
                const existingWithStatus = existingTestCasesForTask.filter(tc => tc.status !== 'Not Run').length;
                const savedWithStatus = savedTestCasesForTask.filter(tc => tc.status !== 'Not Run').length;
                
                // Criar um Map dos status existentes para validação posterior
                const existingStatusMapForTask = new Map<string, TestCase['status']>();
                existingTestCasesForTask.forEach(tc => {
                    if (tc.id && tc.status !== 'Not Run') {
                        existingStatusMapForTask.set(tc.id, tc.status);
                    }
                });
                
                // Log detalhado dos status antes da mesclagem
                const existingStatusDetails = existingTestCasesForTask
                    .filter(tc => tc.status !== 'Not Run')
                    .map(tc => ({ id: tc.id, status: tc.status }));
                const savedStatusDetails = savedTestCasesForTask
                    .filter(tc => tc.status !== 'Not Run')
                    .map(tc => ({ id: tc.id, status: tc.status }));
                
                logger.debug(`Preparando mesclagem de testCases para ${task.id}`, 'jiraService', {
                    existentes: existingTestCasesForTask.length,
                    existentesComStatus: existingWithStatus,
                    existentesStatus: existingStatusDetails,
                    salvos: savedTestCasesForTask.length,
                    salvosComStatus: savedWithStatus,
                    salvosStatus: savedStatusDetails
                });
                
                // REGRA DE OURO: Se existingTestCasesForTask tem status diferentes de "Not Run", usar diretamente sem mesclar
                // Apenas adicionar testCases novos que não existem nos existentes
                let finalTestCases: typeof oldTask.testCases;
                if (existingTestCasesForTask.length > 0 && existingWithStatus > 0) {
                    // PROTEÇÃO FINAL: Se há status executados nos existentes, usar diretamente e apenas adicionar novos
                    logger.info(`PROTEÇÃO FINAL: existingTestCasesForTask tem ${existingWithStatus} status executados para ${task.id}. Usando diretamente sem mesclar.`, 'jiraService');
                    
                    // Criar um Map dos IDs existentes para verificação rápida
                    const existingIdsForTask = new Set(existingTestCasesForTask.map(tc => tc.id).filter(Boolean));
                    
                    // Começar com os existentes (que têm status preservados)
                    finalTestCases = [...existingTestCasesForTask];
                    
                    // Apenas adicionar testCases salvos que não existem nos existentes
                    for (const savedTestCase of savedTestCasesForTask) {
                        if (savedTestCase.id && !existingIdsForTask.has(savedTestCase.id)) {
                            finalTestCases.push(savedTestCase);
                            logger.debug(`Adicionando testCase novo dos salvos para ${task.id}: ${savedTestCase.id}`, 'jiraService');
                        }
                    }
                    
                    const finalWithStatus = finalTestCases.filter(tc => tc.status !== 'Not Run').length;
                    
                    logger.info(`PROTEÇÃO FINAL aplicada para ${task.id}`, 'jiraService', {
                        existentes: existingTestCasesForTask.length,
                        existentesComStatus: existingWithStatus,
                        salvos: savedTestCasesForTask.length,
                        salvosComStatus: savedWithStatus,
                        resultado: finalTestCases.length,
                        resultadoComStatus: finalWithStatus,
                        statusPreservados: finalWithStatus >= existingWithStatus,
                        novosTestCasesAdicionados: finalTestCases.length - existingTestCasesForTask.length
                    });
                } else if (existingTestCasesForTask.length > 0) {
                    // Há existentes mas sem status executados - mesclar normalmente
                    finalTestCases = mergeTestCases(existingTestCasesForTask, savedTestCasesForTask);
                    const finalWithStatus = finalTestCases.filter(tc => tc.status !== 'Not Run').length;
                    
                    logger.debug(`Mesclando testCases para ${task.id} (sem status executados nos existentes)`, 'jiraService', {
                        existentes: existingTestCasesForTask.length,
                        existentesComStatus: existingWithStatus,
                        salvos: savedTestCasesForTask.length,
                        salvosComStatus: savedWithStatus,
                        resultado: finalTestCases.length,
                        resultadoComStatus: finalWithStatus
                    });
                } else if (savedTestCasesForTask.length > 0) {
                    // Não há existentes, usar os salvos
                    finalTestCases = savedTestCasesForTask;
                    logger.debug(`Usando ${savedTestCasesForTask.length} testCases salvos (sem existentes) para ${task.id}`, 'jiraService', {
                        salvosComStatus: savedWithStatus,
                        salvosStatus: savedStatusDetails
                    });
                } else {
                    // Não há nem existentes nem salvos
                    finalTestCases = [];
                    logger.debug(`Nenhum testCase encontrado para ${task.id}`, 'jiraService');
                }
                
                // Fazer merge preservando dados locais e atualizando apenas campos do Jira
                // IMPORTANTE: Sempre definir jiraStatus com o nome exato do Jira (mesmo que seja string vazia)
                // CORREÇÃO CRÍTICA: SEMPRE usar testCases do originalTasksMap diretamente, sem fallback
                // Isso garante que os casos de teste NUNCA sejam alterados, mesmo quando o status da tarefa muda
                const originalTaskForFinal = task.id ? originalTasksMap.get(task.id) : undefined;
                
                // REGRA DE OURO: Se originalTasksMap tem testCases, usar diretamente (sempre preservar)
                // Apenas usar finalTestCases se originalTasksMap não existir ou não tiver testCases
                let finalTestCasesFromOriginal: typeof finalTestCases;
                if (originalTaskForFinal?.testCases && originalTaskForFinal.testCases.length > 0) {
                    // SEMPRE usar testCases do originalTasksMap se existirem
                    finalTestCasesFromOriginal = originalTaskForFinal.testCases;
                    logger.debug(`Usando testCases diretamente do originalTasksMap para ${task.id}: ${finalTestCasesFromOriginal.length} casos`, 'jiraService', {
                        testCasesComStatus: finalTestCasesFromOriginal.filter(tc => tc.status !== 'Not Run').length
                    });
                } else {
                    // Fallback apenas se originalTasksMap não tiver testCases
                    finalTestCasesFromOriginal = finalTestCases;
                    logger.debug(`Fallback: usando finalTestCases mesclados para ${task.id} (originalTasksMap não tem testCases)`, 'jiraService');
                }
                
                // Log para debug: comparar testCases do oldTask vs originalTasksMap
                if (originalTaskForFinal && oldTask.testCases?.length !== originalTaskForFinal.testCases?.length) {
                    logger.debug(`Diferença detectada em testCases para ${task.id}: oldTask tem ${oldTask.testCases?.length || 0}, originalTasksMap tem ${originalTaskForFinal.testCases?.length || 0}`, 'jiraService');
                }
                
                updatedTasks[existingIndex] = {
                    ...oldTask, // Preservar todos os dados locais primeiro
                    // Atualizar apenas campos importados do Jira
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    jiraStatus: jiraStatusName || task.jiraStatus, // Sempre usar jiraStatusName do Jira, ou manter existente se vazio
                    type: task.type,
                    priority: task.priority,
                    jiraPriority: task.jiraPriority,
                    jiraAssignee: task.jiraAssignee,
                    tags: task.tags,
                    severity: task.severity,
                    completedAt: task.completedAt,
                    dueDate: task.dueDate,
                    parentId: task.parentId,
                    epicKey: task.epicKey,
                    assignee: task.assignee,
                    timeTracking: task.timeTracking,
                    components: task.components,
                    fixVersions: task.fixVersions,
                    environment: task.environment,
                    reporter: task.reporter,
                    watchers: task.watchers,
                    issueLinks: task.issueLinks,
                    jiraAttachments: task.jiraAttachments,
                    jiraCustomFields: task.jiraCustomFields,
                    comments: task.comments, // Já faz merge de comentários
                    // Preservar dados locais que não vêm do Jira
                    // CORREÇÃO: Usar finalTestCasesFromOriginal que vem do originalTasksMap (mais recente)
                    testCases: finalTestCasesFromOriginal, // ✅ Preservar status dos testes (do originalTasksMap, mais recente)
                    bddScenarios: oldTask.bddScenarios || [], // ✅ Preservar cenários BDD
                    testStrategy: oldTask.testStrategy, // ✅ Preservar estratégia de teste
                    toolsUsed: oldTask.toolsUsed, // ✅ Preservar ferramentas
                    executedStrategies: oldTask.executedStrategies, // ✅ Preservar estratégias executadas
                    strategyTools: oldTask.strategyTools, // ✅ Preservar ferramentas por estratégia
                    // ✅ CRÍTICO: Preservar testStatus - NUNCA sobrescrever com dados do Jira
                    // O testStatus é completamente independente do status do Jira
                    testStatus: oldTask.testStatus, // ✅ Preservar status de teste independente do Jira
                    linkedBusinessRuleIds: oldTask.linkedBusinessRuleIds,
                    linkedBusinessRuleCategories: oldTask.linkedBusinessRuleCategories,
                    // Preservar createdAt se já existe (não sobrescrever com data do Jira se já foi criado localmente)
                    createdAt: oldTask.createdAt || task.createdAt,
                };
                updatedCount++;
            } else {
                // Preservar tarefa existente se não houve mudanças no Jira
                // Mas ainda assim mesclar testCases salvos se houver
                const savedTestCasesForTaskNoChanges = savedTestStatuses.get(task.id) || [];
                // IMPORTANTE: Obter existingTestCasesNoChanges do projeto ORIGINAL, não de oldTask que pode estar desatualizado
                const originalTaskNoChanges = task.id ? originalTasksMap.get(task.id) : undefined;
                const existingTestCasesNoChanges = originalTaskNoChanges?.testCases || [];
                
                logger.debug(`Obtendo existingTestCasesNoChanges para ${task.id} (sem mudanças)`, 'jiraService', {
                    temOriginalTask: !!originalTaskNoChanges,
                    existingTestCasesNoChangesCount: existingTestCasesNoChanges.length,
                    existingTestCasesNoChangesComStatus: existingTestCasesNoChanges.filter(tc => tc.status !== 'Not Run').length
                });
                
                // Contar status não-padrão antes da mesclagem
                const existingWithStatusNoChanges = existingTestCasesNoChanges.filter(tc => tc.status !== 'Not Run').length;
                const savedWithStatusNoChanges = savedTestCasesForTaskNoChanges.filter(tc => tc.status !== 'Not Run').length;
                
                // Criar um Map dos status existentes para validação posterior
                const existingStatusMapNoChanges = new Map<string, TestCase['status']>();
                existingTestCasesNoChanges.forEach(tc => {
                    if (tc.id && tc.status !== 'Not Run') {
                        existingStatusMapNoChanges.set(tc.id, tc.status);
                    }
                });
                
                // REGRA DE OURO: Se existingTestCasesNoChanges tem status diferentes de "Not Run", usar diretamente sem mesclar
                if (existingTestCasesNoChanges.length > 0 && existingWithStatusNoChanges > 0) {
                    // PROTEÇÃO FINAL: Se há status executados nos existentes, usar diretamente e apenas adicionar novos
                    logger.info(`PROTEÇÃO FINAL (sem mudanças Jira): existingTestCasesNoChanges tem ${existingWithStatusNoChanges} status executados para ${task.id}. Usando diretamente sem mesclar.`, 'jiraService');
                    
                    // Criar um Map dos IDs existentes para verificação rápida
                    const existingIdsNoChanges = new Set(existingTestCasesNoChanges.map(tc => tc.id).filter(Boolean));
                    
                    // Começar com os existentes (que têm status preservados)
                    const mergedTestCasesNoChanges = [...existingTestCasesNoChanges];
                    
                    // Apenas adicionar testCases salvos que não existem nos existentes
                    for (const savedTestCase of savedTestCasesForTaskNoChanges) {
                        if (savedTestCase.id && !existingIdsNoChanges.has(savedTestCase.id)) {
                            mergedTestCasesNoChanges.push(savedTestCase);
                            logger.debug(`Adicionando testCase novo dos salvos para ${task.id} (sem mudanças Jira): ${savedTestCase.id}`, 'jiraService');
                        }
                    }
                    
                    const finalWithStatusNoChanges = mergedTestCasesNoChanges.filter(tc => tc.status !== 'Not Run').length;
                    
                    // CORREÇÃO CRÍTICA: SEMPRE usar testCases do originalTasksMap diretamente, sem fallback
                    // Isso garante que os casos de teste NUNCA sejam alterados, mesmo quando o status da tarefa muda
                    const originalTaskNoChangesFinal = task.id ? originalTasksMap.get(task.id) : undefined;
                    
                    // REGRA DE OURO: Se originalTasksMap tem testCases, usar diretamente (sempre preservar)
                    let finalTestCasesNoChangesFromOriginal: typeof mergedTestCasesNoChanges;
                    if (originalTaskNoChangesFinal?.testCases && originalTaskNoChangesFinal.testCases.length > 0) {
                        // SEMPRE usar testCases do originalTasksMap se existirem
                        finalTestCasesNoChangesFromOriginal = originalTaskNoChangesFinal.testCases;
                        logger.debug(`Usando testCases diretamente do originalTasksMap (sem mudanças) para ${task.id}: ${finalTestCasesNoChangesFromOriginal.length} casos`, 'jiraService');
                    } else {
                        // Fallback apenas se originalTasksMap não tiver testCases
                        finalTestCasesNoChangesFromOriginal = mergedTestCasesNoChanges;
                        logger.debug(`Fallback: usando mergedTestCasesNoChanges para ${task.id} (originalTasksMap não tem testCases)`, 'jiraService');
                    }
                    
                    // IMPORTANTE: Sempre atualizar jiraStatus do Jira, mesmo quando não há outras mudanças
                    updatedTasks[existingIndex] = {
                        ...oldTask,
                        jiraStatus: jiraStatusName, // Sempre atualizar do Jira
                        status: jiraStatusChanged ? mapJiraStatusToTaskStatus(jiraStatusName) : oldTask.status, // Atualizar status mapeado se jiraStatus mudou
                        // CORREÇÃO: Usar finalTestCasesNoChangesFromOriginal que vem do originalTasksMap (mais recente)
                        testCases: finalTestCasesNoChangesFromOriginal,
                        // ✅ CRÍTICO: Preservar testStatus - NUNCA sobrescrever com dados do Jira
                        testStatus: oldTask.testStatus // ✅ Preservar status de teste independente do Jira
                    };
                    
                    if (jiraStatusChanged) {
                        logger.info(`jiraStatus atualizado (sem outras mudanças) para ${task.id}: "${oldTask.jiraStatus}" → "${jiraStatusName}"`, 'jiraService');
                    }
                    
                    logger.info(`PROTEÇÃO FINAL aplicada (sem mudanças Jira) para ${task.id}`, 'jiraService', {
                        existentes: existingTestCasesNoChanges.length,
                        existentesComStatus: existingWithStatusNoChanges,
                        salvos: savedTestCasesForTaskNoChanges.length,
                        salvosComStatus: savedWithStatusNoChanges,
                        resultado: mergedTestCasesNoChanges.length,
                        resultadoComStatus: finalWithStatusNoChanges,
                        statusPreservados: finalWithStatusNoChanges >= existingWithStatusNoChanges,
                        novosTestCasesAdicionados: mergedTestCasesNoChanges.length - existingTestCasesNoChanges.length
                    });
                } else if (existingTestCasesNoChanges.length > 0 || savedTestCasesForTaskNoChanges.length > 0) {
                    // Há existentes mas sem status executados - mesclar normalmente
                    const mergedTestCasesNoChanges = existingTestCasesNoChanges.length > 0
                        ? mergeTestCases(existingTestCasesNoChanges, savedTestCasesForTaskNoChanges)
                        : savedTestCasesForTaskNoChanges;
                    
                    const finalWithStatusNoChanges = mergedTestCasesNoChanges.filter(tc => tc.status !== 'Not Run').length;
                    
                    // CORREÇÃO CRÍTICA: SEMPRE usar testCases do originalTasksMap diretamente, sem fallback
                    // Isso garante que os casos de teste NUNCA sejam alterados, mesmo quando o status da tarefa muda
                    const originalTaskNoChangesMerge = task.id ? originalTasksMap.get(task.id) : undefined;
                    
                    // REGRA DE OURO: Se originalTasksMap tem testCases, usar diretamente (sempre preservar)
                    let finalTestCasesNoChangesFromOriginalMerge: typeof mergedTestCasesNoChanges;
                    if (originalTaskNoChangesMerge?.testCases && originalTaskNoChangesMerge.testCases.length > 0) {
                        // SEMPRE usar testCases do originalTasksMap se existirem
                        finalTestCasesNoChangesFromOriginalMerge = originalTaskNoChangesMerge.testCases;
                        logger.debug(`Usando testCases diretamente do originalTasksMap (merge sem mudanças) para ${task.id}: ${finalTestCasesNoChangesFromOriginalMerge.length} casos`, 'jiraService');
                    } else {
                        // Fallback apenas se originalTasksMap não tiver testCases
                        finalTestCasesNoChangesFromOriginalMerge = mergedTestCasesNoChanges;
                        logger.debug(`Fallback: usando mergedTestCasesNoChanges (merge) para ${task.id} (originalTasksMap não tem testCases)`, 'jiraService');
                    }
                    
                    // IMPORTANTE: Sempre atualizar jiraStatus do Jira, mesmo quando não há outras mudanças
                    updatedTasks[existingIndex] = {
                        ...oldTask,
                        jiraStatus: jiraStatusName, // Sempre atualizar do Jira
                        status: jiraStatusChanged ? mapJiraStatusToTaskStatus(jiraStatusName) : oldTask.status, // Atualizar status mapeado se jiraStatus mudou
                        // CORREÇÃO: Usar finalTestCasesNoChangesFromOriginalMerge que vem do originalTasksMap (mais recente)
                        testCases: finalTestCasesNoChangesFromOriginalMerge,
                        // ✅ CRÍTICO: Preservar testStatus - NUNCA sobrescrever com dados do Jira
                        testStatus: oldTask.testStatus // ✅ Preservar status de teste independente do Jira
                    };
                    
                    if (jiraStatusChanged) {
                        logger.info(`jiraStatus atualizado (sem outras mudanças) para ${task.id}: "${oldTask.jiraStatus}" → "${jiraStatusName}"`, 'jiraService');
                    }
                    
                    logger.debug(`Mesclando testCases (sem mudanças no Jira) para ${task.id}`, 'jiraService', {
                        existentes: existingTestCasesNoChanges.length,
                        existentesComStatus: existingWithStatusNoChanges,
                        salvos: savedTestCasesForTaskNoChanges.length,
                        salvosComStatus: savedWithStatusNoChanges,
                        resultado: mergedTestCasesNoChanges.length,
                        resultadoComStatus: finalWithStatusNoChanges
                    });
                } else {
                    // IMPORTANTE: Mesmo sem testCases para mesclar, usar o projeto original do store
                    // para garantir que temos os status mais recentes
                    const originalTaskForNoChanges = task.id ? originalTasksMap.get(task.id) : undefined;
                    if (originalTaskForNoChanges) {
                        // IMPORTANTE: Sempre atualizar jiraStatus do Jira, mesmo quando não há outras mudanças
                        updatedTasks[existingIndex] = {
                            ...oldTask,
                            jiraStatus: jiraStatusName, // Sempre atualizar do Jira
                            status: jiraStatusChanged ? mapJiraStatusToTaskStatus(jiraStatusName) : oldTask.status, // Atualizar status mapeado se jiraStatus mudou
                            testCases: originalTaskForNoChanges.testCases || []
                        };
                        
                        if (jiraStatusChanged) {
                            logger.info(`jiraStatus atualizado (sem outras mudanças) para ${task.id}: "${oldTask.jiraStatus}" → "${jiraStatusName}"`, 'jiraService');
                        }
                        
                        logger.debug(`Preservando testCases do projeto original (sem mudanças no Jira) para ${task.id}`, 'jiraService', {
                            testCasesCount: (originalTaskForNoChanges.testCases || []).length,
                            testCasesComStatus: (originalTaskForNoChanges.testCases || []).filter(tc => tc.status !== 'Not Run').length
                        });
                    } else {
                        // IMPORTANTE: Sempre atualizar jiraStatus do Jira, mesmo quando não há outras mudanças
                        updatedTasks[existingIndex] = {
                            ...oldTask,
                            jiraStatus: jiraStatusName, // Sempre atualizar do Jira
                            status: jiraStatusChanged ? mapJiraStatusToTaskStatus(jiraStatusName) : oldTask.status // Atualizar status mapeado se jiraStatus mudou
                        };
                        
                        if (jiraStatusChanged) {
                            logger.info(`jiraStatus atualizado (sem outras mudanças) para ${task.id}: "${oldTask.jiraStatus}" → "${jiraStatusName}"`, 'jiraService');
                        }
                        
                        logger.debug(`Nenhum testCase para mesclar (sem mudanças no Jira) para ${task.id}`, 'jiraService');
                    }
                }
            }
        } else {
            logger.info(`Nova tarefa encontrada: ${task.id} - ${task.title}`, 'jiraService');
            updatedTasks.push(task);
            newCount++;
        }
    }

    logger.info(`Resumo: ${updatedCount} atualizadas, ${newCount} novas, ${updatedTasks.length} total`, 'jiraService');

    // VALIDAÇÃO FINAL ROBUSTA: Garantir que os status dos testCases foram preservados
    // Usar originalTasksMap (que foi atualizado dinamicamente) em vez de projectToUse para garantir dados mais recentes
    const statusAntes = Array.from(originalTasksMap.values()).flatMap(t => 
        (t.testCases || []).filter(tc => tc.status !== 'Not Run').map(tc => ({ taskId: t.id, testCaseId: tc.id, status: tc.status }))
    );
    const statusDepois = updatedTasks.flatMap(t => 
        (t.testCases || []).filter(tc => tc.status !== 'Not Run').map(tc => ({ taskId: t.id, testCaseId: tc.id, status: tc.status }))
    );
    
    logger.info(`VALIDAÇÃO FINAL: Comparando status antes e depois da sincronização`, 'jiraService', {
        statusAntes: statusAntes.length,
        statusDepois: statusDepois.length,
        tarefasProcessadas: originalTasksMap.size
    });
    
    // Criar Map dos status antes para validação
    // Usar objeto estruturado para evitar parsing de string com split('-'),
    // pois IDs Jira como "GDPI-304" contêm hífen e quebrariam a extração
    const statusMapAntes = new Map<string, { taskId: string; testCaseId: string; expectedStatus: TestCase['status'] }>();
    statusAntes.forEach(s => {
        if (s.testCaseId) {
            statusMapAntes.set(`${s.taskId}||${s.testCaseId}`, {
                taskId: s.taskId,
                testCaseId: s.testCaseId,
                expectedStatus: s.status,
            });
        }
    });
    
    // Verificar se algum status foi perdido e restaurar do originalTasksMap
    let statusPerdidos = 0;
    let statusRestaurados = 0;
    statusMapAntes.forEach(({ taskId, testCaseId, expectedStatus }) => {
        const statusDepoisEncontrado = statusDepois.find(
            s => s.testCaseId && s.taskId === taskId && s.testCaseId === testCaseId
        );
        
        if (!statusDepoisEncontrado || statusDepoisEncontrado.status !== expectedStatus) {
            statusPerdidos++;
            logger.error(`STATUS PERDIDO na validação final: taskId=${taskId}, testCaseId=${testCaseId}, esperado="${expectedStatus}", obtido="${statusDepoisEncontrado?.status || 'não encontrado'}"`, 'jiraService');
            
            // CORREÇÃO ROBUSTA: Restaurar status do originalTasksMap (que tem os dados mais recentes)
            const originalTask = originalTasksMap.get(taskId);
            if (originalTask) {
                const originalTestCase = originalTask.testCases?.find(tc => tc.id === testCaseId);
                if (originalTestCase && originalTestCase.status !== 'Not Run') {
                    const updatedTaskIndex = updatedTasks.findIndex(t => t.id === taskId);
                    if (updatedTaskIndex >= 0) {
                        const updatedTask = updatedTasks[updatedTaskIndex];
                        const restoredTestCases = (updatedTask.testCases || []).map(tc => 
                            tc.id === testCaseId ? { ...tc, status: originalTestCase.status } : tc
                        );
                        updatedTasks[updatedTaskIndex] = {
                            ...updatedTask,
                            testCases: restoredTestCases
                        };
                        statusRestaurados++;
                        logger.info(`Status restaurado na validação final: taskId=${taskId}, testCaseId=${testCaseId}, status="${originalTestCase.status}"`, 'jiraService');
                    }
                } else {
                    // Tentar restaurar do store diretamente como último recurso
                    const latestProjectFromStore = getLatestProject?.();
                    if (latestProjectFromStore) {
                        const latestTask = latestProjectFromStore.tasks.find(t => t.id === taskId);
                        if (latestTask) {
                            const latestTestCase = latestTask.testCases?.find(tc => tc.id === testCaseId);
                            if (latestTestCase && latestTestCase.status !== 'Not Run') {
                                const updatedTaskIndex = updatedTasks.findIndex(t => t.id === taskId);
                                if (updatedTaskIndex >= 0) {
                                    const updatedTask = updatedTasks[updatedTaskIndex];
                                    const restoredTestCases = (updatedTask.testCases || []).map(tc =>
                                        tc.id === testCaseId ? { ...tc, status: latestTestCase.status } : tc
                                    );
                                    updatedTasks[updatedTaskIndex] = {
                                        ...updatedTask,
                                        testCases: restoredTestCases
                                    };
                                    statusRestaurados++;
                                    logger.info(`Status restaurado do store (último recurso): taskId=${taskId}, testCaseId=${testCaseId}, status="${latestTestCase.status}"`, 'jiraService');
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    
    if (statusPerdidos > 0) {
        logger.warn(`VALIDAÇÃO FINAL: ${statusPerdidos} status foram perdidos, ${statusRestaurados} restaurados antes de retornar`, 'jiraService', {
            statusAntes: statusAntes.length,
            statusDepois: statusDepois.length,
            statusPerdidos: statusPerdidos,
            statusRestaurados: statusRestaurados,
            statusNaoRestaurados: statusPerdidos - statusRestaurados
        });
    } else {
        logger.info(`VALIDAÇÃO FINAL: Todos os ${statusAntes.length} status foram preservados`, 'jiraService', {
            statusAntes: statusAntes.length,
            statusDepois: statusDepois.length,
            tarefasProcessadas: originalTasksMap.size
        });
    }

    // Sincronizar lista de jiraStatuses: incluir status encontrados nas tasks que ainda não constam
    // em project.settings.jiraStatuses (ex.: status criados no Jira após a importação inicial)
    const existingStatusNames = new Set(
        (projectToUse.settings?.jiraStatuses || []).map(s => (typeof s === 'string' ? s : s.name))
    );
    const newStatuses: Array<{ name: string; color: string }> = [];
    updatedTasks.forEach(task => {
        if (task.jiraStatus && !existingStatusNames.has(task.jiraStatus)) {
            existingStatusNames.add(task.jiraStatus);
            newStatuses.push({ name: task.jiraStatus, color: getJiraStatusColor(task.jiraStatus) });
        }
    });
    if (newStatuses.length > 0) {
        logger.info(
            `Sync: ${newStatuses.length} novo(s) status do Jira descobertos e adicionados à lista do projeto`,
            'jiraService',
            { novosStatus: newStatuses.map(s => s.name) }
        );
    }
    const mergedJiraStatuses = [
        ...(projectToUse.settings?.jiraStatuses || []),
        ...newStatuses,
    ];

    // IMPORTANTE: Retornar projeto baseado em projectToUse (do store), não no project passado como parâmetro
    // Isso garante que todos os campos do projeto (não apenas tasks) venham do store com os dados mais recentes
    return {
        ...projectToUse,
        tasks: updatedTasks,
        settings: {
            ...projectToUse.settings,
            jiraStatuses: mergedJiraStatuses.length > 0 ? mergedJiraStatuses : projectToUse.settings?.jiraStatuses,
        },
    };
}
