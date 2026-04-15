---
tag: business-rule
status: active
file_origin: utils/jiraStatusCategorizer.ts
---

# Categorias de status do Jira para agrupamento e análise / export type JiraStatus

**Descrição:** Categorias de status do Jira para agrupamento e análise / export type JiraStatusCategory = 'Concluído' | 'Validado' | 'Em Andamento' | 'Pendente' | 'Bloqueado' | 'Outros'; /** Categoriza um status do Jira em uma das categorias predefinidas / export const categorizeJiraStatus = (jiraStatus: string | undefined): JiraStatusCategory => { if (!jiraStatus) return 'Pendente'; const status = jiraStatus.toLowerCase().trim(); // Concluído: Status que indicam conclusão if ( status.includes('done') || statu

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

[[JiraTask]]
