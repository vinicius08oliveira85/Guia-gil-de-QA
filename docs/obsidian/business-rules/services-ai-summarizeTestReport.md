---
tag: business-rule
status: active
file_origin: services/ai/testReportSummaryService.ts
---

# Limite de caracteres do relatório enviado à IA (evita payload excessivo e stack

**Descrição:** Limite de caracteres do relatório enviado à IA (evita payload excessivo e stack overflow no cliente). */ const MAX_REPORT_LENGTH = 15_000; /** Gera uma versão resumida do registro de testes usando IA. Mantém: identificador da tarefa, título, casos executados com status e resultado encontrado. Não inclui ferramentas de teste.

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
