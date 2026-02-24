import { Project, JiraTask } from '../types';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';
import { saveAs } from 'file-saver';

export const exportProjectToJSON = (project: Project): string => {
  const exportData = {
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      exportedAt: new Date().toISOString(),
      documents: project.documents,
      tasks: project.tasks,
      phases: project.phases,
      shiftLeftAnalysis: project.shiftLeftAnalysis,
      testPyramidAnalysis: project.testPyramidAnalysis,
    },
  };
  return JSON.stringify(exportData, null, 2);
};

export const exportProjectToCSV = (project: Project): string => {
  const headers = [
    'ID',
    'Título',
    'Tipo',
    'Status',
    'Casos de Teste',
    'Casos Executados',
    'Casos Passados',
    'Casos Falhados',
    'Bugs Abertos',
  ];
  const rows: string[] = [headers.join(',')];

  project.tasks.forEach(task => {
    const testCases = task.testCases || [];
    const executed = testCases.filter(tc => tc.status !== 'Not Run').length;
    const passed = testCases.filter(tc => tc.status === 'Passed').length;
    const failed = testCases.filter(tc => tc.status === 'Failed').length;
    const bugs = project.tasks.filter(t => t.type === 'Bug' && t.status !== 'Done').length;

    const row = [
      task.id,
      `"${task.title.replace(/"/g, '""')}"`,
      task.type,
      task.status,
      testCases.length.toString(),
      executed.toString(),
      passed.toString(),
      failed.toString(),
      bugs.toString(),
    ];
    rows.push(row.join(','));
  });

  return rows.join('\n');
};

export const exportTestCasesToCSV = (tasks: JiraTask[]): string => {
  const headers = [
    'Tarefa ID',
    'Tarefa Título',
    'Caso de Teste ID',
    'Descrição',
    'Status',
    'Automatizado',
    'Estratégias',
  ];
  const rows: string[] = [headers.join(',')];

  tasks.forEach(task => {
    (task.testCases || []).forEach(tc => {
      const row = [
        task.id,
        `"${task.title.replace(/"/g, '""')}"`,
        tc.id,
        `"${tc.description.replace(/"/g, '""')}"`,
        tc.status,
        tc.isAutomated ? 'Sim' : 'Não',
        `"${(tc.strategies || []).join('; ')}"`,
      ];
      rows.push(row.join(','));
    });
  });

  return rows.join('\n');
};

