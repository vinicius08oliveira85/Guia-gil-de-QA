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
  _testCase: TestCase,
  task: JiraTask,
  rules: BugCreationRules = DEFAULT_RULES
): BugSeverity => {
  const taskTags = task.tags || [];
  const hasCriticalTag = taskTags.some(tag =>
    rules.criticalTestTags?.some(ct => tag.toLowerCase().includes(ct.toLowerCase()))
  );

  if (hasCriticalTag) {
    return 'Crítico';
  }

  const hasHighSeverityTag = taskTags.some(tag =>
    rules.highSeverityTags?.some(hst => tag.toLowerCase().includes(hst.toLowerCase()))
  );

  if (hasHighSeverityTag) {
    return 'Alto';
  }

  if (taskTags.some(t => t.toLowerCase().includes('segurança'))) {
    return 'Alto';
  }

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
  const actionPreview = testCase.action.slice(0, 80);

  const bugDescription = `Este bug foi gerado automaticamente devido à falha do caso de teste.

**Tarefa Original:** ${task.id} - ${task.title}

**Ação / roteiro:**
${testCase.action}

**Parâmetros:**
${testCase.parameters}

**Resultado Esperado:**
${testCase.expectedResult}

**Resultado Obtido:**
${observedResult || 'Nenhum resultado encontrado foi fornecido.'}
`;

  return {
    id: `BUG-${task.id}-${Date.now().toString().slice(-4)}`,
    title: `BUG: Falha no teste - ${actionPreview}${testCase.action.length > 80 ? '...' : ''}`,
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
    tags: [...(task.tags || []), 'bug-automático', 'teste-falhado'].filter(
      (tag, index, self) => self.indexOf(tag) === index
    ),
  };
};
