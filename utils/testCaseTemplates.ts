import { TestCase } from '../types';

export interface TestCaseTemplate {
  id: string;
  name: string;
  description: string;
  category: 'Functional' | 'Integration' | 'Performance' | 'Security' | 'Usability' | 'Regression' | 'Smoke' | 'E2E';
  testCase: Omit<TestCase, 'id' | 'status'>;
  tags: string[];
}

export const TEST_CASE_TEMPLATES: TestCaseTemplate[] = [
  {
    id: 'login-flow',
    name: 'Fluxo de Login',
    description: 'Template para testes de autenticação e login',
    category: 'Functional',
    tags: ['autenticação', 'login', 'crítico'],
    testCase: {
      description: 'Validar login com credenciais válidas',
      steps: [
        'Acessar a página de login',
        'Inserir email válido',
        'Inserir senha válida',
        'Clicar em "Entrar"'
      ],
      expectedResult: 'Usuário é autenticado e redirecionado para o dashboard',
      strategies: ['Teste Funcional', 'Teste de Usabilidade'],
      isAutomated: true
    }
  },
  {
    id: 'form-validation',
    name: 'Validação de Formulário',
    description: 'Template para testes de validação de campos',
    category: 'Functional',
    tags: ['validação', 'formulário'],
    testCase: {
      description: 'Validar campos obrigatórios do formulário',
      steps: [
        'Acessar o formulário',
        'Tentar submeter sem preencher campos obrigatórios',
        'Verificar mensagens de erro'
      ],
      expectedResult: 'Mensagens de erro são exibidas para campos obrigatórios não preenchidos',
      strategies: ['Teste Funcional', 'Teste de Validação'],
      isAutomated: true
    }
  },
  {
    id: 'api-contract',
    name: 'Contrato de API',
    description: 'Template para validação de contratos de API',
    category: 'Integration',
    tags: ['api', 'contrato', 'integração'],
    testCase: {
      description: 'Validar contrato da API',
      steps: [
        'Fazer requisição GET para endpoint',
        'Validar status code 200',
        'Validar estrutura do JSON de resposta',
        'Validar tipos de dados dos campos'
      ],
      expectedResult: 'API retorna resposta válida conforme contrato definido',
      strategies: ['Teste de Integração', 'Teste de Contrato'],
      isAutomated: true
    }
  },
  {
    id: 'performance-load',
    name: 'Teste de Carga',
    description: 'Template para testes de performance e carga',
    category: 'Performance',
    tags: ['performance', 'carga', 'stress'],
    testCase: {
      description: 'Validar comportamento sob carga',
      steps: [
        'Configurar teste de carga com 100 usuários simultâneos',
        'Executar requisições por 5 minutos',
        'Monitorar tempo de resposta',
        'Verificar taxa de erro'
      ],
      expectedResult: 'Sistema mantém tempo de resposta abaixo de 2s e taxa de erro abaixo de 1%',
      strategies: ['Teste de Performance', 'Teste de Carga'],
      isAutomated: true
    }
  },
  {
    id: 'security-auth',
    name: 'Segurança - Autenticação',
    description: 'Template para testes de segurança de autenticação',
    category: 'Security',
    tags: ['segurança', 'autenticação', 'owasp'],
    testCase: {
      description: 'Validar proteção contra força bruta',
      steps: [
        'Tentar fazer login com senha incorreta 5 vezes',
        'Verificar bloqueio de conta',
        'Tentar fazer login após bloqueio'
      ],
      expectedResult: 'Conta é bloqueada após 5 tentativas falhadas',
      strategies: ['Teste de Segurança', 'Teste de Autenticação'],
      isAutomated: true
    }
  },
  {
    id: 'e2e-user-journey',
    name: 'Jornada do Usuário E2E',
    description: 'Template para testes end-to-end de fluxos completos',
    category: 'E2E',
    tags: ['e2e', 'jornada', 'fluxo-completo'],
    testCase: {
      description: 'Validar jornada completa do usuário',
      steps: [
        'Acessar aplicação',
        'Fazer login',
        'Navegar para funcionalidade principal',
        'Executar ação principal',
        'Verificar resultado',
        'Fazer logout'
      ],
      expectedResult: 'Jornada completa é executada sem erros',
      strategies: ['Teste E2E', 'Teste de Regressão'],
      isAutomated: true
    }
  },
  {
    id: 'regression-smoke',
    name: 'Smoke Test',
    description: 'Template para testes de fumaça rápidos',
    category: 'Smoke',
    tags: ['smoke', 'regressão', 'rápido'],
    testCase: {
      description: 'Validar funcionalidades críticas após deploy',
      steps: [
        'Verificar se aplicação carrega',
        'Verificar login funciona',
        'Verificar funcionalidade principal acessível'
      ],
      expectedResult: 'Funcionalidades críticas estão operacionais',
      strategies: ['Teste de Regressão', 'Smoke Test'],
      isAutomated: true
    }
  },
  {
    id: 'usability-accessibility',
    name: 'Usabilidade e Acessibilidade',
    description: 'Template para testes de usabilidade',
    category: 'Usability',
    tags: ['usabilidade', 'acessibilidade', 'ux'],
    testCase: {
      description: 'Validar acessibilidade da interface',
      steps: [
        'Navegar usando apenas teclado',
        'Verificar contraste de cores',
        'Verificar labels de campos',
        'Testar com leitor de tela'
      ],
      expectedResult: 'Interface é acessível e utilizável',
      strategies: ['Teste de Usabilidade', 'Teste de Acessibilidade'],
      isAutomated: false
    }
  }
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
    status: 'Not Run'
  };
};

