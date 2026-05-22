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
import { workspacePanelShellClass } from '../common/projectCardUi';

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
        if (content) setDocumentSize(content.length);
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

  const primaryLabelClass = cn(
    buttonVariants({ variant: 'default', size: 'sm' }),
    'cursor-pointer gap-1.5 rounded-full border-0 bg-[var(--brand-cta)] px-4 text-white shadow-sm hover:bg-[var(--brand-cta-hover)] sm:min-h-0'
  );

  return (
    <section className={cn(workspacePanelShellClass, 'p-3 sm:p-3.5')} aria-labelledby="spec-doc-heading">
      <div className="border-b border-[var(--brand-surface-border)] pb-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-text-muted)]">
          Contexto de IA
        </p>
        <h2 id="spec-doc-heading" className="mt-0.5 font-heading text-base font-bold text-[var(--brand-text-strong)] sm:text-lg">
          Documento de especificação
        </h2>
      </div>

      {isProcessed ? (
        <div className="mt-3 space-y-2.5">
          <div className="flex items-start gap-2 rounded-lg border border-[color-mix(in_srgb,#10b981_25%,transparent)] bg-[color-mix(in_srgb,#10b981_8%,var(--brand-surface-strong))] px-3 py-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-success sm:h-5 sm:w-5" aria-hidden />
            <p className="text-sm font-medium leading-snug text-[var(--brand-text-strong)]">
              Documento processado e disponível para uso nas análises de IA.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="relative h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--brand-text-muted)_12%,transparent)]"
              role="progressbar"
              aria-valuenow={100}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="h-full w-full rounded-full bg-gradient-to-r from-success to-[color-mix(in_srgb,#10b981_70%,var(--brand-cta))]" />
            </div>
            <span className="shrink-0 text-xs font-bold tabular-nums text-[var(--brand-text-muted)]">100%</span>
          </div>
          {documentSize != null && (
            <p className="text-xs text-[var(--brand-text-muted)]">
              Conteúdo processado: <strong className="text-[var(--brand-text-strong)]">{formatSize(documentSize)}</strong>
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-0.5">
            <label className={cn(primaryLabelClass, isProcessing && 'pointer-events-none opacity-60')}>
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
              className="gap-1.5 rounded-full border-[var(--brand-surface-border)] px-4 text-error hover:border-error/40 hover:bg-error/5"
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
        <div className="mt-3 space-y-2.5">
          <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-[color-mix(in_srgb,var(--brand-cta)_6%,var(--brand-surface-strong))] px-3 py-2">
            <span className="text-base font-bold text-warning" aria-hidden>
              !
            </span>
            <p className="text-sm font-medium leading-snug text-[var(--brand-text-strong)]">
              Nenhum documento processado. As análises de IA funcionarão sem o contexto do documento de
              especificação.
            </p>
          </div>
          <label className={cn(primaryLabelClass, isProcessing && 'pointer-events-none opacity-60')}>
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
          <p className="text-xs text-[var(--brand-text-muted)]">
            Selecione um documento de especificação do projeto (.docx) para que a IA use seu conteúdo nas
            análises.
          </p>
        </div>
      )}
    </section>
  );
};
