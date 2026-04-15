---
tag: business-rule
status: active
file_origin: hooks/useDocumentMetrics.ts
---

# Detecta a categoria de um documento baseado no nome e conteúdo / function detect

**Descrição:** Detecta a categoria de um documento baseado no nome e conteúdo / function detectCategory(name: string, content: string): string { const lowerName = name.toLowerCase(); const lowerContent = content.toLowerCase(); if (lowerName.includes('requisito') || lowerContent.includes('requisito') || lowerContent.includes('requirement')) { return 'requisitos'; } if (lowerName.includes('teste') || lowerName.includes('test') || lowerContent.includes('caso de teste') || lowerContent.includes('test case')) { ret

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

[[Project]] [[ProjectDocument]]
