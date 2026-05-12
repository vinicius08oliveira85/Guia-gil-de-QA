import { TestCase } from '../types';

export interface TestCaseTemplate {
  id: string;
  name: string;
  description: string;
  category:
    | 'Functional'
    | 'Integration'
    | 'Performance'
    | 'Security'
    | 'Usability'
    | 'Regression'
    | 'Smoke'
    | 'E2E';
  testCase: Omit<TestCase, 'id' | 'status'>;
  tags: string[];
}

function stepsToAction(title: string, steps: string[]): string {
  const numbered = steps.map((s, i) => `${i + 1}. ${s}`).join('\n');
  return `${title}\n\n${numbered}`;
}

export const TEST_CASE_TEMPLATES: TestCaseTemplate[] = [
  {
    id: 'login-flow',
    name: 'Fluxo de Login',
    description: 'Template para testes de autenticação e login',
    category: 'Functional',
    tags: ['autenticação', 'login', 'crítico'],
    testCase: {
      action: stepsToAction('Validar login com credenciais válidas', [
        'Acessar a página de login',
        'Inserir email válido',
        'Inserir senha válida',
        'Clicar em "Entrar"',
      ]),
      parameters:
        'Conta de teste com permissões conhecidas; ambiente de homologação; navegador atualizado.',
      expectedResult: 'Usuário é autenticado e redirecionado para o dashboard',
      observedResult: '',
    },
  },
  {
    id: 'form-validation',
    name: 'Validação de Formulário',
    description: 'Template para testes de validação de campos',
    category: 'Functional',
    tags: ['validação', 'formulário'],
    testCase: {
      action: stepsToAction('Validar campos obrigatórios do formulário', [
        'Acessar o formulário',
        'Tentar submeter sem preencher campos obrigatórios',
        'Verificar mensagens de erro',
      ]),
      parameters: '—',
      expectedResult:
        'Mensagens de erro são exibidas para campos obrigatórios não preenchidos',
      observedResult: '',
    },
  },
  {
    id: 'api-contract',
    name: 'Contrato de API',
    description: 'Template para validação de contratos de API',
    category: 'Integration',
    tags: ['api', 'contrato', 'integração'],
    testCase: {
      action: stepsToAction('Validar contrato da API', [
        'Fazer requisição GET para endpoint',
        'Validar status code 200',
        'Validar estrutura do JSON de resposta',
        'Validar tipos de dados dos campos',
      ]),
      parameters: 'Token/credenciais de API; URL base; coleção Postman ou equivalente.',
      expectedResult: 'API retorna resposta válida conforme contrato definido',
      observedResult: '',
    },
  },
  {
    id: 'performance-load',
    name: 'Teste de Carga',
    description: 'Template para testes de performance e carga',
    category: 'Performance',
    tags: ['performance', 'carga', 'stress'],
    testCase: {
      action: stepsToAction('Validar comportamento sob carga', [
        'Configurar teste de carga com 100 usuários simultâneos',
        'Executar requisições por 5 minutos',
        'Monitorar tempo de resposta',
        'Verificar taxa de erro',
      ]),
      parameters: 'Ferramenta de carga (ex.: JMeter); perfil de usuários; SLA acordado.',
      expectedResult:
        'Sistema mantém tempo de resposta abaixo de 2s e taxa de erro abaixo de 1%',
      observedResult: '',
    },
  },
  {
    id: 'security-auth',
    name: 'Segurança - Autenticação',
    description: 'Template para testes de segurança de autenticação',
    category: 'Security',
    tags: ['segurança', 'autenticação', 'owasp'],
    testCase: {
      action: stepsToAction('Validar proteção contra força bruta', [
        'Tentar fazer login com senha incorreta 5 vezes',
        'Verificar bloqueio de conta',
        'Tentar fazer login após bloqueio',
      ]),
      parameters: 'Conta de teste dedicada; política de bloqueio documentada.',
      expectedResult: 'Conta é bloqueada após 5 tentativas falhadas',
      observedResult: '',
    },
  },
  {
    id: 'e2e-user-journey',
    name: 'Jornada do Usuário E2E',
    description: 'Template para testes end-to-end de fluxos completos',
    category: 'E2E',
    tags: ['e2e', 'jornada', 'fluxo-completo'],
    testCase: {
      action: stepsToAction('Validar jornada completa do usuário', [
        'Acessar aplicação',
        'Fazer login',
        'Navegar para funcionalidade principal',
        'Executar ação principal',
        'Verificar resultado',
        'Fazer logout',
      ]),
      parameters: 'Dados de usuário de ponta a ponta; ambiente estável.',
      expectedResult: 'Jornada completa é executada sem erros',
      observedResult: '',
    },
  },
  {
    id: 'regression-smoke',
    name: 'Smoke Test',
    description: 'Template para testes de fumaça rápidos',
    category: 'Smoke',
    tags: ['smoke', 'regressão', 'rápido'],
    testCase: {
      action: stepsToAction('Validar funcionalidades críticas após deploy', [
        'Verificar se aplicação carrega',
        'Verificar login funciona',
        'Verificar funcionalidade principal acessível',
      ]),
      parameters: '—',
      expectedResult: 'Funcionalidades críticas estão operacionais',
      observedResult: '',
    },
  },
  {
    id: 'usability-accessibility',
    name: 'Usabilidade e Acessibilidade',
    description: 'Template para testes de usabilidade',
    category: 'Usability',
    tags: ['usabilidade', 'acessibilidade', 'ux'],
    testCase: {
      action: stepsToAction('Validar acessibilidade da interface', [
        'Navegar usando apenas teclado',
        'Verificar contraste de cores',
        'Verificar labels de campos',
        'Testar com leitor de tela',
      ]),
      parameters: 'Checklist WCAG aplicável; leitor de tela (NVDA/JAWS/VoiceOver).',
      expectedResult: 'Interface é acessível e utilizável',
      observedResult: '',
    },
  },
];

export const getTemplatesByCategory = (category: TestCaseTemplate['category']) => {
  return TEST_CASE_TEMPLATES.filter(t => t.category === category);
};

export const getTemplatesByTag = (tag: string) => {
  return TEST_CASE_TEMPLATES.filter(t => t.tags.includes(tag));
};

export const createTestCaseFromTemplate = (templateId: string): TestCase => {
  const template = TEST_CASE_TEMPLATES.find(t => t.id === templateId);
  if (!template) {
    throw new Error(`Template ${templateId} não encontrado`);
  }

  return {
    id: `tc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    ...template.testCase,
    status: 'Not Run',
    executionKind: template.testCase.executionKind ?? 'manual',
  };
};
