import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';
import { Project } from '../types';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

interface FailedTestData {
  testCase: {
    id: string;
    description: string;
    steps: string[];
    expectedResult: string;
    observedResult?: string;
    priority?: string;
    testEnvironment?: string;
    testSuite?: string;
  };
  task: {
    id: string;
    title: string;
  };
}

interface TableOfContentsItem {
  title: string;
  page: number;
}

// Cores melhoradas
const colors = {
  primary: rgb(0.2, 0.4, 0.8),
  primaryDark: rgb(0.15, 0.3, 0.6),
  error: rgb(0.8, 0.2, 0.2),
  warning: rgb(0.9, 0.6, 0.1),
  success: rgb(0.2, 0.6, 0.2),
  text: rgb(0, 0, 0),
  textLight: rgb(0.3, 0.3, 0.3),
  lightGray: rgb(0.95, 0.95, 0.95),
  mediumGray: rgb(0.85, 0.85, 0.85),
  darkGray: rgb(0.5, 0.5, 0.5),
  white: rgb(1, 1, 1),
  critical: rgb(0.8, 0.1, 0.1),
  high: rgb(0.9, 0.5, 0.1),
  medium: rgb(0.9, 0.7, 0.1),
  low: rgb(0.2, 0.6, 0.2),
};

/**
 * Desenha um box/card com borda e fundo
 */
function drawBox(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  backgroundColor?: any,
  borderColor?: any,
  borderWidth: number = 1
): void {
  // Fundo
  if (backgroundColor) {
    page.drawRectangle({
      x,
      y: y - height,
      width,
      height,
      color: backgroundColor,
    });
  }
  
  // Borda
  if (borderColor) {
    page.drawRectangle({
      x,
      y: y - height,
      width,
      height,
      borderColor,
      borderWidth,
    });
  }
}

/**
 * Desenha um badge de severidade
 */
function drawSeverityBadge(
  page: PDFPage,
  x: number,
  y: number,
  severity: string,
  font: any,
  boldFont: any
): number {
  const severityColor = getSeverityColor(severity);
  const badgeWidth = 60;
  const badgeHeight = 18;
  const padding = 4;
  
  // Fundo do badge
  page.drawRectangle({
    x,
    y: y - badgeHeight,
    width: badgeWidth,
    height: badgeHeight,
    color: severityColor,
    borderColor: colors.text,
    borderWidth: 0.5,
  });
  
  // Texto do badge
  const severityText = severity.length > 8 ? severity.substring(0, 8) : severity;
  page.drawText(severityText, {
    x: x + padding,
    y: y - badgeHeight + padding,
    size: 9,
    font: boldFont,
    color: colors.white,
  });
  
  return badgeWidth + 10;
}

/**
 * Desenha um card de resumo com métrica
 */
function drawSummaryCard(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  title: string,
  value: string,
  color: any,
  font: any,
  boldFont: any
): void {
  // Box do card
  drawBox(page, x, y, width, height, colors.lightGray, colors.mediumGray, 1);
  
  // Título
  page.drawText(title, {
    x: x + 8,
    y: y - 12,
    size: 9,
    font: font,
    color: colors.textLight,
  });
  
  // Valor
  page.drawText(value, {
    x: x + 8,
    y: y - 28,
    size: 20,
    font: boldFont,
    color: color,
  });
}

/**
 * Desenha uma tabela simples
 */
function drawTable(
  page: PDFPage,
  x: number,
  y: number,
  columns: { header: string; width: number }[],
  rows: string[][],
  font: any,
  boldFont: any,
  startY: number
): number {
  const rowHeight = 20;
  const headerHeight = 25;
  let currentY = y;
  const tableWidth = columns.reduce((sum, col) => sum + col.width, 0);
  
  // Header
  drawBox(page, x, currentY, tableWidth, headerHeight, colors.primaryDark, colors.primary, 1);
  let currentX = x;
  columns.forEach((col, index) => {
    page.drawText(col.header, {
      x: currentX + 5,
      y: currentY - headerHeight + 8,
      size: 10,
      font: boldFont,
      color: colors.white,
    });
    currentX += col.width;
  });
  currentY -= headerHeight;
  
  // Linhas
  rows.forEach((row, rowIndex) => {
    if (currentY < startY + 50) {
      return; // Não cabe mais na página
    }
    
    const bgColor = rowIndex % 2 === 0 ? colors.white : colors.lightGray;
    drawBox(page, x, currentY, tableWidth, rowHeight, bgColor, colors.mediumGray, 0.5);
    
    currentX = x;
    row.forEach((cell, cellIndex) => {
      const cellText = wrapText(cell || '', columns[cellIndex].width - 10, font, 9)[0] || '';
      page.drawText(cellText, {
        x: currentX + 5,
        y: currentY - rowHeight + 6,
        size: 9,
        font: font,
        color: colors.text,
      });
      currentX += columns[cellIndex].width;
    });
    
    currentY -= rowHeight;
  });
  
  return currentY;
}

