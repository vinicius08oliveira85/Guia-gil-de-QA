import React, { useRef, useState } from 'react';
import { Button } from './Button';
import { Attachment, JiraTask, Project } from '../../types';
import {
  createAttachment,
  addAttachmentToTask,
  removeAttachmentFromTask,
  formatFileSize,
  getFileIcon,
  getAttachmentUrl,
} from '../../utils/attachmentService';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { cn } from '../../utils/cn';
import {
  leveTaskModalDropZoneClass,
  leveTaskModalMutedClass,
  leveTaskModalMutedXsClass,
  leveTaskModalSectionClass,
  leveTaskModalStrongClass,
  leveViewOutlineBtnClass,
} from './projectCardUi';
import { FileViewer } from './FileViewer';
import { canViewInBrowser, detectFileType } from '../../services/fileViewerService';

interface AttachmentManagerProps {
  task: JiraTask;
  project: Project;
  onUpdateProject: (project: Project) => void;
  onClose?: () => void;
  /** Reduz padding e tamanhos para caber em painéis (ex.: modal Planejamento) */
  compact?: boolean;
}

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  task,
  project,
  onUpdateProject,
  onClose,
  compact = false,
}) => {
  const { handleError, handleSuccess } = useErrorHandler();
  const [uploading, setUploading] = useState(false);
  const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const attachments = task.attachments || [];

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const attachment = await createAttachment(file, task.id);
      const updatedProject = addAttachmentToTask(task.id, attachment, project);
      onUpdateProject(updatedProject);
      handleSuccess(`Arquivo "${file.name}" anexado com sucesso`);

      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Erro ao anexar arquivo'));
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = (attachmentId: string) => {
    try {
      const updatedProject = removeAttachmentFromTask(task.id, attachmentId, project);
      onUpdateProject(updatedProject);
      handleSuccess('Anexo removido');
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Erro ao remover anexo'));
    }
  };

  const handleDownload = (attachment: Attachment) => {
    const url = getAttachmentUrl(attachment);
    const link = document.createElement('a');
    link.href = url;
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (attachment: Attachment) => {
    const fileType = detectFileType(attachment.name, attachment.type);
    if (canViewInBrowser(fileType)) {
      setViewingAttachment(attachment);
    } else {
      // Para arquivos não suportados, fazer download
      handleDownload(attachment);
    }
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-4'}>
      {!compact && (
        <div className="flex items-center justify-between mb-4">
          <h3 className={cn('text-lg font-semibold', leveTaskModalStrongClass)}>
            Anexos ({attachments.length})
          </h3>
          {onClose && (
            <Button type="button" onClick={onClose} size="circle" variant="ghost">
              ✕
            </Button>
          )}
        </div>
      )}

      {/* Upload */}
      <div className={cn(leveTaskModalDropZoneClass, compact && 'p-3')}>
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          disabled={uploading}
          className="hidden"
          id={`file-input-${task.id}`}
        />
        <label
          htmlFor={`file-input-${task.id}`}
          className={`flex flex-col items-center justify-center cursor-pointer ${compact ? 'gap-0.5' : ''} ${
            uploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <span className={compact ? 'text-2xl mb-0.5' : 'text-4xl mb-2'}>📎</span>
          <span
            className={
              compact
                ? cn('text-sm font-semibold', leveTaskModalStrongClass)
                : cn('font-semibold', leveTaskModalStrongClass)
            }
          >
            {uploading ? 'Enviando...' : 'Clique para anexar arquivo'}
          </span>
          <span className={compact ? leveTaskModalMutedXsClass : cn(leveTaskModalMutedClass, 'mt-1 text-sm')}>
            Tamanho máximo: 10MB
          </span>
        </label>
      </div>

      {/* Lista de anexos */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map(attachment => (
            <div
              key={attachment.id}
              className={cn(
                leveTaskModalSectionClass,
                'flex items-center justify-between p-4 transition-all hover:border-primary/30'
              )}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl">{getFileIcon(attachment.type)}</span>
                <div className="flex-1 min-w-0">
                  <div
                    className={cn('truncate font-semibold', leveTaskModalStrongClass, compact && 'text-sm')}
                  >
                    {attachment.name}
                  </div>
                  <div
                    className={
                      compact ? leveTaskModalMutedXsClass : leveTaskModalMutedClass
                    }
                  >
                    {formatFileSize(attachment.size)} •{' '}
                    {new Date(attachment.uploadedAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {(() => {
                  const fileType = detectFileType(attachment.name, attachment.type);
                  const canView = canViewInBrowser(fileType);
                  return canView ? (
                    <button
                      type="button"
                      onClick={() => handleView(attachment)}
                      className={cn(leveViewOutlineBtnClass, 'text-xs')}
                      title="Visualizar"
                    >
                      👁️ Ver
                    </button>
                  ) : null;
                })()}
                <Button
                  type="button"
                  onClick={() => handleDownload(attachment)}
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  title="Download"
                >
                  ⬇️
                </Button>
                <Button
                  type="button"
                  onClick={() => handleRemove(attachment.id)}
                  size="circle"
                  variant="ghost"
                  className="text-error"
                  title="Remover"
                >
                  ✕
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {attachments.length === 0 && (
        <p className={cn('text-center', leveTaskModalMutedClass, compact ? 'py-1 text-xs' : 'py-4')}>
          Nenhum anexo ainda. Clique acima para adicionar arquivos.
        </p>
      )}

      {/* Modal de Visualização */}
      {viewingAttachment && (
        <FileViewer
          content={getAttachmentUrl(viewingAttachment)}
          fileName={viewingAttachment.name}
          mimeType={viewingAttachment.type}
          onClose={() => setViewingAttachment(null)}
          showDownload={true}
          showViewInNewTab={true}
        />
      )}
    </div>
  );
};
