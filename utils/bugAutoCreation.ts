import { JiraTask, TestCase, BugSeverity } from '../types';

export interface BugCreationRules {
  criticalTestTags?: string[];
  highSeverityTags?: string[];
  defaultSeverity?: BugSeverity;
}

const DEFAULT_RULES: BugCreationRules = {
  criticalTestTags: ['crítico', 'autenticação', 'segurança', 'pagamento'],
  highSeverityTags: ['crítico', 'segurança'],
  defaultSeverity: 'Médio',
};

export const determineBugSeverity = (
  testCase: TestCase,
  task: JiraTask,
  rules: BugCreationRules = DEFAULT_RULES
): BugSeverity => {
  // Verificar tags do caso de teste
  const testTags = testCase.strategies || [];
  const hasCriticalTag = testTags.some(tag =>
    rules.criticalTestTags?.some(ct => tag.toLowerCase().includes(ct.toLowerCase()))
  );

  if (hasCriticalTag) {
    return 'Crítico';
  }

  // Verificar tags da tarefa
  const taskTags = task.tags || [];
  const hasHighSeverityTag = taskTags.some(tag =>
    rules.highSeverityTags?.some(hst => tag.toLowerCase().includes(hst.toLowerCase()))
  );

  if (hasHighSeverityTag) {
    return 'Alto';
  }

  // Verificar tipo de teste
  if (testCase.strategies?.some(s => s.toLowerCase().includes('segurança'))) {
    return 'Alto';
  }

  // Verificar prioridade da tarefa
  if (task.priority === 'Urgente' || task.priority === 'Alta') {
    return 'Alto';
  }

  return rules.defaultSeverity || 'Médio';
};

export const createBugFromFailedTest = (
  testCase: TestCase,
  task: JiraTask,
  observedResult: string,
  rules?: BugCreationRules
): JiraTask => {
  const severity = determineBugSeverity(testCase, task, rules);

  const bugDescription = `Este bug foi gerado automaticamente devido à falha do caso de teste.

**Tarefa Original:** ${task.id} - ${task.title}
**Caso de Teste:** ${testCase.description}

**Passos para Reproduzir:**
${testCase.steps.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

**Resultado Esperado:**
${testCase.expectedResult}

**Resultado Encontrado:**
${observedResult || 'Nenhum resultado encontrado foi fornecido.'}

**Estratégias de Teste:**
${testCase.strategies?.join(', ') || 'N/A'}

**Automatizado:** ${testCase.isAutomated ? 'Sim' : 'Não'}
`;

  return {
    id: `BUG-${task.id}-${Date.now().toString().slice(-4)}`,
    title: `BUG: Falha no teste - ${testCase.description.substring(0, 50)}${testCase.description.length > 50 ? '...' : ''}`,
    description: bugDescription,
    type: 'Bug',
    status: 'To Do',
    testCases: [],
    bddScenarios: [],
    parentId: task.parentId || task.id,
    severity,
    priority: severity === 'Crítico' ? 'Urgente' : severity === 'Alto' ? 'Alta' : 'Média',
    createdAt: new Date().toISOString(),
    owner: 'QA',
    assignee: 'Dev',
    tags: [
      ...(task.tags || []),
      'bug-automático',
      'teste-falhado',
      ...(testCase.strategies || []).map(s => s.toLowerCase().replace(/\s+/g, '-')),
    ].filter((tag, index, self) => self.indexOf(tag) === index),
  };
};
