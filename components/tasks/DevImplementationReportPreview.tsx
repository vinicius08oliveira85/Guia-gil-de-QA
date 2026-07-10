import React, { useMemo } from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { Badge } from '../common/Badge';
import { cn } from '../../utils/cn';
import {
  leveSettingsHeadingXsClass,
  leveSettingsMutedTextClass,
  leveSettingsMutedTextXsClass,
} from '../common/projectCardUi';
import { parseDevImplementationReportPreview } from '../../utils/devImplementationReportPreviewParse';
import {
  testReportModalPreviewFieldClass,
  testReportModalPreviewHeaderClass,
  testReportModalSectionClass,
} from './testReportNeuUi';

export interface DevImplementationReportPreviewProps {
  reportText: string;
  formatLabel: string;
  isAISummarized?: boolean;
  aiSummaryMode?: 'executive' | 'po' | null;
}

export const DevImplementationReportPreview: React.FC<DevImplementationReportPreviewProps> = ({
  reportText,
  formatLabel,
  isAISummarized = false,
  aiSummaryMode = null,
}) => {
  const rows = useMemo(() => parseDevImplementationReportPreview(reportText), [reportText]);
  const isMarkdown = formatLabel === 'Markdown' && !isAISummarized;

  return (
    <section
      aria-label="Prévia do registro de implementação"
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
            {rows.map((row, index) => {
              if (row.kind === 'meta') {
                return (
                  <div
                    key={`meta-${index}`}
                    className={cn(testReportModalPreviewFieldClass, 'grid gap-1')}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-base-content/72">
                      {row.label}
                    </span>
                    <span className="break-words text-sm font-medium leading-relaxed text-base-content">
                      {row.value}
                    </span>
                  </div>
                );
              }

              if (row.kind === 'section') {
                return (
                  <div key={`section-${index}`} className="flex items-center gap-3 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-base-content/72">
                      {row.title}
                    </span>
                    <div className="h-px flex-1 bg-base-300" />
                  </div>
                );
              }

              if (row.kind === 'paragraph') {
                return (
                  <p
                    key={`paragraph-${index}`}
                    className={cn(
                      testReportModalPreviewFieldClass,
                      'text-sm leading-relaxed text-base-content'
                    )}
                  >
                    {row.text}
                  </p>
                );
              }

              if (row.kind === 'checklist') {
                return (
                  <div
                    key={`checklist-${index}`}
                    className={cn(testReportModalPreviewFieldClass, 'space-y-2')}
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-base-content/72">
                      {row.title}
                    </p>
                    <ul className="space-y-2">
                      {row.items.map(item => (
                        <li key={item} className="flex items-start gap-2 text-sm text-base-content">
                          <span
                            className="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border border-base-300/80 text-[10px] text-base-content/50"
                            aria-hidden
                          >
                            ☐
                          </span>
                          <span className="min-w-0 flex-1 break-words leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }

              if (row.kind === 'step') {
                const done = row.status === 'done';
                const StatusIcon = done ? CheckCircle2 : Circle;
                return (
                  <div
                    key={`step-${index}`}
                    className={cn(
                      'space-y-2 rounded-box border px-3 py-3',
                      done
                        ? 'border-success/25 bg-success/10'
                        : 'border-base-300/60 bg-base-200/35'
                    )}
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                      <div className="flex min-w-0 items-start gap-2.5">
                        <span
                          className={cn(
                            'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                            done
                              ? 'bg-success/15 text-success'
                              : 'bg-base-content/10 text-base-content/60'
                          )}
                        >
                          {row.order}
                        </span>
                        <div className="min-w-0 space-y-1">
                          <p className="break-words text-sm font-medium leading-relaxed text-base-content">
                            {row.title}
                          </p>
                          {row.description.length > 0 ? (
                            <div className="space-y-1">
                              {row.description.map((line, lineIndex) => (
                                <p
                                  key={`${line}-${lineIndex}`}
                                  className="break-words text-xs leading-relaxed text-base-content/85"
                                >
                                  {line}
                                </p>
                              ))}
                            </div>
                          ) : null}
                          {row.files ? (
                            <p className="break-words text-xs text-base-content/72">
                              <span className="font-semibold">Arquivos:</span> {row.files}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <Badge
                        variant={done ? 'success' : 'neutral'}
                        appearance="pill"
                        size="sm"
                        className="self-start"
                      >
                        <StatusIcon className="mr-1 inline h-3 w-3" aria-hidden />
                        {done ? 'Concluído' : 'Pendente'}
                      </Badge>
                    </div>

                    {row.validations.length > 0 ? (
                      <div className="space-y-1.5 border-t border-base-300/50 pt-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-base-content/72">
                          Validações
                        </p>
                        {row.validations.map(validation => (
                          <div
                            key={validation.text}
                            className="flex items-start gap-2 text-xs text-base-content/85"
                          >
                            <span aria-hidden>{validation.checked ? '☑' : '☐'}</span>
                            <span className="min-w-0 flex-1 break-words">{validation.text}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              }

              if (row.kind === 'bullets') {
                return (
                  <div
                    key={`bullets-${index}`}
                    className={cn(testReportModalPreviewFieldClass, 'space-y-2')}
                  >
                    {row.title ? (
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-base-content/72">
                        {row.title}
                      </p>
                    ) : null}
                    <ul className="list-disc space-y-1 pl-5 text-sm text-base-content">
                      {row.items.map(item => (
                        <li key={item} className="break-words leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              }

              return (
                <div
                  key={`footer-${index}`}
                  className={cn(
                    testReportModalPreviewFieldClass,
                    leveSettingsMutedTextClass,
                    'text-xs font-medium'
                  )}
                >
                  {row.text}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

DevImplementationReportPreview.displayName = 'DevImplementationReportPreview';
