# Testes - QA Agile Guide

Este diretório contém os testes automatizados do projeto.

## Estrutura

```
tests/
├── setup.ts              # Configuração global dos testes
├── hooks/                # Testes de hooks customizados
│   ├── useErrorHandler.test.ts
│   └── useLocalStorage.test.ts
└── components/           # Testes de componentes
    └── ErrorBoundary.test.tsx
```

## Executando Testes

```bash
# Executar todos os testes
npm test

# Executar em modo watch
npm run test:watch

# Executar com UI interativa
npm run test:ui

# Executar com cobertura
npm run test:coverage
```

## Adicionando Novos Testes

1. Crie arquivos `.test.ts` ou `.test.tsx` próximos ao código testado
2. Use Vitest e Testing Library
3. Siga os padrões dos testes existentes

## Cobertura de Testes

Meta: > 70% de cobertura

Execute `npm run test:coverage` para ver o relatório de cobertura.
