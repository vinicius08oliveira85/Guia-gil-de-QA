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
  requisitos: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  testes: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  arquitetura: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  outros: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
};

const defaultBadgeClass = 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300';

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
  'flex flex-col items-center gap-1.5 group p-0 border-0 bg-transparent cursor-pointer rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50';

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
      className="bg-white dark:bg-slate-800 rounded-[12px] p-6 soft-shadow border border-slate-100 dark:border-slate-700 hover-glow transition-all"
      aria-labelledby={`doc-title-${doc.name}`}
    >
      <div className="space-y-4">
        <div>
          <h3
            id={`doc-title-${doc.name}`}
            className="font-bold text-slate-800 dark:text-white truncate"
            title={doc.name}
          >
            {doc.name}
          </h3>
          <div className="flex gap-2 mt-2">
            <span
              className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${badgeClass}`}
            >
              {categoryLabel}
            </span>
          </div>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{metaText}</p>
        <div className="grid grid-cols-6 gap-2 pt-4 border-t border-slate-50 dark:border-slate-700">
          <button type="button" className={actionBtnClass} onClick={onView} aria-label="Ver documento">
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors">
              <Eye className="w-[18px] h-[18px] text-slate-600 dark:text-slate-400" aria-hidden />
            </div>
            <span className="text-[10px] font-medium text-slate-500">Ver</span>
          </button>
          <button type="button" className={actionBtnClass} onClick={onPreview} aria-label="Abrir preview">
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors">
              <ExternalLink className="w-[18px] h-[18px] text-slate-600 dark:text-slate-400" aria-hidden />
            </div>
            <span className="text-[10px] font-medium text-slate-500">Preview</span>
          </button>
          <button
            type="button"
            className={actionBtnClass}
            onClick={onAnalyze}
            disabled={loadingState === 'analyze'}
            aria-label="Analisar com IA"
          >
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors">
              {loadingState === 'analyze' ? (
                <Spinner small />
              ) : (
                <Bot className="w-[18px] h-[18px] text-slate-600 dark:text-slate-400" aria-hidden />
              )}
            </div>
            <span className="text-[10px] font-medium text-slate-500">Analisar</span>
          </button>
          <button
            type="button"
            className={actionBtnClass}
            onClick={onGenerate}
            disabled={loadingState === 'generate'}
            aria-label="Gerar tarefa"
          >
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors">
              {loadingState === 'generate' ? (
                <Spinner small />
              ) : (
                <Wand2 className="w-[18px] h-[18px] text-slate-600 dark:text-slate-400" aria-hidden />
              )}
            </div>
            <span className="text-[10px] font-medium text-slate-500">Gerar</span>
          </button>
          <button type="button" className={actionBtnClass} onClick={onEdit} aria-label="Editar documento">
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors">
              <Pencil className="w-[18px] h-[18px] text-slate-600 dark:text-slate-400" aria-hidden />
            </div>
            <span className="text-[10px] font-medium text-slate-500">Editar</span>
          </button>
          <button type="button" className={actionBtnClass} onClick={onRemove} aria-label="Remover documento">
            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50 group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors">
              <Trash2 className="w-[18px] h-[18px] text-slate-600 dark:text-slate-400" aria-hidden />
            </div>
            <span className="text-[10px] font-medium text-slate-500">Remover</span>
          </button>
        </div>
      </div>
    </article>
  );
};