export const generateProjectReport = (project: Project): string => {
  const tasks = project.tasks || [];
  const testCases = tasks.flatMap(t => t.testCases || []);
  const bugs = tasks.filter(t => t.type === 'Bug');
  const openBugs = bugs.filter(t => t.status !== 'Done');

  const totalTestCases = testCases.length;
  const executedTestCases = testCases.filter(tc => tc.status !== 'Not Run').length;
  const passedTestCases = testCases.filter(tc => tc.status === 'Passed').length;
  const failedTestCases = testCases.filter(tc => tc.status === 'Failed').length;
  const automatedTestCases = testCases.filter(tc => tc.isAutomated).length;

  const report = `
# Relatório do Projeto: ${project.name}

**Data de Geração:** ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}

## 📊 Resumo Executivo

- **Total de Tarefas:** ${tasks.filter(t => t.type !== 'Bug').length}
- **Total de Bugs:** ${bugs.length}
- **Bugs Abertos:** ${openBugs.length}
- **Total de Casos de Teste:** ${totalTestCases}
- **Casos Executados:** ${executedTestCases} (${totalTestCases > 0 ? Math.round((executedTestCases / totalTestCases) * 100) : 0}%)
- **Casos Passados:** ${passedTestCases}
- **Casos Falhados:** ${failedTestCases}
- **Taxa de Sucesso:** ${executedTestCases > 0 ? Math.round((passedTestCases / executedTestCases) * 100) : 0}%
- **Casos Automatizados:** ${automatedTestCases} (${totalTestCases > 0 ? Math.round((automatedTestCases / totalTestCases) * 100) : 0}%)

## 📋 Status das Fases

${project.phases
  .map(
    phase => `
### ${phase.name}
- **Status:** ${phase.status}
${phase.summary ? `- **Resumo:** ${phase.summary}` : ''}
${phase.testTypes && phase.testTypes.length > 0 ? `- **Tipos de Teste:** ${phase.testTypes.join(', ')}` : ''}
`
  )
  .join('\n')}

## 🐛 Bugs Abertos

${
  openBugs.length > 0
    ? openBugs
        .map(
          bug => `
- **${bug.id}:** ${bug.title}
  - Severidade: ${bug.severity || 'N/A'}
  - Prioridade: ${bug.priority || 'N/A'}
  - Status: ${bug.status}
`
        )
        .join('\n')
    : 'Nenhum bug aberto.'
}

## ✅ Tarefas por Status

- **To Do:** ${tasks.filter(t => t.status === 'To Do').length}
- **In Progress:** ${tasks.filter(t => t.status === 'In Progress').length}
- **Done:** ${tasks.filter(t => t.status === 'Done').length}

## 📈 Métricas de Teste

### Distribuição de Status dos Casos de Teste
- **Não Executados:** ${testCases.filter(tc => tc.status === 'Not Run').length}
- **Passados:** ${passedTestCases}
- **Falhados:** ${failedTestCases}

### Automação
- **Automatizados:** ${automatedTestCases}
- **Manuais:** ${totalTestCases - automatedTestCases}

## 📝 Recomendações

${failedTestCases > 0 ? `- ⚠️ Existem ${failedTestCases} casos de teste falhados que precisam de atenção.` : ''}
${openBugs.length > 0 ? `- 🐛 Existem ${openBugs.length} bugs abertos que devem ser priorizados.` : ''}
${automatedTestCases < totalTestCases * 0.5 ? `- 🤖 Considere aumentar a automação de testes. Apenas ${Math.round((automatedTestCases / totalTestCases) * 100)}% dos testes estão automatizados.` : ''}
${executedTestCases < totalTestCases * 0.8 ? `- ✅ Apenas ${Math.round((executedTestCases / totalTestCases) * 100)}% dos casos de teste foram executados.` : ''}

---
*Relatório gerado automaticamente pelo QA Agile Guide*
`;

  return report.trim();
};

export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Exporta projeto para Excel
 */
