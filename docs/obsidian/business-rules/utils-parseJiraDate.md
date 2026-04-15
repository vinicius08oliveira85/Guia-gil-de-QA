---
tag: business-rule
status: active
file_origin: utils/jiraFieldMapper.ts
---

# Formata uma data ISO para o formato esperado pelo Jira (YYYY-MM-DD) / export fun

**Descrição:** Formata uma data ISO para o formato esperado pelo Jira (YYYY-MM-DD) / export function formatDateForJira(dateString: string): string { if (!dateString) return ''; const date = new Date(dateString); return date.toISOString().split('T')[0]; } /** Formata uma data do Jira para ISO string

**Lógica Aplicada:**

- [ ] Avaliar condição: `!jiraDate`

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
