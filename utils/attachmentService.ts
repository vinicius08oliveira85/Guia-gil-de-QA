import { Attachment, Project } from '../types';

// Simulação de armazenamento (em produção, seria um serviço de upload real)
const ATTACHMENTS_STORAGE_KEY = 'qa_attachments';

export const createAttachment = (
  file: File,
  _taskId: string
): Promise<Attachment> => {
  return new Promise((resolve, reject) => {
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      reject(new Error('Arquivo muito grande. Tamanho máximo: 10MB'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      
      // Em produção, você faria upload para um serviço real (S3, Cloudinary, etc.)
      // Por enquanto, armazenamos como base64 no localStorage
      const attachment: Attachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: file.type,
        size: file.size,
        url: base64, // Em produção seria uma URL real
        uploadedAt: new Date().toISOString()
      };

      // Armazenar no localStorage (simulação)
      const stored = localStorage.getItem(ATTACHMENTS_STORAGE_KEY);
      const attachments = stored ? JSON.parse(stored) : {};
      attachments[attachment.id] = attachment;
      localStorage.setItem(ATTACHMENTS_STORAGE_KEY, JSON.stringify(attachments));

      resolve(attachment);
    };

    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsDataURL(file);
  });
};

export const addAttachmentToTask = (
  taskId: string,
  attachment: Attachment,
  project: Project
): Project => {
  const updatedTasks = project.tasks.map(task => {
    if (task.id === taskId) {
      const attachments = task.attachments || [];
      return {
        ...task,
        attachments: [...attachments, attachment]
      };
    }
    return task;
  });

  return { ...project, tasks: updatedTasks };
};

export const removeAttachmentFromTask = (
  taskId: string,
  attachmentId: string,
  project: Project
): Project => {
  const updatedTasks = project.tasks.map(task => {
    if (task.id === taskId) {
      const attachments = (task.attachments || []).filter(a => a.id !== attachmentId);
      return { ...task, attachments };
    }
    return task;
  });

  return { ...project, tasks: updatedTasks };
};

export const getAttachmentUrl = (attachment: Attachment): string => {
  // Se for base64, retorna direto
  if (attachment.url.startsWith('data:')) {
    return attachment.url;
  }
  // Se for URL real, retorna ela
  return attachment.url;
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

export const getFileIcon = (type: string): string => {
  if (type.startsWith('image/')) return '🖼️';
  if (type.startsWith('video/')) return '🎥';
  if (type.includes('pdf')) return '📄';
  if (type.includes('word') || type.includes('document')) return '📝';
  if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
  if (type.includes('zip') || type.includes('rar')) return '📦';
  return '📎';
};

