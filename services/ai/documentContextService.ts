import { loadProcessedDocument } from '../documentProcessingService';
import { logger } from '../../utils/logger';
import { Project } from '../../types';

// Cache do contexto em memória por projeto para evitar leituras repetidas
const contextCache = new Map<string, string | null>();
const cacheInitialized = new Set<string>();

/**
 * Carrega o contexto do documento de especificação processado do projeto
 * Usa cache em memória para melhor performance
 * @param project Projeto do qual carregar o documento de especificação
 * @returns Conteúdo do documento ou null se não existir
 */
export async function getDocumentContext(project: Project | null): Promise<string | null> {
  if (!project) {
    return null;
  }

  const projectId = project.id;

  // Se já temos o contexto em cache para este projeto, retornar diretamente
  if (cacheInitialized.has(projectId) && contextCache.has(projectId)) {
    return contextCache.get(projectId) || null;
  }

  try {
    const content = loadProcessedDocument(project);

    if (content && content.trim().length > 0) {
      contextCache.set(projectId, content);
      cacheInitialized.add(projectId);
      return content;
    }

    // Se não há conteúdo, marcar como inicializado e cachear null
    contextCache.set(projectId, null);
    cacheInitialized.add(projectId);
    return null;
  } catch (error) {
    logger.error('Erro ao carregar contexto do documento', 'documentContextService', error);
    cacheInitialized.add(projectId);
    contextCache.set(projectId, null);
    return null;
  }
}

/**
 * Formata o contexto do documento para incluir nos prompts de IA
 */
export function buildContextSection(content: string): string {
  if (!content || content.trim().length === 0) {
    return '';
  }

  // Limitar o tamanho do contexto para evitar prompts muito longos
  // Manter apenas os primeiros 8000 caracteres para não exceder limites de tokens
  const maxLength = 8000;
  const truncatedContent =
    content.length > maxLength
      ? content.substring(0, maxLength) + '\n\n[... conteúdo truncado para otimização ...]'
      : content;

  return `
═══════════════════════════════════════════════════════════════
DOCUMENTO DE ESPECIFICAÇÃO DO PROJETO - CONTEXTO
═══════════════════════════════════════════════════════════════
${truncatedContent}
═══════════════════════════════════════════════════════════════
`;
}

/**
 * Invalida o cache do contexto para um projeto específico (útil quando o documento é reprocessado)
 * @param projectId ID do projeto para invalidar o cache
 */
export function invalidateContextCache(projectId?: string): void {
  if (projectId) {
    contextCache.delete(projectId);
    cacheInitialized.delete(projectId);
  } else {
    // Se não especificar projectId, limpa todo o cache
    contextCache.clear();
    cacheInitialized.clear();
  }
}

/**
 * Obtém o contexto formatado pronto para usar nos prompts
 * @param project Projeto do qual obter o contexto
 * @returns Contexto formatado ou string vazia se não houver documento
 */
export async function getFormattedContext(project: Project | null): Promise<string> {
  const context = await getDocumentContext(project);
  if (!context) {
    return '';
  }
  return buildContextSection(context);
}
