---
tag: business-rule
status: active
file_origin: utils/exportService.ts
---

# Exporta projeto para PDF / export const exportProjectToPDF = async (project: Pro

**Descrição:** Exporta projeto para PDF / export const exportProjectToPDF = async (project: Project): Promise<void> => { try { const pdfDoc = await PDFDocument.create(); let page = pdfDoc.addPage([595, 842]); // A4 const font = await pdfDoc.embedFont(StandardFonts.Helvetica); const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold); let yPosition = 800; const margin = 50; // Título page.drawText(project.name, { x: margin, y: yPosition, size: 20, font: boldFont, color: rgb(0, 0, 0) }); yPosition -= 

**Lógica Aplicada:**

- [ ] Avaliar condição: `taskRows.length > 0`

**Referências:**

[[Project]]
