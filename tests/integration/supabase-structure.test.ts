/**
 * Testes de integração para verificar estrutura de dados no Supabase
 * Verifica se Casos de Teste, Estratégias e Cenários BDD estão sendo salvos corretamente
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Project, JiraTask, TestCase, TestStrategy, BddScenario } from '../../types';
import {
  verifySupabaseStructure,
  verifyTaskRelations,
} from '../../scripts/verify-supabase-structure';
import { updateProject, loadProjectsFromIndexedDB } from '../../services/dbService';

describe('Estrutura de Dados no Supabase', () => {
  let testProject: Project;

  beforeEach(() => {
    // Criar projeto de teste
    testProject = {
      id: 'test-proj-' + Date.now(),
      name: 'Projeto de Teste - Estrutura',
      description: 'Teste de estrutura de dados',
      tasks: [],
      documents: [],
      phases: [],
    };
  });

  describe('Salvamento de Casos de Teste', () => {
    it('deve salvar casos de teste relacionados à tarefa', async () => {
      const testCase: TestCase = {
        id: 'tc-001',
        description: 'Caso de teste de exemplo',
        steps: ['Passo 1', 'Passo 2'],
        expectedResult: 'Resultado esperado',
        status: 'Not Run',
      };

      const task: JiraTask = {
        id: 'TASK-001',
        title: 'Tarefa de Teste',
        description: 'Descrição da tarefa',
        type: 'Tarefa',
        status: 'To Do',
        testCases: [testCase],
      };

      testProject.tasks = [task];

      // Salvar projeto
      await updateProject(testProject);

      // Carregar e verificar
      const projects = await loadProjectsFromIndexedDB();
      const savedProject = projects.find(p => p.id === testProject.id);

      expect(savedProject).toBeDefined();
      expect(savedProject?.tasks).toHaveLength(1);
      expect(savedProject?.tasks[0].testCases).toHaveLength(1);
      expect(savedProject?.tasks[0].testCases[0].id).toBe('tc-001');
      expect(savedProject?.tasks[0].testCases[0].description).toBe('Caso de teste de exemplo');
    });

    it('deve preservar múltiplos casos de teste na mesma tarefa', async () => {
      const testCases: TestCase[] = [
        {
          id: 'tc-001',
          description: 'Caso 1',
          steps: ['Passo 1'],
          expectedResult: 'Resultado 1',
          status: 'Passed',
        },
        {
          id: 'tc-002',
          description: 'Caso 2',
          steps: ['Passo 1'],
          expectedResult: 'Resultado 2',
          status: 'Failed',
        },
      ];

      const task: JiraTask = {
        id: 'TASK-002',
        title: 'Tarefa com múltiplos testes',
        description: 'Descrição',
        type: 'Tarefa',
        status: 'To Do',
        testCases,
      };

      testProject.tasks = [task];
      await updateProject(testProject);

      const projects = await loadProjectsFromIndexedDB();
      const savedProject = projects.find(p => p.id === testProject.id);

      expect(savedProject?.tasks[0].testCases).toHaveLength(2);
      expect(savedProject?.tasks[0].testCases.map(tc => tc.id)).toEqual(['tc-001', 'tc-002']);
    });
  });

  describe('Salvamento de Estratégias de Teste', () => {
    it('deve salvar estratégias relacionadas à tarefa', async () => {
      const strategy: TestStrategy = {
        testType: 'Testes Funcionais',
        description: 'Estratégia de teste funcional',
        howToExecute: ['Executar casos de teste'],
        tools: 'Postman',
      };

      const task: JiraTask = {
        id: 'TASK-003',
        title: 'Tarefa com estratégia',
        description: 'Descrição',
        type: 'Tarefa',
        status: 'To Do',
        testStrategy: [strategy],
        testCases: [],
      };

      testProject.tasks = [task];
      await updateProject(testProject);

      const projects = await loadProjectsFromIndexedDB();
      const savedProject = projects.find(p => p.id === testProject.id);

      expect(savedProject).toBeDefined();
      expect(savedProject?.tasks[0].testStrategy).toHaveLength(1);
      expect(savedProject?.tasks[0].testStrategy?.[0].testType).toBe('Testes Funcionais');
      expect(savedProject?.tasks[0].testStrategy?.[0].description).toBe(
        'Estratégia de teste funcional'
      );
    });
  });

  describe('Salvamento de Cenários BDD', () => {
    it('deve salvar cenários BDD relacionados à tarefa', async () => {
      const scenario: BddScenario = {
        id: 'bdd-001',
        title: 'Cenário de login',
        gherkin:
          'Dado que estou na página de login\nQuando preencho credenciais\nEntão sou autenticado',
      };

      const task: JiraTask = {
        id: 'TASK-004',
        title: 'Tarefa com BDD',
        description: 'Descrição',
        type: 'Tarefa',
        status: 'To Do',
        bddScenarios: [scenario],
        testCases: [],
      };

      testProject.tasks = [task];
      await updateProject(testProject);

      const projects = await loadProjectsFromIndexedDB();
      const savedProject = projects.find(p => p.id === testProject.id);

      expect(savedProject).toBeDefined();
      expect(savedProject?.tasks[0].bddScenarios).toHaveLength(1);
      expect(savedProject?.tasks[0].bddScenarios?.[0].id).toBe('bdd-001');
      expect(savedProject?.tasks[0].bddScenarios?.[0].title).toBe('Cenário de login');
    });
  });

  describe('Relação com Tarefas', () => {
    it('cada tarefa deve manter seus próprios dados de teste', async () => {
      const task1: JiraTask = {
        id: 'TASK-A',
        title: 'Tarefa A',
        description: 'Descrição A',
        type: 'Tarefa',
        status: 'To Do',
        testCases: [
          {
            id: 'tc-a-001',
            description: 'Teste da tarefa A',
            steps: ['Passo 1'],
            expectedResult: 'Resultado A',
            status: 'Not Run',
          },
        ],
      };

      const task2: JiraTask = {
        id: 'TASK-B',
        title: 'Tarefa B',
        description: 'Descrição B',
        type: 'Tarefa',
        status: 'To Do',
        testCases: [
          {
            id: 'tc-b-001',
            description: 'Teste da tarefa B',
            steps: ['Passo 1'],
            expectedResult: 'Resultado B',
            status: 'Not Run',
          },
        ],
      };

      testProject.tasks = [task1, task2];
      await updateProject(testProject);

      const projects = await loadProjectsFromIndexedDB();
      const savedProject = projects.find(p => p.id === testProject.id);

      expect(savedProject?.tasks).toHaveLength(2);

      // Verificar que cada tarefa mantém seus próprios dados
      const savedTask1 = savedProject?.tasks.find(t => t.id === 'TASK-A');
      const savedTask2 = savedProject?.tasks.find(t => t.id === 'TASK-B');

      expect(savedTask1?.testCases).toHaveLength(1);
      expect(savedTask1?.testCases[0].id).toBe('tc-a-001');
      expect(savedTask1?.testCases[0].description).toBe('Teste da tarefa A');

      expect(savedTask2?.testCases).toHaveLength(1);
      expect(savedTask2?.testCases[0].id).toBe('tc-b-001');
      expect(savedTask2?.testCases[0].description).toBe('Teste da tarefa B');

      // Verificar que não há mistura de dados
      expect(savedTask1?.testCases[0].id).not.toBe('tc-b-001');
      expect(savedTask2?.testCases[0].id).not.toBe('tc-a-001');
    });

    it('não deve compartilhar dados entre tarefas', async () => {
      const task1: JiraTask = {
        id: 'TASK-X',
        title: 'Tarefa X',
        description: 'Descrição X',
        type: 'Tarefa',
        status: 'To Do',
        testCases: [
          {
            id: 'tc-x-001',
            description: 'Teste X',
            steps: ['Passo 1'],
            expectedResult: 'Resultado X',
            status: 'Not Run',
          },
        ],
        testStrategy: [
          {
            testType: 'Estratégia X',
            description: 'Descrição estratégia X',
            howToExecute: ['Passo 1'],
            tools: 'Ferramenta X',
          },
        ],
        bddScenarios: [
          {
            id: 'bdd-x-001',
            title: 'Cenário X',
            gherkin: 'Gherkin X',
          },
        ],
      };

      const task2: JiraTask = {
        id: 'TASK-Y',
        title: 'Tarefa Y',
        description: 'Descrição Y',
        type: 'Tarefa',
        status: 'To Do',
        testCases: [],
        testStrategy: [],
        bddScenarios: [],
      };

      testProject.tasks = [task1, task2];
      await updateProject(testProject);

      const projects = await loadProjectsFromIndexedDB();
      const savedProject = projects.find(p => p.id === testProject.id);

      const savedTask1 = savedProject?.tasks.find(t => t.id === 'TASK-X');
      const savedTask2 = savedProject?.tasks.find(t => t.id === 'TASK-Y');

      // Tarefa X deve ter seus dados
      expect(savedTask1?.testCases).toHaveLength(1);
      expect(savedTask1?.testStrategy).toHaveLength(1);
      expect(savedTask1?.bddScenarios).toHaveLength(1);

      // Tarefa Y não deve ter dados (está vazia)
      expect(savedTask2?.testCases).toHaveLength(0);
      expect(savedTask2?.testStrategy).toHaveLength(0);
      expect(savedTask2?.bddScenarios).toHaveLength(0);

      // Tarefa Y não deve ter acesso aos dados da Tarefa X
      expect(savedTask2?.testCases).not.toContainEqual(savedTask1?.testCases[0]);
    });
  });

  describe('Verificação de Estrutura', () => {
    it('deve verificar estrutura completa do projeto', async () => {
      const task: JiraTask = {
        id: 'TASK-VERIFY',
        title: 'Tarefa para verificação',
        description: 'Descrição',
        type: 'Tarefa',
        status: 'To Do',
        testCases: [
          {
            id: 'tc-verify-001',
            description: 'Caso de teste',
            steps: ['Passo 1'],
            expectedResult: 'Resultado',
            status: 'Passed',
          },
        ],
        testStrategy: [
          {
            testType: 'Funcional',
            description: 'Estratégia',
            howToExecute: ['Passo 1'],
            tools: 'Postman',
          },
        ],
        bddScenarios: [
          {
            id: 'bdd-verify-001',
            title: 'Cenário',
            gherkin: 'Gherkin',
          },
        ],
      };

      testProject.tasks = [task];
      await updateProject(testProject);

      // Executar verificação
      const results = await verifySupabaseStructure();
      const projectResult = results.find(r => r.projectId === testProject.id);

      expect(projectResult).toBeDefined();
      expect(projectResult?.totalTasks).toBe(1);
      expect(projectResult?.totalTestCases).toBe(1);
      expect(projectResult?.totalTestStrategies).toBe(1);
      expect(projectResult?.totalBddScenarios).toBe(1);
      expect(projectResult?.tasksWithTestCases).toBe(1);
      expect(projectResult?.tasksWithTestStrategy).toBe(1);
      expect(projectResult?.tasksWithBddScenarios).toBe(1);
    });

    it('deve verificar relações entre tarefas', async () => {
      const task1: JiraTask = {
        id: 'TASK-REL-1',
        title: 'Tarefa 1',
        description: 'Descrição',
        type: 'Tarefa',
        status: 'To Do',
        testCases: [
          {
            id: 'tc-rel-1',
            description: 'Teste 1',
            steps: ['Passo 1'],
            expectedResult: 'Resultado',
            status: 'Not Run',
          },
        ],
      };

      const task2: JiraTask = {
        id: 'TASK-REL-2',
        title: 'Tarefa 2',
        description: 'Descrição',
        type: 'Tarefa',
        status: 'To Do',
        testCases: [
          {
            id: 'tc-rel-2',
            description: 'Teste 2',
            steps: ['Passo 1'],
            expectedResult: 'Resultado',
            status: 'Not Run',
          },
        ],
      };

      testProject.tasks = [task1, task2];
      await updateProject(testProject);

      const results = await verifySupabaseStructure();
      const projectResult = results.find(r => r.projectId === testProject.id);

      const relationCheck = verifyTaskRelations([projectResult!]);

      expect(relationCheck.isValid).toBe(true);
      expect(relationCheck.issues).toHaveLength(0);
    });
  });
});
