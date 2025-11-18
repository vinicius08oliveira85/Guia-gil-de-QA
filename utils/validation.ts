import { z } from 'zod';

// Schemas de validação
export const ProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Nome do projeto é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().max(1000, 'Descrição muito longa'),
  documents: z.array(z.any()).default([]),
  tasks: z.array(z.any()).default([]),
  phases: z.array(z.any()).default([]),
});

export const TaskSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Título muito longo'),
  description: z.string().max(5000, 'Descrição muito longa'),
  status: z.enum(['To Do', 'In Progress', 'Done']),
  type: z.enum(['Epic', 'História', 'Tarefa', 'Bug']),
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

