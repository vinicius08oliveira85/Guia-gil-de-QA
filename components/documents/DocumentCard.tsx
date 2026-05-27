import React from 'react';
import { Eye, ExternalLink, Bot, Wand2, Pencil, Trash2 } from 'lucide-react';
import { Spinner } from '../common/Spinner';
import { cn } from '../../utils/cn';
import {
  documentsActionOutlineClass,
  documentsActionPrimaryClass,
  documentsActionRemoveClass,
  documentsAnalysisBadgeClass,
  documentsCardActionsGridClass,
  documentsCardClass,
  documentsCardMetaClass,
  documentsCardTitleClass,
  documentsCategoryBadgeClass,
  type DocumentCategoryId,
} from './documentsCardNeuUi';

export interface DocumentCardDoc {
  name: string;
  content: string;
  analysis?: string;
  category?: DocumentCategoryId;
  size?: number;
  tags?: string[];
}

const CATEGORY_LABELS: Record<DocumentCategoryId, string> = {
  requisitos: 'Requisitos',
  testes: 'Testes',
  arquitetura: 'Arquitetura',
  outros: 'Outros',
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
  const categoryLabel = CATEGORY_LABELS[category] ?? 'Outros';

  const isTextContent = doc.content && !doc.content.startsWith('data:');
  const lineCount = isTextContent ? doc.content.split('\n').length : 0;
  const metaText =
    doc.size != null
      ? `${formatFileSize(doc.size)}${isTextContent ? ` • ${lineCount} linhas` : ' • Arquivo binário'}`
      : '';

  return (
    <article className={documentsCardClass} aria-labelledby={`doc-title-${doc.name}`}>
      <h3 id={`doc-title-${doc.name}`} className={documentsCardTitleClass} title={doc.name}>
        {doc.name}
      </h3>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className={documentsCategoryBadgeClass(category)}>{categoryLabel}</span>
        {doc.analysis && doc.analysis.trim() !== '' && (
          <span className={documentsAnalysisBadgeClass}>Com análise</span>
        )}
      </div>
      <p className={documentsCardMetaClass}>{metaText}</p>
      <div className={documentsCardActionsGridClass} role="group" aria-label="Ações do documento">
        <button
          type="button"
          className={documentsActionOutlineClass}
          onClick={onView}
          aria-label="Ver documento"
        >
          <Eye aria-hidden />
          Ver
        </button>
        <button
          type="button"
          className={documentsActionOutlineClass}
          onClick={onPreview}
          aria-label="Abrir preview"
        >
          <ExternalLink aria-hidden />
          Preview
        </button>
        <button
          type="button"
          className={documentsActionPrimaryClass}
          onClick={onAnalyze}
          disabled={loadingState === 'analyze'}
          title="Analisa o conteúdo do documento com IA."
          aria-label="Analisar com IA"
        >
          {loadingState === 'analyze' ? <Spinner small /> : <Bot aria-hidden />}
          Analisar
        </button>
        <button
          type="button"
          className={documentsActionPrimaryClass}
          onClick={onGenerate}
          disabled={loadingState === 'generate'}
          title="Gera uma tarefa a partir do documento com IA."
          aria-label="Gerar tarefa"
        >
          {loadingState === 'generate' ? <Spinner small /> : <Wand2 aria-hidden />}
          Gerar
        </button>
        <button
          type="button"
          className={documentsActionOutlineClass}
          onClick={onEdit}
          aria-label="Editar documento"
        >
          <Pencil aria-hidden />
          Editar
        </button>
        <button
          type="button"
          className={documentsActionRemoveClass}
          onClick={onRemove}
          aria-label="Remover documento"
        >
          <Trash2 aria-hidden />
          Remover
        </button>
      </div>
    </article>
  );
};
