import React, { useMemo } from 'react';
import { Badge } from '../common/Badge';

interface TestReportTextPreviewProps {
  reportText: string;
  formatLabel: string;
  isAISummarized?: boolean;
}

type PreviewStatus = 'Aprovado' | 'Reprovado' | 'Bloqueado';

type PreviewRow =
  | { type: 'meta'; label: string; value: string }
  | { type: 'section'; title: string }
  | { type: 'status'; status: PreviewStatus; content: string; details: string[] }
  | { type: 'text'; content: string }
  | { type: 'footer'; content: string };

function getStatusStyles(status: PreviewStatus) {
  if (status === 'Aprovado') {
    return {
      badgeVariant: 'success' as const,
      cardClass: 'border border-success/25 bg-success/10',
      textClass: 'text-success',
    };
  }

  if (status === 'Bloqueado') {
    return {
      badgeVariant: 'warning' as const,
      cardClass: 'border border-warning/25 bg-warning/10',
      textClass: 'text-warning',
    };
  }

  return {
    badgeVariant: 'error' as const,
    cardClass: 'border border-error/25 bg-error/10',
    textClass: 'text-error',
  };
}

function parseReportRows(reportText: string): PreviewRow[] {
  const rows: PreviewRow[] = [];
  let activeStatusRow: Extract<PreviewRow, { type: 'status' }> | null = null;

  const flushActiveStatus = () => {
    if (activeStatusRow) {
      rows.push(activeStatusRow);
      activeStatusRow = null;
    }
  };

  const lines = reportText.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushActiveStatus();
      continue;
    }

    if (line.startsWith('TASK: ')) {
      flushActiveStatus();
      rows.push({ type: 'meta', label: 'Task', value: line.replace(/^TASK:\s*/, '') });
      continue;
    }

    if (line.startsWith('Título: ')) {
      flushActiveStatus();
      rows.push({ type: 'meta', label: 'Título', value: line.replace(/^Título:\s*/, '') });
      continue;
    }

    if (line.startsWith('Concluído em: ')) {
      flushActiveStatus();
      rows.push({ type: 'footer', content: line });
      continue;
    }

    if (/^[A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ0-9 ]+:$/.test(line)) {
      flushActiveStatus();
      rows.push({ type: 'section', title: line.replace(/:$/, '') });
      continue;
    }

    const structuredStatusMatch = line.match(/^\d+\.\s+\[(APROVADO|REPROVADO|BLOQUEADO)\]\s+(.+)$/);
    if (structuredStatusMatch) {
      flushActiveStatus();
      const mappedStatus =
        structuredStatusMatch[1] === 'APROVADO'
          ? 'Aprovado'
          : structuredStatusMatch[1] === 'BLOQUEADO'
            ? 'Bloqueado'
            : 'Reprovado';

      activeStatusRow = {
        type: 'status',
        status: mappedStatus,
        content: structuredStatusMatch[2],
        details: [],
      };
      continue;
    }

    const conciseStatusMatch = line.match(/^-\s+(Aprovado|Reprovado|Bloqueado):\s+(.+)$/);
    if (conciseStatusMatch) {
      flushActiveStatus();
      rows.push({
        type: 'status',
        status: conciseStatusMatch[1] as PreviewStatus,
        content: conciseStatusMatch[2],
        details: [],
      });
      continue;
    }

    if (activeStatusRow && /^(Observação|Status final):\s+(.+)$/.test(line)) {
      activeStatusRow.details.push(line);
      continue;
    }

    flushActiveStatus();
    rows.push({ type: 'text', content: line });
  }

  flushActiveStatus();
  return rows;
}

export const TestReportTextPreview: React.FC<TestReportTextPreviewProps> = ({
  reportText,
  formatLabel,
  isAISummarized = false,
}) => {
  const parsedRows = useMemo(() => parseReportRows(reportText), [reportText]);

  return (
    <section
      aria-label="Prévia do relatório de testes"
      className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-sm"
    >
      <div className="flex flex-col gap-3 border-b border-base-200 bg-base-200/60 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-base-content">Prévia pronta para copiar</p>
          <p className="text-xs text-base-content/70">
            O botão copiar usa exatamente este conteúdo.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Badge variant="neutral" appearance="pill" size="sm">
            {formatLabel}
          </Badge>
          {isAISummarized ? (
            <Badge variant="info" appearance="pill" size="sm">
              Resumido com IA
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto px-4 py-4">
        {isAISummarized ? (
          <div className="space-y-3 select-text text-sm leading-relaxed text-base-content">
            {reportText
              .split('\n')
              .map(line => line.trim())
              .filter(Boolean)
              .map((line, index) => (
                <p key={`${line}-${index}`} className="rounded-xl border border-base-200 bg-base-100 px-3 py-2">
                  {line}
                </p>
              ))}
          </div>
        ) : (
          <div className="space-y-3 select-text">
            {parsedRows.map((row, index) => {
              if (row.type === 'meta') {
                return (
                  <div
                    key={`${row.type}-${index}`}
                    className="grid gap-1 rounded-xl border border-base-200 bg-base-200/40 px-3 py-2"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-base-content/60">
                      {row.label}
                    </span>
                    <span className="text-sm font-medium text-base-content">{row.value}</span>
                  </div>
                );
              }

              if (row.type === 'section') {
                return (
                  <div key={`${row.type}-${index}`} className="flex items-center gap-3 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-base-content/55">
                      {row.title}
                    </span>
                    <div className="h-px flex-1 bg-base-300" />
                  </div>
                );
              }

              if (row.type === 'status') {
                const styles = getStatusStyles(row.status);
                return (
                  <div
                    key={`${row.type}-${index}`}
                    className={`space-y-2 rounded-xl px-3 py-3 ${styles.cardClass}`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <p className="text-sm font-medium leading-relaxed break-words text-base-content">
                        {row.content}
                      </p>
                      <Badge
                        variant={styles.badgeVariant}
                        appearance="pill"
                        size="sm"
                        className="self-start"
                      >
                        {row.status}
                      </Badge>
                    </div>
                    {row.details.length > 0 ? (
                      <div className="space-y-1.5">
                        {row.details.map((detail, detailIndex) => (
                          <p
                            key={`${detail}-${detailIndex}`}
                            className={`text-xs leading-relaxed ${styles.textClass}`}
                          >
                            {detail}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              }

              if (row.type === 'footer') {
                return (
                  <div
                    key={`${row.type}-${index}`}
                    className="rounded-xl border border-base-200 bg-base-200/40 px-3 py-2 text-xs font-medium text-base-content/70"
                  >
                    {row.content}
                  </div>
                );
              }

              return (
                <p
                  key={`${row.type}-${index}`}
                  className="rounded-xl border border-base-200 bg-base-100 px-3 py-2 text-sm leading-relaxed text-base-content"
                >
                  {row.content}
                </p>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
