import React from 'react';
import { Download } from 'lucide-react';
import { FilePreview } from '../common/FilePreview';
import { jiraMediaService } from '../../services/jiraMediaService';
import { cn } from '../../utils/cn';
import { taskChipSurfaceClass, taskPanelBorderClass } from './taskActionLayout';

interface JiraAttachmentProps {
  url: string;
  filename: string;
  mimeType?: string;
  size?: number;
  thumbnailUrl?: string;
  id: string; // ID do anexo no Jira (obrigatório)
  onView?: (attachment: {
    id: string;
    filename: string;
    url: string;
    mimeType?: string;
  }) => void | Promise<void>;
  isLoading?: boolean;
}

export const JiraAttachment: React.FC<JiraAttachmentProps> = ({
  url,
  filename,
  mimeType,
  size,
  id,
  onView,
  isLoading = false,
}) => {
  const handleDownload = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (onView) {
      onView({ id, filename, url, mimeType });
      return;
    }
    if (url) {
      window.open(url, '_blank');
    }
  };

  // Detectar tipo de mídia
  const mediaType = jiraMediaService.detectMediaType(filename, mimeType);

  // Usar FilePreview para renderização polimórfica
  return (
    <div
      onClick={handleDownload}
      className={cn(
        taskPanelBorderClass,
        'group relative cursor-pointer bg-[color-mix(in_srgb,var(--leve-neu-dark)_6%,var(--leve-neu-bg))] p-2 transition-colors',
        isLoading ? 'pointer-events-none opacity-70' : taskChipSurfaceClass
      )}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[var(--radius)] bg-[color-mix(in_srgb,var(--leve-neu-bg)_70%,transparent)]">
          <span className="loading loading-spinner loading-sm" aria-label="Carregando anexo" />
        </div>
      )}
      <FilePreview
        attachmentId={id}
        filename={filename}
        size={size}
        url={url}
        mimeType={mimeType}
        mediaType={mediaType}
        className="w-32 sm:w-40"
        width="100%"
        height="auto"
      />
      {mediaType === 'image' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 rounded-md">
          <button
            onClick={handleDownload}
            className="btn btn-circle btn-sm btn-ghost text-white"
            title="Baixar imagem"
          >
            <Download size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
