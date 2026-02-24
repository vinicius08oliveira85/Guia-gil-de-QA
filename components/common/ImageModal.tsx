import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { ImageIcon } from 'lucide-react';
import { Spinner } from './Spinner';

interface ImageModalProps {
  url: string;
  fileName: string;
  onClose: () => void;
  /** Quando fornecido, o modal tenta carregar a imagem por este meio (ex.: via proxy); o resultado é usado como src em vez da url direta. */
  fetchImage?: () => Promise<string | null>;
}

/**
 * Modal que exibe uma imagem por URL (fallback quando o conteúdo não está disponível via fetch).
 * Se fetchImage for passado, a imagem é carregada por ele (ex.: via proxy) para evitar CORS.
 * Trata erro de carregamento com opção "Abrir em nova aba".
 */
export const ImageModal: React.FC<ImageModalProps> = ({ url, fileName, onClose, fetchImage }) => {
  const [loadError, setLoadError] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fetching, setFetching] = useState(!!fetchImage);

  useEffect(() => {
    if (!fetchImage) return;
    let cancelled = false;
    setFetching(true);
    fetchImage()
      .then(dataUrl => {
        if (!cancelled && dataUrl) setImageSrc(dataUrl);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchImage]);

  const handleOpenInNewTab = () => {
    window.open(url, '_blank');
    onClose();
  };

  const displaySrc = imageSrc ?? url;
  const showLoading = fetching && !imageSrc && !loadError;

  return (
    <Modal isOpen={true} onClose={onClose} title={fileName} size="xl">
      <div className="flex flex-col gap-4">
        {loadError ? (
          <div className="flex flex-col items-center justify-center py-12 bg-base-200 rounded-xl text-error">
            <ImageIcon size={48} className="mb-2" aria-hidden="true" />
            <span className="text-sm font-medium">Erro ao carregar</span>
            <button
              type="button"
              onClick={handleOpenInNewTab}
              className="btn btn-sm btn-primary mt-4"
            >
              Abrir em nova aba
            </button>
          </div>
        ) : showLoading ? (
          <div className="flex flex-col items-center justify-center py-12 bg-base-200 rounded-xl">
            <Spinner />
            <span className="text-sm text-base-content/70 mt-2">Carregando imagem...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center max-h-[70vh] overflow-auto">
            <img
              src={displaySrc}
              alt={fileName}
              className="max-h-[70vh] w-auto object-contain rounded"
              onError={() => setLoadError(true)}
            />
          </div>
        )}
        {!loadError && !showLoading && (
          <div className="flex justify-end">
            <button type="button" onClick={handleOpenInNewTab} className="btn btn-sm btn-ghost">
              Abrir em nova aba
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
