import React, { useState } from 'react';
import { Comment } from '../../types';
import { format } from 'date-fns';
import { logger } from '../../utils/logger';
import { JiraRichContent } from '../tasks/JiraRichContent';
import { ConfirmDialog } from './ConfirmDialog';
import { cn } from '../../utils/cn';
import {
  leveTaskModalFieldLabelClass,
  leveTaskModalInsetClass,
  leveTaskModalMutedClass,
  leveTaskModalMutedXsClass,
  leveTaskModalMetaBadgeClass,
  leveTaskModalSectionClass,
  leveTaskModalStrongClass,
  leveTaskModalTextareaClass,
  leveViewOutlineBtnClass,
  leveViewPrimaryBtnClass,
} from './projectCardUi';

interface CommentSectionProps {
  comments: Comment[];
  onAddComment?: (content: string) => void;
  onEditComment?: (commentId: string, content: string) => void;
  onDeleteComment?: (commentId: string) => void;
  currentUser?: string;
  /** Somente leitura — exibe comentários do Jira sem formulário de envio. */
  readOnly?: boolean;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  onAddComment,
  onEditComment,
  onDeleteComment,
  currentUser = 'Você',
  readOnly = false,
}) => {
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [pendingDeleteCommentId, setPendingDeleteCommentId] = useState<string | null>(null);

  const formatCommentDate = (dateString: string | undefined): string => {
    if (!dateString) {
      return 'Data não disponível';
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }
      return format(date, "dd/MM/yyyy 'às' HH:mm");
    } catch (error) {
      logger.warn('Erro ao formatar data do comentário', 'CommentSection', error);
      return 'Data inválida';
    }
  };

  const handleSubmit = () => {
    if (readOnly || !onAddComment) return;
    if (newComment.trim()) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditContent(comment.content);
  };

  const handleSaveEdit = () => {
    if (editingId && editContent.trim() && onEditComment) {
      onEditComment(editingId, editContent.trim());
      setEditingId(null);
      setEditContent('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditContent('');
  };

  return (
    <div className="space-y-4 font-sans">
      <h3 className={leveTaskModalFieldLabelClass}>Comentários ({comments.length})</h3>
      {!readOnly && onAddComment ? (
        <div className={cn(leveTaskModalInsetClass, 'space-y-2')}>
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Adicionar comentário..."
            rows={3}
            className={leveTaskModalTextareaClass}
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!newComment.trim()}
            className={cn(leveViewPrimaryBtnClass, 'disabled:cursor-not-allowed disabled:opacity-50')}
            aria-label="Enviar comentário"
          >
            Comentar
          </button>
        </div>
      ) : null}

      <div className="space-y-3">
        {comments.map(comment => (
          <div key={comment.id} className={cn(leveTaskModalSectionClass, 'p-3')}>
            {editingId === comment.id ? (
              <div className="space-y-2">
                <textarea
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  rows={3}
                  className={leveTaskModalTextareaClass}
                />
                <div className="flex gap-2">
                  <button type="button" onClick={handleSaveEdit} className={leveViewPrimaryBtnClass}>
                    Salvar
                  </button>
                  <button type="button" onClick={handleCancelEdit} className={leveViewOutlineBtnClass}>
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('font-semibold', leveTaskModalStrongClass)}>{comment.author}</span>
                    {comment.fromJira && (
                      <span className={leveTaskModalMetaBadgeClass}>Jira</span>
                    )}
                    <span className={leveTaskModalMutedXsClass}>
                      {formatCommentDate(comment.createdAt)}
                    </span>
                  </div>
                  {comment.author === currentUser &&
                    !readOnly &&
                    !comment.fromJira &&
                    (onEditComment || onDeleteComment) && (
                      <div className="flex gap-2">
                        {onEditComment && (
                          <button
                            type="button"
                            onClick={() => handleStartEdit(comment)}
                            className="font-sans text-sm text-base-content/72 hover:text-primary"
                          >
                            Editar
                          </button>
                        )}
                        {onDeleteComment && (
                          <button
                            type="button"
                            onClick={() => setPendingDeleteCommentId(comment.id)}
                            className="font-sans text-sm text-[color-mix(in_srgb,oklch(var(--er))_90%,transparent)] hover:underline"
                          >
                            Excluir
                          </button>
                        )}
                      </div>
                    )}
                  {comment.fromJira && (
                    <span className={cn('text-xs italic', leveTaskModalMutedXsClass)}>
                      Sincronizado do Jira
                    </span>
                  )}
                </div>
                {comment.content.includes('<') ? (
                  <div className={leveTaskModalStrongClass}>
                    <JiraRichContent html={comment.content} />
                  </div>
                ) : (
                  <p className={cn('whitespace-pre-wrap', leveTaskModalMutedClass)}>{comment.content}</p>
                )}
                {comment.mentions && comment.mentions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {comment.mentions.map(mention => (
                      <span key={mention} className={cn(leveTaskModalMetaBadgeClass, 'py-1')}>
                        @{mention}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {comments.length === 0 && (
        <p className={cn('py-4 text-center', leveTaskModalMutedClass)}>
          Nenhum comentário ainda. Seja o primeiro a comentar!
        </p>
      )}

      <ConfirmDialog
        isOpen={!!pendingDeleteCommentId}
        onClose={() => setPendingDeleteCommentId(null)}
        onConfirm={() => {
          if (pendingDeleteCommentId && onDeleteComment) {
            onDeleteComment(pendingDeleteCommentId);
          }
          setPendingDeleteCommentId(null);
        }}
        title="Excluir comentário"
        message="Tem certeza que deseja excluir este comentário? Esta ação não pode ser desfeita."
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="danger"
      />
    </div>
  );
};
