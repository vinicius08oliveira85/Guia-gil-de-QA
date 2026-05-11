import React from 'react';
import { Eye, ExternalLink, Bot, Wand2, Pencil, Trash2 } from 'lucide-react';
import { Spinner } from '../common/Spinner';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

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
  requisitos: 'badge-warning badge-outline',
  testes: 'badge-success badge-outline',
  arquitetura: 'badge-info badge-outline',
  outros: 'badge-ghost border border-base-300 text-base-content/80',
};

const defaultBadgeClass = 'badge-ghost border border-base-300 text-base-content/80';

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

const actionBtnClass =
  'rounded-full gap-1.5 shadow-sm sm:min-h-0 [&_svg]:h-4 [&_svg]:w-4';

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
  const badgeClass = CATEGORY_BADGE_CLASS[category] ?? defaultBadgeClass;
  const categoryLabel = CATEGORY_LABELS[category] ?? 'Outros';

  const isTextContent = doc.content && !doc.content.startsWith('data:');
  const lineCount = isTextContent ? doc.content.split('\n').length : 0;
  const metaText =
    doc.size != null
      ? `${formatFileSize(doc.size)}${isTextContent ? ` • ${lineCount} linhas` : ' • Arquivo binário'}`
      : '';

  return (
    <Card hoverable className="overflow-hidden p-4 sm:p-5">
      <article className="space-y-4" aria-labelledby={`doc-title-${doc.name}`}>
        <div>
          <h3
            id={`doc-title-${doc.name}`}
            className="border-b border-base-300/80 pb-2 text-base font-bold tracking-tight text-base-content"
            title={doc.name}
          >
            {doc.name}
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`badge badge-sm uppercase ${badgeClass}`}>{categoryLabel}</span>
            {doc.analysis && doc.analysis.trim() !== '' && (
              <span
                className="badge badge-success badge-outline badge-sm"
                title="Documento já analisado com IA"
              >
                Com análise
              </span>
            )}
          </div>
        </div>
        <p className="text-xs leading-relaxed text-base-content/70">{metaText}</p>
        <div
          className="flex flex-wrap gap-2 border-t border-base-300 pt-4"
          role="group"
          aria-label="Ações do documento"
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={actionBtnClass}
            onClick={onView}
            aria-label="Ver documento"
          >
            <Eye aria-hidden />
            Ver
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={actionBtnClass}
            onClick={onPreview}
            aria-label="Abrir preview"
          >
            <ExternalLink aria-hidden />
            Preview
          </Button>
          <Button
            type="button"
            variant="default"
            size="sm"
            className={`${actionBtnClass} shadow-primary/20`}
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
            className={`${actionBtnClass} shadow-primary/20`}
            onClick={onGenerate}
            disabled={loadingState === 'generate'}
            title="Gera uma tarefa a partir do documento com IA."
            aria-label="Gerar tarefa"
          >
            {loadingState === 'generate' ? <Spinner small /> : <Wand2 aria-hidden />}
            Gerar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={actionBtnClass}
            onClick={onEdit}
            aria-label="Editar documento"
          >
            <Pencil aria-hidden />
            Editar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={`${actionBtnClass} border-error/40 text-error hover:border-error/55 hover:bg-error/10`}
            onClick={onRemove}
            aria-label="Remover documento"
          >
            <Trash2 aria-hidden />
            Remover
          </Button>
        </div>
      </article>
    </Card>
  );
};
