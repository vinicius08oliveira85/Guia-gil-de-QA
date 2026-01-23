/**
 * Script para verificar a estrutura dos dados no Supabase
 * Verifica como Casos de Teste, Estratégias de Teste e Cenários BDD estão sendo salvos
 * 
 * Execute este script no console do navegador ou como parte de um teste
 */

import { loadProjectsFromSupabase } from '../services/supabaseService';
import { Project, JiraTask, TestCase, TestStrategy, BddScenario } from '../types';
import { logger } from '../utils/logger';

interface VerificationResult {
  projectId: string;
  projectName: string;
  totalTasks: number;
  tasksWithTestCases: number;
  tasksWithTestStrategy: number;
  tasksWithBddScenarios: number;
  totalTestCases: number;
  totalTestStrategies: number;
  totalBddScenarios: number;
  taskDetails: TaskVerificationDetail[];
  issues: string[];
}

interface TaskVerificationDetail {
  taskId: string;
  taskTitle: string;
  taskType: string;
  testCasesCount: number;
  testStrategyCount: number;
  bddScenariosCount: number;
  testCases: TestCase[];
  testStrategy: TestStrategy[];
  bddScenarios: BddScenario[];
  hasTestData: boolean;
}

/**
 * Verifica a estrutura dos dados de teste no Supabase
 */
export const verifySupabaseStructure = async (): Promise<VerificationResult[]> => {
  const results: VerificationResult[] = [];
  const issues: string[] = [];

  try {
    logger.info('Iniciando verificação da estrutura do Supabase...', 'verifySupabase');
    
    // Carregar todos os projetos do Supabase
    const projects = await loadProjectsFromSupabase();
    
    if (projects.length === 0) {
      logger.warn('Nenhum projeto encontrado no Supabase', 'verifySupabase');
      return results;
    }

    logger.info(`Verificando ${projects.length} projeto(s) do Supabase`, 'verifySupabase');

    for (const project of projects) {
      const projectResult: VerificationResult = {
        projectId: project.id,
        projectName: project.name,
        totalTasks: project.tasks?.length || 0,
        tasksWithTestCases: 0,
        tasksWithTestStrategy: 0,
        tasksWithBddScenarios: 0,
        totalTestCases: 0,
        totalTestStrategies: 0,
        totalBddScenarios: 0,
        taskDetails: [],
        issues: []
      };

      if (!project.tasks || project.tasks.length === 0) {
        projectResult.issues.push('Projeto não possui tarefas');
        results.push(projectResult);
        continue;
      }

      // Verificar cada tarefa
      for (const task of project.tasks) {
        const taskDetail: TaskVerificationDetail = {
          taskId: task.id,
          taskTitle: task.title || 'Sem título',
          taskType: task.type || 'Desconhecido',
          testCasesCount: task.testCases?.length || 0,
          testStrategyCount: task.testStrategy?.length || 0,
          bddScenariosCount: task.bddScenarios?.length || 0,
          testCases: task.testCases || [],
          testStrategy: task.testStrategy || [],
          bddScenarios: task.bddScenarios || [],
          hasTestData: false
        };

        // Verificar se tem dados de teste
        if (taskDetail.testCasesCount > 0) {
          projectResult.tasksWithTestCases++;
          projectResult.totalTestCases += taskDetail.testCasesCount;
          taskDetail.hasTestData = true;
        }

        if (taskDetail.testStrategyCount > 0) {
          projectResult.tasksWithTestStrategy++;
          projectResult.totalTestStrategies += taskDetail.testStrategyCount;
          taskDetail.hasTestData = true;
        }

        if (taskDetail.bddScenariosCount > 0) {
          projectResult.tasksWithBddScenarios++;
          projectResult.totalBddScenarios += taskDetail.bddScenariosCount;
          taskDetail.hasTestData = true;
        }

        // Verificar estrutura dos casos de teste
        if (task.testCases && task.testCases.length > 0) {
          for (const testCase of task.testCases) {
            if (!testCase.id) {
              projectResult.issues.push(`Caso de teste sem ID na tarefa ${task.id}`);
            }
            if (!testCase.description) {
              projectResult.issues.push(`Caso de teste sem descrição na tarefa ${task.id}`);
            }
            if (!testCase.status) {
              projectResult.issues.push(`Caso de teste sem status na tarefa ${task.id}`);
            }
          }
        }

        // Verificar estrutura das estratégias
        if (task.testStrategy && task.testStrategy.length > 0) {
          for (const strategy of task.testStrategy) {
            if (!strategy.testType) {
              projectResult.issues.push(`Estratégia sem testType na tarefa ${task.id}`);
            }
            if (!strategy.description) {
              projectResult.issues.push(`Estratégia sem descrição na tarefa ${task.id}`);
            }
          }
        }

        // Verificar estrutura dos cenários BDD
        if (task.bddScenarios && task.bddScenarios.length > 0) {
          for (const scenario of task.bddScenarios) {
            if (!scenario.id) {
              projectResult.issues.push(`Cenário BDD sem ID na tarefa ${task.id}`);
            }
            if (!scenario.title) {
              projectResult.issues.push(`Cenário BDD sem título na tarefa ${task.id}`);
            }
            if (!scenario.gherkin) {
              projectResult.issues.push(`Cenário BDD sem Gherkin na tarefa ${task.id}`);
            }
          }
        }

        projectResult.taskDetails.push(taskDetail);
      }

      // Verificar se há tarefas sem dados de teste quando deveriam ter
      const tasksThatShouldHaveTests = project.tasks.filter(
        task => task.type === 'Tarefa' || task.type === 'Bug'
      );
      
      const tasksWithoutTests = tasksThatShouldHaveTests.filter(
        task => (!task.testCases || task.testCases.length === 0) &&
                (!task.testStrategy || task.testStrategy.length === 0) &&
                (!task.bddScenarios || task.bddScenarios.length === 0)
      );

      if (tasksWithoutTests.length > 0) {
        projectResult.issues.push(
          `${tasksWithoutTests.length} tarefa(s) do tipo Tarefa/Bug sem dados de teste`
        );
      }

      results.push(projectResult);
    }

    // Log resumo
    const totalProjects = results.length;
    const totalTasks = results.reduce((sum, r) => sum + r.totalTasks, 0);
    const totalTestCases = results.reduce((sum, r) => sum + r.totalTestCases, 0);
    const totalStrategies = results.reduce((sum, r) => sum + r.totalTestStrategies, 0);
    const totalBdd = results.reduce((sum, r) => sum + r.totalBddScenarios, 0);
    const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);

    logger.info(
      `Verificação concluída: ${totalProjects} projeto(s), ${totalTasks} tarefa(s), ` +
      `${totalTestCases} caso(s) de teste, ${totalStrategies} estratégia(s), ${totalBdd} cenário(s) BDD. ` +
      `${totalIssues} problema(s) encontrado(s).`,
      'verifySupabase'
    );

    return results;
  } catch (error) {
    logger.error('Erro ao verificar estrutura do Supabase', 'verifySupabase', error);
    throw error;
  }
};

