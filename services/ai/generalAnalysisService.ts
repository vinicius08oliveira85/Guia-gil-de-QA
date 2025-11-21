import { Project, GeneralIAAnalysis, TaskIAAnalysis, TestIAAnalysis } from '../../types';
import { getAIService } from './aiServiceFactory';
import { getAI, Type } from '@google/genai';

/**
 * Gera uma análise geral consolidada de todas as tarefas e testes do projeto
 */
export const generateGeneralIAAnalysis = async (project: Project): Promise<GeneralIAAnalysis> => {
  // Coletar todas as tarefas
  const allTasks = project.tasks;
  const tasksWithoutAnalysis = allTasks.filter(t => !t.iaAnalysis);
  
  // Coletar todos os testes
  const allTests = allTasks.flatMap(task => 
    task.testCases.map(tc => ({
      testId: tc.id,
      taskId: task.id,
      taskTitle: task.title,
      testCase: tc
    }))
  );

  // Preparar dados para o prompt
  const tasksSummary = allTasks.map(t => {
    const testCasesCount = t.testCases?.length || 0;
    const executedTests = t.testCases?.filter(tc => tc.status !== 'Not Run').length || 0;
    const failedTests = t.testCases?.filter(tc => tc.status === 'Failed').length || 0;
    
    return `- ${t.id}: ${t.title} (${t.status})
  Descrição: ${t.description.substring(0, 200)}...
  Tipo: ${t.type}
  Prioridade: ${t.priority || 'Não definida'}
  Testes: ${testCasesCount} total, ${executedTests} executados, ${failedTests} falharam
  BDD: ${t.bddScenarios?.length || 0} cenários
  Dependências: ${t.dependencies?.length || 0}`;
  }).join('\n');

  const testsSummary = allTests.map(t => {
    return `- Teste ${t.testId} (Tarefa: ${t.taskTitle})
  Descrição: ${t.testCase.description}
  Status: ${t.testCase.status}
  Automatizado: ${t.testCase.isAutomated ? 'Sim' : 'Não'}`;
  }).join('\n');

  const prompt = `
Você é um especialista sênior em QA e análise de projetos de software. Analise completamente o projeto abaixo e forneça uma análise consolidada detalhada.

PROJETO: ${project.name}
DESCRIÇÃO: ${project.description || 'Sem descrição'}

TAREFAS DO PROJETO (${allTasks.length} total, ${tasksWithoutAnalysis.length} sem análise):
${tasksSummary}

TESTES DO PROJETO (${allTests.length} total):
${testsSummary}

Sua resposta DEVE ser um objeto JSON válido com a seguinte estrutura:

{
  "summary": "Um resumo geral conciso (3-4 parágrafos) do estado atual do projeto, principais descobertas e recomendações gerais",
  "detectedProblems": ["Lista de problemas detectados", "Cada item deve ser específico e acionável"],
  "riskCalculation": {
    "overallRisk": "Baixo" | "Médio" | "Alto" | "Crítico",
    "riskScore": 0-100,
    "riskFactors": [
      {
        "factor": "Nome do fator de risco",
        "impact": "Baixo" | "Médio" | "Alto",
        "description": "Descrição detalhada do fator"
      }
    ]
  },
  "missingItems": ["Lista de itens faltantes ou incompletos", "Seja específico sobre o que está faltando"],
  "bddSuggestions": [
    {
      "taskId": "ID da tarefa",
      "taskTitle": "Título da tarefa",
      "scenarios": ["Cenário BDD sugerido 1", "Cenário BDD sugerido 2"]
    }
  ],
  "qaImprovements": ["Melhorias específicas de QA", "Cada item deve ser acionável"],
  "taskAnalyses": [
    {
      "taskId": "ID da tarefa",
      "summary": "Resumo da análise desta tarefa",
      "detectedProblems": ["Problemas específicos desta tarefa"],
      "riskLevel": "Baixo" | "Médio" | "Alto" | "Crítico",
      "riskScore": 0-100,
      "missingItems": ["Itens faltantes nesta tarefa"],
      "bddSuggestions": ["Sugestões BDD para esta tarefa"],
      "qaImprovements": ["Melhorias específicas para esta tarefa"]
    }
  ],
  "testAnalyses": [
    {
      "testId": "ID do teste",
      "taskId": "ID da tarefa",
      "summary": "Resumo da análise deste teste",
      "coverage": "Avaliação da cobertura e qualidade do teste",
      "detectedProblems": ["Problemas específicos deste teste"],
      "suggestions": ["Sugestões de melhoria para este teste"]
    }
  ]
}

IMPORTANTE:
- Seja específico e acionável em todas as recomendações
- Priorize problemas críticos e de alto risco
- Forneça análises para todas as tarefas sem análise prévia
- Analise todos os testes disponíveis
- Use português brasileiro
- Retorne APENAS o JSON, sem markdown, sem explicações adicionais
`;

  try {
    const aiService = getAIService();
    const provider = import.meta.env.VITE_OPENAI_API_KEY ? 'openai' : 'gemini';
    
    if (provider === 'gemini') {
      return await generateWithGemini(prompt);
    } else {
      return await generateWithOpenAI(prompt);
    }
  } catch (error) {
    console.error('Error generating general IA analysis:', error);
    throw new Error('Falha ao gerar análise geral com IA');
  }
};

