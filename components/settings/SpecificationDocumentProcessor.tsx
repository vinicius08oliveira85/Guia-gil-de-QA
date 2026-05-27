import React, { useState, useEffect } from 'react';
import { Spinner } from '../common/Spinner';
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
import {
  documentsAlertInfoClass,
  documentsAlertSuccessClass,
  documentsBodyTextClass,
  documentsEyebrowClass,
  documentsMutedTextClass,
  documentsPrimaryBtnClass,
  documentsProgressPercentClass,
  documentsProgressFillClass,
  documentsProgressTrackClass,
  documentsStrongTextClass,
  documentsSectionHeaderClass,
  documentsSectionShellClass,
  documentsSectionTitleClass,
  documentsSpecRemoveBtnClass,
} from '../documents/documentsNeuUi';

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
    documentsPrimaryBtnClass,
    isProcessing && 'pointer-events-none opacity-60'
  );

  return (
    <section className={documentsSectionShellClass} aria-labelledby="spec-doc-heading">
      <div className={documentsSectionHeaderClass}>
        <p className={documentsEyebrowClass}>Contexto de IA</p>
        <h2 id="spec-doc-heading" className={documentsSectionTitleClass}>
          Documento de especificação
        </h2>
      </div>

      {isProcessed ? (
        <div className="mt-3 space-y-2.5">
          <div className={documentsAlertSuccessClass}>
            <CheckCircle2 className="h-4 w-4 shrink-0 text-success sm:h-5 sm:w-5" aria-hidden />
            <p className={documentsBodyTextClass}>
              Documento processado e disponível para uso nas análises de IA.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={documentsProgressTrackClass}
              role="progressbar"
              aria-valuenow={100}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className={documentsProgressFillClass} />
            </div>
            <span className={documentsProgressPercentClass}>100%</span>
          </div>
          {documentSize != null && (
            <p className={documentsMutedTextClass}>
              Conteúdo processado:{' '}
              <strong className={documentsStrongTextClass}>{formatSize(documentSize)}</strong>
            </p>
          )}
          <div className="flex flex-wrap gap-2 pt-0.5">
            <label className={cn(primaryLabelClass, 'cursor-pointer')}>
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
            <button
              type="button"
              className={documentsSpecRemoveBtnClass}
              onClick={handleClear}
              disabled={isProcessing}
              aria-label="Remover documento de especificação"
            >
              <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
              Remover
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-2.5">
          <div className={documentsAlertInfoClass}>
            <span className="text-base font-bold text-[#d85414]" aria-hidden>
              !
            </span>
            <p className={documentsBodyTextClass}>
              Nenhum documento processado. As análises de IA funcionarão sem o contexto do documento de
              especificação.
            </p>
          </div>
          <label className={cn(primaryLabelClass, 'cursor-pointer')}>
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
          <p className={documentsMutedTextClass}>
            Selecione um documento de especificação do projeto (.docx) para que a IA use seu conteúdo nas
            análises.
          </p>
        </div>
      )}
    </section>
  );
};
