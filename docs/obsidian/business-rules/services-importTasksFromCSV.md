---
tag: business-rule
status: active
file_origin: services/fileImportService.ts
---

# Importa um projeto de um arquivo JSON / export const importProjectFromJSON = asy

**Descrição:** Importa um projeto de um arquivo JSON / export const importProjectFromJSON = async (file: File): Promise<ImportResult<Project>> => { try { validateFileSize(file); validateFileType(file, ['json', 'application/json']); const text = await file.text(); const json = JSON.parse(text); // Suportar diferentes estruturas de JSON const projectData = json.project || json; if (!projectData.id || !projectData.name) { return { success: false, error: 'Arquivo JSON inválido: campos obrigatórios (id, name) não e

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

_Nenhuma entidade tipada detectada automaticamente._
