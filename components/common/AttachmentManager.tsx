import React, { useRef, useState } from 'react';
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
import { FileViewer } from './FileViewer';
import { canViewInBrowser, detectFileType } from '../../services/fileViewerService';

interface AttachmentManagerProps {
  task: JiraTask;
  project: Project;
  onUpdateProject: (project: Project) => void;
  onClose?: () => void;
}

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  task,
  project,
  onUpdateProject,
  onClose,
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
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-base-content">Anexos ({attachments.length})</h3>
        {onClose && (
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm btn-circle">
            ✕
          </button>
        )}
      </div>

      {/* Upload */}
      <div
        className={cn(
          'border-2 border-dashed border-base-300 rounded-xl p-4 hover:border-primary/40 hover:bg-primary/5 transition-all'
        )}
      >
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
          className={`flex flex-col items-center justify-center cursor-pointer ${
            uploading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <span className="text-4xl mb-2">📎</span>
          <span className="text-base-content font-semibold">
            {uploading ? 'Enviando...' : 'Clique para anexar arquivo'}
          </span>
          <span className="text-sm text-base-content/70 mt-1">Tamanho máximo: 10MB</span>
        </label>
      </div>

      {/* Lista de anexos */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          {attachments.map(attachment => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-4 bg-base-100 border border-base-300 rounded-xl hover:border-primary/30 transition-all"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl">{getFileIcon(attachment.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-base-content truncate">{attachment.name}</div>
                  <div className="text-sm text-base-content/70">
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
                      className="btn btn-outline btn-sm rounded-full"
                      title="Visualizar"
                    >
                      👁️ Ver
                    </button>
                  ) : null;
                })()}
                <button
                  type="button"
                  onClick={() => handleDownload(attachment)}
                  className="btn btn-outline btn-sm rounded-full"
                  title="Download"
                >
                  ⬇️
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(attachment.id)}
                  className="btn btn-ghost btn-sm btn-circle text-error"
                  title="Remover"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {attachments.length === 0 && (
        <p className="text-center text-base-content/70 py-4">
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
