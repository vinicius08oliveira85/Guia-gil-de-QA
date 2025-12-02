import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Spinner } from '../common/Spinner';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { 
  processAndSaveDocument, 
  isDocumentProcessed, 
  clearProcessedDocument,
  loadProcessedDocument 
} from '../../services/documentProcessingService';
import { invalidateContextCache } from '../../services/ai/documentContextService';

export const SpecificationDocumentProcessor: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const [documentSize, setDocumentSize] = useState<number | null>(null);
  const { handleError, handleSuccess, handleWarning } = useErrorHandler();

  useEffect(() => {
    // Verificar se o documento já foi processado
    const checkStatus = () => {
      const processed = isDocumentProcessed();
      setIsProcessed(processed);
      if (processed) {
        const content = loadProcessedDocument();
        if (content) {
          setDocumentSize(content.length);
        }
      }
    };
    checkStatus();
  }, []);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar que é um arquivo .docx
    if (!file.name.endsWith('.docx') && !file.type.includes('wordprocessingml')) {
      handleWarning('Por favor, selecione um arquivo .docx válido');
      event.target.value = '';
      return;
    }

    setIsProcessing(true);
    try {
      await processAndSaveDocument(file);
      invalidateContextCache(); // Invalidar cache para recarregar o contexto
      setIsProcessed(true);
      setDocumentSize(file.size);
      handleSuccess('Documento de especificação processado com sucesso! O contexto será usado em todas as análises de IA.');
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Erro ao processar documento'), 'Processar documento');
    } finally {
      setIsProcessing(false);
      event.target.value = '';
    }
  };

  const handleClear = () => {
    try {
      clearProcessedDocument();
      invalidateContextCache();
      setIsProcessed(false);
      setDocumentSize(null);
      handleSuccess('Documento de especificação removido. As análises de IA não usarão mais o contexto do documento.');
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Erro ao remover documento'), 'Remover documento');
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <Card>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">
            Documento de Especificação
          </h3>
          <p className="text-sm text-text-secondary">
            Processe o documento de especificação do projeto para que a IA use seu conteúdo como contexto em todas as análises (BDD, testes, análises gerais, etc.).
          </p>
        </div>

        {isProcessed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
              <span className="text-green-500">✓</span>
              <span className="text-sm text-text-primary">
                Documento processado e disponível para uso nas análises de IA
              </span>
            </div>
            {documentSize && (
              <div className="text-xs text-text-secondary">
                Tamanho do conteúdo processado: {formatSize(documentSize)}
              </div>
            )}
            <div className="flex gap-2">
              <label className="btn btn-secondary cursor-pointer">
                🔄 Reprocessar Documento
                <input 
                  type="file" 
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                  onChange={handleFileSelect} 
                  className="hidden" 
                  disabled={isProcessing}
                />
              </label>
              <button
                onClick={handleClear}
                className="btn btn-secondary hover:bg-red-500/20 hover:border-red-500/30"
                disabled={isProcessing}
              >
                🗑️ Remover
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <span className="text-yellow-500">⚠</span>
              <span className="text-sm text-text-primary">
                Nenhum documento processado. As análises de IA funcionarão normalmente, mas sem o contexto do documento de especificação.
              </span>
            </div>
            <label className="btn btn-primary cursor-pointer inline-flex items-center gap-2">
              {isProcessing ? (
                <>
                  <Spinner small />
                  Processando...
                </>
              ) : (
                <>
                  📄 Processar Documento .docx
                </>
              )}
              <input 
                type="file" 
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                onChange={handleFileSelect} 
                className="hidden" 
                disabled={isProcessing}
              />
            </label>
            <p className="text-xs text-text-secondary">
              Selecione o arquivo "Leve_Especificacao_APP_Regulacao_Agil_V1 (1).docx" ou outro documento de especificação do projeto.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

