import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useJiraImage } from '../../hooks/useJiraImage';

export interface GalleryImage {
  src: string;
  alt: string;
  filename: string;
  mimeType?: string;
}

interface JiraGalleryProps {
  images: GalleryImage[];
  isOpen: boolean;
  initialIndex: number;
  onClose: () => void;
}

// Componente interno para carregar imagem autenticada no Lightbox
const LightboxImage = ({ src, alt, mimeType }: { src: string; alt: string; mimeType?: string }) => {
  const { objectUrl, loading, error } = useJiraImage(src, mimeType);

  if (loading) return <div className="loading loading-spinner loading-lg text-white"></div>;
  if (error) return <div className="text-error font-medium">Erro ao carregar imagem</div>;

  return (
    <img
      src={objectUrl || ''}
      alt={alt}
      className="max-h-[85vh] max-w-[90vw] object-contain shadow-2xl rounded-md animate-scale-in"
    />
  );
};

export const JiraGallery: React.FC<JiraGalleryProps> = ({
  images,
  isOpen,
  initialIndex,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Previne scroll do body quando aberto
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || images.length === 0) return null;

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % images.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + images.length) % images.length);
  };

  const currentImage = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-50"
      >
        <X size={32} />
      </button>

      <div className="absolute top-4 left-4 text-white/80 font-medium z-50">
        {currentIndex + 1} / {images.length}
      </div>

      <button
        onClick={handlePrev}
        className="absolute left-4 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
      >
        <ChevronLeft size={40} />
      </button>

      <div className="relative flex flex-col items-center" onClick={e => e.stopPropagation()}>
        <LightboxImage
          src={currentImage.src}
          alt={currentImage.alt}
          mimeType={currentImage.mimeType}
        />
        <p className="mt-4 text-white/90 text-sm font-medium">{currentImage.filename}</p>
      </div>

      <button
        onClick={handleNext}
        className="absolute right-4 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
      >
        <ChevronRight size={40} />
      </button>
    </div>
  );
};
