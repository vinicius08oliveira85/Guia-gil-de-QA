---
tag: business-rule
status: active
file_origin: utils/jiraStatusCategorizer.ts
aggregate: module
---

# Módulo: Jira Status Categorizer

**Descrição:** Agregado de `utils/jiraStatusCategorizer.ts` com 6 exportação(ões) relevante(s) (funções, const arrow e schemas Zod `*Schema`).

**Exportações analisadas:** 6

## `categorizeJiraStatus`

**Descrição:** Categorias de status do Jira para agrupamento e análise / export type JiraStatusCategory = 'Concluído' | 'Validado' | 'Em Andamento' | 'Pendente' | 'Bloqueado' | 'Outros'; /** Categoriza um status do Jira em uma das categorias predefinidas

**Lógica Aplicada:**

- [ ] Avaliar condição: `!jiraStatus`

**Referências (trecho):** _Nenhuma entidade tipada detectada neste export._

---

## `getTaskStatusCategory`

**Descrição:** Categorias de status do Jira para agrupamento e análise / export type JiraStatusCategory = 'Concluído' | 'Validado' | 'Em Andamento' | 'Pendente' | 'Bloqueado' | 'Outros'; /** Categoriza um status do Jira em uma das categorias predefinidas / export const categorizeJiraStatus = (jiraStatus: string | undefined): JiraStatusCategory => { if (!jiraStatus) return 'Pendente'; const status = jiraStatus.toLowerCase().trim(); // Concluído: Status que indicam conclusão if ( status.includes('done') || statu

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[JiraTask]]

---

## `groupTasksByStatusCategory`

**Descrição:** Categorias de status do Jira para agrupamento e análise / export type JiraStatusCategory = 'Concluído' | 'Validado' | 'Em Andamento' | 'Pendente' | 'Bloqueado' | 'Outros'; /** Categoriza um status do Jira em uma das categorias predefinidas / export const categorizeJiraStatus = (jiraStatus: string | undefined): JiraStatusCategory => { if (!jiraStatus) return 'Pendente'; const status = jiraStatus.toLowerCase().trim(); // Concluído: Status que indicam conclusão if ( status.includes('done') || statu

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[JiraTask]]

---

## `countTasksByStatusCategory`

**Descrição:** Categorias de status do Jira para agrupamento e análise / export type JiraStatusCategory = 'Concluído' | 'Validado' | 'Em Andamento' | 'Pendente' | 'Bloqueado' | 'Outros'; /** Categoriza um status do Jira em uma das categorias predefinidas / export const categorizeJiraStatus = (jiraStatus: string | undefined): JiraStatusCategory => { if (!jiraStatus) return 'Pendente'; const status = jiraStatus.toLowerCase().trim(); // Concluído: Status que indicam conclusão if ( status.includes('done') || statu

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[JiraTask]]

---

## `groupTasksByJiraStatus`

**Descrição:** Categorias de status do Jira para agrupamento e análise / export type JiraStatusCategory = 'Concluído' | 'Validado' | 'Em Andamento' | 'Pendente' | 'Bloqueado' | 'Outros'; /** Categoriza um status do Jira em uma das categorias predefinidas / export const categorizeJiraStatus = (jiraStatus: string | undefined): JiraStatusCategory => { if (!jiraStatus) return 'Pendente'; const status = jiraStatus.toLowerCase().trim(); // Concluído: Status que indicam conclusão if ( status.includes('done') || statu

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[JiraTask]]

---

## `countTasksByJiraStatus`

**Descrição:** Categorias de status do Jira para agrupamento e análise / export type JiraStatusCategory = 'Concluído' | 'Validado' | 'Em Andamento' | 'Pendente' | 'Bloqueado' | 'Outros'; /** Categoriza um status do Jira em uma das categorias predefinidas / export const categorizeJiraStatus = (jiraStatus: string | undefined): JiraStatusCategory => { if (!jiraStatus) return 'Pendente'; const status = jiraStatus.toLowerCase().trim(); // Concluído: Status que indicam conclusão if ( status.includes('done') || statu

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências (trecho):**

[[JiraTask]]

---

**Referências (módulo):**

[[JiraTask]]