/**
 * Gera um relatório formatado dos resultados da verificação
 */
export const generateVerificationReport = (results: VerificationResult[]): string => {
  let report = '# Relatório de Verificação - Estrutura Supabase\n\n';
  
  report += `## Resumo Geral\n\n`;
  report += `- **Total de Projetos**: ${results.length}\n`;
  report += `- **Total de Tarefas**: ${results.reduce((sum, r) => sum + r.totalTasks, 0)}\n`;
  report += `- **Total de Casos de Teste**: ${results.reduce((sum, r) => sum + r.totalTestCases, 0)}\n`;
  report += `- **Total de Estratégias**: ${results.reduce((sum, r) => sum + r.totalTestStrategies, 0)}\n`;
  report += `- **Total de Cenários BDD**: ${results.reduce((sum, r) => sum + r.totalBddScenarios, 0)}\n`;
  report += `- **Total de Problemas**: ${results.reduce((sum, r) => sum + r.issues.length, 0)}\n\n`;

  for (const result of results) {
    report += `## Projeto: ${result.projectName} (${result.projectId})\n\n`;
    report += `- **Total de Tarefas**: ${result.totalTasks}\n`;
    report += `- **Tarefas com Casos de Teste**: ${result.tasksWithTestCases}\n`;
    report += `- **Tarefas com Estratégias**: ${result.tasksWithTestStrategy}\n`;
    report += `- **Tarefas com Cenários BDD**: ${result.tasksWithBddScenarios}\n`;
    report += `- **Total de Casos de Teste**: ${result.totalTestCases}\n`;
    report += `- **Total de Estratégias**: ${result.totalTestStrategies}\n`;
    report += `- **Total de Cenários BDD**: ${result.totalBddScenarios}\n\n`;

    if (result.issues.length > 0) {
      report += `### Problemas Encontrados:\n\n`;
      for (const issue of result.issues) {
        report += `- ⚠️ ${issue}\n`;
      }
      report += `\n`;
    }

    if (result.taskDetails.length > 0) {
      report += `### Detalhes por Tarefa:\n\n`;
      for (const task of result.taskDetails) {
        if (task.hasTestData) {
          report += `#### Tarefa: ${task.taskTitle} (${task.taskId})\n`;
          report += `- **Tipo**: ${task.taskType}\n`;
          report += `- **Casos de Teste**: ${task.testCasesCount}\n`;
          report += `- **Estratégias**: ${task.testStrategyCount}\n`;
          report += `- **Cenários BDD**: ${task.bddScenariosCount}\n\n`;
        }
      }
    }
  }

  return report;
};

/**
 * Verifica se os dados estão relacionados corretamente às tarefas
 */
export const verifyTaskRelations = (results: VerificationResult[]): {
  isValid: boolean;
  issues: string[];
} => {
  const issues: string[] = [];

  for (const result of results) {
    // Verificar se cada tarefa tem seus próprios dados
    const taskIds = new Set<string>();
    
    for (const taskDetail of result.taskDetails) {
      if (taskIds.has(taskDetail.taskId)) {
        issues.push(`Tarefa duplicada encontrada: ${taskDetail.taskId} no projeto ${result.projectName}`);
      }
      taskIds.add(taskDetail.taskId);

      // Verificar se os casos de teste têm IDs únicos dentro da tarefa
      const testCaseIds = new Set<string>();
      for (const testCase of taskDetail.testCases) {
        if (testCaseIds.has(testCase.id)) {
          issues.push(
            `Caso de teste duplicado: ${testCase.id} na tarefa ${taskDetail.taskId} do projeto ${result.projectName}`
          );
        }
        testCaseIds.add(testCase.id);
      }

      // Verificar se os cenários BDD têm IDs únicos dentro da tarefa
      const bddIds = new Set<string>();
      for (const scenario of taskDetail.bddScenarios) {
        if (bddIds.has(scenario.id)) {
          issues.push(
            `Cenário BDD duplicado: ${scenario.id} na tarefa ${taskDetail.taskId} do projeto ${result.projectName}`
          );
        }
        bddIds.add(scenario.id);
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  };
};

