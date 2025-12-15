import mammoth from 'mammoth';
import { logger } from '../utils/logger';
import { Project } from '../types';

/**
 * Processa um arquivo .docx e converte para texto
 */
export async function processDocxFile(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    
    if (result.messages.length > 0) {
      logger.warn('Avisos ao processar documento', 'documentProcessingService', { messages: result.messages });
    }
    
    return result.value;
  } catch (error) {
    logger.error('Erro ao processar arquivo .docx', 'documentProcessingService', error);
    throw new Error('Falha ao processar arquivo .docx. Verifique se o arquivo está no formato correto.');
  }
}

/**
 * Salva o documento processado no projeto
 * @param project Projeto onde o documento será salvo
 * @param content Conteúdo processado do documento
 * @returns Projeto atualizado com o documento de especificação
 */
export function saveProcessedDocument(project: Project, content: string): Project {
  try {
    const updatedProject: Project = {
      ...project,
      specificationDocument: content
    };
    logger.info(`Documento de especificação processado e salvo no projeto ${project.id}`);
    return updatedProject;
  } catch (error) {
    logger.error('Erro ao salvar documento processado', 'documentProcessingService', error);
    throw new Error('Falha ao salvar documento processado');
  }
}

/**
 * Carrega o documento processado do projeto
 * @param project Projeto de onde o documento será carregado
 * @returns Conteúdo do documento ou null se não existir
 */
export function loadProcessedDocument(project: Project): string | null {
  try {
    return project.specificationDocument || null;
  } catch (error) {
    logger.error('Erro ao carregar documento processado', 'documentProcessingService', error);
    return null;
  }
}

/**
 * Verifica se o documento já foi processado para o projeto
 * @param project Projeto a verificar
 * @returns true se o documento existe, false caso contrário
 */
export function isDocumentProcessed(project: Project): boolean {
  try {
    return project.specificationDocument !== undefined && 
           project.specificationDocument !== null &&
           project.specificationDocument.trim().length > 0;
  } catch (error) {
    logger.error('Erro ao verificar status do documento', 'documentProcessingService', error);
    return false;
  }
}

/**
 * Remove o documento processado do projeto
 * @param project Projeto de onde o documento será removido
 * @returns Projeto atualizado sem o documento de especificação
 */
export function clearProcessedDocument(project: Project): Project {
  try {
    const { specificationDocument, ...projectWithoutSpec } = project;
    logger.info(`Documento de especificação removido do projeto ${project.id}`);
    return projectWithoutSpec as Project;
  } catch (error) {
    logger.error('Erro ao remover documento processado', 'documentProcessingService', error);
    throw error;
  }
}

/**
 * Processa um arquivo .docx e retorna o projeto atualizado e o conteúdo
 * @param project Projeto onde o documento será salvo
 * @param file Arquivo .docx a ser processado
 * @returns Objeto com o projeto atualizado e o conteúdo processado
 */
export async function processAndSaveDocument(project: Project, file: File): Promise<{ project: Project; content: string }> {
  const processedContent = await processDocxFile(file);
  const updatedProject = saveProcessedDocument(project, processedContent);
  return { project: updatedProject, content: processedContent };
}