async function generateWithGemini(prompt: string): Promise<GeneralIAAnalysis> {
  const generalAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
      summary: { type: Type.STRING },
      detectedProblems: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      riskCalculation: {
        type: Type.OBJECT,
        properties: {
          overallRisk: { type: Type.STRING, enum: ['Baixo', 'Médio', 'Alto', 'Crítico'] },
          riskScore: { type: Type.NUMBER },
          riskFactors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                factor: { type: Type.STRING },
                impact: { type: Type.STRING, enum: ['Baixo', 'Médio', 'Alto'] },
                description: { type: Type.STRING }
              },
              required: ['factor', 'impact', 'description']
            }
          }
        },
        required: ['overallRisk', 'riskScore', 'riskFactors']
      },
      missingItems: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      bddSuggestions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            taskId: { type: Type.STRING },
            taskTitle: { type: Type.STRING },
            scenarios: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['taskId', 'taskTitle', 'scenarios']
        }
      },
      qaImprovements: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      },
      taskAnalyses: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            taskId: { type: Type.STRING },
            summary: { type: Type.STRING },
            detectedProblems: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            riskLevel: { type: Type.STRING, enum: ['Baixo', 'Médio', 'Alto', 'Crítico'] },
            riskScore: { type: Type.NUMBER },
            missingItems: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            bddSuggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            qaImprovements: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['taskId', 'summary', 'detectedProblems', 'riskLevel', 'riskScore', 'missingItems', 'bddSuggestions', 'qaImprovements']
        }
      },
      testAnalyses: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            testId: { type: Type.STRING },
            taskId: { type: Type.STRING },
            summary: { type: Type.STRING },
            coverage: { type: Type.STRING },
            detectedProblems: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['testId', 'taskId', 'summary', 'coverage', 'detectedProblems', 'suggestions']
        }
      }
    },
    required: ['summary', 'detectedProblems', 'riskCalculation', 'missingItems', 'bddSuggestions', 'qaImprovements', 'taskAnalyses', 'testAnalyses']
  };

  try {
    const response = await getAI().models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: generalAnalysisSchema,
      },
    });

    const parsed = JSON.parse(response.text.trim());
    return {
      ...parsed,
      generatedAt: new Date().toISOString(),
      isOutdated: false
    };
  } catch (error) {
    console.error('Error with Gemini:', error);
    throw error;
  }
}

async function generateWithOpenAI(prompt: string): Promise<GeneralIAAnalysis> {
  // Para OpenAI, vamos usar o serviço existente através de uma chamada direta
  try {
    const OpenAI = (await import('openai')).default;
    
    const openaiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;
    if (!openaiKey) {
      throw new Error('OpenAI API key não configurada');
    }

    const openai = new OpenAI({ apiKey: openaiKey, dangerouslyAllowBrowser: true });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Você é um especialista sênior em garantia de qualidade de software (QA) e análise de projetos. Sempre responda em português brasileiro e retorne APENAS JSON válido."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("Resposta vazia da API OpenAI");
    }

    const parsed = JSON.parse(content);
    return {
      ...parsed,
      generatedAt: new Date().toISOString(),
      isOutdated: false
    };
  } catch (error) {
    console.error('Error with OpenAI:', error);
    throw error;
  }
}

