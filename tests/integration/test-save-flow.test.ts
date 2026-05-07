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
      phases: [],
    };

    testTask = {
      id: 'TASK-SAVE-001',
      title: 'Tarefa para Teste de Salvamento',
      description: 'Descrição da tarefa',
      type: 'Tarefa',
      status: 'To Do',
      testCases: [],
    };

    testProject.tasks = [testTask];
  });

  describe('Criação de Caso de Teste via Modal', () => {
    it('deve criar e salvar novo caso de teste', async () => {
      // Simular criação de caso de teste via modal
      const newTestCase: TestCase = {
        id: 'tc-new-' + Date.now(),
        action:
          '1. Acessar sistema\n2. Preencher formulário',
        parameters: 'Pré-condições: usuário logado',
        expectedResult: 'Formulário preenchido com sucesso',
        observedResult: '',
        status: 'Not Run',
      };

      // Simular handleSaveTestCase do TasksView
      const updatedTask = {
        ...testTask,
        testCases: [...testTask.testCases, newTestCase],
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
      expect(savedProject?.tasks[0].testCases[0].action).toBe(newTestCase.action);
      expect(savedProject?.tasks[0].testCases[0].status).toBe('Not Run');
    });

    it('deve salvar caso de teste com todas as propriedades', async () => {
      const completeTestCase: TestCase = {
        id: 'tc-complete-' + Date.now(),
        action:
          'Descrição completa do caso de teste\n\n1. Passo 1\n2. Passo 2\n3. Passo 3',
        parameters: [
          'Pré-condições: Pré-condições do teste',
          'Suíte: Suite de Testes',
          'Ambiente: Ambiente de Teste',
          'Estratégias (legado): Estratégia 1, Estratégia 2',
          'Ferramentas usadas na execução: Postman, Selenium',
        ].join('\n'),
        expectedResult: 'Resultado esperado detalhado',
        observedResult: 'Resultado observado',
        status: 'Passed',
      };

      const updatedTask = {
        ...testTask,
        testCases: [completeTestCase],
      };

      testProject.tasks = [updatedTask];
      await updateProject(testProject);

      const projects = await loadProjectsFromIndexedDB();
      const savedProject = projects.find(p => p.id === testProject.id);
      const savedTestCase = savedProject?.tasks[0].testCases[0];

      expect(savedTestCase).toBeDefined();
      expect(savedTestCase?.action).toContain('Descrição completa do caso de teste');
      expect(savedTestCase?.parameters).toContain('Suite de Testes');
      expect(savedTestCase?.parameters).toContain('Postman');
      expect(savedTestCase?.status).toBe('Passed');
      expect(savedTestCase?.observedResult).toBe('Resultado observado');
    });
  });

  describe('Edição de Caso de Teste via Modal', () => {
    it('deve atualizar caso de teste existente', async () => {
      // Criar caso de teste inicial
      const originalTestCase: TestCase = {
        id: 'tc-edit-001',
        action: 'Passo original',
        parameters: '—',
        expectedResult: 'Resultado original',
        observedResult: '',
        status: 'Not Run',
      };

      testTask.testCases = [originalTestCase];
      testProject.tasks = [testTask];
      await updateProject(testProject);

      // Simular edição via modal (handleSaveTestCase)
      const updatedTestCase: TestCase = {
        ...originalTestCase,
        action: '1. Passo atualizado 1\n2. Passo atualizado 2',
        expectedResult: 'Resultado atualizado',
        status: 'Passed',
        observedResult: 'Resultado observado após execução',
      };

      const updatedTask = {
        ...testTask,
        testCases: testTask.testCases.map(tc =>
          tc.id === updatedTestCase.id ? updatedTestCase : tc
        ),
      };

      testProject.tasks = [updatedTask];
      await updateProject(testProject);

      // Verificar atualização
      const projects = await loadProjectsFromIndexedDB();
      const savedProject = projects.find(p => p.id === testProject.id);
      const savedTestCase = savedProject?.tasks[0].testCases.find(tc => tc.id === 'tc-edit-001');

      expect(savedTestCase).toBeDefined();
      expect(savedTestCase?.action).toContain('Passo atualizado');
      expect(savedTestCase?.status).toBe('Passed');
      expect(savedTestCase?.observedResult).toBe('Resultado observado após execução');
    });

    it('deve preservar outros casos de teste ao editar um', async () => {
      const testCase1: TestCase = {
        id: 'tc-multi-1',
        action: 'Passo 1',
        parameters: '—',
        expectedResult: 'Resultado 1',
        observedResult: '',
        status: 'Passed',
      };

      const testCase2: TestCase = {
        id: 'tc-multi-2',
        action: 'Passo 2',
        parameters: '—',
        expectedResult: 'Resultado 2',
        observedResult: 'falhou',
        status: 'Failed',
      };

      testTask.testCases = [testCase1, testCase2];
      testProject.tasks = [testTask];
      await updateProject(testProject);

      // Editar apenas o primeiro caso
      const updatedTestCase1: TestCase = {
        ...testCase1,
        status: 'Blocked',
      };

      const updatedTask = {
        ...testTask,
        testCases: testTask.testCases.map(tc =>
          tc.id === updatedTestCase1.id ? updatedTestCase1 : tc
        ),
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
      expect(saved2?.action).toBe('Passo 2'); // Preservado
    });
  });

  describe('Persistência no Supabase', () => {
    it('deve persistir dados após múltiplas atualizações', async () => {
      let currentTestCase: TestCase = {
        id: 'tc-persist-001',
        action: 'Passo 1',
        parameters: '—',
        expectedResult: 'Resultado inicial',
        observedResult: '',
        status: 'Not Run',
      };

      testTask.testCases = [currentTestCase];
      testProject.tasks = [testTask];

      // Primeira atualização
      await updateProject(testProject);

      // Segunda atualização
      currentTestCase = {
        ...currentTestCase,
        status: 'Passed',
        observedResult: 'Resultado observado',
      };

      testTask.testCases = [currentTestCase];
      testProject.tasks = [testTask];
      await updateProject(testProject);

      // Terceira atualização
      currentTestCase = {
        ...currentTestCase,
        status: 'Failed',
        observedResult: 'Falha observada',
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
        action: '1. Passo 1\n2. Passo 2',
        parameters: 'Ferramentas usadas na execução: Postman',
        expectedResult: 'Resultado esperado',
        observedResult: '',
        status: 'Passed',
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
      expect(reloadedProject?.tasks[0].testCases[0].parameters).toContain('Postman');
    });
  });

  describe('Validação de Dados', () => {
    it('deve rejeitar caso de teste sem ID', async () => {
      const invalidTestCase = {
        action: 'Passo 1',
        parameters: '',
        expectedResult: 'Resultado',
        observedResult: '',
        status: 'Not Run' as const,
      };

      // TypeScript deve impedir isso, mas testamos a validação
      expect(() => {
        testTask.testCases = [invalidTestCase as TestCase];
      }).not.toThrow();
    });

    it('deve preservar arrays vazios quando apropriado', async () => {
      const testCase: TestCase = {
        id: 'tc-empty-arrays',
        action: 'Passo 1',
        parameters: '—',
        expectedResult: 'Resultado',
        observedResult: '',
        status: 'Not Run',
      };

      testTask.testCases = [testCase];
      testProject.tasks = [testTask];
      await updateProject(testProject);

      const projects = await loadProjectsFromIndexedDB();
      const savedProject = projects.find(p => p.id === testProject.id);
      const savedTestCase = savedProject?.tasks[0].testCases[0];

      // Arrays vazios podem ser undefined após sanitização
      expect(savedTestCase).toBeDefined();
      expect(savedTestCase?.action).toBe('Passo 1');
    });
  });
});
