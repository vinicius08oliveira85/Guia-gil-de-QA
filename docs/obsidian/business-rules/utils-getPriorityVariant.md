---
tag: business-rule
status: active
file_origin: utils/taskHelpers.ts
---

# Mapeia nome de status (Jira ou PT) para categoria interna

**Descrição:** Mapeia nome de status (Jira ou PT) para categoria interna. Mesma lógica do jiraService. */ const mapJiraStatusToTaskStatus = (jiraStatus: string | undefined | null): 'To Do' | 'In Progress' | 'Done' => { if (!jiraStatus) return 'To Do'; const s = jiraStatus.toLowerCase(); if (s.includes('done') || s.includes('resolved') || s.includes('closed') || s.includes('concluído') || s.includes('concluido') || s.includes('finalizado') || s.includes('resolvido') || s.includes('fechado')) return 'Done'; if (

**Lógica Aplicada:**

- [ ] Avaliar condição: `priority === 'Urgente' || priority === 'Crítica'`
- [ ] Avaliar condição: `priority === 'Alta'`
- [ ] Avaliar condição: `priority === 'Média'`
- [ ] Avaliar condição: `priority === 'Baixa'`

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
