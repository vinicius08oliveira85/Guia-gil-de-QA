# Prompt de comando – Modal Registro de Testes

Use o texto abaixo em comandos, issues ou instruções (ex.: Cursor, outro dev) para referenciar o modal de Registro de Testes e o comportamento desejado.

---

```
Contexto: Modal "Registro de Testes Realizados" (TestReportModal).
DOM: div#modal-content > div.flex-1.overflow-y-auto (conteúdo rolável do modal) contendo seletor de formato (Texto estruturado, Markdown, Resumido), botões Baixar/Copiar, resumo visual dos casos e textarea readonly com aria-label="Conteúdo do relatório de testes".
Objetivo: O relatório deve ser mais resumido, conter apenas informações dos testes (sem ferramentas de teste) e ter opção de "Resumir com IA" que preenche o textarea com versão concisa gerada por IA.
Arquivos principais: components/tasks/TestReportModal.tsx, utils/testReportGenerator.ts e, para IA, services/ai/testReportSummaryService.ts.
```

---

## Implementação atual

- **Formatos:** Texto estruturado, Markdown e **Resumido** (compacto, sem ferramentas).
- **Gerador:** [utils/testReportGenerator.ts](../utils/testReportGenerator.ts) — opções `includeTools` (default `false`) e `concise` (formato resumido).
- **Resumir com IA:** botão no modal chama [services/ai/testReportSummaryService.ts](../services/ai/testReportSummaryService.ts) e atualiza o conteúdo do textarea com o resumo gerado pelo Gemini.
