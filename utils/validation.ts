import { z } from 'zod';
import { PhaseName, PhaseStatus } from '../types';

// Schemas auxiliares
export const ProjectDocumentSchema = z.object({
  name: z.string().min(1),
  content: z.string(),
  analysis: z.string().optional(),
});

export const PhaseSchema = z.object({
  name: z.enum([
    'Request',
    'Analysis',
    'Design',
    'Analysis and Code',
    'Build',
    'Test',
    'Release',
    'Deploy',
    'Operate',
    'Monitor',
  ]),
  status: z.enum(['Não Iniciado', 'Em Andamento', 'Concluído']),
  summary: z.string().optional(),
  testTypes: z.array(z.string()).optional(),
});

// Schemas de validação
export const ProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Nome do projeto é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().max(1000, 'Descrição muito longa'),
  documents: z.array(ProjectDocumentSchema).default([]),
  tasks: z.array(z.any()).default([]), // TaskSchema é muito complexo, manter any por enquanto
  phases: z.array(PhaseSchema).default([]),
});

export const TaskSchema = z.object({
  id: z.string().min(3, 'ID deve ter pelo menos 3 caracteres').max(50, 'ID muito longo'),
  title: z.string().min(5, 'Título deve ter pelo menos 5 caracteres').max(200, 'Título muito longo'),
  description: z.string().max(5000, 'Descrição muito longa').optional(),
  status: z.enum(['To Do', 'In Progress', 'Done']).default('To Do'),
  type: z.enum(['Epic', 'História', 'Tarefa', 'Bug']),
  priority: z.enum(['Baixa', 'Média', 'Alta', 'Urgente']).optional(),
  severity: z.enum(['Crítico', 'Alto', 'Médio', 'Baixo']).optional(),
  owner: z.enum(['Product', 'QA', 'Dev']).optional(),
  assignee: z.enum(['Product', 'QA', 'Dev']).optional(),
  tags: z.array(z.string()).optional(),
  parentId: z.string().optional(),
});

export const TestCaseSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1, 'Descrição é obrigatória'),
  steps: z.array(z.string()).min(1, 'Pelo menos um passo é necessário'),
  expectedResult: z.string().min(1, 'Resultado esperado é obrigatório'),
});

export const BddScenarioSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Título é obrigatório'),
  gherkin: z.string().min(1, 'Cenário Gherkin é obrigatório'),
});

// Funções de validação
export const validateProject = (data: unknown) => {
  return ProjectSchema.safeParse(data);
};

export const validateTask = (data: unknown) => {
  return TaskSchema.safeParse(data);
};

export const validateTestCase = (data: unknown) => {
  return TestCaseSchema.safeParse(data);
};

export const validateBddScenario = (data: unknown) => {
  return BddScenarioSchema.safeParse(data);
};


