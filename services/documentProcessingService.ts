import mammoth from 'mammoth';
import { logger } from '../utils/logger';

const SPECIFICATION_STORAGE_KEY = 'qa_specification_document';
const SPECIFICATION_PROCESSED_KEY = 'qa_specification_processed';

/**
 * Processa um arquivo .docx e converte para texto
 */
export async function processDocxFile(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (result.messages.length > 0) {
      logger.warn('Avisos ao processar documento:', result.messages);
    }
    
    return result.value;
  } catch (error) {
    logger.error('Erro ao processar arquivo .docx:', error);
    throw new Error('Falha ao processar arquivo .docx. Verifique se o arquivo está no formato correto.');
  }
}

/**
 * Salva o documento processado no armazenamento local
 */
export function saveProcessedDocument(content: string): void {
  try {
    localStorage.setItem(SPECIFICATION_PROCESSED_KEY, content);
    localStorage.setItem(SPECIFICATION_STORAGE_KEY, 'processed');
    logger.info('Documento de especificação processado e salvo com sucesso');
  } catch (error) {
    logger.error('Erro ao salvar documento processado:', error);
    throw new Error('Falha ao salvar documento processado');
  }
}

/**
 * Carrega o documento processado do armazenamento local
 */
export function loadProcessedDocument(): string | null {
  try {
    const content = localStorage.getItem(SPECIFICATION_PROCESSED_KEY);
    return content;
  } catch (error) {
    logger.error('Erro ao carregar documento processado:', error);
    return null;
  }
}

/**
 * Verifica se o documento já foi processado
 */
export function isDocumentProcessed(): boolean {
  try {
    return localStorage.getItem(SPECIFICATION_STORAGE_KEY) === 'processed' && 
           localStorage.getItem(SPECIFICATION_PROCESSED_KEY) !== null;
  } catch (error) {
    logger.error('Erro ao verificar status do documento:', error);
    return false;
  }
}

/**
 * Remove o documento processado do armazenamento
 */
export function clearProcessedDocument(): void {
  try {
    localStorage.removeItem(SPECIFICATION_STORAGE_KEY);
    localStorage.removeItem(SPECIFICATION_PROCESSED_KEY);
    logger.info('Documento de especificação removido');
  } catch (error) {
    logger.error('Erro ao remover documento processado:', error);
  }
}

/**
 * Processa um arquivo .docx e salva automaticamente
 */
export async function processAndSaveDocument(file: File): Promise<string> {
  const processedContent = await processDocxFile(file);
  saveProcessedDocument(processedContent);
  return processedContent;
}

