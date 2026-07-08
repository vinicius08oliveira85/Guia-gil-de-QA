import React, { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { Badge } from '../common/Badge';
import { cn } from '../../utils/cn';
import {
  leveSettingsHeadingXsClass,
  leveSettingsMutedTextClass,
  leveSettingsMutedTextXsClass,
} from '../common/projectCardUi';
import {
  testReportModalPreviewFieldClass,
  testReportModalPreviewHeaderClass,
  testReportModalSectionClass,
  testReportModalStatCardClass,
} from './testReportNeuUi';

interface TestReportTextPreviewProps {
  reportText: string;
  formatLabel: string;
  isAISummarized?: boolean;
  aiSummaryMode?: 'executive' | 'po' | null;
}

type PreviewStatus = 'Aprovado' | 'Reprovado' | 'Bloqueado';
type PreviewSummaryMetrics = {
  approved: number;
  failed: number;
  blocked: number;
  notRun: number;
};

type PreviewRow =
  | { type: 'meta'; label: string; value: string }
  | { type: 'summary'; metrics: PreviewSummaryMetrics }
  | { type: 'section'; title: string }
  | { type: 'status'; status: PreviewStatus; content: string; details: string[] }
  | { type: 'poCase'; status: PreviewStatus; title: string; details: string[] }
  | { type: 'text'; content: string }
  | { type: 'footer'; content: string };

function getStatusStyles(status: PreviewStatus) {
  if (status === 'Aprovado') {
    return {
      Icon: CheckCircle2,
      badgeVariant: 'success' as const,
      cardClass: 'border border-success/25 bg-success/10',
      textClass: 'text-success',
      iconClass: 'text-success',
      iconChipClass: 'bg-success/15 text-success',
    };
  }

  if (status === 'Bloqueado') {
    return {
      Icon: AlertTriangle,
      badgeVariant: 'warning' as const,
      cardClass: 'border border-warning/25 bg-warning/10',
      textClass: 'text-warning',
      iconClass: 'text-warning',
      iconChipClass: 'bg-warning/15 text-warning',
    };
  }

  return {
    Icon: XCircle,
    badgeVariant: 'error' as const,
    cardClass: 'border border-error/25 bg-error/10',
    textClass: 'text-error',
    iconClass: 'text-error',
    iconChipClass: 'bg-error/15 text-error',
  };
}

function getSummaryMetricStyles(type: keyof PreviewSummaryMetrics) {
  switch (type) {
    case 'approved':
      return {
        label: 'Aprovados',
        Icon: CheckCircle2,
        className: 'border-success/25 bg-success/10 text-success',
      };
    case 'failed':
      return {
        label: 'Reprovados',
        Icon: XCircle,
        className: 'border-error/25 bg-error/10 text-error',
      };
    case 'blocked':
      return {
        label: 'Bloqueados',
        Icon: AlertTriangle,
        className: 'border-warning/25 bg-warning/10 text-warning',
      };
    case 'notRun':
      return {
        label: 'Não executados',
        Icon: Clock3,
        className:
          'border-[color-mix(in_srgb,#5C524B_38%,transparent)] bg-[color-mix(in_srgb,#3A342F_22%,#4B433D)] text-[rgba(245,241,230,0.78)]',
      };
  }
}

function parseReportRows(reportText: string): PreviewRow[] {
  const rows: PreviewRow[] = [];
  let activeStatusRow: Extract<PreviewRow, { type: 'status' }> | null = null;
  let activePoCase: Extract<PreviewRow, { type: 'poCase' }> | null = null;

  const flushActiveStatus = () => {
    if (activeStatusRow) {
      rows.push(activeStatusRow);
      activeStatusRow = null;
    }
  };

  const flushActivePoCase = () => {
    if (activePoCase) {
      rows.push(activePoCase);
      activePoCase = null;
    }
  };

  const flushActive = () => {
    flushActiveStatus();
    flushActivePoCase();
  };

  const lines = reportText.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushActive();
      continue;
    }

    if (line.startsWith('TASK: ') || line.startsWith('RELATÓRIO DE VALIDAÇÃO PARA PO |')) {
      flushActive();
      rows.push({
        type: 'meta',
        label: 'Task',
        value: line.replace(/^TASK:\s*/, '').replace(/^RELATÓRIO DE VALIDAÇÃO PARA PO \| /, ''),
      });
      continue;
    }

    if (line.startsWith('Título: ')) {
      flushActive();
      rows.push({ type: 'meta', label: 'Título', value: line.replace(/^Título:\s*/, '') });
      continue;
    }

    if (
      line.startsWith('História / contexto: ') ||
      line.startsWith('Cenários BDD relacionados: ') ||
      line.startsWith('Escopo desta execução: ')
    ) {
      flushActive();
      const [label, ...rest] = line.split(':');
      rows.push({ type: 'meta', label: label.trim(), value: rest.join(':').trim() });
      continue;
    }

    if (line.startsWith('Concluído em: ')) {
      flushActive();
      rows.push({ type: 'footer', content: line });
      continue;
    }

    const conciseSummaryMatch = line.match(
      /^Resumo:\s+(\d+)\s+aprovado\(s\)\s+\|\s+(\d+)\s+reprovado\(s\)\s+\|\s+(\d+)\s+bloqueado\(s\)\s+\|\s+(\d+)\s+n(?:ã|a)o executado\(s\)$/i
    );
    if (conciseSummaryMatch) {
      flushActive();
      rows.push({
        type: 'summary',
        metrics: {
          approved: Number(conciseSummaryMatch[1]),
          failed: Number(conciseSummaryMatch[2]),
          blocked: Number(conciseSummaryMatch[3]),
          notRun: Number(conciseSummaryMatch[4]),
        },
      });
      continue;
    }

    const poCaseMatch = line.match(/^CASO\s+(\d+)\s+—\s+(Aprovado|Reprovado|Bloqueado)/i);
    if (poCaseMatch) {
      flushActive();
      activePoCase = {
        type: 'poCase',
        status: poCaseMatch[2] as PreviewStatus,
        title: `Caso ${poCaseMatch[1]}`,
        details: [],
      };
      continue;
    }

    if (activePoCase) {
      if (/^(O que foi validado|Como foi testado|Dados \/ contexto|Resultado obtido|Status):/.test(line)) {
        activePoCase.details.push(line);
        continue;
      }
      if (/^\d+\.\s+/.test(line)) {
        activePoCase.details.push(line);
        continue;
      }
    }

    if (/^[A-ZÁÀÂÃÉÈÊÍÌÎÓÒÔÕÚÙÛÇ0-9 /]+:$/.test(line)) {
      flushActive();
      rows.push({ type: 'section', title: line.replace(/:$/, '') });
      continue;
    }

    const structuredStatusMatch = line.match(
      /^\d+\.\s+\[(APROVADO|REPROVADO|BLOQUEADO)(?:\s+[^\]]+)?\]\s+(.+)$/
    );
    if (structuredStatusMatch) {
      flushActive();
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

    const conciseStatusMatch = line.match(
      /^-\s+(Aprovado|Reprovado|Bloqueado)(?:\s+(?:✅|❌|⚠️))?:\s+(.+)$/
    );
    if (conciseStatusMatch) {
      flushActive();
      rows.push({
        type: 'status',
        status: conciseStatusMatch[1] as PreviewStatus,
        content: conciseStatusMatch[2],
        details: [],
      });
      continue;
    }

    if (
      activeStatusRow &&
      /^(Observação|Status final|Resultado esperado|Ação necessária|Parâmetros \/ contexto|Resultado obtido):\s+/.test(
        line
      )
    ) {
      activeStatusRow.details.push(line);
      continue;
    }

    flushActive();
    rows.push({ type: 'text', content: line });
  }

  flushActive();
  return rows;
}

