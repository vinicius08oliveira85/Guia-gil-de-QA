import React, { useEffect, useRef, useState } from 'react';
import { useJiraImage } from '../../hooks/useJiraImage';
import { ImageIcon, AlertCircle } from 'lucide-react';

interface JiraImageProps {
  src: string;
  alt?: string;
  className?: string;
  width?: number | string;
  height?: number | string;
  loading?: 'lazy' | 'eager';
  onError?: () => void;
  onLoad?: () => void;
  'data-jira-url'?: string;
}

/**
 * Componente para renderizar imagens do Jira com autenticação automática.
 * Usa o hook useJiraImage para carregar imagens através do proxy quando necessário.
 * Implementa lazy loading com Intersection Observer para melhor performance.
 */
export const JiraImage: React.FC<JiraImageProps> = ({
  src,
  alt = '',
  className = '',
  width,
  height,
  loading = 'lazy',
  onError,
  onLoad,
  'data-jira-url': dataJiraUrl,
}) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(loading === 'eager');
  const [isInView, setIsInView] = useState(false);

  // URL a usar: preferir data-jira-url se disponível, senão usar src
  const imageUrl = dataJiraUrl || src;

  // Usar hook para carregar imagem com autenticação
  const {
    objectUrl,
    loading: imageLoading,
    error: imageError,
    isImage,
  } = useJiraImage(
    imageUrl,
    'image/*' // Assumir que é imagem
  );

  // Intersection Observer para lazy loading avançado
  useEffect(() => {
    if (loading !== 'lazy' || shouldLoad) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Começar a carregar 50px antes de entrar na viewport
        threshold: 0.01,
      }
    );

    const currentRef = containerRef.current || imageRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      observer.disconnect();
    };
  }, [loading, shouldLoad]);

  // Handler de erro
  const handleError = () => {
    if (onError) {
      onError();
    }
  };

  // Handler de load
  const handleLoad = () => {
    if (onLoad) {
      onLoad();
    }
  };

  // Se não é imagem ou não deve carregar ainda, mostrar placeholder
  if (!isImage || (!shouldLoad && loading === 'lazy')) {
    return (
      <div
        ref={containerRef}
        className={`jira-image-placeholder ${className}`}
        style={{
          width: width || '100%',
          height: height || 'auto',
          minHeight: height ? undefined : '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--base-200, #e5e7eb)',
          borderRadius: '0.5rem',
        }}
      >
        <ImageIcon className="w-12 h-12 text-base-content/20" />
      </div>
    );
  }

  // Se está carregando, mostrar skeleton
  if (imageLoading) {
    return (
      <div
        ref={containerRef}
        className={`jira-image-loading ${className}`}
        style={{
          width: width || '100%',
          height: height || 'auto',
          minHeight: height ? undefined : '200px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--base-200, #e5e7eb)',
          borderRadius: '0.5rem',
        }}
      >
        <div className="animate-pulse flex items-center justify-center">
          <ImageIcon className="w-12 h-12 text-base-content/20" />
        </div>
      </div>
    );
  }

  // Se houve erro, mostrar mensagem de erro
  if (imageError || !objectUrl) {
    return (
      <div
        ref={containerRef}
        className={`jira-image-error ${className}`}
        style={{
          width: width || '100%',
          height: height || 'auto',
          minHeight: height ? undefined : '200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--base-200, #e5e7eb)',
          borderRadius: '0.5rem',
          padding: '1rem',
          gap: '0.5rem',
        }}
      >
        <AlertCircle className="w-8 h-8 text-error" />
        <span className="text-xs text-base-content/60 text-center">Erro ao carregar imagem</span>
        {imageUrl && (
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-xs btn-outline mt-2"
          >
            Abrir no Jira
          </a>
        )}
      </div>
    );
  }

  // Renderizar imagem
  return (
    <div
      ref={containerRef}
      className={`jira-image-container ${className}`}
      style={{
        width: width || '100%',
        height: height || 'auto',
      }}
    >
      <img
        ref={imageRef}
        src={objectUrl}
        alt={alt}
        className="jira-image max-w-full h-auto rounded-md"
        style={{
          width: width || '100%',
          height: height || 'auto',
          objectFit: 'contain',
        }}
        loading={loading}
        onError={handleError}
        onLoad={handleLoad}
        data-jira-url={imageUrl}
      />
    </div>
  );
};
