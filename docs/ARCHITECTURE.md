# Arquitetura - QA Agile Guide

## Visão Geral

QA Agile Guide é uma aplicação React moderna construída com TypeScript, Vite e Tailwind CSS.

## Estrutura de Pastas

```
qa-agile-guide/
├── api/                  # Serverless functions (Vercel)
│   ├── jira-proxy.ts
│   └── supabaseProxy.ts
├── components/           # Componentes React
│   ├── common/          # Componentes reutilizáveis
│   ├── tasks/           # Componentes de tarefas
│   ├── dashboard/       # Dashboards e métricas
│   └── ...
├── hooks/               # React hooks customizados
├── services/            # Serviços de negócio
│   ├── ai/             # Serviços de IA
│   ├── dbService.ts     # IndexedDB
│   └── supabaseService.ts
├── store/               # Estado global (Zustand)
├── tests/               # Testes automatizados
├── utils/               # Utilitários
└── types.ts            # Definições TypeScript
```

## Gerenciamento de Estado

### Estado Global (Zustand)

O projeto usa Zustand para gerenciamento de estado global:

- `store/projectsStore.ts` - Estado de projetos e tarefas

### Estado Local

Componentes individuais usam `useState` para estado local que não precisa ser compartilhado.

## Armazenamento de Dados

### IndexedDB (Local)

Armazenamento local no navegador via IndexedDB. Implementado em `services/dbService.ts`.

### Supabase (Cloud)

Armazenamento na nuvem opcional via Supabase. Implementado em `services/supabaseService.ts`.

## Testes

- **Framework**: Vitest
- **Testing Library**: @testing-library/react
- **Cobertura**: Meta de 70%+

## Build e Deploy

- **Build Tool**: Vite
- **Deploy**: Vercel
- **CI/CD**: GitHub Actions

## Decisões Arquiteturais

### Por que Zustand?

- Leve e simples
- Sem boilerplate
- TypeScript nativo
- Boa performance

### Por que IndexedDB + Supabase?

- IndexedDB: Funciona offline, rápido
- Supabase: Sincronização entre dispositivos, backup na nuvem

### Por que Vitest?

- Rápido (usa Vite)
- Compatível com Vite
- TypeScript nativo
- Boa experiência de desenvolvimento
