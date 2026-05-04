import { Project, JiraTask, TestCase } from '../types';
import { logger } from './logger';
import { restoreBackup } from '../services/backupService';

export interface IntegrityIssue {
  type: 'missing_field' | 'invalid_data' | 'corrupted_data' | 'inconsistent_data';
  severity: 'low' | 'medium' | 'high' | 'critical';
  path: string; // Caminho do campo (ex: 'tasks[0].testCases[1].description')
  message: string;
  expected?: any;
  actual?: any;
}

export interface IntegrityCheckResult {
  isValid: boolean;
  issues: IntegrityIssue[];
  canAutoFix: boolean;
  autoFixed?: boolean;
}

/**
 * Impressão digital leve do projeto (evita JSON.stringify do grafo inteiro → stack/heap em projetos grandes).
 */
const projectIntegrityFingerprint = (project: Project): string => {
  try {
    let hash = 5381;
    const mix = (s: string) => {
      for (let i = 0; i < s.length; i++) {
        hash = (hash * 33) ^ s.charCodeAt(i);
        hash |= 0;
      }
    };

    mix(project.id || '');
    mix(project.name || '');
    mix(project.updatedAt || '');
    mix(project.createdAt || '');

    const tasks = project.tasks || [];
    hash = (hash * 33 + tasks.length) | 0;

    for (let ti = 0; ti < tasks.length; ti++) {
      const t = tasks[ti];
      mix(t.id || '');
      mix(t.title?.slice(0, 120) || '');
      mix(t.updatedAt || t.createdAt || '');
      const tcs = t.testCases || [];
      hash = (hash * 33 + tcs.length) | 0;
      for (let ci = 0; ci < tcs.length; ci++) {
        const tc = tcs[ci];
        mix(tc.id || '');
        mix(tc.status || '');
      }
    }

    const docs = project.documents || [];
    hash = (hash * 33 + docs.length) | 0;
    for (let di = 0; di < docs.length; di++) {
      mix(docs[di].name || '');
    }

    return `fp:${(hash >>> 0).toString(36)}`;
  } catch {
    return 'fp:error';
  }
};

/**
 * Valida estrutura básica de um projeto
 */
const validateProjectStructure = (project: Project): IntegrityIssue[] => {
  const issues: IntegrityIssue[] = [];

  if (!project.id) {
    issues.push({
      type: 'missing_field',
      severity: 'critical',
      path: 'id',
      message: 'Projeto sem ID',
    });
  }

  if (!project.name || project.name.trim() === '') {
    issues.push({
      type: 'missing_field',
      severity: 'high',
      path: 'name',
      message: 'Projeto sem nome',
    });
  }

  if (!Array.isArray(project.tasks)) {
    issues.push({
      type: 'invalid_data',
      severity: 'critical',
      path: 'tasks',
      message: 'Campo tasks não é um array',
      expected: 'array',
      actual: typeof project.tasks,
    });
  }

  if (!Array.isArray(project.phases)) {
    issues.push({
      type: 'invalid_data',
      severity: 'high',
      path: 'phases',
      message: 'Campo phases não é um array',
      expected: 'array',
      actual: typeof project.phases,
    });
  }

  return issues;
};

/**
 * Valida estrutura de uma tarefa
 */
const validateTask = (task: JiraTask, taskIndex: number): IntegrityIssue[] => {
  const issues: IntegrityIssue[] = [];

  if (!task.id) {
    issues.push({
      type: 'missing_field',
      severity: 'high',
      path: `tasks[${taskIndex}].id`,
      message: `Tarefa ${taskIndex} sem ID`,
    });
  }

  if (!task.title || task.title.trim() === '') {
    issues.push({
      type: 'missing_field',
      severity: 'medium',
      path: `tasks[${taskIndex}].title`,
      message: `Tarefa ${taskIndex} sem título`,
    });
  }

  if (!task.type) {
    issues.push({
      type: 'missing_field',
      severity: 'high',
      path: `tasks[${taskIndex}].type`,
      message: `Tarefa ${taskIndex} sem tipo`,
    });
  }

  // Validar casos de teste apenas para tarefas do tipo "Tarefa"
  if (task.type === 'Tarefa') {
    if (!Array.isArray(task.testCases)) {
      issues.push({
        type: 'invalid_data',
        severity: 'medium',
        path: `tasks[${taskIndex}].testCases`,
        message: `testCases não é um array na tarefa ${taskIndex}`,
        expected: 'array',
        actual: typeof task.testCases,
      });
    } else {
      // Validar cada caso de teste
      task.testCases.forEach((testCase, tcIndex) => {
        const tcIssues = validateTestCase(testCase, taskIndex, tcIndex);
        issues.push(...tcIssues);
      });
    }
  } else {
    // Tarefas que não são "Tarefa" não devem ter casos de teste
    if (task.testCases && task.testCases.length > 0) {
      issues.push({
        type: 'inconsistent_data',
        severity: 'low',
        path: `tasks[${taskIndex}].testCases`,
        message: `Tarefa do tipo "${task.type}" não deve ter casos de teste`,
      });
    }
  }

  return issues;
};

