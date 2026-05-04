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

## Storybook (opcional)

```bash
npm run storybook
```
