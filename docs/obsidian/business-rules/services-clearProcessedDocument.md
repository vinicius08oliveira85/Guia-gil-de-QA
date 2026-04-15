---
tag: business-rule
status: active
file_origin: services/documentProcessingService.ts
---

# Processa um arquivo

**Descrição:** Processa um arquivo .docx e converte para texto / export async function processDocxFile(file: File): Promise<string> { try { const arrayBuffer = await file.arrayBuffer(); const result = await mammoth.extractRawText({ arrayBuffer }); if (result.messages.length > 0) { logger.warn('Avisos ao processar documento', 'documentProcessingService', { messages: result.messages }); } return result.value; } catch (error) { logger.error('Erro ao processar arquivo .docx', 'documentProcessingService', error); t

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

[[Project]]