/**
 * Desenha um gráfico de barras simples
 */
function drawBarChart(
  page: PDFPage,
  x: number,
  y: number,
  width: number,
  height: number,
  data: { label: string; value: number; color: any }[],
  maxValue: number,
  font: any,
  boldFont: any
): void {
  const barHeight = (height - 40) / data.length;
  const chartWidth = width - 100;
  
  data.forEach((item, index) => {
    const barY = y - (index * barHeight) - 20;
    const barWidth = (item.value / maxValue) * chartWidth;
    
    // Barra
    page.drawRectangle({
      x: x + 80,
      y: barY - barHeight + 5,
      width: barWidth,
      height: barHeight - 10,
      color: item.color,
    });
    
    // Label
    page.drawText(item.label, {
      x: x + 5,
      y: barY - barHeight / 2 - 3,
      size: 9,
      font: font,
      color: colors.text,
    });
    
    // Valor
    page.drawText(item.value.toString(), {
      x: x + 85 + barWidth,
      y: barY - barHeight / 2 - 3,
      size: 9,
      font: boldFont,
      color: colors.text,
    });
  });
}

/**
 * Desenha header em todas as páginas
 */
function drawHeader(
  page: PDFPage,
  projectName: string,
  pageNumber: number,
  totalPages: number,
  font: any,
  boldFont: any
): void {
  const headerHeight = 30;
  const headerColor = colors.primaryDark;
  
  // Fundo do header
  page.drawRectangle({
    x: 0,
    y: 842 - headerHeight,
    width: 595,
    height: headerHeight,
    color: headerColor,
  });
  
  // Nome do projeto
  page.drawText(projectName, {
    x: 50,
    y: 842 - headerHeight + 8,
    size: 10,
    font: boldFont,
    color: colors.white,
  });
  
  // Número da página
  page.drawText(`Página ${pageNumber} de ${totalPages}`, {
    x: 495,
    y: 842 - headerHeight + 8,
    size: 10,
    font: font,
    color: colors.white,
  });
}

/**
 * Desenha rodapé melhorado
 */
function drawFooter(
  page: PDFPage,
  projectName: string,
  generatedAt: Date,
  font: any
): void {
  const footerText = `${projectName} - Gerado em ${format(generatedAt, 'dd/MM/yyyy HH:mm')}`;
  page.drawText(footerText, {
    x: 50,
    y: 25,
    size: 8,
    font: font,
    color: colors.darkGray,
  });
}

/**
 * Calcula estatísticas dos bugs
 */
function calculateBugStatistics(failedTests: FailedTestData[], analysisText: string) {
  const stats = {
    total: failedTests.length,
    bySeverity: {
      crítico: 0,
      alto: 0,
      médio: 0,
      baixo: 0,
    },
    byTask: new Map<string, number>(),
    byEnvironment: new Map<string, number>(),
  };
  
  // Analisar texto para severidade
  const severityMatch = analysisText.match(/Severidade:\s*([^\n]+)/gi);
  if (severityMatch) {
    severityMatch.forEach(match => {
      const severity = match.replace(/Severidade:\s*/i, '').trim().toLowerCase();
      if (severity.includes('crítico') || severity.includes('critico')) {
        stats.bySeverity.crítico++;
      } else if (severity.includes('alto')) {
        stats.bySeverity.alto++;
      } else if (severity.includes('médio') || severity.includes('medio')) {
        stats.bySeverity.médio++;
      } else {
        stats.bySeverity.baixo++;
      }
    });
  }
  
  // Agrupar por tarefa
  failedTests.forEach(ft => {
    const taskId = ft.task.id;
    stats.byTask.set(taskId, (stats.byTask.get(taskId) || 0) + 1);
    
    if (ft.testCase.testEnvironment) {
      stats.byEnvironment.set(
        ft.testCase.testEnvironment,
        (stats.byEnvironment.get(ft.testCase.testEnvironment) || 0) + 1
      );
    }
  });
  
  return stats;
}

/**
 * Gera PDF profissional do relatório de análise de testes reprovados
 */
