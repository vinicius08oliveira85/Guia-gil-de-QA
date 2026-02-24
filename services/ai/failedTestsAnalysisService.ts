import { Project, JiraTask, TestCase } from '../../types';
import { callGeminiWithRetry } from './geminiApiWrapper';
import { getAIService } from './aiServiceFactory';
import { logger } from '../../utils/logger';
import { normalizeExecutedStrategy } from '../../utils/testCaseMigration';

interface FailedTestWithTask {
  testCase: TestCase;
  task: JiraTask;
}

interface BugAnalysis {
  title: string;
  severity: 'Crítico' | 'Alto' | 'Médio' | 'Baixo';
  businessImpact: string;
  technicalDescription: string;
  reproductionSteps: string[];
  expectedVsObserved: string;
  recommendation: string;
  priority: number;
}

interface FailedTestsAnalysis {
  executiveSummary: string;
  bugs: BugAnalysis[];
  prioritization: string;
  nextSteps: string[];
}

/**
 * Gera análise estruturada de testes reprovados como um QA Sênior apresentaria ao PO
 */
export async function generateFailedTestsAnalysisForPO(
  project: Project,
  failedTests: FailedTestWithTask[]
): Promise<string> {
  try {
    if (failedTests.length === 0) {
      return 'Nenhum teste reprovado selecionado para análise.';
    }

    // Preparar dados dos testes reprovados para a IA
    const testsData = failedTests.map((ft, index) => {
      const executedStrategies = normalizeExecutedStrategy(ft.testCase.executedStrategy);
      return {
        index: index + 1,
        testId: ft.testCase.id,
        testDescription: ft.testCase.description || 'Sem descrição',
        taskId: ft.task.id,
        taskTitle: ft.task.title || 'Sem título',
        steps: ft.testCase.steps || [],
        expectedResult: ft.testCase.expectedResult || '',
        observedResult: ft.testCase.observedResult || '',
        priority: ft.testCase.priority || 'Média',
        environment: ft.testCase.testEnvironment || 'Não especificado',
        suite: ft.testCase.testSuite || 'Não especificado',
        strategies: executedStrategies,
        toolsUsed: ft.testCase.toolsUsed || [],
      };
    });

    const projectContext = {
      name: project.name,
      description: project.description || '',
      totalFailedTests: failedTests.length,
      affectedTasks: Array.from(new Set(failedTests.map(ft => ft.task.id))).length,
    };

    const prompt = `Você é um QA Sênior experiente e precisa apresentar um relatório profissional de análise de bugs encontrados para o Product Owner (PO).

CONTEXTO DO PROJETO:
- Nome: ${projectContext.name}
- Descrição: ${projectContext.description}
- Total de Testes Reprovados: ${projectContext.totalFailedTests}
- Tarefas Afetadas: ${projectContext.affectedTasks}

TESTES REPROVADOS:
${JSON.stringify(testsData, null, 2)}

INSTRUÇÕES:
1. Analise os erros encontrados e identifique padrões, áreas mais afetadas e tipos de problemas
2. Agrupe bugs similares ou relacionados à mesma funcionalidade/área
3. Determine a severidade geral (Crítico, Alto, Médio, Baixo) baseado em:
   - Impacto consolidado no negócio
   - Quantidade de bugs por área
   - Bloqueio de funcionalidades críticas
   - Experiência do usuário
4. Crie um resumo executivo consolidado que apresente:
   - Análise geral dos bugs encontrados
   - Padrões identificados (ex: "3 bugs relacionados a autenticação")
   - Áreas mais afetadas
   - Impacto geral no projeto
5. Na análise dos bugs, forneça:
   - Agrupamento por tipo/área/funcionalidade
   - Severidade consolidada por grupo
   - Impacto no negócio (em linguagem que o PO entenda)
   - Descrição técnica resumida dos problemas
   - Comparação entre resultado esperado vs observado (quando relevante)
   - Recomendação de ação para cada grupo
6. Priorize os grupos de bugs em ordem de correção
7. Sugira próximos passos acionáveis para o time

FORMATO DE SAÍDA:
Gere um relatório em português, estruturado e profissional, seguindo este formato:

RELATÓRIO DE BUGS ENCONTRADOS - ANÁLISE QA SÊNIOR
==================================================

RESUMO EXECUTIVO
----------------
[Análise consolidada dos bugs encontrados: quantidade total, áreas mais afetadas, padrões identificados, impacto geral no projeto e no negócio. Apresente uma visão estratégica para o PO.]

ANÁLISE DOS BUGS
----------------

[Agrupe e analise os bugs por tipo, área ou similaridade. Para cada grupo:]

Grupo 1: [Nome do grupo - ex: "Bugs de Autenticação", "Problemas de Validação"]
- Quantidade: [X bugs]
- Severidade: [Crítico/Alto/Médio/Baixo]
- Impacto no Negócio: [Descrição clara do impacto consolidado, em linguagem de negócio]
- Descrição Técnica: [Resumo técnico dos problemas encontrados neste grupo]
- Resultado Esperado vs Observado: [Comparação consolidada quando relevante]
- Recomendação: [Ação sugerida para este grupo - ex: "Correção urgente antes do release", "Incluir na próxima sprint", etc.]

[Repita para cada grupo identificado]

PRIORIZAÇÃO
-----------
[Recomendações de ordem de correção baseadas na análise consolidada, explicando o porquê de cada prioridade e o impacto de corrigir cada grupo primeiro]

PRÓXIMOS PASSOS
---------------
1. [Ação sugerida 1 baseada na análise]
2. [Ação sugerida 2 baseada na análise]
...

IMPORTANTE:
- Foque em análise e resumo, não em detalhes de passos para reproduzir
- Agrupe bugs similares para facilitar a compreensão
- Use linguagem clara e profissional
- Foque no impacto no negócio para o PO
- Seja específico e acionável
- Priorize grupos de bugs críticos e de alto impacto
- Forneça contexto suficiente para tomada de decisão estratégica`;

    // Usar Gemini diretamente via callGeminiWithRetry
    try {
      const response = await callGeminiWithRetry({
        model: 'gemini-2.0-flash-exp',
        contents: prompt,
      });

      return response.text.trim();
    } catch (error) {
      logger.warn(
        'Erro ao gerar análise com IA. Usando análise estruturada manual.',
        'failedTestsAnalysisService',
        error
      );
      return generateManualAnalysis(project, failedTests);
    }
  } catch (error) {
    logger.error(
      'Erro ao gerar análise IA de testes reprovados',
      'failedTestsAnalysisService',
      error
    );
    // Fallback para análise manual
    return generateManualAnalysis(project, failedTests);
  }
}

