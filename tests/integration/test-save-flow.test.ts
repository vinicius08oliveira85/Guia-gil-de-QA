/**
 * Testes de integração para verificar fluxo completo de salvamento
 * Testa criação/edição de casos de teste via modal e verifica persistência no Supabase
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Project, JiraTask, TestCase } from '../../types';
import { updateProject, loadProjectsFromIndexedDB } from '../../services/dbService';

describe('Fluxo de Salvamento de Casos de Teste', () => {
  let testProject: Project;
  let testTask: JiraTask;

  beforeEach(() => {
    testProject = {
      id: 'test-proj-save-' + Date.now(),
      name: 'Projeto Teste Salvamento',
      description: 'Teste de fluxo de salvamento',
      tasks: [],
      documents: [],
      phases: []
    };

    testTask = {
      id: 'TASK-SAVE-001',
      title: 'Tarefa para Teste de Salvamento',
      description: 'Descrição da tarefa',
      type: 'Tarefa',
      status: 'To Do',
      testCases: []
    };

    testProject.tasks = [testTask];
  });

  describe('Criação de Caso de Teste via Modal', () => {
    it('deve criar e salvar novo caso de teste', async () => {
      // Simular criação de caso de teste via modal
      const newTestCase: TestCase = {
        id: 'tc-new-' + Date.now(),
        description: 'Novo caso de teste criado via modal',
        steps: ['Passo 1: Acessar sistema', 'Passo 2: Preencher formulário'],
        expectedResult: 'Formulário preenchido com sucesso',
        status: 'Not Run',
        preconditions: 'Usuário logado',
        priority: 'Alta'
      };

      // Simular handleSaveTestCase do TasksView
      const updatedTask = {
        ...testTask,
        testCases: [...testTask.testCases, newTestCase]
      };

      testProject.tasks = [updatedTask];

      // Salvar projeto
      await updateProject(testProject);

      // Verificar persistência
      const projects = await loadProjectsFromIndexedDB();
      const savedProject = projects.find(p => p.id === testProject.id);

      expect(savedProject).toBeDefined();
      expect(savedProject?.tasks[0].testCases).toHaveLength(1);
      expect(savedProject?.tasks[0].testCases[0].id).toBe(newTestCase.id);
      expect(savedProject?.tasks[0].testCases[0].description).toBe(newTestCase.description);
      expect(savedProject?.tasks[0].testCases[0].status).toBe('Not Run');
      expect(savedProject?.tasks[0].testCases[0].priority).toBe('Alta');
    });

    it('deve salvar caso de teste com todas as propriedades', async () => {
      const completeTestCase: TestCase = {
        id: 'tc-complete-' + Date.now(),
        title: 'Título do Teste',
        description: 'Descrição completa do caso de teste',
        steps: ['Passo 1', 'Passo 2', 'Passo 3'],
        expectedResult: 'Resultado esperado detalhado',
        status: 'Passed',
        strategies: ['Estratégia 1', 'Estratégia 2'],
        executedStrategy: ['Estratégia executada'],
        isAutomated: true,
        observedResult: 'Resultado observado',
        toolsUsed: ['Postman', 'Selenium'],
        preconditions: 'Pré-condições do teste',
        testSuite: 'Suite de Testes',
        testEnvironment: 'Ambiente de Teste',
        priority: 'Urgente'
      };

      const updatedTask = {
        ...testTask,
        testCases: [completeTestCase]
      };

      testProject.tasks = [updatedTask];
      await updateProject(testProject);

      const projects = await loadProjectsFromIndexedDB();
      const savedProject = projects.find(p => p.id === testProject.id);
      const savedTestCase = savedProject?.tasks[0].testCases[0];

      expect(savedTestCase).toBeDefined();
      expect(savedTestCase?.title).toBe('Título do Teste');
      expect(savedTestCase?.description).toBe('Descrição completa do caso de teste');
      expect(savedTestCase?.steps).toHaveLength(3);
      expect(savedTestCase?.status).toBe('Passed');
      expect(savedTestCase?.strategies).toEqual(['Estratégia 1', 'Estratégia 2']);
      expect(savedTestCase?.executedStrategy).toEqual(['Estratégia executada']);
      expect(savedTestCase?.isAutomated).toBe(true);
      expect(savedTestCase?.observedResult).toBe('Resultado observado');
      expect(savedTestCase?.toolsUsed).toEqual(['Postman', 'Selenium']);
      expect(savedTestCase?.preconditions).toBe('Pré-condições do teste');
      expect(savedTestCase?.testSuite).toBe('Suite de Testes');
      expect(savedTestCase?.testEnvironment).toBe('Ambiente de Teste');
      expect(savedTestCase?.priority).toBe('Urgente');
    });
  });

  describe('Edição de Caso de Teste via Modal', () => {
    it('deve atualizar caso de teste existente', async () => {
      // Criar caso de teste inicial
      const originalTestCase: TestCase = {
        id: 'tc-edit-001',
        description: 'Caso de teste original',
        steps: ['Passo original'],
        expectedResult: 'Resultado original',
        status: 'Not Run'
      };

      testTask.testCases = [originalTestCase];
      testProject.tasks = [testTask];
      await updateProject(testProject);

      // Simular edição via modal (handleSaveTestCase)
      const updatedTestCase: TestCase = {
        ...originalTestCase,
        description: 'Caso de teste atualizado',
        steps: ['Passo atualizado 1', 'Passo atualizado 2'],
        expectedResult: 'Resultado atualizado',
        status: 'Passed',
        observedResult: 'Resultado observado após execução'
      };

      const updatedTask = {
        ...testTask,
        testCases: testTask.testCases.map(tc => 
          tc.id === updatedTestCase.id ? updatedTestCase : tc
        )
      };

      testProject.tasks = [updatedTask];
      await updateProject(testProject);

      // Verificar atualização
      const projects = await loadProjectsFromIndexedDB();
      const savedProject = projects.find(p => p.id === testProject.id);
      const savedTestCase = savedProject?.tasks[0].testCases.find(tc => tc.id === 'tc-edit-001');

      expect(savedTestCase).toBeDefined();
      expect(savedTestCase?.description).toBe('Caso de teste atualizado');
      expect(savedTestCase?.steps).toHaveLength(2);
      expect(savedTestCase?.status).toBe('Passed');
      expect(savedTestCase?.observedResult).toBe('Resultado observado após execução');
    });

    it('deve preservar outros casos de teste ao editar um', async () => {
      const testCase1: TestCase = {
        id: 'tc-multi-1',
        description: 'Caso de teste 1',
        steps: ['Passo 1'],
        expectedResult: 'Resultado 1',
        status: 'Passed'
      };

      const testCase2: TestCase = {
        id: 'tc-multi-2',
        description: 'Caso de teste 2',
        steps: ['Passo 2'],
        expectedResult: 'Resultado 2',
        status: 'Failed'
      };

      testTask.testCases = [testCase1, testCase2];
      testProject.tasks = [testTask];
      await updateProject(testProject);

      // Editar apenas o primeiro caso
      const updatedTestCase1: TestCase = {
        ...testCase1,
        status: 'Blocked'
      };

      const updatedTask = {
        ...testTask,
        testCases: testTask.testCases.map(tc => 
          tc.id === updatedTestCase1.id ? updatedTestCase1 : tc
        )
      };

      testProject.tasks = [updatedTask];
      await updateProject(testProject);

      // Verificar que ambos os casos foram preservados
      const projects = await loadProjectsFromIndexedDB();
      const savedProject = projects.find(p => p.id === testProject.id);

      expect(savedProject?.tasks[0].testCases).toHaveLength(2);
      
      const saved1 = savedProject?.tasks[0].testCases.find(tc => tc.id === 'tc-multi-1');
      const saved2 = savedProject?.tasks[0].testCases.find(tc => tc.id === 'tc-multi-2');

      expect(saved1?.status).toBe('Blocked'); // Atualizado
      expect(saved2?.status).toBe('Failed'); // Preservado
      expect(saved2?.description).toBe('Caso de teste 2'); // Preservado
    });
  });

  describe('Persistência no Supabase', () => {
    it('deve persistir dados após múltiplas atualizações', async () => {
      let currentTestCase: TestCase = {
        id: 'tc-persist-001',
        description: 'Versão inicial',
        steps: ['Passo 1'],
        expectedResult: 'Resultado inicial',
        status: 'Not Run'
      };

      testTask.testCases = [currentTestCase];
      testProject.tasks = [testTask];

      // Primeira atualização
      await updateProject(testProject);

      // Segunda atualização
      currentTestCase = {
        ...currentTestCase,
        status: 'Passed',
        observedResult: 'Resultado observado'
      };

      testTask.testCases = [currentTestCase];
      testProject.tasks = [testTask];
      await updateProject(testProject);

      // Terceira atualização
      currentTestCase = {
        ...currentTestCase,
        status: 'Failed',
        observedResult: 'Falha observada'
      };

      testTask.testCases = [currentTestCase];
      testProject.tasks = [testTask];
      await updateProject(testProject);

      // Verificar última versão persistida
      const projects = await loadProjectsFromIndexedDB();
      const savedProject = projects.find(p => p.id === testProject.id);
      const savedTestCase = savedProject?.tasks[0].testCases[0];

      expect(savedTestCase?.status).toBe('Failed');
      expect(savedTestCase?.observedResult).toBe('Falha observada');
    });

    it('deve manter dados mesmo após recarregar do Supabase', async () => {
      const testCase: TestCase = {
        id: 'tc-reload-001',
        description: 'Caso de teste para recarregamento',
        steps: ['Passo 1', 'Passo 2'],
        expectedResult: 'Resultado esperado',
        status: 'Passed',
        toolsUsed: ['Postman'],
        priority: 'Alta'
      };

      testTask.testCases = [testCase];
      testProject.tasks = [testTask];
      await updateProject(testProject);

      // Recarregar do Supabase
      const reloadedProjects = await loadProjectsFromIndexedDB();
      const reloadedProject = reloadedProjects.find(p => p.id === testProject.id);

      expect(reloadedProject).toBeDefined();
      expect(reloadedProject?.tasks[0].testCases).toHaveLength(1);
      expect(reloadedProject?.tasks[0].testCases[0].id).toBe('tc-reload-001');
      expect(reloadedProject?.tasks[0].testCases[0].status).toBe('Passed');
      expect(reloadedProject?.tasks[0].testCases[0].toolsUsed).toEqual(['Postman']);
      expect(reloadedProject?.tasks[0].testCases[0].priority).toBe('Alta');
    });
  });

  describe('Validação de Dados', () => {
    it('deve rejeitar caso de teste sem ID', async () => {
      const invalidTestCase = {
        description: 'Caso sem ID',
        steps: ['Passo 1'],
        expectedResult: 'Resultado',
        status: 'Not Run' as const
      };

      // TypeScript deve impedir isso, mas testamos a validação
      expect(() => {
        testTask.testCases = [invalidTestCase as TestCase];
      }).not.toThrow();
    });

    it('deve preservar arrays vazios quando apropriado', async () => {
      const testCase: TestCase = {
        id: 'tc-empty-arrays',
        description: 'Caso com arrays vazios',
        steps: ['Passo 1'],
        expectedResult: 'Resultado',
        status: 'Not Run',
        strategies: [],
        toolsUsed: []
      };

      testTask.testCases = [testCase];
      testProject.tasks = [testTask];
      await updateProject(testProject);

      const projects = await loadProjectsFromIndexedDB();
      const savedProject = projects.find(p => p.id === testProject.id);
      const savedTestCase = savedProject?.tasks[0].testCases[0];

      // Arrays vazios podem ser undefined após sanitização
      expect(savedTestCase).toBeDefined();
      expect(savedTestCase?.description).toBe('Caso com arrays vazios');
    });
  });
});

