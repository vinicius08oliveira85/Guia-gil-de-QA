---
tag: business-rule
status: active
file_origin: utils/timelineColors.ts
---

# Retorna classes CSS para o card ativo do timeline baseado no tema / export const

**Descrição:** Retorna classes CSS para o card ativo do timeline baseado no tema / export const getActiveCardClasses = (theme: Theme): string => { switch (theme) { case 'dark': return 'border-surface-border bg-surface shadow-lg'; case 'light': return 'border-surface-border bg-surface shadow-lg'; case 'leve-saude': return 'border-surface-border bg-surface shadow-lg'; case 'auto': { const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches; return prefersDark ? 'border-surface-border bg-surfa

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
