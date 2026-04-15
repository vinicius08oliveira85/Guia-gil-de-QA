---
tag: business-rule
status: active
file_origin: store/middleware.ts
aggregate: module
---

# Módulo: Middleware

**Descrição:** Agregado de `store/middleware.ts` com 3 exportação(ões) relevante(s) (funções, const arrow e schemas Zod `*Schema`).

**Exportações analisadas:** 3

## `loggerMiddleware`

**Descrição:** Middleware para logging de ações do store Registra todas as mudanças de estado para debugging

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):** _Nenhuma entidade tipada detectada neste export._

---

## `persistMiddleware`

**Descrição:** Middleware para logging de ações do store Registra todas as mudanças de estado para debugging / export const loggerMiddleware = <T extends object>( config: StateCreator<T>, name?: string ): StateCreator<T> => { return (set, get, api) => { const storeName = name || 'Store'; return config( (...args) => { const result = set(...args); const newState = get(); logger.debug( `[${storeName}] State updated`, 'Store', { state: newState } ); return result; }, get, api ); }; }; /** Middleware para persistên

**Lógica Aplicada:**

- [ ] Avaliar condição: `options.include`
- [ ] Avaliar condição: `options.exclude`

**Referências (trecho):** _Nenhuma entidade tipada detectada neste export._

---

## `protectionMiddleware`

**Descrição:** Middleware para logging de ações do store Registra todas as mudanças de estado para debugging / export const loggerMiddleware = <T extends object>( config: StateCreator<T>, name?: string ): StateCreator<T> => { return (set, get, api) => { const storeName = name || 'Store'; return config( (...args) => { const result = set(...args); const newState = get(); logger.debug( `[${storeName}] State updated`, 'Store', { state: newState } ); return result; }, get, api ); }; }; /** Middleware para persistên

**Lógica Aplicada:**

- [ ] Avaliar condição: `isDestructive && options.getProjectFromState && options.getProjectId`
- [ ] Avaliar condição: `project && projectId`
- [ ] Avaliar condição: `newProject`
- [ ] Avaliar condição: `fixResult.restoredFromBackup`
- [ ] Avaliar condição: `fixResult.wasFixed`

**Referências (trecho):**

[[Project]]

---

**Referências (módulo):**

[[Project]]
