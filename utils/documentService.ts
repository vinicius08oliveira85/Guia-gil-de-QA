import { ProjectDocument } from '../types';

const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024; // 50MB

export interface DocumentFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string | ArrayBuffer; // Base64 para texto/imagens, ArrayBuffer para binários
  uploadedAt: string;
  category?: 'requisitos' | 'testes' | 'arquitetura' | 'outros';
}

export const createDocumentFromFile = (file: File): Promise<DocumentFile> => {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_DOCUMENT_SIZE) {
      reject(
        new Error(`Arquivo muito grande. Tamanho máximo: ${MAX_DOCUMENT_SIZE / 1024 / 1024}MB`)
      );
      return;
    }

    const isTextFile =
      file.type.startsWith('text/') ||
      file.type === 'application/json' ||
      file.type === 'text/csv' ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.json') ||
      file.name.endsWith('.csv');

    const isImageFile = file.type.startsWith('image/');

    if (isTextFile) {
      // Ler como texto
      const reader = new FileReader();
      reader.onload = () => {
        const document: DocumentFile = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          content: reader.result as string,
          uploadedAt: new Date().toISOString(),
        };
        resolve(document);
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(file);
    } else if (isImageFile) {
      // Ler imagem como base64
      const reader = new FileReader();
      reader.onload = () => {
        const document: DocumentFile = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          content: reader.result as string, // Base64 data URL
          uploadedAt: new Date().toISOString(),
        };
        resolve(document);
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsDataURL(file);
    } else {
      // Ler como ArrayBuffer para arquivos binários
      const reader = new FileReader();
      reader.onload = () => {
        // Converter ArrayBuffer para base64
        const bytes = new Uint8Array(reader.result as ArrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        const dataUrl = `data:${file.type};base64,${base64}`;

        const document: DocumentFile = {
          id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          content: dataUrl,
          uploadedAt: new Date().toISOString(),
        };
        resolve(document);
      };
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsArrayBuffer(file);
    }
  });
};

export const convertDocumentFileToProjectDocument = (docFile: DocumentFile): ProjectDocument => {
  if (typeof docFile.content === 'string') {
    // Se for texto ou imagem base64
    if (
      docFile.type.startsWith('text/') ||
      docFile.name.endsWith('.txt') ||
      docFile.name.endsWith('.md')
    ) {
      return {
        name: docFile.name,
        content: docFile.content,
        analysis: undefined,
      };
    } else {
      // Para imagens e outros arquivos, armazenar como referência
      return {
        name: docFile.name,
        content: `[Arquivo: ${docFile.name}]\nTipo: ${docFile.type}\nTamanho: ${formatFileSize(docFile.size)}\n\n${docFile.content}`,
        analysis: undefined,
      };
    }
  }

  // Fallback
  return {
    name: docFile.name,
    content: `[Arquivo binário: ${docFile.name}]`,
    analysis: undefined,
  };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const getFileIcon = (type: string, name: string): string => {
  if (type.startsWith('image/')) return '🖼️';
  if (type.startsWith('video/')) return '🎥';
  if (type.includes('pdf')) return '📄';
  if (
    type.includes('word') ||
    type.includes('document') ||
    name.endsWith('.doc') ||
    name.endsWith('.docx')
  )
    return '📝';
  if (
    type.includes('excel') ||
    type.includes('spreadsheet') ||
    name.endsWith('.xls') ||
    name.endsWith('.xlsx')
  )
    return '📊';
  if (
    type.includes('powerpoint') ||
    type.includes('presentation') ||
    name.endsWith('.ppt') ||
    name.endsWith('.pptx')
  )
    return '📽️';
  if (
    type.includes('zip') ||
    type.includes('rar') ||
    name.endsWith('.zip') ||
    name.endsWith('.rar')
  )
    return '📦';
  if (type.includes('json')) return '📋';
  if (type.includes('csv')) return '📈';
  if (name.endsWith('.txt') || name.endsWith('.md')) return '📄';
  return '📎';
};

export const canPreview = (type: string): boolean => {
  return (
    type.startsWith('image/') ||
    type.includes('pdf') ||
    type.startsWith('text/') ||
    type.includes('json') ||
    type.includes('csv')
  );
};

/**
 * Verifica se o arquivo é um PDF
 */
export const isPDF = (fileName: string, mimeType?: string): boolean => {
  return fileName.toLowerCase().endsWith('.pdf') || mimeType === 'application/pdf';
};

/**
 * Verifica se o arquivo é um Excel
 */
export const isExcel = (fileName: string, mimeType?: string): boolean => {
  const lowerName = fileName.toLowerCase();
  return (
    lowerName.endsWith('.xlsx') ||
    lowerName.endsWith('.xls') ||
    Boolean(mimeType?.includes('spreadsheet')) ||
    Boolean(mimeType?.includes('excel'))
  );
};

/**
 * Verifica se o arquivo é um Word
 */
export const isWord = (fileName: string, mimeType?: string): boolean => {
  const lowerName = fileName.toLowerCase();
  return (
    lowerName.endsWith('.docx') ||
    lowerName.endsWith('.doc') ||
    Boolean(mimeType?.includes('word')) ||
    Boolean(mimeType?.includes('document'))
  );
};

/**
 * Obtém o tipo MIME baseado na extensão do arquivo
 */
export const getMimeTypeFromFileName = (fileName: string): string => {
  const extension = fileName.toLowerCase().split('.').pop() || '';
  const mimeTypes: Record<string, string> = {
    pdf: 'application/pdf',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    doc: 'application/msword',
    csv: 'text/csv',
    json: 'application/json',
    txt: 'text/plain',
    md: 'text/markdown',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  };
  return mimeTypes[extension] || 'application/octet-stream';
};
