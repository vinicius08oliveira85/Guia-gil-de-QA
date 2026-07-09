import type { Project } from '../../types';
import type { TaskAiContext } from './taskAiContext';
import { buildComplementaryDocumentSection } from './testGenerationPrompts';
import { formatDevStackForPrompt } from '../../utils/devStackFormat';

export const DEV_GUIDANCE_JSON_FOOTER =
  'Responda somente com JSON válido no formato do schema solicitado.';

export async function buildDevGuidancePrompt(
  ctx: TaskAiContext,
  project: Project | null | undefined
): Promise<string> {
  const stackBlock = formatDevStackForPrompt(project?.settings?.devStack);
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
2. Alinhe passos, módulos e contratos à stack configurada acima.
3. Use as regras de negócio vinculadas; não invente escopo fora delas.
4. Inclua passos ordenados, arquivos/módulos sugeridos, dicas de código quando útil e checklist de validação por passo.
5. Sugira testes que o desenvolvedor deve escrever (lista curta), sem formato de caso de teste QA.
6. Responda em português brasileiro.${imageNote}

${DEV_GUIDANCE_JSON_FOOTER}
`.trim();
}
