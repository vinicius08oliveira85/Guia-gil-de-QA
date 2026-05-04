import { FileText, FileSpreadsheet, FileCode, FileArchive, Image, File } from 'lucide-react';
import React from 'react';

export interface FileMetadata {
  icon: React.ElementType;
  color: string;
  label: string;
}

export const getFileMetadata = (fileName: string): FileMetadata => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  switch (ext) {
    case 'pdf':
      return { icon: FileText, color: 'text-red-500', label: 'Documento PDF' };
    case 'xls':
    case 'xlsx':
    case 'csv':
      return { icon: FileSpreadsheet, color: 'text-green-600', label: 'Planilha' };
    case 'doc':
    case 'docx':
      return { icon: FileText, color: 'text-blue-600', label: 'Documento Word' };
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return { icon: FileArchive, color: 'text-yellow-600', label: 'Arquivo Compactado' };
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
    case 'svg':
      return { icon: Image, color: 'text-purple-600', label: 'Imagem' };
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'json':
    case 'html':
    case 'css':
      return { icon: FileCode, color: 'text-cyan-600', label: 'Código' };
    default:
      return { icon: File, color: 'text-base-content/50', label: 'Arquivo' };
  }
};
