---
tag: business-rule
status: active
file_origin: hooks/useErrorHandler.ts
---

# Interface para erros customizados da aplicação / export interface AppError exten

**Descrição:** Interface para erros customizados da aplicação / export interface AppError extends Error { code?: string; context?: string; } /** Hook para tratamento centralizado de erros e notificações ```tsx const { handleError, handleSuccess } = useErrorHandler(); try { await someOperation(); handleSuccess('Operação concluída!'); } catch (error) { handleError(error, 'Nome da operação'); } ```

**Lógica Aplicada:**

- [ ] Avaliar condição: `error instanceof Error`
- [ ] Avaliar condição: `'code' in error`
- [ ] Avaliar condição: `typeof error === 'string'`
- [ ] Avaliar condição: `typeof error === 'object' && error !== null && 'code' in error`
- [ ] Avaliar condição: `typeof c === 'string'`
- [ ] Avaliar condição: `typeof m === 'string'`

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
