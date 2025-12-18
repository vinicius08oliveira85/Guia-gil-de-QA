import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
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
  };
  task: {
    id: string;
    title: string;
  };
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
    const sectionSpacing = 20;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - margin;

    // Cores
    const primaryColor = rgb(0.2, 0.4, 0.8);
    const errorColor = rgb(0.8, 0.2, 0.2);
    const textColor = rgb(0, 0, 0);
    const lightGray = rgb(0.9, 0.9, 0.9);

    // ========== CAPA ==========
    // Título principal
    page.drawText('RELATÓRIO DE BUGS ENCONTRADOS', {
      x: margin,
      y: yPosition,
      size: 24,
      font: boldFont,
      color: primaryColor
    });
    yPosition -= 40;

    page.drawText('Análise QA Sênior', {
      x: margin,
      y: yPosition,
      size: 16,
      font: font,
      color: textColor
    });
    yPosition -= 60;

    // Informações do projeto
    page.drawText('Projeto:', {
      x: margin,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: textColor
    });
    page.drawText(project.name, {
      x: margin + 60,
      y: yPosition,
      size: 12,
      font: font,
      color: textColor
    });
    yPosition -= 25;

    page.drawText('Data:', {
      x: margin,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: textColor
    });
    page.drawText(format(generatedAt, 'dd/MM/yyyy HH:mm'), {
      x: margin + 60,
      y: yPosition,
      size: 12,
      font: font,
      color: textColor
    });
    yPosition -= 25;

    page.drawText('Total de Bugs:', {
      x: margin,
      y: yPosition,
      size: 12,
      font: boldFont,
      color: textColor
    });
    page.drawText(failedTests.length.toString(), {
      x: margin + 90,
      y: yPosition,
      size: 12,
      font: font,
      color: errorColor
    });
    yPosition -= 40;

    // Linha divisória
    page.drawLine({
      start: { x: margin, y: yPosition },
      end: { x: pageWidth - margin, y: yPosition },
      thickness: 1,
      color: lightGray
    });
    yPosition -= sectionSpacing;

    // ========== RESUMO EXECUTIVO ==========
    const executiveSummaryMatch = analysisText.match(/RESUMO EXECUTIVO\s*-+\s*([\s\S]*?)(?=BUGS IDENTIFICADOS|PRIORIZAÇÃO|$)/i);
    if (executiveSummaryMatch) {
      if (yPosition < 150) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
      }

      page.drawText('RESUMO EXECUTIVO', {
        x: margin,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: primaryColor
      });
      yPosition -= 30;

      const summaryText = executiveSummaryMatch[1].trim();
      const summaryLines = wrapText(summaryText, pageWidth - 2 * margin, font, 11);
      
      summaryLines.forEach(line => {
        if (yPosition < 50) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          yPosition = pageHeight - margin;
        }
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: 11,
          font: font,
          color: textColor
        });
        yPosition -= lineHeight;
      });
      yPosition -= sectionSpacing;
    }

    // ========== BUGS IDENTIFICADOS ==========
    const bugsSectionMatch = analysisText.match(/BUGS IDENTIFICADOS\s*-+\s*([\s\S]*?)(?=PRIORIZAÇÃO|PRÓXIMOS PASSOS|$)/i);
    
    if (yPosition < 200) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      yPosition = pageHeight - margin;
    }

    page.drawText('BUGS IDENTIFICADOS', {
      x: margin,
      y: yPosition,
      size: 16,
      font: boldFont,
      color: primaryColor
    });
    yPosition -= 30;

    // Processar cada bug
    if (bugsSectionMatch) {
      const bugsText = bugsSectionMatch[1];
      const bugMatches = bugsText.match(/\d+\.\s*([^\n]+)\n([\s\S]*?)(?=\d+\.|$)/g);
      
      if (bugMatches) {
        bugMatches.forEach((bugMatch, index) => {
          if (yPosition < 100) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            yPosition = pageHeight - margin;
          }

          const bugLines = bugMatch.split('\n').filter(l => l.trim());
          const bugTitle = bugLines[0]?.replace(/^\d+\.\s*/, '') || `Bug ${index + 1}`;
          
          // Título do bug
          page.drawText(`${index + 1}. ${bugTitle}`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: boldFont,
            color: textColor
          });
          yPosition -= 20;

          // Detalhes do bug
          bugLines.slice(1).forEach(line => {
            if (yPosition < 50) {
              page = pdfDoc.addPage([pageWidth, pageHeight]);
              yPosition = pageHeight - margin;
            }

            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('- Severidade:')) {
              const severity = trimmedLine.replace('- Severidade:', '').trim();
              const severityColor = getSeverityColor(severity);
              page.drawText('Severidade:', {
                x: margin + 10,
                y: yPosition,
                size: 10,
                font: boldFont,
                color: textColor
              });
              page.drawText(severity, {
                x: margin + 80,
                y: yPosition,
                size: 10,
                font: font,
                color: severityColor
              });
              yPosition -= lineHeight;
            } else if (trimmedLine.startsWith('-')) {
              const wrapped = wrapText(trimmedLine, pageWidth - 2 * margin - 20, font, 10);
              wrapped.forEach(wrappedLine => {
                if (yPosition < 50) {
                  page = pdfDoc.addPage([pageWidth, pageHeight]);
                  yPosition = pageHeight - margin;
                }
                page.drawText(wrappedLine, {
                  x: margin + 10,
                  y: yPosition,
                  size: 10,
                  font: font,
                  color: textColor
                });
                yPosition -= lineHeight;
              });
            }
          });

          yPosition -= 15;
        });
      }
    } else {
      // Fallback: listar bugs diretamente dos dados
      failedTests.forEach((ft, index) => {
        if (yPosition < 100) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          yPosition = pageHeight - margin;
        }

        page.drawText(`${index + 1}. ${ft.testCase.description || `Bug na tarefa ${ft.task.id}`}`, {
          x: margin,
          y: yPosition,
          size: 12,
          font: boldFont,
          color: textColor
        });
        yPosition -= 20;

        page.drawText(`Tarefa: ${ft.task.id} - ${ft.task.title}`, {
          x: margin + 10,
          y: yPosition,
          size: 10,
          font: font,
          color: textColor
        });
        yPosition -= lineHeight;

        if (ft.testCase.observedResult) {
          const wrapped = wrapText(`Resultado Observado: ${ft.testCase.observedResult}`, pageWidth - 2 * margin - 20, font, 10);
          wrapped.forEach(line => {
            if (yPosition < 50) {
              page = pdfDoc.addPage([pageWidth, pageHeight]);
              yPosition = pageHeight - margin;
            }
            page.drawText(line, {
              x: margin + 10,
              y: yPosition,
              size: 10,
              font: font,
              color: errorColor
            });
            yPosition -= lineHeight;
          });
        }

        yPosition -= 15;
      });
    }

    // ========== PRIORIZAÇÃO ==========
    const prioritizationMatch = analysisText.match(/PRIORIZAÇÃO\s*-+\s*([\s\S]*?)(?=PRÓXIMOS PASSOS|$)/i);
    if (prioritizationMatch) {
      if (yPosition < 150) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
      }

      page.drawText('PRIORIZAÇÃO', {
        x: margin,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: primaryColor
      });
      yPosition -= 30;

      const prioritizationText = prioritizationMatch[1].trim();
      const prioritizationLines = wrapText(prioritizationText, pageWidth - 2 * margin, font, 11);
      
      prioritizationLines.forEach(line => {
        if (yPosition < 50) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          yPosition = pageHeight - margin;
        }
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: 11,
          font: font,
          color: textColor
        });
        yPosition -= lineHeight;
      });
    }

    // ========== PRÓXIMOS PASSOS ==========
    const nextStepsMatch = analysisText.match(/PRÓXIMOS PASSOS\s*-+\s*([\s\S]*?)$/i);
    if (nextStepsMatch) {
      if (yPosition < 150) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - margin;
      }

      page.drawText('PRÓXIMOS PASSOS', {
        x: margin,
        y: yPosition,
        size: 16,
        font: boldFont,
        color: primaryColor
      });
      yPosition -= 30;

      const nextStepsText = nextStepsMatch[1].trim();
      const nextStepsLines = nextStepsText.split('\n').filter(l => l.trim());
      
      nextStepsLines.forEach(line => {
        if (yPosition < 50) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          yPosition = pageHeight - margin;
        }
        const trimmedLine = line.trim().replace(/^\d+\.\s*/, '');
        page.drawText(`• ${trimmedLine}`, {
          x: margin,
          y: yPosition,
          size: 11,
          font: font,
          color: textColor
        });
        yPosition -= lineHeight;
      });
    }

    // ========== RODAPÉ ==========
    const totalPages = pdfDoc.getPageCount();
    for (let i = 0; i < totalPages; i++) {
      const currentPage = pdfDoc.getPage(i);
      currentPage.drawText(
        `Página ${i + 1} de ${totalPages} - ${project.name} - ${format(generatedAt, 'dd/MM/yyyy')}`,
        {
          x: margin,
          y: 30,
          size: 8,
          font: font,
          color: rgb(0.5, 0.5, 0.5)
        }
      );
    }

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
 * Usa estimativa baseada em caracteres (aproximadamente 6 pixels por caractere para Helvetica)
 */
function wrapText(text: string, maxWidth: number, font: any, fontSize: number): string[] {
  // Estimativa: aproximadamente 0.6 * fontSize pixels por caractere para Helvetica
  const charsPerLine = Math.floor(maxWidth / (fontSize * 0.6));
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    
    // Se a linha testada exceder o limite de caracteres, quebrar
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
    return rgb(0.8, 0.1, 0.1);
  }
  if (lowerSeverity.includes('alto')) {
    return rgb(0.9, 0.5, 0.1);
  }
  if (lowerSeverity.includes('médio') || lowerSeverity.includes('medio')) {
    return rgb(0.9, 0.7, 0.1);
  }
  return rgb(0.2, 0.6, 0.2);
}

