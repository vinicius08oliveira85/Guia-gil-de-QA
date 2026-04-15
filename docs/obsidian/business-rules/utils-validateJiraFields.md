---
tag: business-rule
status: active
file_origin: utils/jiraFieldMapper.ts
---

# Formata uma data ISO para o formato esperado pelo Jira (YYYY-MM-DD) / export fun

**Descrição:** Formata uma data ISO para o formato esperado pelo Jira (YYYY-MM-DD) / export function formatDateForJira(dateString: string): string { if (!dateString) return ''; const date = new Date(dateString); return date.toISOString().split('T')[0]; } /** Formata uma data do Jira para ISO string / export function parseJiraDate(jiraDate: string): string { if (!jiraDate) return ''; // Jira retorna datas no formato ISO, então podemos retornar diretamente return jiraDate; } /** Valida se uma chave de issue do J

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

[[JiraTask]]
