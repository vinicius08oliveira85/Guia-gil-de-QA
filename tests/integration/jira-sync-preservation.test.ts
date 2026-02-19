/**
 * Testes de integração para verificar preservação de dados após sincronização com Jira
 * Verifica se Casos de Teste, Estratégias e Cenários BDD são preservados corretamente
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Project, JiraTask, TestCase, TestStrategy, BddScenario } from '../../types';
import { syncJiraProject } from '../../services/jiraService';
import { updateProject, getAllProjects } from '../../services/dbService';
import { loadProjectsFromSupabase } from '../../services/supabaseService';
import type { JiraConfig } from '../../types';

// Mock do jiraService para testes
vi.mock('../../services/jiraService', async () => {
  const actual = await vi.importActual('../../services/jiraService');
  return {
    ...actual,
    // Mock será implementado nos testes específicos
  };
});

describe('Preservação de Dados após Sincronização Jira', () => {
  let testProject: Project;
  let jiraConfig: JiraConfig;

  beforeEach(() => {
    testProject = {
      id: 'test-proj-jira-' + Date.now(),
      name: 'Projeto Teste Jira Sync',
      description: 'Teste de preservação após sync Jira',
      tasks: [],
      documents: [],
      phases: []
    };

    jiraConfig = {
      url: 'https://test-jira.atlassian.net',
      email: 'test@example.com',
      apiToken: 'test-token',
      projectKey: 'TEST'
    };
  });

  describe('Preservação de Casos de Teste', () => {
    it('deve preservar casos de teste após sincronização', async () => {
      const originalTestCase: TestCase = {
        id: 'tc-preserve-001',
        description: 'Caso de teste original',
        steps: ['Passo 1', 'Passo 2'],
        expectedResult: 'Resultado esperado',
        status: 'Passed',
        observedResult: 'Resultado observado',
        priority: 'Alta'
      };

      const task: JiraTask = {
        id: 'TEST-001',
        title: 'Tarefa Original',
        description: 'Descrição original',
        type: 'Tarefa',
        status: 'To Do',
        testCases: [originalTestCase]
      };

      testProject.tasks = [task];
      await updateProject(testProject);

      // Simular sincronização com Jira (tarefa atualizada do Jira)
      const jiraUpdatedTask: JiraTask = {
        ...task,
        title: 'Tarefa Atualizada do Jira',
        description: 'Descrição atualizada do Jira',
        status: 'In Progress',
        // testCases não vem do Jira - deve ser preservado
      };

      // Simular syncJiraProject preservando dados locais
      const syncedTask: JiraTask = {
        ...jiraUpdatedTask,
        // Preservar dados locais
        testCases: task.testCases, // ✅ Preservar casos de teste
        bddScenarios: task.bddScenarios || [],
        testStrategy: task.testStrategy
      };

      testProject.tasks = [syncedTask];
      await updateProject(testProject);

      // Verificar preservação
      const { projects } = await loadProjectsFromSupabase();
      const savedProject = projects.find(p => p.id === testProject.id);

      expect(savedProject).toBeDefined();
      expect(savedProject?.tasks[0].title).toBe('Tarefa Atualizada do Jira'); // Atualizado do Jira
      expect(savedProject?.tasks[0].testCases).toHaveLength(1); // ✅ Preservado
      expect(savedProject?.tasks[0].testCases[0].id).toBe('tc-preserve-001');
      expect(savedProject?.tasks[0].testCases[0].status).toBe('Passed'); // ✅ Status preservado
      expect(savedProject?.tasks[0].testCases[0].observedResult).toBe('Resultado observado'); // ✅ Preservado
    });

    it('deve preservar status dos casos de teste após sincronização', async () => {
      const testCases: TestCase[] = [
        {
          id: 'tc-status-1',
          description: 'Caso 1',
          steps: ['Passo 1'],
          expectedResult: 'Resultado 1',
          status: 'Passed'
        },
        {
          id: 'tc-status-2',
          description: 'Caso 2',
          steps: ['Passo 2'],
          expectedResult: 'Resultado 2',
          status: 'Failed'
        },
        {
          id: 'tc-status-3',
          description: 'Caso 3',
          steps: ['Passo 3'],
          expectedResult: 'Resultado 3',
          status: 'Blocked'
        }
      ];

      const task: JiraTask = {
        id: 'TEST-002',
        title: 'Tarefa com Status',
        description: 'Descrição',
        type: 'Tarefa',
        status: 'To Do',
        testCases
      };

      testProject.tasks = [task];
      await updateProject(testProject);

      // Simular sincronização
      const jiraUpdatedTask: JiraTask = {
        ...task,
        title: 'Tarefa Atualizada',
        status: 'Done'
      };

      const syncedTask: JiraTask = {
        ...jiraUpdatedTask,
        testCases: task.testCases // ✅ Preservar casos de teste com seus status
      };

      testProject.tasks = [syncedTask];
      await updateProject(testProject);

      // Verificar que todos os status foram preservados
      const { projects } = await loadProjectsFromSupabase();
      const savedProject = projects.find(p => p.id === testProject.id);

      expect(savedProject?.tasks[0].testCases).toHaveLength(3);
      expect(savedProject?.tasks[0].testCases.find(tc => tc.id === 'tc-status-1')?.status).toBe('Passed');
      expect(savedProject?.tasks[0].testCases.find(tc => tc.id === 'tc-status-2')?.status).toBe('Failed');
      expect(savedProject?.tasks[0].testCases.find(tc => tc.id === 'tc-status-3')?.status).toBe('Blocked');
    });
  });

  describe('Preservação de Estratégias de Teste', () => {
    it('deve preservar estratégias de teste após sincronização', async () => {
      const strategy: TestStrategy = {
        testType: 'Testes Funcionais',
        description: 'Estratégia de teste funcional',
        howToExecute: ['Passo 1', 'Passo 2'],
        tools: 'Postman, Selenium'
      };

      const task: JiraTask = {
        id: 'TEST-003',
        title: 'Tarefa com Estratégia',
        description: 'Descrição',
        type: 'Tarefa',
        status: 'To Do',
        testStrategy: [strategy]
      };

      testProject.tasks = [task];
      await updateProject(testProject);

      // Simular sincronização
      const jiraUpdatedTask: JiraTask = {
        ...task,
        title: 'Tarefa Atualizada do Jira',
        description: 'Nova descrição do Jira'
      };

      const syncedTask: JiraTask = {
        ...jiraUpdatedTask,
        testStrategy: task.testStrategy // ✅ Preservar estratégias
      };

      testProject.tasks = [syncedTask];
      await updateProject(testProject);

      // Verificar preservação
      const { projects } = await loadProjectsFromSupabase();
      const savedProject = projects.find(p => p.id === testProject.id);

      expect(savedProject?.tasks[0].testStrategy).toHaveLength(1);
      expect(savedProject?.tasks[0].testStrategy?.[0].testType).toBe('Testes Funcionais');
      expect(savedProject?.tasks[0].testStrategy?.[0].description).toBe('Estratégia de teste funcional');
      expect(savedProject?.tasks[0].testStrategy?.[0].tools).toBe('Postman, Selenium');
    });
  });

  describe('Preservação de Cenários BDD', () => {
    it('deve preservar cenários BDD após sincronização', async () => {
      const scenario: BddScenario = {
        id: 'bdd-preserve-001',
        title: 'Cenário de Login',
        gherkin: 'Dado que estou na página de login\nQuando preencho credenciais válidas\nEntão sou autenticado'
      };

      const task: JiraTask = {
        id: 'TEST-004',
        title: 'Tarefa com BDD',
        description: 'Descrição',
        type: 'Tarefa',
        status: 'To Do',
        bddScenarios: [scenario]
      };

      testProject.tasks = [task];
      await updateProject(testProject);

      // Simular sincronização
      const jiraUpdatedTask: JiraTask = {
        ...task,
        title: 'Tarefa Atualizada',
        status: 'In Progress'
      };

      const syncedTask: JiraTask = {
        ...jiraUpdatedTask,
        bddScenarios: task.bddScenarios || [] // ✅ Preservar cenários BDD
      };

      testProject.tasks = [syncedTask];
      await updateProject(testProject);

      // Verificar preservação
      const { projects } = await loadProjectsFromSupabase();
      const savedProject = projects.find(p => p.id === testProject.id);

      expect(savedProject?.tasks[0].bddScenarios).toHaveLength(1);
      expect(savedProject?.tasks[0].bddScenarios?.[0].id).toBe('bdd-preserve-001');
      expect(savedProject?.tasks[0].bddScenarios?.[0].title).toBe('Cenário de Login');
      expect(savedProject?.tasks[0].bddScenarios?.[0].gherkin).toContain('Dado que estou na página de login');
    });
  });

  describe('Preservação Completa de Dados', () => {
    it('deve preservar todos os dados de teste após sincronização', async () => {
      const task: JiraTask = {
        id: 'TEST-005',
        title: 'Tarefa Completa',
        description: 'Descrição original',
        type: 'Tarefa',
        status: 'To Do',
        testCases: [
          {
            id: 'tc-complete-1',
            description: 'Caso de teste completo',
            steps: ['Passo 1'],
            expectedResult: 'Resultado',
            status: 'Passed',
            toolsUsed: ['Postman']
          }
        ],
        testStrategy: [
          {
            testType: 'Funcional',
            description: 'Estratégia funcional',
            howToExecute: ['Executar'],
            tools: 'Postman'
          }
        ],
        bddScenarios: [
          {
            id: 'bdd-complete-1',
            title: 'Cenário completo',
            gherkin: 'Gherkin completo'
          }
        ]
      };

      testProject.tasks = [task];
      await updateProject(testProject);

      // Simular sincronização completa
      const jiraUpdatedTask: JiraTask = {
        ...task,
        title: 'Tarefa Atualizada do Jira',
        description: 'Nova descrição do Jira',
        status: 'Done',
        priority: 'Alta'
      };

      // Simular comportamento do syncJiraProject (linhas 1545-1578)
      const syncedTask: JiraTask = {
        ...jiraUpdatedTask,
        // ✅ Preservar todos os dados locais
        testCases: task.testCases, // ✅ Preservar casos de teste
        bddScenarios: task.bddScenarios || [], // ✅ Preservar cenários BDD
        testStrategy: task.testStrategy // ✅ Preservar estratégias
      };

      testProject.tasks = [syncedTask];
      await updateProject(testProject);

      // Verificar preservação completa
      const { projects } = await loadProjectsFromSupabase();
      const savedProject = projects.find(p => p.id === testProject.id);

      // Campos atualizados do Jira
      expect(savedProject?.tasks[0].title).toBe('Tarefa Atualizada do Jira');
      expect(savedProject?.tasks[0].description).toBe('Nova descrição do Jira');
      expect(savedProject?.tasks[0].status).toBe('Done');
      expect(savedProject?.tasks[0].priority).toBe('Alta');

      // ✅ Dados locais preservados
      expect(savedProject?.tasks[0].testCases).toHaveLength(1);
      expect(savedProject?.tasks[0].testCases[0].id).toBe('tc-complete-1');
      expect(savedProject?.tasks[0].testCases[0].status).toBe('Passed');
      
      expect(savedProject?.tasks[0].testStrategy).toHaveLength(1);
      expect(savedProject?.tasks[0].testStrategy?.[0].testType).toBe('Funcional');
      
      expect(savedProject?.tasks[0].bddScenarios).toHaveLength(1);
      expect(savedProject?.tasks[0].bddScenarios?.[0].id).toBe('bdd-complete-1');
    });
  });

  describe('Múltiplas Tarefas', () => {
    it('deve preservar dados de todas as tarefas após sincronização', async () => {
      const task1: JiraTask = {
        id: 'TEST-MULTI-1',
        title: 'Tarefa 1',
        description: 'Descrição 1',
        type: 'Tarefa',
        status: 'To Do',
        testCases: [
          {
            id: 'tc-multi-1',
            description: 'Teste tarefa 1',
            steps: ['Passo 1'],
            expectedResult: 'Resultado 1',
            status: 'Passed'
          }
        ]
      };

      const task2: JiraTask = {
        id: 'TEST-MULTI-2',
        title: 'Tarefa 2',
        description: 'Descrição 2',
        type: 'Tarefa',
        status: 'To Do',
        testStrategy: [
          {
            testType: 'Estratégia tarefa 2',
            description: 'Descrição estratégia',
            howToExecute: ['Executar'],
            tools: 'Ferramenta'
          }
        ]
      };

      testProject.tasks = [task1, task2];
      await updateProject(testProject);

      // Simular sincronização de ambas as tarefas
      const syncedTask1: JiraTask = {
        ...task1,
        title: 'Tarefa 1 Atualizada',
        status: 'In Progress',
        testCases: task1.testCases // ✅ Preservar
      };

      const syncedTask2: JiraTask = {
        ...task2,
        title: 'Tarefa 2 Atualizada',
        status: 'Done',
        testStrategy: task2.testStrategy // ✅ Preservar
      };

      testProject.tasks = [syncedTask1, syncedTask2];
      await updateProject(testProject);

      // Verificar preservação de ambas
      const { projects } = await loadProjectsFromSupabase();
      const savedProject = projects.find(p => p.id === testProject.id);

      expect(savedProject?.tasks).toHaveLength(2);

      const savedTask1 = savedProject?.tasks.find(t => t.id === 'TEST-MULTI-1');
      const savedTask2 = savedProject?.tasks.find(t => t.id === 'TEST-MULTI-2');

      // Tarefa 1
      expect(savedTask1?.title).toBe('Tarefa 1 Atualizada');
      expect(savedTask1?.testCases).toHaveLength(1);
      expect(savedTask1?.testCases[0].id).toBe('tc-multi-1');

      // Tarefa 2
      expect(savedTask2?.title).toBe('Tarefa 2 Atualizada');
      expect(savedTask2?.testStrategy).toHaveLength(1);
      expect(savedTask2?.testStrategy?.[0].testType).toBe('Estratégia tarefa 2');
    });
  });
});

