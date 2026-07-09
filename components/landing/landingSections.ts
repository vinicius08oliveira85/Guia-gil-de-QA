import type { ProjectWorkflow } from '../../types';
import {
  PROJECT_WORKFLOW_DESCRIPTIONS,
  PROJECT_WORKFLOW_LABELS,
} from '../../utils/projectWorkflow';

/** Metadados das seções acessíveis pelos cards da LandingPage. */
export const LANDING_SECTIONS = {
  projectsQa: {
    title: PROJECT_WORKFLOW_LABELS.qa,
    description: PROJECT_WORKFLOW_DESCRIPTIONS.qa,
    badge: 'QA',
    workflow: 'qa' as const satisfies ProjectWorkflow,
  },
  projectsDev: {
    title: PROJECT_WORKFLOW_LABELS.dev,
    description: PROJECT_WORKFLOW_DESCRIPTIONS.dev,
    badge: 'Dev',
    workflow: 'dev' as const satisfies ProjectWorkflow,
  },
  jiraSolus: {
    title: 'Acompanhamento',
    description: 'Acompanhe tarefas com status, SLA e indicadores de progresso.',
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
    'Projetos QA e Dev, dossiês de regras e acompanhamento Jira × Solus em um só lugar.',
} as const;

/** Versão exibida no rodapé da home (alinhar ao package.json quando possível). */
export const APP_VERSION = '0.0.0';