export const exportProjectToExcel = async (project: Project): Promise<void> => {
  try {
    const workbook = XLSX.utils.book_new();

    // Planilha 1: Resumo do Projeto
    const summaryData = [
      ['Projeto', project.name],
      ['Descrição', project.description || ''],
      ['Data de Exportação', format(new Date(), 'dd/MM/yyyy HH:mm')],
      ['Total de Tarefas', project.tasks.filter(t => t.type !== 'Bug').length],
      ['Total de Bugs', project.tasks.filter(t => t.type === 'Bug').length],
      ['Total de Casos de Teste', project.tasks.flatMap(t => t.testCases || []).length],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumo');

    // Planilha 2: Tarefas
    const tasksData = project.tasks.map(task => {
      const testCases = task.testCases || [];
      return {
        ID: task.id,
        Título: task.title,
        Tipo: task.type,
        Status: task.status,
        Prioridade: task.priority || '',
        Responsável: task.assignee || '',
        Descrição: task.description || '',
        'Casos de Teste': testCases.length,
        'Casos Executados': testCases.filter(tc => tc.status !== 'Not Run').length,
        'Casos Passados': testCases.filter(tc => tc.status === 'Passed').length,
        'Casos Falhados': testCases.filter(tc => tc.status === 'Failed').length,
        Tags: task.tags?.join(', ') || '',
      };
    });
    const tasksSheet = XLSX.utils.json_to_sheet(tasksData);
    XLSX.utils.book_append_sheet(workbook, tasksSheet, 'Tarefas');

    // Planilha 3: Casos de Teste
    const testCasesData: any[] = [];
    project.tasks.forEach(task => {
      (task.testCases || []).forEach(tc => {
        testCasesData.push({
          'Tarefa ID': task.id,
          'Tarefa Título': task.title,
          'Caso de Teste ID': tc.id,
          Descrição: tc.description,
          Status: tc.status,
          Automatizado: tc.isAutomated ? 'Sim' : 'Não',
          'Resultado Esperado': tc.expectedResult || '',
          'Resultado Observado': tc.observedResult || '',
          Prioridade: tc.priority || '',
        });
      });
    });
    if (testCasesData.length > 0) {
      const testCasesSheet = XLSX.utils.json_to_sheet(testCasesData);
      XLSX.utils.book_append_sheet(workbook, testCasesSheet, 'Casos de Teste');
    }

    // Gerar arquivo
    const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const fileName = `${project.name}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    saveAs(blob, fileName);
  } catch (error) {
    throw new Error(
      `Erro ao exportar para Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
};

/**
 * Exporta projeto para PDF
 */
export const exportProjectToPDF = async (project: Project): Promise<void> => {
  try {
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let yPosition = 800;
    const margin = 50;

    // Título
    page.drawText(project.name, {
      x: margin,
      y: yPosition,
      size: 20,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    yPosition -= 30;

    // Descrição
    if (project.description) {
      page.drawText('Descrição:', {
        x: margin,
        y: yPosition,
        size: 12,
        font: boldFont,
      });
      yPosition -= 20;
      const descLines = project.description.split('\n');
      descLines.forEach(line => {
        if (yPosition < 50) {
          page = pdfDoc.addPage([595, 842]);
          yPosition = 800;
        }
        page.drawText(line.substring(0, 80), {
          x: margin,
          y: yPosition,
          size: 10,
          font: font,
        });
        yPosition -= 15;
      });
      yPosition -= 10;
    }

    // Resumo
    const tasks = project.tasks || [];
    const testCases = tasks.flatMap(t => t.testCases || []);
    const bugs = tasks.filter(t => t.type === 'Bug');

    page.drawText('Resumo Executivo', {
      x: margin,
      y: yPosition,
      size: 14,
      font: boldFont,
    });
    yPosition -= 25;

    const summary = [
      `Total de Tarefas: ${tasks.filter(t => t.type !== 'Bug').length}`,
      `Total de Bugs: ${bugs.length}`,
      `Total de Casos de Teste: ${testCases.length}`,
      `Casos Executados: ${testCases.filter(tc => tc.status !== 'Not Run').length}`,
      `Casos Passados: ${testCases.filter(tc => tc.status === 'Passed').length}`,
      `Casos Falhados: ${testCases.filter(tc => tc.status === 'Failed').length}`,
    ];

    summary.forEach(line => {
      if (yPosition < 50) {
        page = pdfDoc.addPage([595, 842]);
        yPosition = 800;
      }
      page.drawText(line, {
        x: margin + 10,
        y: yPosition,
        size: 10,
        font: font,
      });
      yPosition -= 15;
    });

    // Tarefas
    yPosition -= 20;
    if (yPosition < 100) {
      page = pdfDoc.addPage([595, 842]);
      yPosition = 800;
    }

    page.drawText('Tarefas', {
      x: margin,
      y: yPosition,
      size: 14,
      font: boldFont,
    });
    yPosition -= 25;

    tasks.slice(0, 20).forEach(task => {
      if (yPosition < 50) {
        page = pdfDoc.addPage([595, 842]);
        yPosition = 800;
      }
      page.drawText(`${task.id}: ${task.title}`, {
        x: margin + 10,
        y: yPosition,
        size: 10,
        font: font,
      });
      yPosition -= 15;
    });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const fileName = `${project.name}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    saveAs(blob, fileName);
  } catch (error) {
    throw new Error(
      `Erro ao exportar para PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
};

/**
 * Exporta projeto para Word
 */
export const exportProjectToWord = async (project: Project): Promise<void> => {
  try {
    const tasks = project.tasks || [];
    const testCases = tasks.flatMap(t => t.testCases || []);
    const bugs = tasks.filter(t => t.type === 'Bug');

    const children: (Paragraph | Table)[] = [
      new Paragraph({
        text: project.name,
        heading: HeadingLevel.TITLE,
      }),
      new Paragraph({
        text: `Data de Exportação: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
      }),
      new Paragraph({ text: '' }),
      new Paragraph({
        text: 'Descrição',
        heading: HeadingLevel.HEADING_1,
      }),
      new Paragraph({
        text: project.description || 'Sem descrição',
      }),
      new Paragraph({ text: '' }),
      new Paragraph({
        text: 'Resumo Executivo',
        heading: HeadingLevel.HEADING_1,
      }),
      new Paragraph({
        children: [
          new TextRun({ text: `Total de Tarefas: ${tasks.filter(t => t.type !== 'Bug').length}` }),
          new TextRun({ text: '\n' }),
          new TextRun({ text: `Total de Bugs: ${bugs.length}` }),
          new TextRun({ text: '\n' }),
          new TextRun({ text: `Total de Casos de Teste: ${testCases.length}` }),
          new TextRun({ text: '\n' }),
          new TextRun({
            text: `Casos Executados: ${testCases.filter(tc => tc.status !== 'Not Run').length}`,
          }),
          new TextRun({ text: '\n' }),
          new TextRun({
            text: `Casos Passados: ${testCases.filter(tc => tc.status === 'Passed').length}`,
          }),
          new TextRun({ text: '\n' }),
          new TextRun({
            text: `Casos Falhados: ${testCases.filter(tc => tc.status === 'Failed').length}`,
          }),
        ],
      }),
      new Paragraph({ text: '' }),
      new Paragraph({
        text: 'Tarefas',
        heading: HeadingLevel.HEADING_1,
      }),
    ];

    // Tabela de tarefas
    const taskRows = tasks.slice(0, 50).map(task => {
      const testCases = task.testCases || [];
      return new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(task.id)] }),
          new TableCell({ children: [new Paragraph(task.title)] }),
          new TableCell({ children: [new Paragraph(task.type)] }),
          new TableCell({ children: [new Paragraph(task.status)] }),
          new TableCell({ children: [new Paragraph(String(testCases.length))] }),
        ],
      });
    });

    if (taskRows.length > 0) {
      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph('ID')] }),
                new TableCell({ children: [new Paragraph('Título')] }),
                new TableCell({ children: [new Paragraph('Tipo')] }),
                new TableCell({ children: [new Paragraph('Status')] }),
                new TableCell({ children: [new Paragraph('Casos de Teste')] }),
              ],
            }),
            ...taskRows,
          ],
        })
      );
    }

    const doc = new Document({
      sections: [
        {
          children: children,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `${project.name}_${format(new Date(), 'yyyy-MM-dd')}.docx`;
    saveAs(blob, fileName);
  } catch (error) {
    throw new Error(
      `Erro ao exportar para Word: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
};

/**
 * Exporta tarefas para Excel
 */
export const exportTasksToExcel = async (tasks: JiraTask[]): Promise<void> => {
  try {
    const workbook = XLSX.utils.book_new();
    const tasksData = tasks.map(task => {
      const testCases = task.testCases || [];
      return {
        ID: task.id,
        Título: task.title,
        Tipo: task.type,
        Status: task.status,
        Prioridade: task.priority || '',
        Responsável: task.assignee || '',
        Descrição: task.description || '',
        'Casos de Teste': testCases.length,
        Tags: task.tags?.join(', ') || '',
      };
    });
    const sheet = XLSX.utils.json_to_sheet(tasksData);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Tarefas');

    const excelBuffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const fileName = `Tarefas_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    saveAs(blob, fileName);
  } catch (error) {
    throw new Error(
      `Erro ao exportar tarefas para Excel: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    );
  }
};