export async function generateFailedTestsPDF(
  project: Project,
  analysisText: string,
  failedTests: FailedTestData[],
  generatedAt: Date = new Date()
): Promise<void> {
  try {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const pageWidth = 595;
    const pageHeight = 842;
    const margin = 50;
    const lineHeight = 14;
    const sectionSpacing = 25;
    const headerHeight = 30;
    const footerHeight = 40;

    const tableOfContents: TableOfContentsItem[] = [];
    let currentPageIndex = 0;

    // Calcular estatísticas
    const stats = calculateBugStatistics(failedTests, analysisText);

    // ========== CAPA MELHORADA ==========
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    currentPageIndex = 0;
    let yPosition = pageHeight - margin;

    // Header da capa
    page.drawRectangle({
      x: 0,
      y: pageHeight - headerHeight,
      width: pageWidth,
      height: headerHeight,
      color: colors.primaryDark,
    });
    
    page.drawText('QA AGILE GUIDE', {
      x: margin,
      y: pageHeight - headerHeight + 8,
      size: 12,
      font: boldFont,
      color: colors.white,
    });

    yPosition -= headerHeight + 40;

    // Título principal
    page.drawText('RELATÓRIO DE BUGS', {
      x: margin,
      y: yPosition,
      size: 32,
      font: boldFont,
      color: colors.primary,
    });
    yPosition -= 45;

    page.drawText('Análise Detalhada de Testes Reprovados', {
      x: margin,
      y: yPosition,
      size: 16,
      font: font,
      color: colors.text,
    });
    yPosition -= 60;

    // Cards de estatísticas
    const cardWidth = 120;
    const cardHeight = 70;
    const cardSpacing = 20;
    const cardsStartX = margin;
    const cardsY = yPosition;

    // Card Total
    drawSummaryCard(
      page,
      cardsStartX,
      cardsY,
      cardWidth,
      cardHeight,
      'Total de Bugs',
      stats.total.toString(),
      colors.error,
      font,
      boldFont
    );

    // Card Crítico
    drawSummaryCard(
      page,
      cardsStartX + cardWidth + cardSpacing,
      cardsY,
      cardWidth,
      cardHeight,
      'Críticos',
      stats.bySeverity.crítico.toString(),
      colors.critical,
      font,
      boldFont
    );

    // Card Alto
    drawSummaryCard(
      page,
      cardsStartX + (cardWidth + cardSpacing) * 2,
      cardsY,
      cardWidth,
      cardHeight,
      'Alta Severidade',
      stats.bySeverity.alto.toString(),
      colors.high,
      font,
      boldFont
    );

    yPosition -= cardHeight + 40;

    // Informações do projeto em box
    const infoBoxHeight = 120;
    drawBox(page, margin, yPosition, pageWidth - 2 * margin, infoBoxHeight, colors.lightGray, colors.mediumGray, 1);
    
    yPosition -= 20;
    page.drawText('Informações do Projeto', {
      x: margin + 10,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: colors.primary,
    });
    yPosition -= 25;

    page.drawText('Projeto:', {
      x: margin + 10,
      y: yPosition,
      size: 10,
      font: boldFont,
      color: colors.text,
    });
    page.drawText(project.name, {
      x: margin + 70,
      y: yPosition,
      size: 10,
      font: font,
      color: colors.text,
    });
    yPosition -= 20;

    page.drawText('Data de Geração:', {
      x: margin + 10,
      y: yPosition,
      size: 10,
      font: boldFont,
      color: colors.text,
    });
    page.drawText(format(generatedAt, 'dd/MM/yyyy HH:mm'), {
      x: margin + 110,
      y: yPosition,
      size: 10,
      font: font,
      color: colors.text,
    });
    yPosition -= 20;

    if (project.description) {
      page.drawText('Descrição:', {
        x: margin + 10,
        y: yPosition,
        size: 10,
        font: boldFont,
        color: colors.text,
      });
      const descLines = wrapText(project.description, pageWidth - 2 * margin - 120, font, 9);
      page.drawText(descLines[0] || '', {
        x: margin + 80,
        y: yPosition,
        size: 9,
        font: font,
        color: colors.textLight,
      });
    }

    tableOfContents.push({ title: 'Capa', page: 1 });

    // ========== SUMÁRIO ==========
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    currentPageIndex = 1;
    yPosition = pageHeight - margin - headerHeight;
    
    drawHeader(page, project.name, currentPageIndex + 1, pdfDoc.getPageCount(), font, boldFont);

    page.drawText('SUMÁRIO', {
      x: margin,
      y: yPosition,
      size: 20,
      font: boldFont,
      color: colors.primary,
    });
    yPosition -= 40;

    const sections = [
      'Resumo Executivo',
      'Métricas e Estatísticas',
      'Tabela de Bugs',
      'Análise Detalhada dos Bugs',
      'Priorização',
      'Próximos Passos',
    ];

    sections.forEach((section, index) => {
      if (yPosition < 100) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        currentPageIndex++;
        yPosition = pageHeight - margin - headerHeight;
        // Header será atualizado no final com número correto de páginas
      }

      page.drawText(`${index + 1}. ${section}`, {
        x: margin + 20,
        y: yPosition,
        size: 11,
        font: font,
        color: colors.text,
      });
      yPosition -= 25;
    });

    // ========== RESUMO EXECUTIVO MELHORADO ==========
    const executiveSummaryMatch = analysisText.match(/RESUMO EXECUTIVO\s*-+\s*([\s\S]*?)(?=ANÁLISE DOS BUGS|BUGS IDENTIFICADOS|PRIORIZAÇÃO|MÉTRICAS|$)/i);
    if (executiveSummaryMatch) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      currentPageIndex++;
      yPosition = pageHeight - margin - headerHeight;
      
      // Header será atualizado no final com número correto de páginas
      tableOfContents.push({ title: 'Resumo Executivo', page: currentPageIndex + 1 });

      page.drawText('RESUMO EXECUTIVO', {
        x: margin,
        y: yPosition,
        size: 18,
        font: boldFont,
        color: colors.primary,
      });
      yPosition -= 35;

      const summaryText = executiveSummaryMatch[1].trim();
      const summaryLines = wrapText(summaryText, pageWidth - 2 * margin, font, 11);
      
      summaryLines.forEach(line => {
        if (yPosition < footerHeight + 50) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          currentPageIndex++;
          yPosition = pageHeight - margin - headerHeight;
          // Header será atualizado no final com número correto de páginas
        }
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: 11,
          font: font,
          color: colors.text,
        });
        yPosition -= lineHeight + 2;
      });
      yPosition -= sectionSpacing;
    }

    // ========== MÉTRICAS E ESTATÍSTICAS ==========
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    currentPageIndex++;
    yPosition = pageHeight - margin - headerHeight;
    
    drawHeader(page, project.name, currentPageIndex + 1, pdfDoc.getPageCount(), font, boldFont);
    tableOfContents.push({ title: 'Métricas e Estatísticas', page: currentPageIndex + 1 });

    page.drawText('MÉTRICAS E ESTATÍSTICAS', {
      x: margin,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: colors.primary,
    });
    yPosition -= 35;

    // Gráfico de severidade
    if (yPosition < 300) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      currentPageIndex++;
      yPosition = pageHeight - margin - headerHeight;
      // Header será atualizado no final com número correto de páginas
    }

    page.drawText('Distribuição por Severidade', {
      x: margin,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: colors.text,
    });
    yPosition -= 25;

    const severityData = [
      { label: 'Crítico', value: stats.bySeverity.crítico, color: colors.critical },
      { label: 'Alto', value: stats.bySeverity.alto, color: colors.high },
      { label: 'Médio', value: stats.bySeverity.médio, color: colors.medium },
      { label: 'Baixo', value: stats.bySeverity.baixo, color: colors.low },
    ].filter(item => item.value > 0);

    const maxSeverity = Math.max(...severityData.map(d => d.value), 1);
    drawBarChart(page, margin, yPosition, pageWidth - 2 * margin, 150, severityData, maxSeverity, font, boldFont);
    yPosition -= 160;

    // Tabela de estatísticas por tarefa
    if (stats.byTask.size > 0 && yPosition < 200) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      currentPageIndex++;
      yPosition = pageHeight - margin - headerHeight;
      // Header será atualizado no final com número correto de páginas
    }

    if (stats.byTask.size > 0) {
      page.drawText('Bugs por Tarefa', {
        x: margin,
        y: yPosition,
        size: 12,
        font: boldFont,
        color: colors.text,
      });
      yPosition -= 25;

      const taskRows: string[][] = [];
      stats.byTask.forEach((count, taskId) => {
        const task = failedTests.find(ft => ft.task.id === taskId)?.task;
        taskRows.push([
          taskId,
          task?.title || 'Sem título',
          count.toString(),
        ]);
      });

      const taskColumns = [
        { header: 'ID Tarefa', width: 120 },
        { header: 'Título', width: 300 },
        { header: 'Bugs', width: 80 },
      ];

      yPosition = drawTable(page, margin, yPosition, taskColumns, taskRows, font, boldFont, footerHeight + 50);
      yPosition -= sectionSpacing;
    }

    // ========== TABELA DETALHADA DE BUGS ==========
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    currentPageIndex++;
    yPosition = pageHeight - margin - headerHeight;
    
    drawHeader(page, project.name, currentPageIndex + 1, pdfDoc.getPageCount(), font, boldFont);
    tableOfContents.push({ title: 'Tabela de Bugs', page: currentPageIndex + 1 });

    page.drawText('TABELA DETALHADA DE BUGS', {
      x: margin,
      y: yPosition,
      size: 18,
      font: boldFont,
      color: colors.primary,
    });
    yPosition -= 35;

    const bugTableColumns = [
      { header: 'ID', width: 70 },
      { header: 'Tarefa', width: 90 },
      { header: 'Descrição', width: 180 },
      { header: 'Severidade', width: 70 },
      { header: 'Prioridade', width: 70 },
      { header: 'Ambiente', width: 70 },
      { header: 'Suite', width: 55 },
    ];

    const bugTableRows: string[][] = [];
    failedTests.forEach((ft, index) => {
      // Extrair severidade do texto de análise se disponível
      let severity = 'N/A';
      const severityMatch = analysisText.match(new RegExp(`(?:Bug|Teste)\\s*${index + 1}[\\s\\S]*?Severidade:\\s*([^\\n]+)`, 'i'));
      if (severityMatch) {
        severity = severityMatch[1].trim();
      }

      bugTableRows.push([
        ft.testCase.id || `TC-${index + 1}`,
        ft.task.id,
        ft.testCase.description.substring(0, 45) + (ft.testCase.description.length > 45 ? '...' : ''),
        severity,
        ft.testCase.priority || 'N/A',
        ft.testCase.testEnvironment || 'N/A',
        ft.testCase.testSuite || 'N/A',
      ]);
    });

    yPosition = drawTable(page, margin, yPosition, bugTableColumns, bugTableRows, font, boldFont, footerHeight + 50);

    // ========== ANÁLISE DETALHADA DOS BUGS ==========
    const bugsSectionMatch = analysisText.match(/ANÁLISE DOS BUGS\s*-+\s*([\s\S]*?)(?=PRIORIZAÇÃO|PRÓXIMOS PASSOS|$)/i);
    
    if (yPosition < 200 || !bugsSectionMatch) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      currentPageIndex++;
      yPosition = pageHeight - margin - headerHeight;
      // Header será atualizado no final com número correto de páginas
    }

    if (bugsSectionMatch) {
      tableOfContents.push({ title: 'Análise Detalhada dos Bugs', page: currentPageIndex + 1 });

      page.drawText('ANÁLISE DETALHADA DOS BUGS', {
        x: margin,
        y: yPosition,
        size: 18,
        font: boldFont,
        color: colors.primary,
      });
      yPosition -= 35;

      const bugsText = bugsSectionMatch[1];
      const groupMatches = bugsText.match(/Grupo\s*\d+:\s*([^\n]+)\n([\s\S]*?)(?=Grupo\s*\d+:|PRIORIZAÇÃO|PRÓXIMOS PASSOS|$)/gi);
      
      if (groupMatches) {
        groupMatches.forEach((groupMatch, index) => {
          if (yPosition < 200) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            currentPageIndex++;
            yPosition = pageHeight - margin - headerHeight;
            // Header será atualizado no final com número correto de páginas
          }

          const groupLines = groupMatch.split('\n').filter(l => l.trim());
          const groupTitle = groupLines[0]?.replace(/^Grupo\s*\d+:\s*/i, '') || `Grupo ${index + 1}`;
          
          // Box para o grupo
          const boxHeight = 150;
          drawBox(page, margin, yPosition, pageWidth - 2 * margin, boxHeight, colors.lightGray, colors.primary, 2);
          
          yPosition -= 20;
          page.drawText(`Grupo ${index + 1}: ${groupTitle}`, {
            x: margin + 10,
            y: yPosition,
            size: 13,
            font: boldFont,
            color: colors.primary,
          });
          yPosition -= 25;

          // Detalhes do grupo
          groupLines.slice(1).forEach(line => {
            if (yPosition < margin + 50) {
              yPosition -= 10;
              return;
            }

            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('- Quantidade:')) {
              const quantity = trimmedLine.replace('- Quantidade:', '').trim();
              page.drawText('Quantidade:', {
                x: margin + 15,
                y: yPosition,
                size: 10,
                font: boldFont,
                color: colors.text,
              });
              page.drawText(quantity, {
                x: margin + 95,
                y: yPosition,
                size: 10,
                font: font,
                color: colors.text,
              });
              yPosition -= lineHeight + 3;
            } else if (trimmedLine.startsWith('- Severidade:')) {
              const severity = trimmedLine.replace('- Severidade:', '').trim();
              page.drawText('Severidade:', {
                x: margin + 15,
                y: yPosition,
                size: 10,
                font: boldFont,
                color: colors.text,
              });
              const badgeX = margin + 95;
              drawSeverityBadge(page, badgeX, yPosition, severity, font, boldFont);
              yPosition -= lineHeight + 8;
            } else if (trimmedLine.startsWith('- Impacto no Negócio:')) {
              const impact = trimmedLine.replace('- Impacto no Negócio:', '').trim();
              page.drawText('Impacto no Negócio:', {
                x: margin + 15,
                y: yPosition,
                size: 10,
                font: boldFont,
                color: colors.text,
              });
              yPosition -= lineHeight + 3;
              const wrapped = wrapText(impact, pageWidth - 2 * margin - 30, font, 10);
              wrapped.forEach(wrappedLine => {
                if (yPosition < margin + 50) return;
                page.drawText(wrappedLine, {
                  x: margin + 20,
                  y: yPosition,
                  size: 10,
                  font: font,
                  color: colors.text,
                });
                yPosition -= lineHeight;
              });
              yPosition -= 3;
            } else if (trimmedLine.startsWith('- Descrição Técnica:')) {
              const technical = trimmedLine.replace('- Descrição Técnica:', '').trim();
              page.drawText('Descrição Técnica:', {
                x: margin + 15,
                y: yPosition,
                size: 10,
                font: boldFont,
                color: colors.text,
              });
              yPosition -= lineHeight + 3;
              const wrapped = wrapText(technical, pageWidth - 2 * margin - 30, font, 10);
              wrapped.forEach(wrappedLine => {
                if (yPosition < margin + 50) return;
                page.drawText(wrappedLine, {
                  x: margin + 20,
                  y: yPosition,
                  size: 10,
                  font: font,
                  color: colors.text,
                });
                yPosition -= lineHeight;
              });
              yPosition -= 3;
            } else if (trimmedLine.startsWith('- Recomendação:')) {
              const recommendation = trimmedLine.replace('- Recomendação:', '').trim();
              page.drawText('Recomendação:', {
                x: margin + 15,
                y: yPosition,
                size: 10,
                font: boldFont,
                color: colors.primary,
              });
              yPosition -= lineHeight + 3;
              const wrapped = wrapText(recommendation, pageWidth - 2 * margin - 30, font, 10);
              wrapped.forEach(wrappedLine => {
                if (yPosition < margin + 50) return;
                page.drawText(wrappedLine, {
                  x: margin + 20,
                  y: yPosition,
                  size: 10,
                  font: font,
                  color: colors.primary,
                });
                yPosition -= lineHeight;
              });
              yPosition -= 3;
            } else if (trimmedLine.startsWith('-') && !trimmedLine.startsWith('- Quantidade') && !trimmedLine.startsWith('- Severidade') && !trimmedLine.startsWith('- Impacto') && !trimmedLine.startsWith('- Descrição') && !trimmedLine.startsWith('- Recomendação')) {
              const wrapped = wrapText(trimmedLine, pageWidth - 2 * margin - 30, font, 10);
              wrapped.forEach(wrappedLine => {
                if (yPosition < margin + 50) return;
                page.drawText(wrappedLine, {
                  x: margin + 20,
                  y: yPosition,
                  size: 10,
                  font: font,
                  color: colors.text,
                });
                yPosition -= lineHeight;
              });
            }
          });

          yPosition -= 20;
        });
      } else {
        // Fallback: mostrar bugs individuais com detalhes completos
        failedTests.forEach((ft, index) => {
          if (yPosition < 250) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            currentPageIndex++;
            yPosition = pageHeight - margin - headerHeight;
            // Header será atualizado no final com número correto de páginas
          }

          const bugBoxHeight = 180;
          drawBox(page, margin, yPosition, pageWidth - 2 * margin, bugBoxHeight, colors.lightGray, colors.mediumGray, 1);
          
          yPosition -= 20;
          page.drawText(`Bug ${index + 1}: ${ft.testCase.description.substring(0, 60)}`, {
            x: margin + 10,
            y: yPosition,
            size: 12,
            font: boldFont,
            color: colors.text,
          });
          yPosition -= 25;

          // Informações do teste
          page.drawText(`Tarefa: ${ft.task.id} - ${ft.task.title}`, {
            x: margin + 15,
            y: yPosition,
            size: 10,
            font: font,
            color: colors.text,
          });
          yPosition -= 18;

          if (ft.testCase.testEnvironment) {
            page.drawText(`Ambiente: ${ft.testCase.testEnvironment}`, {
              x: margin + 15,
              y: yPosition,
              size: 10,
              font: font,
              color: colors.text,
            });
            yPosition -= 18;
          }

          if (ft.testCase.priority) {
            page.drawText(`Prioridade: ${ft.testCase.priority}`, {
              x: margin + 15,
              y: yPosition,
              size: 10,
              font: font,
              color: colors.text,
            });
            yPosition -= 18;
          }

          if (ft.testCase.testSuite) {
            page.drawText(`Suite de Teste: ${ft.testCase.testSuite}`, {
              x: margin + 15,
              y: yPosition,
              size: 10,
              font: font,
              color: colors.text,
            });
            yPosition -= 18;
          }

          // Passos
          if (ft.testCase.steps && ft.testCase.steps.length > 0) {
            page.drawText('Passos para Reproduzir:', {
              x: margin + 15,
              y: yPosition,
              size: 10,
              font: boldFont,
              color: colors.text,
            });
            yPosition -= 18;
            ft.testCase.steps.forEach((step, stepIndex) => {
              const stepText = `${stepIndex + 1}. ${step}`;
              const wrapped = wrapText(stepText, pageWidth - 2 * margin - 30, font, 9);
              wrapped.forEach(line => {
                if (yPosition < margin + 50) return;
                page.drawText(line, {
                  x: margin + 25,
                  y: yPosition,
                  size: 9,
                  font: font,
                  color: colors.text,
                });
                yPosition -= 14;
              });
            });
            yPosition -= 5;
          }

          // Resultado esperado vs observado
          if (ft.testCase.expectedResult) {
            page.drawText('Resultado Esperado:', {
              x: margin + 15,
              y: yPosition,
              size: 10,
              font: boldFont,
              color: colors.success,
            });
            yPosition -= 15;
            const expectedWrapped = wrapText(ft.testCase.expectedResult, pageWidth - 2 * margin - 30, font, 9);
            expectedWrapped.forEach(line => {
              if (yPosition < margin + 50) return;
              page.drawText(line, {
                x: margin + 25,
                y: yPosition,
                size: 9,
                font: font,
                color: colors.text,
              });
              yPosition -= 14;
            });
          }

          if (ft.testCase.observedResult) {
            page.drawText('Resultado Observado:', {
              x: margin + 15,
              y: yPosition,
              size: 10,
              font: boldFont,
              color: colors.error,
            });
            yPosition -= 15;
            const observedWrapped = wrapText(ft.testCase.observedResult, pageWidth - 2 * margin - 30, font, 9);
            observedWrapped.forEach(line => {
              if (yPosition < margin + 50) return;
              page.drawText(line, {
                x: margin + 25,
                y: yPosition,
                size: 9,
                font: font,
                color: colors.error,
              });
              yPosition -= 14;
            });
          }

          yPosition -= 20;
        });
      }
    }

    // ========== PRIORIZAÇÃO MELHORADA ==========
    const prioritizationMatch = analysisText.match(/PRIORIZAÇÃO\s*-+\s*([\s\S]*?)(?=PRÓXIMOS PASSOS|$)/i);
    if (prioritizationMatch) {
      if (yPosition < 200) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        currentPageIndex++;
        yPosition = pageHeight - margin - headerHeight;
        // Header será atualizado no final com número correto de páginas
      }

      tableOfContents.push({ title: 'Priorização', page: currentPageIndex + 1 });

      page.drawText('PRIORIZAÇÃO', {
        x: margin,
        y: yPosition,
        size: 18,
        font: boldFont,
        color: colors.primary,
      });
      yPosition -= 35;

      const prioritizationText = prioritizationMatch[1].trim();
      const prioritizationLines = wrapText(prioritizationText, pageWidth - 2 * margin, font, 11);
      
      prioritizationLines.forEach(line => {
        if (yPosition < footerHeight + 50) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          currentPageIndex++;
          yPosition = pageHeight - margin - headerHeight;
          // Header será atualizado no final com número correto de páginas
        }
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: 11,
          font: font,
          color: colors.text,
        });
        yPosition -= lineHeight + 2;
      });
    }

    // ========== PRÓXIMOS PASSOS ==========
    const nextStepsMatch = analysisText.match(/PRÓXIMOS PASSOS\s*-+\s*([\s\S]*?)$/i);
    if (nextStepsMatch) {
      if (yPosition < 200) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        currentPageIndex++;
        yPosition = pageHeight - margin - headerHeight;
        // Header será atualizado no final com número correto de páginas
      }

      tableOfContents.push({ title: 'Próximos Passos', page: currentPageIndex + 1 });

      page.drawText('PRÓXIMOS PASSOS', {
        x: margin,
        y: yPosition,
        size: 18,
        font: boldFont,
        color: colors.primary,
      });
      yPosition -= 35;

      const nextStepsText = nextStepsMatch[1].trim();
      const nextStepsLines = nextStepsText.split('\n').filter(l => l.trim());
      
      nextStepsLines.forEach((line, index) => {
        if (yPosition < footerHeight + 50) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          currentPageIndex++;
          yPosition = pageHeight - margin - headerHeight;
          // Header será atualizado no final com número correto de páginas
        }
        const trimmedLine = line.trim().replace(/^\d+\.\s*/, '');
        
        // Box para cada passo
        const stepBoxHeight = 35;
        drawBox(page, margin, yPosition, pageWidth - 2 * margin, stepBoxHeight, colors.lightGray, colors.primary, 1);
        
        page.drawText(`${index + 1}.`, {
          x: margin + 10,
          y: yPosition - 20,
          size: 12,
          font: boldFont,
          color: colors.primary,
        });
        
        const wrapped = wrapText(trimmedLine, pageWidth - 2 * margin - 40, font, 10);
        wrapped.forEach((wrappedLine, lineIndex) => {
          page.drawText(wrappedLine, {
            x: margin + 35,
            y: yPosition - 20 - (lineIndex * 14),
            size: 10,
            font: font,
            color: colors.text,
          });
        });
        
        yPosition -= stepBoxHeight + 10;
      });
    }

    // ========== HEADER E FOOTER EM TODAS AS PÁGINAS ==========
    const finalTotalPages = pdfDoc.getPageCount();
    for (let i = 0; i < finalTotalPages; i++) {
      const currentPage = pdfDoc.getPage(i);
      
      // Pular capa (página 0)
      if (i > 0) {
        drawHeader(currentPage, project.name, i + 1, finalTotalPages, font, boldFont);
      }
      
      drawFooter(currentPage, project.name, generatedAt, font);
    }
    
    // Atualizar números de página no sumário com total correto
    const finalTocPage = pdfDoc.getPage(1);
    let finalTocY = pageHeight - margin - headerHeight - 40;
    
    sections.forEach((section, index) => {
      const tocItem = tableOfContents.find(item => item.title === section);
      if (tocItem) {
        const pageText = `${index + 1}. ${section}`;
        const pageNumText = `... ${tocItem.page}`;
        const pageNumWidth = boldFont.widthOfTextAtSize(pageNumText, 11);
        
        // Desenhar fundo branco para sobrescrever texto anterior
        finalTocPage.drawRectangle({
          x: margin + 15,
          y: finalTocY - 10,
          width: pageWidth - 2 * margin - 30,
          height: 20,
          color: colors.white,
        });
        
        finalTocPage.drawText(pageText, {
          x: margin + 20,
          y: finalTocY,
          size: 11,
          font: font,
          color: colors.text,
        });
        
        finalTocPage.drawText(pageNumText, {
          x: pageWidth - margin - pageNumWidth,
          y: finalTocY,
          size: 11,
          font: boldFont,
          color: colors.primary,
        });
        
        finalTocY -= 25;
      }
    });

    // Salvar PDF
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const fileName = `${project.name}_relatorio_bugs_${format(generatedAt, 'yyyy-MM-dd')}.pdf`;
    saveAs(blob, fileName);
  } catch (error) {
    throw new Error(`Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
  }
}

/**
 * Quebra texto em linhas que cabem na largura especificada
 */
function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  const charsPerLine = Math.floor(maxWidth / (fontSize * 0.6));
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    
    if (testLine.length > charsPerLine && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Retorna cor baseada na severidade
 */
function getSeverityColor(severity: string): any {
  const lowerSeverity = severity.toLowerCase();
  if (lowerSeverity.includes('crítico') || lowerSeverity.includes('critico')) {
    return colors.critical;
  }
  if (lowerSeverity.includes('alto')) {
    return colors.high;
  }
  if (lowerSeverity.includes('médio') || lowerSeverity.includes('medio')) {
    return colors.medium;
  }
  return colors.low;
}
