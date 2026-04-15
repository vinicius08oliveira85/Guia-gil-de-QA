---
tag: business-rule
status: active
file_origin: utils/exportService.ts
---

# Exporta projeto para Word / export const exportProjectToWord = async (project: P

**Descrição:** Exporta projeto para Word / export const exportProjectToWord = async (project: Project): Promise<void> => { try { const tasks = project.tasks || []; const testCases = tasks.flatMap(t => t.testCases || []); const bugs = tasks.filter(t => t.type === 'Bug'); const children: (Paragraph | Table)[] = [ new Paragraph({ text: project.name, heading: HeadingLevel.TITLE }), new Paragraph({ text: `Data de Exportação: ${format(new Date(), 'dd/MM/yyyy HH:mm')}` }), new Paragraph({ text: '' }), new Paragraph({

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

[[JiraTask]]
