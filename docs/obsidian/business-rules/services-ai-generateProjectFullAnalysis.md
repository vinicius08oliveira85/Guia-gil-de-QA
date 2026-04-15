---
tag: business-rule
status: active
file_origin: services/ai/projectFullAnalysisService.ts
---

# Máximo de tarefas incluídas no contexto enviado ao modelo para análise completa

**Descrição:** Máximo de tarefas incluídas no contexto enviado ao modelo para análise completa. */ const MAX_TASKS_IN_CONTEXT = 100; /** Máximo de caracteres por trecho de documento no contexto. */ const MAX_DOCUMENTS_SNIPPET_CHARS = 500; const normalizeSnippet = (value: string | undefined, maxLength: number): string => { if (!value) return ''; const s = value.replace(/\s+/g, ' ').trim(); return s.length <= maxLength ? s : `${s.slice(0, maxLength)}…`; }; function aggregateTestExecutionForContext(tasks: Project

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

[[Project]] [[ProjectFullAnalysis]]
