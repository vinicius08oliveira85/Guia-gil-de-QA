import React from 'react';
import { Eye, ExternalLink, Bot, Wand2, Pencil, Trash2 } from 'lucide-react';
import { Spinner } from '../common/Spinner';
import { Button } from '../common/Button';
import { cn } from '../../utils/cn';
import { dashboardInsightCardClass } from '../common/projectCardUi';

export interface DocumentCardDoc {
  name: string;
  content: string;
  analysis?: string;
  category?: 'requisitos' | 'testes' | 'arquitetura' | 'outros';
  size?: number;
  tags?: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  requisitos: 'Requisitos',
  testes: 'Testes',
  arquitetura: 'Arquitetura',
  outros: 'Outros',
};

const CATEGORY_BADGE_CLASS: Record<string, string> = {
  requisitos:
    'border-[color-mix(in_srgb,var(--brand-highlight)_30%,transparent)] bg-[color-mix(in_srgb,var(--brand-highlight)_10%,transparent)] text-[var(--brand-highlight)]',
  testes:
    'border-[color-mix(in_srgb,#10b981_28%,transparent)] bg-[color-mix(in_srgb,#10b981_10%,transparent)] text-success',
  arquitetura:
    'border-[color-mix(in_srgb,var(--brand-cta)_28%,transparent)] bg-[color-mix(in_srgb,var(--brand-cta)_10%,transparent)] text-[var(--brand-cta)]',
  outros: 'border-[var(--brand-surface-border)] bg-[var(--brand-chip)] text-[var(--brand-text-muted)]',
};

export interface DocumentCardProps {
  doc: DocumentCardDoc;
  onView: () => void;
  onPreview: () => void;
  onAnalyze: () => void;
  onGenerate: () => void;
  onEdit: () => void;
  onRemove: () => void;
  loadingState: 'analyze' | 'generate' | null;
  formatFileSize: (bytes: number) => string;
}

const actionOutlineClass =
  'h-8 gap-1 rounded-full border-[var(--brand-surface-border)] px-2.5 text-xs sm:min-h-0 [&_svg]:h-3.5 [&_svg]:w-3.5';

const actionPrimaryClass =
  'h-8 gap-1 rounded-full border-0 bg-[var(--brand-cta)] px-2.5 text-xs text-white hover:bg-[var(--brand-cta-hover)] sm:min-h-0 [&_svg]:h-3.5 [&_svg]:w-3.5';

export const DocumentCard: React.FC<DocumentCardProps> = ({
  doc,
  onView,
  onPreview,
  onAnalyze,
  onGenerate,
  onEdit,
  onRemove,
  loadingState,
  formatFileSize,
}) => {
  const category = doc.category ?? 'outros';
  const badgeClass = CATEGORY_BADGE_CLASS[category] ?? CATEGORY_BADGE_CLASS.outros;
  const categoryLabel = CATEGORY_LABELS[category] ?? 'Outros';

  const isTextContent = doc.content && !doc.content.startsWith('data:');
  const lineCount = isTextContent ? doc.content.split('\n').length : 0;
  const metaText =
    doc.size != null
      ? `${formatFileSize(doc.size)}${isTextContent ? ` • ${lineCount} linhas` : ' • Arquivo binário'}`
      : '';

  return (
    <article className={cn(dashboardInsightCardClass, 'p-3 sm:p-3.5')} aria-labelledby={`doc-title-${doc.name}`}>
      <h3
        id={`doc-title-${doc.name}`}
        className="line-clamp-2 border-b border-[var(--brand-surface-border)] pb-2 font-heading text-sm font-bold leading-snug text-[var(--brand-text-strong)] sm:text-base"
        title={doc.name}
      >
        {doc.name}
      </h3>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase', badgeClass)}>
          {categoryLabel}
        </span>
        {doc.analysis && doc.analysis.trim() !== '' && (
          <span className="inline-flex rounded-full border border-[color-mix(in_srgb,#10b981_28%,transparent)] bg-[color-mix(in_srgb,#10b981_8%,transparent)] px-2 py-0.5 text-[10px] font-semibold text-success">
            Com análise
          </span>
        )}
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--brand-text-muted)]">{metaText}</p>
      <div
        className="mt-2.5 flex flex-wrap gap-1.5 border-t border-[var(--brand-surface-border)] pt-2.5"
        role="group"
        aria-label="Ações do documento"
      >
        <Button type="button" variant="outline" size="sm" className={actionOutlineClass} onClick={onView} aria-label="Ver documento">
          <Eye aria-hidden />
          Ver
        </Button>
        <Button type="button" variant="outline" size="sm" className={actionOutlineClass} onClick={onPreview} aria-label="Abrir preview">
          <ExternalLink aria-hidden />
          Preview
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          className={actionPrimaryClass}
          onClick={onAnalyze}
          disabled={loadingState === 'analyze'}
          title="Analisa o conteúdo do documento com IA."
          aria-label="Analisar com IA"
        >
          {loadingState === 'analyze' ? <Spinner small /> : <Bot aria-hidden />}
          Analisar
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          className={actionPrimaryClass}
          onClick={onGenerate}
          disabled={loadingState === 'generate'}
          title="Gera uma tarefa a partir do documento com IA."
          aria-label="Gerar tarefa"
        >
          {loadingState === 'generate' ? <Spinner small /> : <Wand2 aria-hidden />}
          Gerar
        </Button>
        <Button type="button" variant="outline" size="sm" className={actionOutlineClass} onClick={onEdit} aria-label="Editar documento">
          <Pencil aria-hidden />
          Editar
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(actionOutlineClass, 'text-error hover:border-error/40 hover:bg-error/5')}
          onClick={onRemove}
          aria-label="Remover documento"
        >
          <Trash2 aria-hidden />
          Remover
        </Button>
      </div>
    </article>
  );
};
