import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ExternalLink,
} from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configurar worker do PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  /** URL do PDF */
  url: string;
  /** Nome do arquivo */
  filename: string;
  /** Callback para download */
  onDownload?: () => void;
  /** Callback para abrir externo */
  onOpenExternal?: () => void;
  /** Classe CSS adicional */
  className?: string;
}

/**
 * Componente para visualização de PDFs
 * Suporta navegação de páginas, zoom e rotação
 */
export const PDFViewer: React.FC<PDFViewerProps> = ({
  url,
  filename,
  onDownload,
  onOpenExternal,
  className = '',
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    setError(`Erro ao carregar PDF: ${error.message}`);
    setLoading(false);
  };

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => (numPages ? Math.min(numPages, prev + 1) : prev));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(3.0, prev + 0.25));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.25));
  };

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const resetZoom = () => {
    setScale(1.0);
  };

  if (error) {
    return (
      <div
        className={`pdf-viewer-error flex flex-col items-center justify-center p-8 ${className}`}
      >
        <div className="text-error mb-4">
          <p className="text-lg font-semibold">{error}</p>
        </div>
        {onOpenExternal && (
          <button onClick={onOpenExternal} className="btn btn-primary">
            <ExternalLink size={16} className="mr-2" />
            Abrir PDF no navegador
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`pdf-viewer flex flex-col h-full ${className}`}>
      {/* Controles */}
      <div className="pdf-viewer-controls flex items-center justify-between p-2 bg-base-200 rounded-t-lg border-b border-base-300">
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="btn btn-sm btn-ghost"
            title="Página anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium px-2">
            {pageNumber} / {numPages || '?'}
          </span>
          <button
            onClick={goToNextPage}
            disabled={!numPages || pageNumber >= numPages}
            className="btn btn-sm btn-ghost"
            title="Próxima página"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="btn btn-sm btn-ghost"
            title="Diminuir zoom"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-sm font-medium px-2 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            disabled={scale >= 3.0}
            className="btn btn-sm btn-ghost"
            title="Aumentar zoom"
          >
            <ZoomIn size={16} />
          </button>
          <button onClick={resetZoom} className="btn btn-sm btn-ghost" title="Resetar zoom">
            Reset
          </button>
          <button onClick={rotate} className="btn btn-sm btn-ghost" title="Rotacionar">
            <RotateCw size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onDownload && (
            <button onClick={onDownload} className="btn btn-sm btn-ghost" title="Download">
              <Download size={16} />
            </button>
          )}
          {onOpenExternal && (
            <button
              onClick={onOpenExternal}
              className="btn btn-sm btn-ghost"
              title="Abrir em nova aba"
            >
              <ExternalLink size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Área de visualização */}
      <div className="pdf-viewer-content flex-1 overflow-auto bg-base-100 p-4 flex justify-center">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        )}
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="loading loading-spinner loading-lg"></div>
            </div>
          }
          error={
            <div className="text-error p-4">
              <p>Erro ao carregar PDF</p>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            rotate={rotation}
            className="pdf-page shadow-lg"
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>
    </div>
  );
};
