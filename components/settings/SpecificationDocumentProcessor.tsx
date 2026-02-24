import React, { useState, useEffect } from 'react';
import { Spinner } from '../common/Spinner';
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

  const cardClass =
    'bg-white dark:bg-slate-800 rounded-[12px] p-6 soft-shadow border border-slate-100 dark:border-slate-700';

  return (
    <section className={cardClass} aria-labelledby="spec-doc-heading">
      <h2
        id="spec-doc-heading"
        className="text-2xl md:text-3xl font-bold tracking-tight text-base-content mb-2"
      >
        Documento de Especificação
      </h2>

      {isProcessed ? (
        <>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-[12px] p-4 flex items-center gap-3 mb-6">
            <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" aria-hidden />
            <p className="text-green-700 dark:text-green-400 text-sm font-medium">
              Documento processado e disponível para uso nas análises de IA
            </p>
          </div>
          <div className="relative w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full mb-2 overflow-hidden">
            <div className="progress-gradient h-full w-full rounded-full" aria-hidden />
          </div>
          <div className="flex justify-end mb-6">
            <span className="text-xs font-semibold text-slate-500">100%</span>
          </div>
          {documentSize != null && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Conteúdo processado: {formatSize(documentSize)}
            </p>
          )}
          <div className="flex gap-3">
            <label className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-5 py-2.5 rounded-[12px] font-medium flex items-center gap-2 transition-all hover-glow cursor-pointer">
              <RefreshCw className="w-5 h-5" aria-hidden />
              Reprocessar Documento
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
              onClick={handleClear}
              disabled={isProcessing}
              className="border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-5 py-2.5 rounded-[12px] font-medium flex items-center gap-2 transition-all"
              aria-label="Remover documento de especificação"
            >
              <Trash2 className="w-5 h-5" aria-hidden />
              Remover
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-[12px] p-4 flex items-center gap-3 mb-6">
            <span className="text-amber-600 dark:text-amber-400 text-xl font-medium" aria-hidden>
              !
            </span>
            <p className="text-amber-800 dark:text-amber-200 text-sm font-medium">
              Nenhum documento processado. As análises de IA funcionarão sem o contexto do documento
              de especificação.
            </p>
          </div>
          <label className="bg-[#4f46e5] hover:bg-[#4338ca] text-white px-5 py-2.5 rounded-[12px] font-medium flex items-center gap-2 transition-all hover-glow cursor-pointer inline-flex">
            {isProcessing ? (
              <>
                <Spinner small />
                <span>Processando...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" aria-hidden />
                <span>Processar Documento .docx</span>
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
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
            Selecione um documento de especificação do projeto (.docx) para que a IA use seu
            conteúdo nas análises.
          </p>
        </>
      )}
    </section>
  );
};
