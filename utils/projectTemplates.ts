import { Project, PhaseName } from '../types';
import { PHASE_NAMES } from './constants';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Web' | 'Mobile' | 'API' | 'E2E' | 'Performance' | 'Segurança' | 'Geral';
  phases: Partial<Record<PhaseName, { summary: string; testTypes: string[] }>>;
  defaultTasks: Array<{
    title: string;
    description: string;
    type: 'Epic' | 'História' | 'Tarefa';
  }>;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'web-app',
    name: 'Aplicação Web',
    description:
      'Template para projetos de aplicações web com foco em testes funcionais e de usabilidade',
    category: 'Web',
    phases: {
      Request: {
        summary:
          'Coleta e análise de requisitos para aplicação web. Foco em entender funcionalidades, fluxos de usuário e requisitos não-funcionais.',
        testTypes: ['Análise de Requisitos', 'Validação de User Stories'],
      },
      Analysis: {
        summary:
          'Análise detalhada dos requisitos, identificação de casos de uso e definição de critérios de aceitação.',
        testTypes: ['Análise de Casos de Uso', 'Definição de Critérios de Aceitação'],
      },
      Design: {
        summary:
          'Design de testes baseado em wireframes e mockups. Planejamento de testes de usabilidade e acessibilidade.',
        testTypes: ['Teste de Usabilidade', 'Teste de Acessibilidade', 'Teste de Design'],
      },
      Test: {
        summary:
          'Execução de testes funcionais, de integração, usabilidade e regressão para aplicação web.',
        testTypes: [
          'Teste Funcional',
          'Teste de Integração',
          'Teste de Regressão',
          'Teste de Usabilidade',
        ],
      },
    },
    defaultTasks: [
      {
        title: 'Testar fluxo de autenticação',
        description: 'Validar login, logout, recuperação de senha e gestão de sessão',
        type: 'História',
      },
      {
        title: 'Testar responsividade',
        description:
          'Garantir que a aplicação funciona corretamente em diferentes tamanhos de tela',
        type: 'Tarefa',
      },
      {
        title: 'Testar compatibilidade de navegadores',
        description: 'Validar funcionamento em Chrome, Firefox, Safari e Edge',
        type: 'Tarefa',
      },
    ],
  },
  {
    id: 'mobile-app',
    name: 'Aplicativo Mobile',
    description:
      'Template para projetos mobile com foco em testes em diferentes dispositivos e sistemas operacionais',
    category: 'Mobile',
    phases: {
      Test: {
        summary:
          'Testes específicos para mobile: gestos, orientação, performance em diferentes dispositivos e sistemas operacionais.',
        testTypes: [
          'Teste de Dispositivos',
          'Teste de Gestos',
          'Teste de Performance Mobile',
          'Teste de Compatibilidade',
        ],
      },
    },
    defaultTasks: [
      {
        title: 'Testar em diferentes dispositivos',
        description: 'Validar funcionamento em iOS e Android, diferentes tamanhos de tela',
        type: 'História',
      },
      {
        title: 'Testar gestos e interações',
        description: 'Validar swipe, pinch, tap e outras interações touch',
        type: 'Tarefa',
      },
      {
        title: 'Testar offline/online',
        description: 'Validar comportamento quando há perda de conexão',
        type: 'Tarefa',
      },
    ],
  },
  {
    id: 'api-testing',
    name: 'API Testing',
    description: 'Template focado em testes de API REST/GraphQL',
    category: 'API',
    phases: {
      Test: {
        summary:
          'Testes de API incluindo validação de contratos, performance, segurança e integração.',
        testTypes: [
          'Teste de Contrato',
          'Teste de Performance',
          'Teste de Segurança',
          'Teste de Integração',
        ],
      },
    },
    defaultTasks: [
      {
        title: 'Validar contratos de API',
        description: 'Garantir que os contratos estão corretos e versionados',
        type: 'História',
      },
      {
        title: 'Testar autenticação e autorização',
        description: 'Validar tokens, permissões e segurança',
        type: 'Tarefa',
      },
      {
        title: 'Testar performance e carga',
        description: 'Validar tempo de resposta e capacidade de carga',
        type: 'Tarefa',
      },
    ],
  },
  {
    id: 'e2e-testing',
    name: 'Testes End-to-End',
    description: 'Template para automação de testes E2E',
    category: 'E2E',
    phases: {
      'Analysis and Code': {
        summary: 'Desenvolvimento de scripts de automação E2E e framework de testes.',
        testTypes: ['Automação E2E', 'Desenvolvimento de Scripts'],
      },
      Test: {
        summary: 'Execução de testes E2E automatizados em pipeline CI/CD.',
        testTypes: ['Teste E2E Automatizado', 'Teste de Regressão Automatizado'],
      },
    },
    defaultTasks: [
      {
        title: 'Configurar framework de automação',
        description: 'Setup de Cypress, Playwright ou Selenium',
        type: 'Tarefa',
      },
      {
        title: 'Criar scripts de teste críticos',
        description: 'Automatizar fluxos principais da aplicação',
        type: 'História',
      },
    ],
  },
  {
    id: 'performance',
    name: 'Testes de Performance',
    description: 'Template para testes de carga, stress e performance',
    category: 'Performance',
    phases: {
      Test: {
        summary: 'Testes de performance, carga, stress e capacidade do sistema.',
        testTypes: [
          'Teste de Carga',
          'Teste de Stress',
          'Teste de Capacidade',
          'Análise de Performance',
        ],
      },
    },
    defaultTasks: [
      {
        title: 'Definir cenários de carga',
        description: 'Identificar cenários críticos para testes de performance',
        type: 'História',
      },
      {
        title: 'Configurar ferramentas de performance',
        description: 'Setup de JMeter, K6 ou similar',
        type: 'Tarefa',
      },
    ],
  },
  {
    id: 'security',
    name: 'Testes de Segurança',
    description: 'Template para testes de segurança e vulnerabilidades',
    category: 'Segurança',
    phases: {
      Test: {
        summary:
          'Testes de segurança incluindo OWASP Top 10, vulnerabilidades e validação de segurança.',
        testTypes: ['Teste de Segurança', 'Análise de Vulnerabilidades', 'Teste de Penetração'],
      },
    },
    defaultTasks: [
      {
        title: 'Validar OWASP Top 10',
        description: 'Testar vulnerabilidades mais comuns',
        type: 'História',
      },
      {
        title: 'Testar autenticação e autorização',
        description: 'Validar segurança de acesso',
        type: 'Tarefa',
      },
    ],
  },
];

export const createProjectFromTemplate = (
  templateId: string,
  projectName: string,
  description: string
): Project => {
  const template = PROJECT_TEMPLATES.find(t => t.id === templateId);

  if (!template) {
    throw new Error(`Template ${templateId} não encontrado`);
  }

  const phases = PHASE_NAMES.map(name => {
    const templatePhase = template.phases[name];
    return {
      name,
      status: templatePhase ? ('Em Andamento' as const) : ('Não Iniciado' as const),
      summary: templatePhase?.summary,
      testTypes: templatePhase?.testTypes,
    };
  });

  const tasks = template.defaultTasks.map((task, index) => ({
    id: `${templateId.toUpperCase()}-${index + 1}`,
    title: task.title,
    description: task.description,
    type: task.type,
    status: 'To Do' as const,
    testCases: [],
    bddScenarios: [],
    createdAt: new Date().toISOString(),
    owner: 'QA' as const,
    assignee: 'QA' as const,
  }));

  return {
    id: `proj-${Date.now()}`,
    name: projectName,
    description: description || template.description,
    documents: [],
    tasks,
    phases,
  };
};
