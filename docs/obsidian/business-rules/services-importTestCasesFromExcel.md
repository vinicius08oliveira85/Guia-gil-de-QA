---
tag: business-rule
status: active
file_origin: services/fileImportService.ts
---

# Importa tarefas de um arquivo CSV / export const importTasksFromCSV = async (fil

**Descrição:** Importa tarefas de um arquivo CSV / export const importTasksFromCSV = async (file: File, options: ImportOptions = {}): Promise<ImportResult<JiraTask[]>> => { try { validateFileSize(file); validateFileType(file, ['csv', 'text/csv']); const text = await file.text(); const lines = text.split('\n').filter(line => line.trim()); if (lines.length < 2) { return { success: false, error: 'Arquivo CSV vazio ou sem dados' }; } // Parsear header const headers = lines[0].split(',').map(h => h.trim().replace(/

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
