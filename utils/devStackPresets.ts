import type { DevStackConfig } from '../types';

export const EMPTY_DEV_STACK: DevStackConfig = {
  languages: [],
  frameworks: [],
  databases: [],
  tools: [],
  architectureStyle: '',
  testingApproach: '',
  notes: '',
  implementationTool: 'cursor',
};

export interface DevStackPreset {
  id: string;
  name: string;
  description: string;
  config: DevStackConfig;
}

export const DEV_STACK_PRESETS: DevStackPreset[] = [
  {
    id: 'react-vite-supabase',
    name: 'React + Vite + Supabase',
    description: 'SPA TypeScript com backend Supabase',
    config: {
      languages: ['TypeScript'],
      frameworks: ['React', 'Vite'],
      databases: ['PostgreSQL (Supabase)'],
      tools: ['Supabase CLI', 'ESLint', 'Vitest', 'Cursor AI'],
      architectureStyle: 'Componentes + hooks + services',
      testingApproach: 'Vitest + testes de integração',
    },
  },
  {
    id: 'nestjs-postgres',
    name: 'NestJS + PostgreSQL',
    description: 'API REST modular com TypeORM/Prisma',
    config: {
      languages: ['TypeScript'],
      frameworks: ['NestJS'],
      databases: ['PostgreSQL'],
      tools: ['Docker', 'Swagger', 'Jest', 'Cursor AI'],
      architectureStyle: 'Clean Architecture / módulos Nest',
      testingApproach: 'TDD com Jest (unit + e2e)',
    },
  },
  {
    id: 'python-fastapi',
    name: 'Python + FastAPI',
    description: 'API Python assíncrona',
    config: {
      languages: ['Python'],
      frameworks: ['FastAPI'],
      databases: ['PostgreSQL'],
      tools: ['Docker', 'Poetry', 'pytest', 'Cursor AI'],
      architectureStyle: 'Camadas router → service → repository',
      testingApproach: 'pytest + TestClient',
    },
  },
];

export function normalizeDevStackConfig(
  stack: DevStackConfig | undefined | null
): DevStackConfig {
  if (!stack) return { ...EMPTY_DEV_STACK };
  return {
    languages: [...(stack.languages ?? [])],
    frameworks: [...(stack.frameworks ?? [])],
    databases: [...(stack.databases ?? [])],
    tools: [...(stack.tools ?? [])],
    architectureStyle: stack.architectureStyle?.trim() ?? '',
    testingApproach: stack.testingApproach?.trim() ?? '',
    notes: stack.notes?.trim() ?? '',
    implementationTool: 'cursor',
  };
}

export function devStackIsConfigured(stack: DevStackConfig | undefined | null): boolean {
  const s = normalizeDevStackConfig(stack);
  return (
    s.languages.length > 0 ||
    s.frameworks.length > 0 ||
    s.databases.length > 0 ||
    s.tools.length > 0 ||
    Boolean(s.architectureStyle) ||
    Boolean(s.testingApproach) ||
    Boolean(s.notes)
  );
}
