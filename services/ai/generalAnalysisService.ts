import { GoogleGenAI, Type } from "@google/genai";
import { Project, GeneralIAAnalysis, TaskIAAnalysis, TestIAAnalysis, JiraTask } from '../../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.warn("GEMINI_API_KEY environment variable not set. Some features may not work.");
}

const getAI = () => {
  if (!ai) {
    throw new Error("GEMINI_API_KEY não configurada. Por favor, configure a variável de ambiente VITE_GEMINI_API_KEY.");
  }
  return ai;
};

const generalAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "Um resumo geral consolidado de todas as tarefas e testes do projeto, destacando pontos principais, status geral e recomendações estratégicas."
    },
    detectedProblems: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Lista de problemas críticos detectados em todo o projeto (ex: falta de testes, tarefas sem descrição, riscos de qualidade)."
    },
    riskCalculation: {
      type: Type.OBJECT,
      properties: {
        overallRisk: {
          type: Type.STRING,
          enum: ['Baixo', 'Médio', 'Alto', 'Crítico'],
          description: "Nível de risco geral do projeto baseado em todas as análises."
        },
        riskScore: {
          type: Type.NUMBER,
          description: "Score de risco numérico de 0 a 100, onde 0 é sem risco e 100 é risco crítico."
        },
        riskFactors: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              factor: { type: Type.STRING, description: "Nome do fator de risco identificado." },
              impact: {
                type: Type.STRING,
                enum: ['Baixo', 'Médio', 'Alto'],
                description: "Impacto deste fator no projeto."
              },
              description: { type: Type.STRING, description: "Descrição detalhada do fator de risco." }
            },
            required: ['factor', 'impact', 'description']
          },
          description: "Lista de fatores de risco identificados no projeto."
        }
      },
      required: ['overallRisk', 'riskScore', 'riskFactors']
    },
    missingItems: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Lista de itens faltantes ou incompletos no projeto (ex: testes não criados, documentação ausente, cenários BDD faltantes)."
    },
    bddSuggestions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          taskId: { type: Type.STRING, description: "ID da tarefa que precisa de cenários BDD." },
          taskTitle: { type: Type.STRING, description: "Título da tarefa." },
          scenarios: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Lista de cenários BDD sugeridos em formato Gherkin."
          }
        },
        required: ['taskId', 'taskTitle', 'scenarios']
      },
      description: "Sugestões de cenários BDD para tarefas que ainda não os possuem ou precisam de mais."
    },
    qaImprovements: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Lista de melhorias de QA recomendadas para o projeto como um todo."
    },
    taskAnalyses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          taskId: { type: Type.STRING },
          summary: { type: Type.STRING, description: "Resumo da análise da tarefa." },
          detectedProblems: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Problemas específicos detectados nesta tarefa."
          },
          riskLevel: {
            type: Type.STRING,
            enum: ['Baixo', 'Médio', 'Alto', 'Crítico'],
            description: "Nível de risco desta tarefa específica."
          },
          riskScore: {
            type: Type.NUMBER,
            description: "Score de risco de 0 a 100 para esta tarefa."
          },
          missingItems: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Itens faltantes específicos desta tarefa."
          },
          bddSuggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Sugestões de cenários BDD para esta tarefa."
          },
          qaImprovements: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Melhorias de QA específicas para esta tarefa."
          }
        },
        required: ['taskId', 'summary', 'detectedProblems', 'riskLevel', 'riskScore', 'missingItems', 'bddSuggestions', 'qaImprovements']
      },
      description: "Análises individuais detalhadas para cada tarefa do projeto."
    },
    testAnalyses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          testId: { type: Type.STRING },
          taskId: { type: Type.STRING },
          summary: { type: Type.STRING, description: "Resumo da análise do teste." },
          coverage: { type: Type.STRING, description: "Avaliação da cobertura e qualidade do teste." },
          detectedProblems: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Problemas detectados neste teste específico."
          },
          suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Sugestões de melhoria para este teste."
          }
        },
        required: ['testId', 'taskId', 'summary', 'coverage', 'detectedProblems', 'suggestions']
      },
      description: "Análises individuais detalhadas para cada teste do projeto."
    }
  },
  required: ['summary', 'detectedProblems', 'riskCalculation', 'missingItems', 'bddSuggestions', 'qaImprovements', 'taskAnalyses', 'testAnalyses']
};

/**
 * Gera uma análise geral consolidada de todas as tarefas e testes do projeto
 */
