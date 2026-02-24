import React, { useMemo } from 'react';
import { CollapsibleSection } from './CollapsibleSection';
import { CopySectionButton } from './CopySectionButton';

interface ReportPreviewProps {
  reportText: string;
  format: 'text' | 'markdown';
  onFormatChange?: (format: 'text' | 'markdown') => void;
}

/**
 * Componente de preview do relatório com syntax highlighting e seções colapsáveis
 */
export const ReportPreview: React.FC<ReportPreviewProps> = ({
  reportText,
  format,
  onFormatChange,
}) => {
  type ReportSection = { title: string; content: string; startLine: number };
  type DraftSection = { title: string; content: string[]; startLine: number };

  // Dividir relatório em seções
  const sections = useMemo(() => {
    const lines = reportText.split('\n');
    const result: ReportSection[] = [];

    let currentSection: DraftSection | null = null;

    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      // Detectar cabeçalhos
      if (
        line.startsWith('RELATÓRIO DE TESTES REPROVADOS') ||
        line.startsWith('# RELATÓRIO DE TESTES REPROVADOS')
      ) {
        if (currentSection) {
          result.push({
            title: currentSection.title,
            content: currentSection.content.join('\n'),
            startLine: currentSection.startLine,
          });
        }
        currentSection = { title: 'Cabeçalho', content: [line], startLine: idx };
      } else if (
        line.startsWith('FILTROS APLICADOS') ||
        line.startsWith('## FILTROS APLICADOS') ||
        line.startsWith('FILTROS APLICADOS:')
      ) {
        if (currentSection) {
          result.push({
            title: currentSection.title,
            content: currentSection.content.join('\n'),
            startLine: currentSection.startLine,
          });
        }
        currentSection = { title: 'Filtros Aplicados', content: [line], startLine: idx };
      } else if (line.startsWith('TESTES REPROVADOS') || line.startsWith('## TESTES REPROVADOS')) {
        if (currentSection) {
          result.push({
            title: currentSection.title,
            content: currentSection.content.join('\n'),
            startLine: currentSection.startLine,
          });
        }
        currentSection = { title: 'Testes Reprovados', content: [line], startLine: idx };
      } else if (currentSection) {
        currentSection.content.push(line);
      }
    }

    if (currentSection) {
      result.push({
        title: currentSection.title,
        content: currentSection.content.join('\n'),
        startLine: currentSection.startLine,
      });
    }

    // Se não encontrou seções, retornar tudo como uma seção
    if (result.length === 0) {
      return [
        {
          title: 'Relatório Completo',
          content: reportText,
          startLine: 0,
        },
      ];
    }

    return result;
  }, [reportText]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toggle de formato */}
      {onFormatChange && (
        <div className="flex-shrink-0 flex items-center justify-between mb-sm pb-sm border-b border-base-300">
          <span className="text-xs font-semibold text-base-content/70 uppercase tracking-wide">
            Formato
          </span>
          <div className="flex gap-xs">
            <button
              type="button"
              onClick={() => onFormatChange('text')}
              className={`
                btn btn-xs
                ${format === 'text' ? 'btn-primary' : 'btn-ghost'}
              `}
            >
              Texto
            </button>
            <button
              type="button"
              onClick={() => onFormatChange('markdown')}
              className={`
                btn btn-xs
                ${format === 'markdown' ? 'btn-primary' : 'btn-ghost'}
              `}
            >
              Markdown
            </button>
          </div>
        </div>
      )}

      {/* Preview com seções colapsáveis */}
      <div className="flex-1 overflow-y-auto space-y-sm">
        {sections.map((section, idx) => (
          <CollapsibleSection key={idx} title={section.title} defaultExpanded={idx === 0}>
            <div className="flex items-center justify-between mb-xs">
              <span className="text-xs text-base-content/70">
                {section.content.split('\n').length} linhas
              </span>
              <CopySectionButton text={section.content} sectionName={section.title} />
            </div>
            <pre
              className={`
              w-full p-sm rounded-lg
              bg-base-200 border border-base-300
              text-xs font-mono text-base-content
              overflow-x-auto
              ${format === 'markdown' ? 'whitespace-pre-wrap' : ''}
            `}
            >
              {section.content}
            </pre>
          </CollapsibleSection>
        ))}
      </div>
    </div>
  );
};
