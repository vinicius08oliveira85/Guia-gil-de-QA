import type { Project } from '../../types';
import type { TaskAiContext } from './taskAiContext';
import { buildComplementaryDocumentSection } from './testGenerationPrompts';
import { formatDevStackForPrompt } from '../../utils/devStackFormat';
import { formatLatestDevProjectAnalysisForPrompt } from '../../utils/devProjectAnalysisFormat';

export const DEV_GUIDANCE_JSON_FOOTER =
  'Responda somente com JSON válido no formato do schema solicitado.';

export async function buildDevGuidancePrompt(
  ctx: TaskAiContext,
  project: Project | null | undefined
): Promise<string> {
  const stackBlock = formatDevStackForPrompt(project?.settings?.devStack);
  const devAnalysisBlock = formatLatestDevProjectAnalysisForPrompt(
    project?.devProjectFullAnalyses
  );
  const docSection = await buildComplementaryDocumentSection(project);
  const rulesPart = ctx.businessRulesBlock.trim()
    ? `\n\n### REGRAS DE NEGÓCIO APLICÁVEIS ###\n${ctx.businessRulesBlock}\n`
    : '\n\n### REGRAS DE NEGÓCIO APLICÁVEIS ###\n(nenhuma regra vinculada)\n';

  const imageNote =
    ctx.imageParts.length > 0
      ? ' Analise imagens anexadas (telas, fluxos, campos visíveis).'
      : '';

  return `
Você é um arquiteto/desenvolvedor sênior mentorando a implementação de uma tarefa.

### STACK DO PROJETO ###
${stackBlock}

### ANÁLISE DEV DO PROJETO (mais recente) ###
${devAnalysisBlock}

### CONTEXTO DA TAREFA ###
Título: ${ctx.title}
Tipo: ${ctx.taskType ?? 'Tarefa'}
Descrição:
${ctx.description}

Formulários anexados:
${ctx.attachedFormsContext}
${rulesPart}
${docSection ? `\n### DOCUMENTAÇÃO COMPLEMENTAR ###\n${docSection}\n` : ''}

INSTRUÇÕES:
1. Gere um GUIA DE IMPLEMENTAÇÃO prático para o desenvolvedor — não gere casos de teste formais (isso é fluxo QA).
2. O desenvolvedor SEMPRE implementa código com o **Agente do Cursor (Cursor AI)**. Cada passo deve incluir um prompt pronto para colar no chat do Agente.
3. Alinhe passos, módulos e contratos à stack configurada acima e ao backlog/riscos da análise Dev do projeto quando disponível.
4. Use as regras de negócio vinculadas; não invente escopo fora delas.
5. Inclua passos ordenados, arquivos/módulos sugeridos, dicas de código quando útil e checklist de validação por passo.
6. Sugira testes que o desenvolvedor deve escrever (lista curta), sem formato de caso de teste QA.
7. Para CADA item em implementationSteps, inclua obrigatoriamente:
   - cursorAgentAction: "create" (arquivo/módulo novo), "modify" (alterar existente) ou "delete" (remover código/arquivo).
   - cursorAgentPrompt: prompt completo em português, auto-suficiente, pronto para colar no Agente do Cursor. Deve:
     * Começar indicando a ação (criar, modificar ou excluir) e os caminhos de arquivo afetados.
     * Descrever o comportamento esperado, stack, regras de negócio relevantes e critérios de conclusão.
     * Pedir que o agente siga convenções do projeto e não altere arquivos fora do escopo do passo.
     * Ser imperativo e específico — o agente não terá outro contexto além deste prompt.
8. Inclua cursorAgentMasterPrompt: um único prompt consolidado para implementar a tarefa inteira em uma sessão do Agente do Cursor (referenciando os passos na ordem, sem repetir texto desnecessário).
9. Responda em português brasileiro.${imageNote}

${DEV_GUIDANCE_JSON_FOOTER}
`.trim();
}
