import React, { useState } from 'react';
import { Modal } from './Modal';
import { ImageIcon } from 'lucide-react';

interface ImageModalProps {
    url: string;
    fileName: string;
    onClose: () => void;
}

/**
 * Modal que exibe uma imagem por URL (fallback quando o conteúdo não está disponível via fetch).
 * Trata erro de carregamento com opção "Abrir em nova aba".
 */
export const ImageModal: React.FC<ImageModalProps> = ({ url, fileName, onClose }) => {
    const [loadError, setLoadError] = useState(false);

    const handleOpenInNewTab = () => {
        window.open(url, '_blank');
        onClose();
    };

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
                ) : (
                    <div className="flex items-center justify-center max-h-[70vh] overflow-auto">
                        <img
                            src={url}
                            alt={fileName}
                            className="max-h-[70vh] w-auto object-contain rounded"
                            onError={() => setLoadError(true)}
                        />
                    </div>
                )}
                {!loadError && (
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleOpenInNewTab}
                            className="btn btn-sm btn-ghost"
                        >
                            Abrir em nova aba
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};
