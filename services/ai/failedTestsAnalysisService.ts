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
        toolsUsed: ft.testCase.toolsUsed || []
      };
    });

    const projectContext = {
      name: project.name,
      description: project.description || '',
      totalFailedTests: failedTests.length,
      affectedTasks: Array.from(new Set(failedTests.map(ft => ft.task.id))).length
    };

    const prompt = `Você é um QA Sênior experiente e precisa apresentar um relatório profissional de bugs encontrados para o Product Owner (PO).

CONTEXTO DO PROJETO:
- Nome: ${projectContext.name}
- Descrição: ${projectContext.description}
- Total de Testes Reprovados: ${projectContext.totalFailedTests}
- Tarefas Afetadas: ${projectContext.affectedTasks}

TESTES REPROVADOS:
${JSON.stringify(testsData, null, 2)}

INSTRUÇÕES:
1. Analise cada teste reprovado e estruture como um bug profissional
2. Determine a severidade de cada bug (Crítico, Alto, Médio, Baixo) baseado em:
   - Impacto no negócio
   - Frequência de uso da funcionalidade
   - Bloqueio de outras funcionalidades
   - Experiência do usuário
3. Para cada bug, forneça:
   - Título claro e objetivo
   - Severidade
   - Impacto no negócio (em linguagem que o PO entenda)
   - Descrição técnica (para o time de desenvolvimento)
   - Passos para reproduzir (baseado nos steps do teste)
   - Comparação entre resultado esperado vs observado
   - Recomendação de ação
4. Priorize os bugs em ordem de correção
5. Forneça um resumo executivo para o PO
6. Sugira próximos passos para o time

FORMATO DE SAÍDA:
Gere um relatório em português, estruturado e profissional, seguindo este formato:

RELATÓRIO DE BUGS ENCONTRADOS - ANÁLISE QA SÊNIOR
==================================================

RESUMO EXECUTIVO
----------------
[Resumo para o PO sobre impacto geral, quantidade de bugs, áreas afetadas, impacto no negócio]

BUGS IDENTIFICADOS
------------------

[Para cada bug, estruture assim:]

1. [Título do Bug]
   - Severidade: [Crítico/Alto/Médio/Baixo]
   - Impacto no Negócio: [Descrição clara do impacto, em linguagem de negócio]
   - Descrição Técnica: [Detalhes técnicos para o time de desenvolvimento]
   - Passos para Reproduzir:
     1. [Passo 1]
     2. [Passo 2]
     ...
   - Resultado Esperado: [O que deveria acontecer]
   - Resultado Observado: [O que realmente aconteceu]
   - Recomendação: [Ação sugerida - ex: "Correção urgente antes do release", "Incluir na próxima sprint", etc.]

PRIORIZAÇÃO
-----------
[Recomendações de ordem de correção, explicando o porquê de cada prioridade]

PRÓXIMOS PASSOS
---------------
1. [Ação sugerida 1]
2. [Ação sugerida 2]
...

IMPORTANTE:
- Use linguagem clara e profissional
- Foque no impacto no negócio para o PO
- Seja específico e acionável
- Priorize bugs críticos e de alto impacto
- Forneça contexto suficiente para tomada de decisão`;

    // Usar Gemini diretamente via callGeminiWithRetry
    try {
      const response = await callGeminiWithRetry({
        model: 'gemini-2.0-flash-exp',
        contents: prompt
      });
      
      return response.text.trim();
    } catch (error) {
      logger.warn('Erro ao gerar análise com IA. Usando análise estruturada manual.', 'failedTestsAnalysisService', error);
      return generateManualAnalysis(project, failedTests);
    }
  } catch (error) {
    logger.error('Erro ao gerar análise IA de testes reprovados', 'failedTestsAnalysisService', error);
    // Fallback para análise manual
    return generateManualAnalysis(project, failedTests);
  }
}

/**
 * Gera análise manual estruturada quando IA não está disponível
 */
function generateManualAnalysis(
  project: Project,
  failedTests: FailedTestWithTask[]
): string {
  const lines: string[] = [];
  
  lines.push('RELATÓRIO DE BUGS ENCONTRADOS - ANÁLISE QA SÊNIOR');
  lines.push('==================================================');
  lines.push('');
  lines.push('');
  
  // Resumo Executivo
  lines.push('RESUMO EXECUTIVO');
  lines.push('----------------');
  lines.push(`Durante a execução dos testes do projeto "${project.name}", foram identificados ${failedTests.length} teste(s) reprovado(s).`);
  lines.push(`Estes testes afetam ${Array.from(new Set(failedTests.map(ft => ft.task.id))).length} tarefa(s) do projeto.`);
  lines.push('');
  lines.push('Recomenda-se uma análise detalhada de cada bug identificado para determinar a prioridade de correção e o impacto no negócio.');
  lines.push('');
  lines.push('');
  
  // Bugs Identificados
  lines.push('BUGS IDENTIFICADOS');
  lines.push('------------------');
  lines.push('');
  
  failedTests.forEach((ft, index) => {
    const severity = determineSeverity(ft.testCase);
    const priority = ft.testCase.priority || 'Média';
    
    lines.push(`${index + 1}. ${ft.testCase.description || `Bug na tarefa ${ft.task.id}`}`);
    lines.push(`   - Severidade: ${severity}`);
    lines.push(`   - Prioridade: ${priority}`);
    lines.push(`   - Tarefa: ${ft.task.id} - ${ft.task.title || 'Sem título'}`);
    lines.push(`   - Ambiente: ${ft.testCase.testEnvironment || 'Não especificado'}`);
    lines.push('');
    
    if (ft.testCase.steps && ft.testCase.steps.length > 0) {
      lines.push('   Passos para Reproduzir:');
      ft.testCase.steps.forEach((step, stepIndex) => {
        lines.push(`     ${stepIndex + 1}. ${step}`);
      });
      lines.push('');
    }
    
    if (ft.testCase.expectedResult) {
      lines.push(`   Resultado Esperado: ${ft.testCase.expectedResult}`);
    }
    
    if (ft.testCase.observedResult) {
      lines.push(`   Resultado Observado: ${ft.testCase.observedResult}`);
    }
    
    lines.push('');
    lines.push('');
  });
  
  // Priorização
  lines.push('PRIORIZAÇÃO');
  lines.push('-----------');
  lines.push('Recomenda-se priorizar a correção dos bugs de acordo com a severidade e impacto no negócio.');
  lines.push('Bugs críticos e de alta prioridade devem ser corrigidos antes do próximo release.');
  lines.push('');
  lines.push('');
  
  // Próximos Passos
  lines.push('PRÓXIMOS PASSOS');
  lines.push('---------------');
  lines.push('1. Revisar e validar cada bug identificado');
  lines.push('2. Priorizar bugs de acordo com impacto no negócio');
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