export async function generateGeneralIAAnalysis(project: Project): Promise<GeneralIAAnalysis> {
  try {
    // Preparar dados das tarefas para análise
    const tasksData = project.tasks.map(task => {
      const testCasesCount = task.testCases?.length || 0;
      const testCasesStatus = task.testCases?.map(tc => tc.status) || [];
      const bddScenariosCount = task.bddScenarios?.length || 0;
      const hasTestStrategy = (task.testStrategy?.length || 0) > 0;

      return {
        id: task.id,
        title: task.title,
        description: task.description || '',
        status: task.status,
        type: task.type,
        testCasesCount,
        testCasesStatus,
        bddScenariosCount,
        hasTestStrategy,
        hasDescription: !!task.description && task.description.trim().length > 0
      };
    });

    // Preparar dados dos testes
    const testsData = project.tasks.flatMap(task =>
      (task.testCases || []).map(testCase => ({
        id: testCase.id,
        taskId: task.id,
        taskTitle: task.title,
        description: testCase.description,
        status: testCase.status,
        steps: testCase.steps?.length || 0,
        expectedResult: testCase.expectedResult || '',
        isAutomated: testCase.isAutomated || false
      }))
    );

    const tasksSummary = tasksData.map(t => 
      `- ${t.id} (${t.type}): ${t.title} | Status: ${t.status} | Testes: ${t.testCasesCount} | BDD: ${t.bddScenariosCount}`
    ).join('\n');

    const testsSummary = testsData.map(t => 
      `- ${t.id} (Tarefa: ${t.taskTitle}): ${t.description} | Status: ${t.status} | Automatizado: ${t.isAutomated}`
    ).join('\n');

    const prompt = `
Aja como um especialista sênior em QA e análise de projetos de software. Analise o projeto completo abaixo e forneça uma análise consolidada e detalhada.

PROJETO: ${project.name}
DESCRIÇÃO: ${project.description || 'Sem descrição'}

TAREFAS DO PROJETO (${tasksData.length} total):
${tasksSummary}

TESTES DO PROJETO (${testsData.length} total):
${testsSummary || 'Nenhum teste encontrado'}

INSTRUÇÕES:
1. Analise TODAS as tarefas e testes fornecidos
2. Identifique problemas críticos, riscos e oportunidades de melhoria
3. Calcule o risco geral do projeto baseado em:
   - Tarefas sem testes ou com poucos testes
   - Testes não executados ou falhando
   - Falta de cenários BDD
   - Tarefas sem descrição adequada
   - Falta de estratégia de testes
4. Para cada tarefa, forneça uma análise individual detalhada incluindo:
   - Resumo da tarefa
   - Problemas detectados
   - Nível de risco (Baixo, Médio, Alto, Crítico) e score (0-100)
   - Itens faltantes
   - Sugestões de cenários BDD (se aplicável)
   - Melhorias de QA específicas
5. Para cada teste, forneça uma análise individual incluindo:
   - Resumo do teste
   - Avaliação de cobertura
   - Problemas detectados
   - Sugestões de melhoria
6. Gere sugestões de cenários BDD para tarefas que precisam deles
7. Forneça melhorias de QA gerais para o projeto

IMPORTANTE: 
- Seja específico e acionável em todas as recomendações
- Priorize tarefas e testes com maior risco
- Considere o contexto completo do projeto
- Retorne APENAS um objeto JSON válido conforme o schema definido
`;

    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: generalAnalysisSchema,
      },
    });

    const parsedResponse = JSON.parse(response.text.trim());

    // Adicionar metadados e garantir estrutura correta
    const analysis: GeneralIAAnalysis = {
      summary: parsedResponse.summary || 'Análise geral do projeto.',
      detectedProblems: parsedResponse.detectedProblems || [],
      riskCalculation: {
        overallRisk: parsedResponse.riskCalculation?.overallRisk || 'Médio',
        riskScore: parsedResponse.riskCalculation?.riskScore || 50,
        riskFactors: parsedResponse.riskCalculation?.riskFactors || []
      },
      missingItems: parsedResponse.missingItems || [],
      bddSuggestions: parsedResponse.bddSuggestions || [],
      qaImprovements: parsedResponse.qaImprovements || [],
      taskAnalyses: (parsedResponse.taskAnalyses || []).map((ta: any): TaskIAAnalysis => ({
        taskId: ta.taskId,
        summary: ta.summary || 'Análise da tarefa.',
        detectedProblems: ta.detectedProblems || [],
        riskLevel: ta.riskLevel || 'Médio',
        riskScore: ta.riskScore || 50,
        missingItems: ta.missingItems || [],
        bddSuggestions: ta.bddSuggestions || [],
        qaImprovements: ta.qaImprovements || [],
        generatedAt: new Date().toISOString(),
        isOutdated: false
      })),
      testAnalyses: (parsedResponse.testAnalyses || []).map((ta: any): TestIAAnalysis => ({
        testId: ta.testId,
        taskId: ta.taskId,
        summary: ta.summary || 'Análise do teste.',
        coverage: ta.coverage || 'Cobertura não avaliada.',
        detectedProblems: ta.detectedProblems || [],
        suggestions: ta.suggestions || [],
        generatedAt: new Date().toISOString(),
        isOutdated: false
      })),
      generatedAt: new Date().toISOString(),
      isOutdated: false
    };

    return analysis;
  } catch (error) {
    console.error("Error generating general IA analysis:", error);
    throw new Error("Falha ao gerar análise geral de IA. Verifique a configuração da API e tente novamente.");
  }
}

