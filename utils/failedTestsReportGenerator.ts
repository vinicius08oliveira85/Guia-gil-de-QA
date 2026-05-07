import { Project, JiraTask, TestCase } from '../types';
import { getTestCaseEnvironment, getTestCaseSuite } from './testCaseMigration';

export type FailedTestsReportFormat = 'text' | 'markdown';

interface FailedTestWithTask {
  testCase: TestCase;
  task: JiraTask;
}

interface GenerateFailedTestsReportOptions {
  format?: FailedTestsReportFormat;
  selectedTestIds?: string[];
  filters?: {
    taskId?: string;
    priorities?: string[];
    environments?: string[];
    suites?: string[];
  };
}

/**
 * Formata data no formato dd/MM/yyyy às HH:mm:ss
 */
function formatDateTime(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} às ${hours}:${minutes}:${seconds}`;
}

/**
 * Coleta todos os testes reprovados de um projeto ou tarefa
 */
function collectFailedTests(project: Project, taskId?: string): FailedTestWithTask[] {
  const failedTests: FailedTestWithTask[] = [];

  const tasks = taskId ? project.tasks.filter(t => t.id === taskId) : project.tasks;

  tasks.forEach(task => {
    const failedTestCases = (task.testCases || []).filter(tc => tc.status === 'Failed');

    failedTestCases.forEach(testCase => {
      failedTests.push({ testCase, task });
    });
  });

  return failedTests;
}

/**
 * Aplica filtros aos testes reprovados
 */
function applyFilters(
  failedTests: FailedTestWithTask[],
  filters?: GenerateFailedTestsReportOptions['filters']
): FailedTestWithTask[] {
  if (!filters) return failedTests;

  let filtered = failedTests;

  // Filtro por tarefa
  if (filters.taskId) {
    filtered = filtered.filter(ft => ft.task.id === filters.taskId);
  }

  // Filtro por prioridade (da tarefa Jira)
  if (filters.priorities && filters.priorities.length > 0) {
    filtered = filtered.filter(
      ft => ft.task.priority && filters.priorities!.includes(ft.task.priority)
    );
  }

  // Filtro por ambiente (campo estruturado ou linha legada em parâmetros)
  if (filters.environments && filters.environments.length > 0) {
    filtered = filtered.filter(ft => {
      const env = getTestCaseEnvironment(ft.testCase);
      return !!env && filters.environments!.includes(env);
    });
  }

  // Filtro por suíte
  if (filters.suites && filters.suites.length > 0) {
    filtered = filtered.filter(ft => {
      const suite = getTestCaseSuite(ft.testCase);
      return !!suite && filters.suites!.includes(suite);
    });
  }

  return filtered;
}

/**
 * Gera um relatório de testes reprovados
 */
export function generateFailedTestsReport(
  project: Project,
  generatedAt: Date = new Date(),
  options: GenerateFailedTestsReportOptions = {}
): string {
  const format: FailedTestsReportFormat = options.format ?? 'text';
  const lines: string[] = [];

  // Coletar testes reprovados
  const allFailedTests = collectFailedTests(project, options.filters?.taskId);

  // Aplicar filtros
  let filteredTests = applyFilters(allFailedTests, options.filters);

  // Aplicar seleção de testes (se especificada)
  if (options.selectedTestIds && options.selectedTestIds.length > 0) {
    filteredTests = filteredTests.filter(ft => options.selectedTestIds!.includes(ft.testCase.id));
  }

  // Cabeçalho
  if (format === 'markdown') {
    lines.push('# RELATÓRIO DE TESTES REPROVADOS');
    lines.push('');
  } else {
    lines.push('RELATÓRIO DE TESTES REPROVADOS');
    lines.push('==============================');
    lines.push('');
  }

  lines.push(`Projeto: ${project.name}`);
  lines.push(`Gerado em: ${formatDateTime(generatedAt)}`);
  lines.push('');
  lines.push('');

  // Seção FILTROS APLICADOS
  if (format === 'markdown') {
    lines.push('## FILTROS APLICADOS');
  } else {
    lines.push('FILTROS APLICADOS:');
  }
  lines.push('');

  const scope = options.filters?.taskId ? 'Tarefa' : 'Projeto';
  lines.push(`- Escopo: ${scope}`);

  if (options.filters?.taskId) {
    const task = project.tasks.find(t => t.id === options.filters!.taskId);
    lines.push(`- Tarefa: ${options.filters.taskId} - ${task?.title || 'N/A'}`);
  }

  if (options.filters?.priorities && options.filters.priorities.length > 0) {
    lines.push(`- Prioridade: ${options.filters.priorities.join(', ')}`);
  }

  if (options.filters?.environments && options.filters.environments.length > 0) {
    lines.push(`- Ambiente: ${options.filters.environments.join(', ')}`);
  }

  if (options.filters?.suites && options.filters.suites.length > 0) {
    lines.push(`- Suite: ${options.filters.suites.join(', ')}`);
  }

  if (!options.filters || Object.keys(options.filters).length === 0) {
    lines.push('- Nenhum filtro aplicado');
  }

  lines.push('');
  lines.push('');

  // Seção TESTES REPROVADOS
  if (format === 'markdown') {
    lines.push('## TESTES REPROVADOS');
  } else {
    lines.push('TESTES REPROVADOS:');
    lines.push('==================');
  }
  lines.push('');
  lines.push('');

  if (filteredTests.length === 0) {
    lines.push('Nenhum teste reprovado encontrado com os filtros aplicados.');
    lines.push('');
  } else {
    filteredTests.forEach((failedTest, index) => {
      const { testCase, task } = failedTest;
      const titleLine = testCase.action || `Teste ${index + 1}`;

      // Número do teste
      if (format === 'markdown') {
        lines.push(`### ${index + 1}. ${titleLine}`);
      } else {
        lines.push(`${index + 1}. ${titleLine}`);
      }
      lines.push('');

      // Informações da tarefa
      lines.push(`   Tarefa: ${task.id} - ${task.title || 'Sem título'}`);
      lines.push(`   Status: ❌ Reprovado`);

      if (task.priority) {
        lines.push(`   Prioridade (tarefa): ${task.priority}`);
      }

      lines.push('');

      if (testCase.parameters?.trim()) {
        if (format === 'markdown') {
          lines.push(`   **Parâmetros necessários:** ${testCase.parameters}`);
        } else {
          lines.push(`   Parâmetros necessários: ${testCase.parameters}`);
        }
        lines.push('');
      }

      // Resultado esperado
      if (testCase.expectedResult) {
        if (format === 'markdown') {
          lines.push(`   **Resultado Esperado:** ${testCase.expectedResult}`);
        } else {
          lines.push(`   Resultado Esperado: ${testCase.expectedResult}`);
        }
        lines.push('');
      }

      // Resultado obtido
      if (testCase.observedResult && testCase.observedResult.trim()) {
        if (format === 'markdown') {
          lines.push(
            `   **Resultado obtido:** <span style="color: red;">${testCase.observedResult}</span>`
          );
        } else {
          lines.push(`   Resultado obtido: ${testCase.observedResult}`);
        }
        lines.push('');
      }

      lines.push('');
    });
  }

  // Seção RESUMO
  if (format === 'markdown') {
    lines.push('## RESUMO');
  } else {
    lines.push('RESUMO:');
    lines.push('=======');
  }
  lines.push('');

  lines.push(`Total de Testes Reprovados: ${filteredTests.length}`);
  lines.push('');

  // Distribuição por tarefa
  const byTask = new Map<string, number>();
  filteredTests.forEach(ft => {
    const count = byTask.get(ft.task.id) || 0;
    byTask.set(ft.task.id, count + 1);
  });

  if (byTask.size > 0) {
    if (format === 'markdown') {
      lines.push('### Por Tarefa:');
    } else {
      lines.push('Por Tarefa:');
    }
    lines.push('');
    Array.from(byTask.entries()).forEach(([taskId, count]) => {
      const task = project.tasks.find(t => t.id === taskId);
      lines.push(`  - ${taskId} - ${task?.title || 'N/A'}: ${count}`);
    });
    lines.push('');
  }

  // Distribuição por prioridade
  const byPriority = new Map<string, number>();
  filteredTests.forEach(ft => {
    const priority = ft.task.priority || 'Não especificada';
    const count = byPriority.get(priority) || 0;
    byPriority.set(priority, count + 1);
  });

  if (byPriority.size > 0) {
    if (format === 'markdown') {
      lines.push('### Por Prioridade:');
    } else {
      lines.push('Por Prioridade:');
    }
    lines.push('');
    Array.from(byPriority.entries()).forEach(([priority, count]) => {
      lines.push(`  - ${priority}: ${count}`);
    });
    lines.push('');
  }

  // Distribuição por ambiente
  const byEnvironment = new Map<string, number>();
  filteredTests.forEach(ft => {
    const env =
      getTestCaseEnvironment(ft.testCase) || 'Não especificado no roteiro';
    const count = byEnvironment.get(env) || 0;
    byEnvironment.set(env, count + 1);
  });

  if (byEnvironment.size > 0) {
    if (format === 'markdown') {
      lines.push('### Por Ambiente:');
    } else {
      lines.push('Por Ambiente:');
    }
    lines.push('');
    Array.from(byEnvironment.entries()).forEach(([env, count]) => {
      lines.push(`  - ${env}: ${count}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}
