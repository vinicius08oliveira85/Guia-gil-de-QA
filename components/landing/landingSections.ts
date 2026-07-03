/** Metadados das seções acessíveis pelos cards da LandingPage. */
export const LANDING_SECTIONS = {
  projects: {
    title: 'Projetos',
    description: 'Gerencie projetos, tarefas, casos de teste e dossiês de regras de negócio.',
    badge: 'Principal',
  },
  jiraSolus: {
    title: 'Acompanhamento',
    description:
      'Acompanhe tarefas com status, SLA e indicadores de progresso (Jira × Solus).',
  },
  settings: {
    title: 'Configurações',
    description: 'Jira, Gemini, pasta local e preferências do app.',
  },
} as const;

export const APP_BRAND = {
  title: 'QA Agile Guide',
  subtitle: 'Gestão de QA ágil, métricas e automação',
  tagline:
    'Projetos, casos de teste, dossiês de regras e acompanhamento Jira × Solus em um só lugar.',
} as const;

/** Versão exibida no rodapé da home (alinhar ao package.json quando possível). */
export const APP_VERSION = '0.0.0';
