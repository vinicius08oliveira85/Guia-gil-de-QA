---
tag: business-rule
status: active
file_origin: services/fileImportService.ts
---

# Importa casos de teste de um arquivo Excel / export const importTestCasesFromExc

**Descrição:** Importa casos de teste de um arquivo Excel / export const importTestCasesFromExcel = async ( file: File, taskId: string, options: ImportOptions = {} ): Promise<ImportResult<TestCase[]>> => { try { if (!taskId || taskId.trim() === '') { return { success: false, error: 'ID da tarefa é obrigatório para importar casos de teste' }; } validateFileSize(file); validateFileType(file, ['xlsx', 'xls', 'spreadsheet', 'excel']); const arrayBuffer = await file.arrayBuffer(); const workbook = XLSX.read(arrayBu

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

[[ProjectDocument]]