export const TestReportTextPreview: React.FC<TestReportTextPreviewProps> = ({
  reportText,
  formatLabel,
  isAISummarized = false,
  aiSummaryMode = null,
}) => {
  const parsedRows = useMemo(() => parseReportRows(reportText), [reportText]);
  const isMarkdown = formatLabel === 'Markdown' && !isAISummarized;

  return (
    <section
      aria-label="Prévia do relatório de testes"
      className={cn(
        testReportModalSectionClass,
        'flex h-full min-h-[320px] flex-col overflow-hidden'
      )}
    >
      <div
        className={cn(
          testReportModalPreviewHeaderClass,
          'flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between'
        )}
      >
        <div className="min-w-0">
          <p className={leveSettingsHeadingXsClass}>Prévia pronta para copiar</p>
          <p className={leveSettingsMutedTextXsClass}>O botão copiar usa exatamente este conteúdo.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Badge variant="neutral" appearance="pill" size="sm">
            {formatLabel}
          </Badge>
          {isAISummarized ? (
            <Badge variant="info" appearance="pill" size="sm">
              {aiSummaryMode === 'po' ? 'Narrativa PO (IA)' : 'Resumido com IA'}
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
                <p key={`${line}-${index}`} className={testReportModalPreviewFieldClass}>
                  {line}
                </p>
              ))}
          </div>
        ) : isMarkdown ? (
          <pre
            className={cn(
              testReportModalPreviewFieldClass,
              'whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-base-content'
            )}
          >
            {reportText}
          </pre>
        ) : (
          <div className="space-y-3 select-text">
            {parsedRows.map((row, index) => {
              if (row.type === 'meta') {
                return (
                  <div
                    key={`${row.type}-${index}`}
                    className={cn(testReportModalPreviewFieldClass, 'grid gap-1')}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-base-content/72">
                      {row.label}
                    </span>
                    <span className="text-sm font-medium text-base-content">{row.value}</span>
                  </div>
                );
              }

              if (row.type === 'section') {
                return (
                  <div key={`${row.type}-${index}`} className="flex items-center gap-3 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-base-content/72">
                      {row.title}
                    </span>
                    <div className="h-px flex-1 bg-base-300" />
                  </div>
                );
              }

              if (row.type === 'summary') {
                const metricOrder: Array<keyof PreviewSummaryMetrics> = [
                  'approved',
                  'failed',
                  'blocked',
                  'notRun',
                ];

                return (
                  <div
                    key={`${row.type}-${index}`}
                    className="grid grid-cols-1 gap-2 sm:grid-cols-2 2xl:grid-cols-4"
                  >
                    {metricOrder.map(metricKey => {
                      const metric = getSummaryMetricStyles(metricKey);
                      const Icon = metric.Icon;
                      return (
                        <div
                          key={metricKey}
                          className={cn(
                            testReportModalStatCardClass,
                            'flex min-h-[92px] flex-col items-start justify-between gap-3 text-left',
                            metric.className
                          )}
                        >
                          <div className="flex w-full items-start gap-2">
                            <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-current/10">
                              <Icon className="h-4 w-4" aria-hidden />
                            </span>
                            <p className="min-w-0 text-[11px] font-semibold uppercase leading-tight tracking-wide opacity-80 break-words">
                              {metric.label}
                            </p>
                          </div>
                          <p className="text-2xl font-bold leading-none">{row.metrics[metricKey]}</p>
                        </div>
                      );
                    })}
                  </div>
                );
              }

              if (row.type === 'status') {
                const styles = getStatusStyles(row.status);
                const Icon = styles.Icon;
                return (
                  <div
                    key={`${row.type}-${index}`}
                    className={`space-y-2 rounded-box px-3 py-3 ${styles.cardClass}`}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${styles.iconChipClass}`}
                        >
                          <Icon className={`h-4 w-4 ${styles.iconClass}`} aria-hidden />
                        </span>
                        <p className="break-words text-sm font-medium leading-relaxed text-base-content">
                          {row.content}
                        </p>
                      </div>
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

              if (row.type === 'poCase') {
                const styles = getStatusStyles(row.status);
                const Icon = styles.Icon;
                return (
                  <div
                    key={`${row.type}-${index}`}
                    className={`space-y-2 rounded-box px-3 py-3 ${styles.cardClass}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-base-content">{row.title}</p>
                      <Badge variant={styles.badgeVariant} appearance="pill" size="sm">
                        {row.status}
                      </Badge>
                    </div>
                    <div className="flex items-start gap-2">
                      <span
                        className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${styles.iconChipClass}`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${styles.iconClass}`} aria-hidden />
                      </span>
                      <div className="space-y-1.5">
                        {row.details.map((detail, detailIndex) => (
                          <p
                            key={`${detail}-${detailIndex}`}
                            className="text-xs leading-relaxed text-base-content"
                          >
                            {detail}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              }

              if (row.type === 'footer') {
                return (
                  <div
                    key={`${row.type}-${index}`}
                    className={cn(testReportModalPreviewFieldClass, 'text-xs font-medium text-base-content/72')}
                  >
                    {row.content}
                  </div>
                );
              }

              return (
                <p
                  key={`${row.type}-${index}`}
                  className={cn(
                    testReportModalPreviewFieldClass,
                    'text-sm leading-relaxed text-base-content'
                  )}
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
