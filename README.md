# QA Agile Guide

Aplicação web (React + Vite + TypeScript). Variáveis de ambiente de referência estão em [`.env.example`](.env.example).

## Desenvolvimento

```bash
npm install --legacy-peer-deps
npm run dev
```

Proxy Supabase local (Vercel): `npm run dev:local` (requer configuração no Vercel/variáveis).

## Build e qualidade

```bash
npm run type-check
npm run build
npm run lint
npm run test -- --run
```

## IA — geração de casos de teste

Na API interna (`AIService.generateTestCasesForTask` / `testCaseGenerationService`), o nível de detalhe dos roteiros é **`Resumido`** ou **`Estruturado`** (`TestCaseDetailLevel` em `types.ts`). Valores legados (`Padrão`, `Detalhado`) são tratados por `normalizeTestCaseDetailLevel` e mapeados para **`Estruturado`**. O texto enviado ao modelo por nível está em `services/ai/testGenerationPrompts.ts` (`detailLevelBlock`).

## Storybook (opcional)

```bash
npm run storybook
```
