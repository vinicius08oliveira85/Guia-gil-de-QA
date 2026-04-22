---
tag: business-rule
status: active
file_origin: hooks/useRouterSync.ts
---

# useRouterSync — SPA (dashboard / projeto / settings) e URL

## Descrição

Sincroniza o estado da aplicação (`selectedProjectId`, `showSettings`) com a query string da URL, usando a History API. Convenção:

| Rota | URL (path + search) |
|------|---------------------|
| Dashboard | `/` (sem query canônica) |
| Projeto | `?project=<id>` |
| Configurações | `?view=settings` |

## Comportamento técnico

1. **URL → estado** (`useLayoutEffect`, mount + `popstate`): lê `window.location.search`, normaliza para a search canônica com `replaceState` se houver parâmetros estranhos, depois ajusta `setShowSettings` / `selectProject` conforme a rota parseada.
2. **Estado → URL** (`useEffect`): se a search canônica desejada for diferente da atual, aplica `replaceState` (não `pushState`) para **não encher o histórico** a cada troca interna de projeto ou settings.
3. **`isLoading`**: enquanto `true`, o efeito estado→URL **não roda**, para não competir com a hidratação inicial (carregamento de projetos) e evitar corrida com o layout que aplica a URL.
4. **Projeto inexistente**: se `selectedProjectId` não existir em `projects` (lista já carregada), limpa seleção e zera a query com `replaceState`.

## Integração

- **App.tsx**: passa `selectedProjectId`, `projects`, `showSettings`, `setShowSettings`, `selectProject`, `isLoading`.
- **Tipos**: `Project[]` só para validar id; store continua sendo a fonte de `selectProject`.

## Depuração (loops / overflow)

Se voltar sintoma de loop de render ou pilha:

1. React **Profiler** (dev): gravar commit e ver componentes que re-renderizam em excesso.
2. Confirmar que `isLoading` é repassado e que não há outro código chamando `history.pushState`/`replaceState` em conflito com este hook.
3. Testes: `tests/hooks/useRouterSync.test.ts`.

## Checklist de revisão

- [x] Condições explícitas (if/early return) revisadas no arquivo de origem.
- [x] Integração com `App` e opções do hook documentadas.

## Referências

- `hooks/useRouterSync.ts`
- `tests/hooks/useRouterSync.test.ts`
