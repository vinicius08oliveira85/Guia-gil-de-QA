import { getJiraConfig } from './jiraService';
import { logger } from '../utils/logger';

/**
 * Tipos de mídia suportados pelo sistema
 */
export type MediaType = 'image' | 'pdf' | 'document' | 'spreadsheet' | 'archive' | 'code' | 'other';

/**
 * Informações sobre um anexo/mídia do Jira
 */
export interface JiraMediaInfo {
  id: string;
  filename: string;
  size: number;
  mimeType?: string;
  mediaType: MediaType;
  url: string;
  thumbnailUrl?: string;
  created?: string;
  author?: string;
}

/**
 * Configuração para resolução de URLs de mídia
 */
export interface MediaResolutionConfig {
  useProxy?: boolean;
  includeThumbnail?: boolean;
  cacheEnabled?: boolean;
}

/**
 * Serviço para gerenciar mídia do Jira de forma segura e escalável
 */
export class JiraMediaService {
  private static instance: JiraMediaService;
  private static hasWarnedNoJiraConfig = false;
  private urlCache: Map<string, string> = new Map();

  private constructor() {}

  static getInstance(): JiraMediaService {
    if (!JiraMediaService.instance) {
      JiraMediaService.instance = new JiraMediaService();
    }
    return JiraMediaService.instance;
  }

  /**
   * Detecta o tipo de mídia baseado no nome do arquivo e MIME type
   */
  detectMediaType(filename: string, mimeType?: string): MediaType {
    const lowerName = filename.toLowerCase();
    const ext = lowerName.split('.').pop() || '';

    // Imagens
    if (
      mimeType?.startsWith('image/') ||
      ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)
    ) {
      return 'image';
    }

    // PDF
    if (mimeType?.includes('pdf') || ext === 'pdf') {
      return 'pdf';
    }

    // Documentos (Word, etc)
    if (
      mimeType?.includes('word') ||
      mimeType?.includes('document') ||
      ['doc', 'docx', 'odt', 'rtf'].includes(ext)
    ) {
      return 'document';
    }

    // Planilhas (Excel, etc)
    if (
      mimeType?.includes('sheet') ||
      mimeType?.includes('excel') ||
      ['xls', 'xlsx', 'csv', 'ods'].includes(ext)
    ) {
      return 'spreadsheet';
    }

    // Arquivos de código
    if (
      mimeType?.includes('text') ||
      mimeType?.includes('code') ||
      ['js', 'ts', 'jsx', 'tsx', 'json', 'xml', 'html', 'css', 'md'].includes(ext)
    ) {
      return 'code';
    }

    // Arquivos compactados
    if (
      mimeType?.includes('zip') ||
      mimeType?.includes('archive') ||
      ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)
    ) {
      return 'archive';
    }

    return 'other';
  }

  /**
   * Resolve a URL de um anexo do Jira, usando proxy se necessário
   */
  resolveMediaUrl(
    attachmentId: string,
    filename: string,
    jiraUrl?: string,
    config: MediaResolutionConfig = {}
  ): string {
    const jiraConfig = jiraUrl ? { url: jiraUrl } : getJiraConfig();

    if (!jiraConfig?.url) {
      if (!JiraMediaService.hasWarnedNoJiraConfig) {
        JiraMediaService.hasWarnedNoJiraConfig = true;
        logger.warn('Jira config não encontrada para resolver URL de mídia', 'JiraMediaService');
      }
      return '';
    }

    const baseUrl = jiraConfig.url.replace(/\/$/, '');
    const directUrl = `${baseUrl}/secure/attachment/${attachmentId}/${encodeURIComponent(filename)}`;

    // Se não usar proxy, retornar URL direta
    if (!config.useProxy) {
      return directUrl;
    }

    // Para proxy, retornar URL que será interceptada pelo hook
    // O hook usará o proxy automaticamente
    return directUrl;
  }

  /**
   * Obtém URL de thumbnail do Jira se disponível
   */
  getThumbnailUrl(
    attachmentId: string,
    filename: string,
    jiraUrl?: string,
    width: number = 200,
    height: number = 200
  ): string | null {
    const jiraConfig = jiraUrl ? { url: jiraUrl } : getJiraConfig();

    if (!jiraConfig?.url) {
      return null;
    }

    // Verificar se é imagem (thumbnails só disponíveis para imagens)
    const mediaType = this.detectMediaType(filename);
    if (mediaType !== 'image') {
      return null;
    }

    const baseUrl = jiraConfig.url.replace(/\/$/, '');
    // Jira fornece thumbnails via endpoint /secure/thumbnail/
    return `${baseUrl}/secure/thumbnail/${attachmentId}/${encodeURIComponent(filename)}?width=${width}&height=${height}`;
  }

  /**
   * Verifica se thumbnail está disponível para um anexo
   */
  hasThumbnail(filename: string): boolean {
    const mediaType = this.detectMediaType(filename);
    return mediaType === 'image';
  }

  /**
   * Cria URL de proxy para requisição autenticada
   */
  createProxyUrl(endpoint: string): string {
    // Retornar endpoint que será usado pelo proxy
    return endpoint;
  }

  /**
   * Obtém informações completas sobre uma mídia do Jira
   */
  getMediaInfo(
    attachment: {
      id: string;
      filename: string;
      size: number;
      created?: string;
      author?: string;
    },
    jiraUrl?: string,
    config: MediaResolutionConfig = {}
  ): JiraMediaInfo {
    const mimeType = this.guessMimeType(attachment.filename);
    const mediaType = this.detectMediaType(attachment.filename, mimeType);
    const url = this.resolveMediaUrl(attachment.id, attachment.filename, jiraUrl, config);

    // Adicionar thumbnail URL se configurado e disponível
    let thumbnailUrl: string | undefined;
    if (config.includeThumbnail && this.hasThumbnail(attachment.filename)) {
      thumbnailUrl = this.getThumbnailUrl(attachment.id, attachment.filename, jiraUrl) || undefined;
    }

    return {
      id: attachment.id,
      filename: attachment.filename,
      size: attachment.size,
      mimeType,
      mediaType,
      url,
      thumbnailUrl,
      created: attachment.created,
      author: attachment.author,
    };
  }

  /**
   * Tenta adivinhar o MIME type baseado na extensão
   */
  private guessMimeType(filename: string): string | undefined {
    const ext = filename.toLowerCase().split('.').pop() || '';
    const mimeTypes: Record<string, string> = {
      // Imagens
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
      bmp: 'image/bmp',
      // Documentos
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      // Planilhas
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      csv: 'text/csv',
      // Código
      json: 'application/json',
      xml: 'application/xml',
      html: 'text/html',
      css: 'text/css',
      js: 'text/javascript',
      ts: 'text/typescript',
      md: 'text/markdown',
    };

    return mimeTypes[ext];
  }

  /**
   * Limpa o cache de URLs
   */
  clearCache(): void {
    this.urlCache.clear();
  }

  /**
   * Verifica se uma URL é do Jira
   */
  isJiraUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const jiraConfig = getJiraConfig();

      if (!jiraConfig?.url) return false;

      const jiraUrlObj = new URL(jiraConfig.url);
      return (
        urlObj.origin === jiraUrlObj.origin ||
        url.includes('/secure/attachment/') ||
        url.includes('/rest/api/')
      );
    } catch {
      return false;
    }
  }
}

/**
 * Instância singleton do serviço
 */
export const jiraMediaService = JiraMediaService.getInstance();
