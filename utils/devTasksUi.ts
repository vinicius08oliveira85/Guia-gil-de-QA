/** Textos e rótulos da aba de tarefas em projetos Dev (sem vocabulário de QA). */
export const DEV_TASKS_COPY = {
  eyebrow: 'Projeto · Tarefas & Implementação',
  title: 'Tarefas & Implementação',
  subtitle:
    'Acompanhe o backlog e use a IA para obter guias de implementação com prompts prontos para o Agente do Cursor, alinhados à stack do projeto.',
  pageAriaLabel: 'Tarefas e implementação do projeto',
  backlogAriaLabel: 'Tarefas de implementação — backlog do projeto',
  aiButtonLabel: 'Assistência Dev com IA',
  aiButtonAnalyzingLabel: 'Analisando…',
  aiButtonTooltip:
    'Analisa o projeto (stack, backlog técnico e riscos) e pode gerar guias de implementação para tarefas que ainda não têm guia.',
  aiMobileMenuLabel: 'Assistência Dev com IA',
  exploreSectionDesc:
    'Alterne entre todas as tarefas e o backlog, filtre por sprint e busque por ID ou título para priorizar a implementação.',
  listSectionDesc:
    'Todas as tarefas do projeto com filtros e ações em lote. Abra uma tarefa para copiar prompts do Agente do Cursor.',
} as const;

export const DEV_GUIDANCE_QUALITY_FILTERS = [
  { id: 'with-guidance', label: 'Com guia IA' },
  { id: 'without-guidance', label: 'Sem guia IA' },
] as const;
