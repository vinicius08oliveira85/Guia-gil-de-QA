import { loadProcessedDocument } from '../documentProcessingService';
import { logger } from '../../utils/logger';

// Cache do contexto em memória para evitar leituras repetidas
let cachedContext: string | null = null;
let cacheInitialized = false;

/**
 * Carrega o contexto do documento de especificação processado
 * Usa cache em memória para melhor performance
 */
export async function getDocumentContext(): Promise<string | null> {
  // Se já temos o contexto em cache, retornar diretamente
  if (cacheInitialized && cachedContext !== null) {
    return cachedContext;
  }

  try {
    const content = loadProcessedDocument();
    
    if (content && content.trim().length > 0) {
      cachedContext = content;
      cacheInitialized = true;
      return content;
    }
    
    // Se não há conteúdo, limpar cache
    cachedContext = null;
    cacheInitialized = true;
    return null;
  } catch (error) {
    logger.error('Erro ao carregar contexto do documento:', error);
    cacheInitialized = true;
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
  const truncatedContent = content.length > maxLength 
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
 * Invalida o cache do contexto (útil quando o documento é reprocessado)
 */
export function invalidateContextCache(): void {
  cachedContext = null;
  cacheInitialized = false;
}

/**
 * Obtém o contexto formatado pronto para usar nos prompts
 */
export async function getFormattedContext(): Promise<string> {
  const context = await getDocumentContext();
  if (!context) {
    return '';
  }
  return buildContextSection(context);
}

