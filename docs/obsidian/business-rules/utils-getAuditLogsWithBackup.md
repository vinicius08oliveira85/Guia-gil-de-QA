---
tag: business-rule
status: active
file_origin: utils/auditLog.ts
---

# Obtém logs de auditoria filtrados por origem / export const getAuditLogsByOrigin

**Descrição:** Obtém logs de auditoria filtrados por origem / export const getAuditLogsByOrigin = (origin: AuditLogEntry['origin']): AuditLogEntry[] => { return getAuditLogs().filter(log => log.origin === origin); }; /** Obtém logs de auditoria que têm backup associado

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
