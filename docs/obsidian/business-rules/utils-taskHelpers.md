---
tag: business-rule
status: active
file_origin: utils/taskHelpers.ts
aggregate: module
---

# Módulo: Task Helpers

**Descrição:** Agregado de `utils/taskHelpers.ts` com 5 exportação(ões) relevante(s) (funções, const arrow e schemas Zod `*Schema`).

**Exportações analisadas:** 5

## `getPriorityVariant`

**Descrição:** Mapeia nome de status (Jira ou PT) para categoria interna. Mesma lógica do jiraService. */ const mapJiraStatusToTaskStatus = (jiraStatus: string | undefined | null): 'To Do' | 'In Progress' | 'Done' => { if (!jiraStatus) return 'To Do'; const s = jiraStatus.toLowerCase(); if (s.includes('done') || s.includes('resolved') || s.includes('closed') || s.includes('concluído') || s.includes('concluido') || s.includes('finalizado') || s.includes('resolvido') || s.includes('fechado')) return 'Done'; if (

**Lógica Aplicada:**

- [ ] Avaliar condição: `priority === 'Urgente' || priority === 'Crítica'`
- [ ] Avaliar condição: `priority === 'Alta'`
- [ ] Avaliar condição: `priority === 'Média'`
- [ ] Avaliar condição: `priority === 'Baixa'`

**Referências (trecho):** _Nenhuma entidade tipada detectada neste export._

---

## `getDisplayStatus`

**Descrição:** Mapeia nome de status (Jira ou PT) para categoria interna. Mesma lógica do jiraService. */ const mapJiraStatusToTaskStatus = (jiraStatus: string | undefined | null): 'To Do' | 'In Progress' | 'Done' => { if (!jiraStatus) return 'To Do'; const s = jiraStatus.toLowerCase(); if (s.includes('done') || s.includes('resolved') || s.includes('closed') || s.includes('concluído') || s.includes('concluido') || s.includes('finalizado') || s.includes('resolvido') || s.includes('fechado')) return 'Done'; if (

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[JiraTask]]

---

## `getDisplayStatusLabel`

**Descrição:** Mapeia nome de status (Jira ou PT) para categoria interna. Mesma lógica do jiraService. */ const mapJiraStatusToTaskStatus = (jiraStatus: string | undefined | null): 'To Do' | 'In Progress' | 'Done' => { if (!jiraStatus) return 'To Do'; const s = jiraStatus.toLowerCase(); if (s.includes('done') || s.includes('resolved') || s.includes('closed') || s.includes('concluído') || s.includes('concluido') || s.includes('finalizado') || s.includes('resolvido') || s.includes('fechado')) return 'Done'; if (

**Lógica Aplicada:**

- [ ] Avaliar condição: `task.jiraStatus`
- [ ] Avaliar condição: `jiraStatuses?.length`

**Referências (trecho):**

[[JiraTask]]

---

## `getDisplayPriorityLabel`

**Descrição:** Mapeia nome de status (Jira ou PT) para categoria interna. Mesma lógica do jiraService. */ const mapJiraStatusToTaskStatus = (jiraStatus: string | undefined | null): 'To Do' | 'In Progress' | 'Done' => { if (!jiraStatus) return 'To Do'; const s = jiraStatus.toLowerCase(); if (s.includes('done') || s.includes('resolved') || s.includes('closed') || s.includes('concluído') || s.includes('concluido') || s.includes('finalizado') || s.includes('resolvido') || s.includes('fechado')) return 'Done'; if (

**Lógica Aplicada:**

- [ ] Avaliar condição: `task.jiraPriority`
- [ ] Avaliar condição: `jiraPriorities?.length`

**Referências (trecho):**

[[JiraTask]]

---

## `getTestPhaseStatus`

**Descrição:** Mapeia nome de status (Jira ou PT) para categoria interna. Mesma lógica do jiraService. */ const mapJiraStatusToTaskStatus = (jiraStatus: string | undefined | null): 'To Do' | 'In Progress' | 'Done' => { if (!jiraStatus) return 'To Do'; const s = jiraStatus.toLowerCase(); if (s.includes('done') || s.includes('resolved') || s.includes('closed') || s.includes('concluído') || s.includes('concluido') || s.includes('finalizado') || s.includes('resolvido') || s.includes('fechado')) return 'Done'; if (

**Lógica Aplicada:**

- [ ] Avaliar condição: `task.type === 'Epic' || task.type === 'História'`
- [ ] Avaliar condição: `subtasks.length === 0`
- [ ] Avaliar condição: `!testCases || testCases.length === 0`

**Referências (trecho):**

[[JiraTask]]

---

**Referências (módulo):**

[[JiraTask]]
