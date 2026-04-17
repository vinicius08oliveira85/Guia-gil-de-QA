import React from 'react';
import { Eye, ExternalLink, Bot, Wand2, Pencil, Trash2 } from 'lucide-react';
import { Spinner } from '../common/Spinner';

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
  'flex flex-col items-center gap-1.5 group p-0 border-0 bg-transparent cursor-pointer rounded-lg text-base-content/70 hover:text-base-content transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50';

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
  const metaText = doc.size != null
    ? `${formatFileSize(doc.size)}${isTextContent ? ` • ${lineCount} linhas` : ' • Arquivo binário'}`
    : '';

  return (
    <article
      className="rounded-xl border border-base-300 bg-base-100 p-5 shadow-sm transition-all hover:shadow-lg"
      aria-labelledby={`doc-title-${doc.name}`}
    >
      <div className="space-y-4">
        <div>
          <h3
            id={`doc-title-${doc.name}`}
            className="font-bold text-base-content truncate"
            title={doc.name}
          >
            {doc.name}
          </h3>
          <div className="flex gap-2 mt-2 flex-wrap items-center">
            <span className={`badge badge-sm uppercase ${badgeClass}`}>{categoryLabel}</span>
            {doc.analysis && doc.analysis.trim() !== '' && (
              <span className="badge badge-success badge-outline badge-sm" title="Documento já analisado com IA">
                Com análise
              </span>
            )}
          </div>
        </div>
        <p className="text-xs text-base-content/70">{metaText}</p>
        <div className="grid grid-cols-6 gap-2 pt-4 border-t border-base-300">
          <button type="button" className={actionBtnClass} onClick={onView} aria-label="Ver documento">
            <div className="p-2 rounded-lg transition-colors duration-300 group-hover:bg-base-200">
              <Eye className="w-[18px] h-[18px] text-current" aria-hidden />
            </div>
            <span className="text-[10px] font-medium text-inherit">Ver</span>
          </button>
          <button type="button" className={actionBtnClass} onClick={onPreview} aria-label="Abrir preview">
            <div className="p-2 rounded-lg transition-colors duration-300 group-hover:bg-base-200">
              <ExternalLink className="w-[18px] h-[18px] text-current" aria-hidden />
            </div>
            <span className="text-[10px] font-medium text-inherit">Preview</span>
          </button>
          <button
            type="button"
            className={actionBtnClass}
            onClick={onAnalyze}
            disabled={loadingState === 'analyze'}
            title="Analisa o conteúdo do documento com IA."
            aria-label="Analisar com IA"
          >
            <div className="p-2 rounded-lg transition-colors duration-300 group-hover:bg-base-200">
              {loadingState === 'analyze' ? (
                <Spinner small />
              ) : (
                <Bot className="w-[18px] h-[18px] text-current" aria-hidden />
              )}
            </div>
            <span className="text-[10px] font-medium text-inherit">Analisar</span>
          </button>
          <button
            type="button"
            className={actionBtnClass}
            onClick={onGenerate}
            disabled={loadingState === 'generate'}
            title="Gera uma tarefa a partir do documento com IA."
            aria-label="Gerar tarefa"
          >
            <div className="p-2 rounded-lg transition-colors duration-300 group-hover:bg-base-200">
              {loadingState === 'generate' ? (
                <Spinner small />
              ) : (
                <Wand2 className="w-[18px] h-[18px] text-current" aria-hidden />
              )}
            </div>
            <span className="text-[10px] font-medium text-inherit">Gerar</span>
          </button>
          <button type="button" className={actionBtnClass} onClick={onEdit} aria-label="Editar documento">
            <div className="p-2 rounded-lg transition-colors duration-300 group-hover:bg-base-200">
              <Pencil className="w-[18px] h-[18px] text-current" aria-hidden />
            </div>
            <span className="text-[10px] font-medium text-inherit">Editar</span>
          </button>
          <button type="button" className={actionBtnClass} onClick={onRemove} aria-label="Remover documento">
            <div className="p-2 rounded-lg transition-colors duration-300 group-hover:bg-base-200">
              <Trash2 className="w-[18px] h-[18px] text-current" aria-hidden />
            </div>
            <span className="text-[10px] font-medium text-inherit">Remover</span>
          </button>
        </div>
      </div>
    </article>
  );
};