/**
 * Valida estrutura de um caso de teste
 */
const validateTestCase = (
  testCase: TestCase,
  taskIndex: number,
  testCaseIndex: number
): IntegrityIssue[] => {
  const issues: IntegrityIssue[] = [];
  const path = `tasks[${taskIndex}].testCases[${testCaseIndex}]`;

  if (!testCase.id) {
    issues.push({
      type: 'missing_field',
      severity: 'medium',
      path: `${path}.id`,
      message: `Caso de teste ${testCaseIndex} sem ID`,
    });
  }

  if (!testCase.description || testCase.description.trim() === '') {
    issues.push({
      type: 'missing_field',
      severity: 'medium',
      path: `${path}.description`,
      message: `Caso de teste ${testCaseIndex} sem descrição`,
    });
  }

  if (!Array.isArray(testCase.steps)) {
    issues.push({
      type: 'invalid_data',
      severity: 'medium',
      path: `${path}.steps`,
      message: `steps não é um array no caso de teste ${testCaseIndex}`,
      expected: 'array',
      actual: typeof testCase.steps,
    });
  }

  if (!testCase.expectedResult || testCase.expectedResult.trim() === '') {
    issues.push({
      type: 'missing_field',
      severity: 'low',
      path: `${path}.expectedResult`,
      message: `Caso de teste ${testCaseIndex} sem resultado esperado`,
    });
  }

  if (!testCase.status) {
    issues.push({
      type: 'missing_field',
      severity: 'low',
      path: `${path}.status`,
      message: `Caso de teste ${testCaseIndex} sem status`,
    });
  }

  return issues;
};

/**
 * Valida integridade de um projeto
 */
export const validateProjectIntegrity = (project: Project): IntegrityCheckResult => {
  const issues: IntegrityIssue[] = [];

  // Validar estrutura básica
  issues.push(...validateProjectStructure(project));

  // Validar tarefas
  if (Array.isArray(project.tasks)) {
    project.tasks.forEach((task, index) => {
      issues.push(...validateTask(task, index));
    });
  }

  try {
    const fingerprint = projectIntegrityFingerprint(project);
    if (fingerprint === 'fp:error') {
      issues.push({
        type: 'corrupted_data',
        severity: 'critical',
        path: 'root',
        message: 'Não foi possível calcular impressão digital do projeto (possível corrupção)',
      });
    }
  } catch {
    issues.push({
      type: 'corrupted_data',
      severity: 'critical',
      path: 'root',
      message: 'Erro ao validar integridade do projeto',
    });
  }

  const hasCriticalIssues = issues.some(issue => issue.severity === 'critical');
  const canAutoFix =
    !hasCriticalIssues &&
    issues.every(issue => issue.type === 'missing_field' || issue.type === 'inconsistent_data');

  return {
    isValid: issues.length === 0,
    issues,
    canAutoFix,
  };
};

/**
 * Tenta corrigir automaticamente problemas de integridade
 */
