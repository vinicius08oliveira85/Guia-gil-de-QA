import React, { useState } from 'react';
import { Comment } from '../../types';
import { format } from 'date-fns';
import { logger } from '../../utils/logger';
import { JiraRichContent } from '../tasks/JiraRichContent';

interface CommentSectionProps {
  comments: Comment[];
  onAddComment: (content: string) => void;
  onEditComment?: (commentId: string, content: string) => void;
  onDeleteComment?: (commentId: string) => void;
  currentUser?: string;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  comments,
  onAddComment,
  onEditComment,
  onDeleteComment,
  currentUser = 'Você'
}) => {
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  /**
   * Formata a data do comentário com validação
   * Retorna uma string formatada ou fallback se a data for inválida
   */
  const formatCommentDate = (dateString: string | undefined): string => {
    if (!dateString) {
      return 'Data não disponível';
    }

    try {
      const date = new Date(dateString);
      // Verifica se a data é válida
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
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-base-content/70 uppercase tracking-wide">
        Comentários ({comments.length})
      </h3>
      <div className="text-base-content/80 space-y-2">
        {/* Formulário de novo comentário - mesma formatação da descrição */}
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Adicionar comentário..."
          rows={3}
          className="w-full px-3 py-2 bg-surface border border-surface-border rounded-md text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent text-base-content/80"
        />
        <button
          onClick={handleSubmit}
          disabled={!newComment.trim()}
          className="btn btn-primary btn-sm text-xs px-3 py-1.5"
          aria-label="Enviar comentário"
        >
          Comentar
        </button>
      </div>

      {/* Lista de comentários - mesma área visual da descrição */}
      <div className="space-y-3 text-base-content/80">
        {comments.map(comment => (
          <div
            key={comment.id}
            className="p-3 bg-base-100/80 dark:bg-black/20 rounded-md border border-surface-border"
          >
            {editingId === comment.id ? (
              <div className="space-y-2 text-base-content/80">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-surface border border-surface-border rounded-md text-text-primary"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="btn btn-primary btn-sm text-xs px-3 py-1.5"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="btn btn-secondary btn-sm text-xs px-3 py-1.5"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-text-primary">{comment.author}</span>
                    {comment.fromJira && (
                      <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-full border border-blue-500/30">
                        Jira
                      </span>
                    )}
                    <span className="text-sm text-text-secondary">
                      {formatCommentDate(comment.createdAt)}
                    </span>
                  </div>
                  {comment.author === currentUser && !comment.fromJira && (onEditComment || onDeleteComment) && (
                    <div className="flex gap-2">
                      {onEditComment && (
                        <button
                          onClick={() => handleStartEdit(comment)}
                          className="text-sm text-text-secondary hover:text-text-primary"
                        >
                          Editar
                        </button>
                      )}
                      {onDeleteComment && (
                        <button
                          onClick={() => onDeleteComment(comment.id)}
                          className="text-sm text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          Excluir
                        </button>
                      )}
                    </div>
                  )}
                  {comment.fromJira && (
                    <span className="text-xs text-text-secondary italic">
                      Sincronizado do Jira
                    </span>
                  )}
                </div>
                {comment.content.includes('<') ? (
                  <div className="text-text-primary">
                    <JiraRichContent html={comment.content} />
                  </div>
                ) : (
                  <p className="text-text-primary whitespace-pre-wrap">{comment.content}</p>
                )}
                {comment.mentions && comment.mentions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {comment.mentions.map(mention => (
                      <span
                        key={mention}
                        className="text-xs px-2 py-1 bg-accent/20 text-accent-light rounded"
                      >
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
        <p className="text-text-secondary text-center py-4">
          Nenhum comentário ainda. Seja o primeiro a comentar!
        </p>
      )}
    </div>
  );
};

