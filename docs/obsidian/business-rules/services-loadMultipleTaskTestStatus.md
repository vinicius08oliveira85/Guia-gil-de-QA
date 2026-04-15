---
tag: business-rule
status: active
file_origin: services/taskTestStatusService.ts
---

# Calcula o status de teste baseado nos testCases da task ou nas subtarefas (para

**Descrição:** Calcula o status de teste baseado nos testCases da task ou nas subtarefas (para Epic/História) Regras para Epic/História: - Se não há subtarefas → 'testar' - Se todas as subtarefas estão 'teste_concluido' → 'teste_concluido' - Se alguma subtarefa está 'pendente' → 'pendente' - Se alguma subtarefa está 'testando' → 'testando' - Caso contrário → 'testar' Regras para Tarefa/Bug: 1. Se não há testCases → 'testar' (laranja) 2. Se todos os testCases foram executados (nenhum 'Not Run') e nenhum está 'F

**Lógica Aplicada:**

- [ ] Avaliar condição: `taskKeys.length === 0`
- [ ] Avaliar condição: `forceLocalOnly`

**Referências:**

[[TaskTestStatus]]
