---
tag: business-rule
status: active
file_origin: utils/exportService.ts
---

# Exporta projeto para Excel / export const exportProjectToExcel = async (project:

**Descrição:** Exporta projeto para Excel / export const exportProjectToExcel = async (project: Project): Promise<void> => { try { const workbook = XLSX.utils.book_new(); // Planilha 1: Resumo do Projeto const summaryData = [ ['Projeto', project.name], ['Descrição', project.description || ''], ['Data de Exportação', format(new Date(), 'dd/MM/yyyy HH:mm')], ['Total de Tarefas', project.tasks.filter(t => t.type !== 'Bug').length], ['Total de Bugs', project.tasks.filter(t => t.type === 'Bug').length], ['Total de 

**Lógica Aplicada:**

- [ ] Avaliar condição: `project.description`
- [ ] Avaliar condição: `yPosition < 50`
- [ ] Avaliar condição: `yPosition < 50`
- [ ] Avaliar condição: `yPosition < 100`
- [ ] Avaliar condição: `yPosition < 50`

**Referências:**

[[Project]]
