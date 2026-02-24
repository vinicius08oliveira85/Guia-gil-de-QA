import React from 'react';
import {
  FileText,
  Image as ImageIcon,
  File,
  FileCode,
  FileSpreadsheet,
  FileType,
  Archive,
} from 'lucide-react';
import { MediaType } from '../../services/jiraMediaService';
import { useJiraMedia } from '../../hooks/useJiraMedia';

interface FilePreviewProps {
  /** ID do anexo no Jira */
  attachmentId: string;
  /** Nome do arquivo */
  filename: string;
  /** Tamanho do arquivo em bytes */
  size?: number;
  /** URL direta (opcional, será resolvida se não fornecida) */
  url?: string;
  /** MIME type (opcional, será detectado se não fornecido) */
  mimeType?: string;
  /** Tipo de mídia (opcional, será detectado se não fornecido) */
  mediaType?: MediaType;
  /** Classe CSS adicional */
  className?: string;
  /** Largura do preview */
  width?: number | string;
  /** Altura do preview */
  height?: number | string;
  /** Callback quando clicado */
  onClick?: () => void;
  /** Mostrar apenas ícone (sem preview) */
  iconOnly?: boolean;
  /** Tamanho do ícone */
  iconSize?: number;
}

/**
 * Componente polimórfico que decide automaticamente como renderizar um arquivo
 * baseado no tipo de mídia (imagem, PDF, documento, etc)
 */
export const FilePreview: React.FC<FilePreviewProps> = ({
  attachmentId,
  filename,
  size,
  url,
  mimeType,
  mediaType,
  className = '',
  width,
  height,
  onClick,
  iconOnly = false,
  iconSize = 32,
}) => {
  // Obter informações da mídia e carregar se necessário
  const { objectUrl, thumbnailUrl, loading, loadingThumbnail, error, mediaInfo } = useJiraMedia(
    attachmentId,
    filename,
    size,
    {
      useProxy: true,
      includeThumbnail: true,
    }
  );

  const finalMediaType = mediaType || mediaInfo?.mediaType || 'other';
  const finalUrl = url || mediaInfo?.url || '';
  const [showFullImage, setShowFullImage] = React.useState(false);

  // Renderização para imagens
  if (finalMediaType === 'image' && !iconOnly) {
    // Usar thumbnail se disponível e imagem completa ainda não carregou
    const displayUrl = showFullImage && objectUrl ? objectUrl : thumbnailUrl || objectUrl;

    return (
      <div
        className={`file-preview file-preview-image ${className}`}
        style={{ width, height }}
        onClick={onClick}
        onMouseEnter={() => {
          // Carregar imagem completa ao hover se thumbnail estiver sendo exibido
          if (thumbnailUrl && !objectUrl && !loading) {
            setShowFullImage(true);
          }
        }}
      >
        {loading || loadingThumbnail ? (
          <div className="flex items-center justify-center w-full h-full bg-base-200 animate-pulse">
            <ImageIcon size={iconSize} className="text-base-content/20" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center w-full h-full bg-base-200 text-error">
            <ImageIcon size={iconSize} />
            <span className="text-xs mt-2">Erro ao carregar</span>
          </div>
        ) : displayUrl ? (
          <img
            src={displayUrl}
            alt={filename}
            className="w-full h-full object-cover rounded transition-opacity duration-300"
            loading="lazy"
            onLoad={() => {
              // Quando imagem completa carregar, atualizar para mostrar ela
              if (objectUrl && thumbnailUrl && displayUrl === thumbnailUrl) {
                setShowFullImage(true);
              }
            }}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-base-200">
            <ImageIcon size={iconSize} className="text-base-content/20" />
          </div>
        )}
      </div>
    );
  }

  // Renderização de ícone para outros tipos
  const IconComponent = getIconForMediaType(finalMediaType, iconSize);

  return (
    <div
      className={`file-preview file-preview-icon ${className}`}
      style={{ width, height }}
      onClick={onClick}
    >
      <IconComponent />
      {!iconOnly && (
        <div className="file-preview-info">
          <span className="file-preview-filename truncate" title={filename}>
            {filename}
          </span>
          {size && (
            <span className="file-preview-size text-xs text-base-content/60">
              {formatSize(size)}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Obtém o componente de ícone apropriado para o tipo de mídia
 */
function getIconForMediaType(
  mediaType: MediaType,
  size: number = 32
): React.ComponentType<{ className?: string }> {
  switch (mediaType) {
    case 'pdf':
      return props => <FileText size={size} className={`text-red-500 ${props.className || ''}`} />;
    case 'document':
      return props => <FileType size={size} className={`text-blue-500 ${props.className || ''}`} />;
    case 'spreadsheet':
      return props => (
        <FileSpreadsheet size={size} className={`text-green-500 ${props.className || ''}`} />
      );
    case 'code':
      return props => (
        <FileCode size={size} className={`text-yellow-500 ${props.className || ''}`} />
      );
    case 'archive':
      return props => (
        <Archive size={size} className={`text-purple-500 ${props.className || ''}`} />
      );
    default:
      return props => (
        <File size={size} className={`text-base-content/50 ${props.className || ''}`} />
      );
  }
}

/**
 * Formata tamanho de arquivo
 */
function formatSize(bytes: number): string {
  if (!bytes) return '';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Componente especializado para preview de PDF (preparado para futuro)
 */
export const PDFPreview: React.FC<
  Omit<FilePreviewProps, 'mediaType'> & { onView?: () => void }
> = ({ attachmentId, filename, size, url, className = '', onView }) => {
  const finalUrl = url || '';

  return (
    <div className={`file-preview file-preview-pdf ${className}`}>
      <FileText className="w-16 h-16 text-red-500" />
      <div className="file-preview-info">
        <span className="file-preview-filename truncate" title={filename}>
          {filename}
        </span>
        {size && (
          <span className="file-preview-size text-xs text-base-content/60">{formatSize(size)}</span>
        )}
      </div>
      {onView && (
        <button onClick={onView} className="btn btn-sm btn-outline mt-2">
          Visualizar PDF
        </button>
      )}
    </div>
  );
};