/**
 * Gera análise manual estruturada quando IA não está disponível
 */
function generateManualAnalysis(project: Project, failedTests: FailedTestWithTask[]): string {
  const lines: string[] = [];

  lines.push('RELATÓRIO DE BUGS ENCONTRADOS - ANÁLISE QA SÊNIOR');
  lines.push('==================================================');
  lines.push('');
  lines.push('');

  // Resumo Executivo
  lines.push('RESUMO EXECUTIVO');
  lines.push('----------------');
  lines.push(
    `Durante a execução dos testes do projeto "${project.name}", foram identificados ${failedTests.length} teste(s) reprovado(s).`
  );
  lines.push(
    `Estes testes afetam ${Array.from(new Set(failedTests.map(ft => ft.task.id))).length} tarefa(s) do projeto.`
  );
  lines.push('');

  // Agrupar por tarefa para análise
  const bugsByTask = new Map<string, FailedTestWithTask[]>();
  failedTests.forEach(ft => {
    const taskId = ft.task.id;
    if (!bugsByTask.has(taskId)) {
      bugsByTask.set(taskId, []);
    }
    bugsByTask.get(taskId)!.push(ft);
  });

  lines.push(
    `Análise consolidada: Os bugs estão distribuídos em ${bugsByTask.size} tarefa(s) diferentes.`
  );

  // Identificar padrões básicos
  const severities = failedTests.map(ft => determineSeverity(ft.testCase));
  const criticalCount = severities.filter(s => s === 'Crítico').length;
  const highCount = severities.filter(s => s === 'Alto').length;

  if (criticalCount > 0 || highCount > 0) {
    lines.push(
      `Identificados ${criticalCount} bug(s) crítico(s) e ${highCount} bug(s) de alta severidade que requerem atenção imediata.`
    );
  }

  lines.push('');
  lines.push(
    'Recomenda-se priorizar a correção dos bugs críticos e de alta severidade antes do próximo release.'
  );
  lines.push('');
  lines.push('');

  // Análise dos Bugs (agrupada)
  lines.push('ANÁLISE DOS BUGS');
  lines.push('----------------');
  lines.push('');

  // Agrupar por tarefa
  bugsByTask.forEach((bugs, taskId) => {
    const task = bugs[0].task;
    const severitiesInGroup = bugs.map(ft => determineSeverity(ft.testCase));
    const maxSeverity = severitiesInGroup.includes('Crítico')
      ? 'Crítico'
      : severitiesInGroup.includes('Alto')
        ? 'Alto'
        : severitiesInGroup.includes('Médio')
          ? 'Médio'
          : 'Baixo';

    lines.push(`Grupo: ${task.title || taskId}`);
    lines.push(`- Quantidade: ${bugs.length} bug(s)`);
    lines.push(`- Severidade: ${maxSeverity}`);
    lines.push(`- Tarefa: ${taskId}`);
    lines.push(
      `- Impacto no Negócio: ${bugs.length > 1 ? 'Múltiplos bugs afetam esta funcionalidade' : 'Bug isolado que pode impactar a funcionalidade'}`
    );
    lines.push('');

    if (bugs.some(ft => ft.testCase.observedResult)) {
      const observedResults = bugs
        .map(ft => ft.testCase.observedResult)
        .filter(r => r && r.trim())
        .join('; ');
      if (observedResults) {
        lines.push(
          `- Resultado Observado: ${observedResults.substring(0, 200)}${observedResults.length > 200 ? '...' : ''}`
        );
        lines.push('');
      }
    }

    lines.push(
      `- Recomendação: ${maxSeverity === 'Crítico' || maxSeverity === 'Alto' ? 'Correção urgente antes do release' : 'Incluir na próxima sprint'}`
    );
    lines.push('');
    lines.push('');
  });

  // Priorização
  lines.push('PRIORIZAÇÃO');
  lines.push('-----------');
  lines.push(
    'Recomenda-se priorizar a correção dos bugs de acordo com a severidade e impacto no negócio.'
  );
  if (criticalCount > 0) {
    lines.push(`Bugs críticos (${criticalCount}) devem ser corrigidos imediatamente.`);
  }
  if (highCount > 0) {
    lines.push(
      `Bugs de alta severidade (${highCount}) devem ser corrigidos antes do próximo release.`
    );
  }
  lines.push('');
  lines.push('');

  // Próximos Passos
  lines.push('PRÓXIMOS PASSOS');
  lines.push('---------------');
  lines.push('1. Revisar e validar os bugs identificados');
  lines.push('2. Priorizar bugs de acordo com severidade e impacto no negócio');
  lines.push('3. Atribuir bugs ao time de desenvolvimento');
  lines.push('4. Acompanhar correção e validação dos bugs');
  lines.push('');

  return lines.join('\n');
}

/**
 * Determina severidade baseada em critérios do teste
 */
function determineSeverity(testCase: TestCase): 'Crítico' | 'Alto' | 'Médio' | 'Baixo' {
  const priority = testCase.priority;

  if (priority === 'Urgente') return 'Crítico';
  if (priority === 'Alta') return 'Alto';
  if (priority === 'Média') return 'Médio';
  return 'Baixo';
}
