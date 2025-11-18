import React, { useRef, useState } from 'react';
import { Attachment, JiraTask, Project } from '../../types';
import { 
  createAttachment, 
  addAttachmentToTask, 
  removeAttachmentFromTask,
  formatFileSize,
  getFileIcon,
  getAttachmentUrl
} from '../../utils/attachmentService';
import { useErrorHandler } from '../../hooks/useErrorHandler';

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
  onClose
}) => {
  const { handleError, handleSuccess } = useErrorHandler();
  const [uploading, setUploading] = useState(false);
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Anexos ({attachments.length})</h3>
        {onClose && (
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">✕</button>
        )}
      </div>

      {/* Upload */}
      <div className="border-2 border-dashed border-surface-border rounded-lg p-4">
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
          <span className="text-text-primary font-semibold">
            {uploading ? 'Enviando...' : 'Clique para anexar arquivo'}
          </span>
          <span className="text-sm text-text-secondary mt-1">
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
              className="flex items-center justify-between p-3 bg-surface border border-surface-border rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-2xl">{getFileIcon(attachment.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-text-primary truncate">{attachment.name}</div>
                  <div className="text-sm text-text-secondary">
                    {formatFileSize(attachment.size)} • {new Date(attachment.uploadedAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {attachment.type.startsWith('image/') && (
                  <button
                    onClick={() => {
                      const url = getAttachmentUrl(attachment);
                      window.open(url, '_blank');
                    }}
                    className="px-3 py-1 text-sm bg-accent/20 text-accent hover:bg-accent/30 rounded"
                    title="Visualizar"
                  >
                    👁️ Ver
                  </button>
                )}
                <button
                  onClick={() => handleDownload(attachment)}
                  className="px-3 py-1 text-sm bg-surface-hover text-text-primary hover:bg-surface rounded"
                  title="Download"
                >
                  ⬇️
                </button>
                <button
                  onClick={() => handleRemove(attachment.id)}
                  className="px-3 py-1 text-sm text-red-400 hover:text-red-300"
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
        <p className="text-center text-text-secondary py-4">
          Nenhum anexo ainda. Clique acima para adicionar arquivos.
        </p>
      )}
    </div>
  );
};