export const autoFixIntegrityIssues = (project: Project): Project => {
  const fixedProject = { ...project };

  // Corrigir campos obrigatórios faltantes
  if (!fixedProject.id) {
    fixedProject.id = `proj-${Date.now()}`;
    logger.warn('ID do projeto gerado automaticamente', 'dataIntegrityService');
  }

  if (!fixedProject.name || fixedProject.name.trim() === '') {
    fixedProject.name = 'Projeto Sem Nome';
    logger.warn('Nome do projeto definido automaticamente', 'dataIntegrityService');
  }

  // Garantir que tasks é um array
  if (!Array.isArray(fixedProject.tasks)) {
    fixedProject.tasks = [];
    logger.warn('Campo tasks corrigido para array vazio', 'dataIntegrityService');
  }

  // Garantir que phases é um array
  if (!Array.isArray(fixedProject.phases)) {
    fixedProject.phases = [];
    logger.warn('Campo phases corrigido para array vazio', 'dataIntegrityService');
  }

  // Corrigir tarefas
  fixedProject.tasks = fixedProject.tasks.map((task, index) => {
    const fixedTask = { ...task };

    // Corrigir ID faltante
    if (!fixedTask.id) {
      fixedTask.id = `task-${Date.now()}-${index}`;
      logger.warn(`ID da tarefa ${index} gerado automaticamente`, 'dataIntegrityService');
    }

    // Corrigir título faltante
    if (!fixedTask.title || fixedTask.title.trim() === '') {
      fixedTask.title = 'Tarefa Sem Título';
      logger.warn(`Título da tarefa ${index} definido automaticamente`, 'dataIntegrityService');
    }

    // Corrigir tipo faltante
    if (!fixedTask.type) {
      fixedTask.type = 'Tarefa';
      logger.warn(`Tipo da tarefa ${index} definido como "Tarefa"`, 'dataIntegrityService');
    }

    // Garantir que testCases é um array
    if (!Array.isArray(fixedTask.testCases)) {
      fixedTask.testCases = [];
    }

    // Remover casos de teste de tipos não permitidos
    if (fixedTask.type !== 'Tarefa' && fixedTask.testCases.length > 0) {
      logger.warn(
        `Removendo ${fixedTask.testCases.length} casos de teste da tarefa ${index} (tipo: ${fixedTask.type})`,
        'dataIntegrityService'
      );
      fixedTask.testCases = [];
    }

    // Corrigir casos de teste
    fixedTask.testCases = fixedTask.testCases.map((testCase, tcIndex) => {
      const fixedTestCase = { ...testCase };

      // Corrigir ID faltante
      if (!fixedTestCase.id) {
        fixedTestCase.id = `test-${Date.now()}-${index}-${tcIndex}`;
      }

      // Corrigir descrição faltante
      if (!fixedTestCase.description || fixedTestCase.description.trim() === '') {
        fixedTestCase.description = 'Caso de teste sem descrição';
      }

      // Garantir que steps é um array
      if (!Array.isArray(fixedTestCase.steps)) {
        fixedTestCase.steps = [];
      }

      // Corrigir resultado esperado faltante
      if (!fixedTestCase.expectedResult || fixedTestCase.expectedResult.trim() === '') {
        fixedTestCase.expectedResult = 'Resultado esperado não especificado';
      }

      // Corrigir status faltante
      if (!fixedTestCase.status) {
        fixedTestCase.status = 'Not Run';
      }

      return fixedTestCase;
    });

    return fixedTask;
  });

  return fixedProject;
};

/**
 * Valida e corrige integridade de um projeto, restaurando backup se necessário
 */
export const validateAndFixProject = async (
  project: Project,
  projectId: string
): Promise<{ project: Project; wasFixed: boolean; restoredFromBackup: boolean }> => {
  const checkResult = validateProjectIntegrity(project);

  if (checkResult.isValid) {
    return {
      project,
      wasFixed: false,
      restoredFromBackup: false,
    };
  }

  logger.warn(
    `Problemas de integridade detectados no projeto ${projectId}: ${checkResult.issues.length} issues`,
    'dataIntegrityService',
    { issues: checkResult.issues }
  );

  // Se pode corrigir automaticamente, tentar corrigir
  if (checkResult.canAutoFix) {
    logger.info(
      'Tentando corrigir problemas de integridade automaticamente',
      'dataIntegrityService'
    );
    const fixedProject = autoFixIntegrityIssues(project);
    const fixedCheckResult = validateProjectIntegrity(fixedProject);

    if (fixedCheckResult.isValid) {
      logger.info('Problemas de integridade corrigidos automaticamente', 'dataIntegrityService');
      return {
        project: fixedProject,
        wasFixed: true,
        restoredFromBackup: false,
      };
    } else {
      logger.warn(
        'Não foi possível corrigir todos os problemas automaticamente',
        'dataIntegrityService'
      );
    }
  }

  // Se não pode corrigir ou correção falhou, tentar restaurar do backup
  if (checkResult.issues.some(issue => issue.severity === 'critical')) {
    logger.warn(
      'Problemas críticos detectados, tentando restaurar do backup',
      'dataIntegrityService'
    );

    try {
      // Tentar restaurar do backup mais recente
      const restoredProject = await restoreBackup(projectId, 'latest');
      const restoredCheckResult = validateProjectIntegrity(restoredProject);

      if (restoredCheckResult.isValid) {
        logger.info('Projeto restaurado do backup com sucesso', 'dataIntegrityService');
        return {
          project: restoredProject,
          wasFixed: false,
          restoredFromBackup: true,
        };
      } else {
        logger.warn('Backup também tem problemas de integridade', 'dataIntegrityService');
      }
    } catch (error) {
      logger.error('Erro ao restaurar do backup', 'dataIntegrityService', error);
    }
  }

  // Se tudo falhar, retornar projeto original (mesmo com problemas)
  logger.error(
    'Não foi possível corrigir ou restaurar projeto, retornando projeto original',
    'dataIntegrityService'
  );

  return {
    project,
    wasFixed: false,
    restoredFromBackup: false,
  };
};
