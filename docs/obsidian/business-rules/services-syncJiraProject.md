---
tag: business-rule
status: active
file_origin: services/jiraService.ts
---

# Facade do módulo Jira: reexporta todas as funções e tipos de services/jira/ e in

**Descrição:** Facade do módulo Jira: reexporta todas as funções e tipos de services/jira/ e injeta a dependência do store em syncJiraProject para manter compatibilidade. / import * as jira from './jira'; import type { JiraConfig } from './jira'; import type { Project } from '../types'; import { useProjectsStore } from '../store/projectsStore'; export * from './jira'; /** Sincroniza o projeto com o Jira, usando o projeto mais recente do store quando disponível. (Wrapper que injeta getLatestProject para o módul

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

[[Project]]
