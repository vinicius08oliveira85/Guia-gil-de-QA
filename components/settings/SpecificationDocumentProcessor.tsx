import React, { useState, useEffect } from 'react';
import { Spinner } from '../common/Spinner';
import { Button, buttonVariants } from '../common/Button';
import { cn } from '../../utils/cn';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import {
  processAndSaveDocument,
  isDocumentProcessed,
  clearProcessedDocument,
  loadProcessedDocument,
} from '../../services/documentProcessingService';
import { invalidateContextCache } from '../../services/ai/documentContextService';
import { Project } from '../../types';
import { CheckCircle2, RefreshCw, Trash2, Upload } from 'lucide-react';

interface SpecificationDocumentProcessorProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
}

export const SpecificationDocumentProcessor: React.FC<SpecificationDocumentProcessorProps> = ({
  project,
  onUpdateProject,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [documentSize, setDocumentSize] = useState<number | null>(null);
  const { handleError, handleSuccess, handleWarning } = useErrorHandler();

  useEffect(() => {
    const checkStatus = () => {
      const processed = isDocumentProcessed(project);
      setIsProcessed(processed);
      if (processed) {
        const content = loadProcessedDocument(project);
        if (content) {
          setDocumentSize(content.length);
        }
      } else {
        setDocumentSize(null);
      }
    };
    checkStatus();
  }, [project]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx') && !file.type.includes('wordprocessingml')) {
      handleWarning('Por favor, selecione um arquivo .docx válido');
      event.target.value = '';
      return;
    }

    setIsProcessing(true);
    try {
      const { project: updatedProject, content } = await processAndSaveDocument(project, file);
      onUpdateProject(updatedProject);
      invalidateContextCache(project.id);
      setIsProcessed(true);
      setDocumentSize(content.length);
      handleSuccess(
        'Documento de especificação processado com sucesso! O contexto será usado em todas as análises de IA.'
      );
    } catch (error) {
      handleError(
        error instanceof Error ? error : new Error('Erro ao processar documento'),
        'Processar documento'
      );
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  const handleClear = async () => {
    try {
      const updatedProject = clearProcessedDocument(project);
      onUpdateProject(updatedProject);
      invalidateContextCache(project.id);
      setIsProcessed(false);
      setDocumentSize(null);
      handleSuccess(
        'Documento de especificação removido. As análises de IA não usarão mais o contexto do documento.'
      );
    } catch (error) {
      handleError(
        error instanceof Error ? error : new Error('Erro ao remover documento'),
        'Remover documento'
      );
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <section
      className="mb-tasks-panel-loose rounded-xl border border-base-300/80 bg-base-100/95 p-4 shadow-sm backdrop-blur-sm sm:p-5"
      aria-labelledby="spec-doc-heading"
    >
      <div className="border-b border-base-300/80 pb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-base-content/60">
          Contexto de IA
        </p>
        <h2 id="spec-doc-heading" className="mt-1 text-lg font-bold tracking-tight text-base-content">
          Documento de especificação
        </h2>
      </div>

      {isProcessed ? (
        <div className="mt-4 space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-success/25 bg-success/10 px-4 py-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success" aria-hidden />
            <p className="text-sm font-medium leading-snug text-base-content">
              Documento processado e disponível para uso nas análises de IA.
            </p>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-base-300/80">
            <div
              className="h-full w-full rounded-full bg-success/70"
              role="progressbar"
              aria-valuenow={100}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <div className="flex justify-end">
            <span className="text-xs font-semibold text-base-content/55">100%</span>
          </div>
          {documentSize != null && (
            <p className="text-xs text-base-content/60">
              Conteúdo processado: {formatSize(documentSize)}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <label
              className={cn(
                buttonVariants({ variant: 'default', size: 'sm' }),
                'cursor-pointer rounded-full px-4 shadow-md shadow-primary/15 sm:min-h-0',
                isProcessing && 'pointer-events-none opacity-60'
              )}
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Reprocessar documento
              <input
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileSelect}
                className="hidden"
                disabled={isProcessing}
                aria-label="Selecionar novo arquivo .docx para reprocessar"
              />
            </label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full px-4"
              onClick={handleClear}
              disabled={isProcessing}
              aria-label="Remover documento de especificação"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 px-4 py-3">
            <span className="text-lg font-bold text-warning" aria-hidden>
              !
            </span>
            <p className="text-sm font-medium leading-snug text-base-content">
              Nenhum documento processado. As análises de IA funcionarão sem o contexto do documento
              de especificação.
            </p>
          </div>
          <label
            className={cn(
              buttonVariants({ variant: 'default', size: 'sm' }),
              'cursor-pointer rounded-full px-4 shadow-md shadow-primary/15 sm:min-h-0',
              isProcessing && 'pointer-events-none opacity-60'
            )}
          >
            {isProcessing ? (
              <>
                <Spinner small />
                <span>Processando...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" aria-hidden />
                <span>Processar documento .docx</span>
              </>
            )}
            <input
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isProcessing}
              aria-label="Selecionar arquivo .docx de especificação"
            />
          </label>
          <p className="text-xs text-base-content/55">
            Selecione um documento de especificação do projeto (.docx) para que a IA use seu conteúdo
            nas análises.
          </p>
        </div>
      )}
    </section>
  );
};
