import type { JiraTask } from '../../types';
import { JiraContentSanitizer } from '../../utils/jiraContentSanitizer';
import { fetchJiraAttachmentAsDataUrl } from '../../utils/jiraAttachmentFetch';
import { getJiraConfig } from '../jiraService';
import { logger } from '../../utils/logger';
import type { GeminiContentPart } from './geminiApiWrapper';

const LOGGER_CONTEXT = 'taskImageContext';
const MAX_IMAGES = 5;
const IMAGE_EXT_PATTERN = /\.(png|jpe?g|gif|webp)$/i;

export interface TaskImageDescriptor {
  label: string;
  source: 'descricao' | 'anexo-jira' | 'anexo-local';
  fingerprint: string;
}

export interface TaskImageContext {
  imageParts: GeminiContentPart[];
  imageSummary: string;
  descriptors: TaskImageDescriptor[];
  fingerprint: string;
}

function resolveMimeType(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  const map: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  return ext && map[ext] ? map[ext] : 'image/png';
}

function isImageFilename(name: string): boolean {
  return IMAGE_EXT_PATTERN.test(name);
}

function isImageAttachmentType(type: string | undefined): boolean {
  return !!type && type.toLowerCase().startsWith('image/');
}

function dataUrlToGeminiPart(dataUrl: string): GeminiContentPart | null {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return {
    inlineData: {
      mimeType: match[1],
      data: match[2],
    },
  };
}

interface ImageCandidate {
  label: string;
  source: TaskImageDescriptor['source'];
  fingerprint: string;
  fetch: () => Promise<string | null>;
}

/**
 * Extrai imagens da descrição e anexos da tarefa para análise multimodal (Gemini).
 */
export async function resolveTaskImageContext(task: JiraTask): Promise<TaskImageContext> {
  const candidates: ImageCandidate[] = [];

  const inlineImages = JiraContentSanitizer.extractImageUrls(task.description ?? '');
  for (const [index, img] of inlineImages.entries()) {
    const attachment = (task.jiraAttachments ?? []).find(att => att.id === img.attachmentId);
    candidates.push({
      label: `Imagem ${index + 1} (descrição)${img.alt ? `: ${img.alt}` : ''}`,
      source: 'descricao',
      fingerprint: `inline:${img.attachmentId ?? img.url}`,
      fetch: async () => {
        if (attachment) {
          return fetchJiraAttachmentAsDataUrl({
            id: attachment.id,
            filename: attachment.filename,
            url: '',
          });
        }
        if (img.url.startsWith('data:')) return img.url;
        return null;
      },
    });
  }

  for (const att of task.jiraAttachments ?? []) {
    if (!isImageFilename(att.filename)) continue;
    if (candidates.some(c => c.fingerprint === `jira:${att.id}`)) continue;
    candidates.push({
      label: `Anexo Jira: ${att.filename}`,
      source: 'anexo-jira',
      fingerprint: `jira:${att.id}`,
      fetch: () =>
        fetchJiraAttachmentAsDataUrl({
          id: att.id,
          filename: att.filename,
          url: '',
        }),
    });
  }

  for (const att of task.attachments ?? []) {
    if (!isImageFilename(att.name) && !isImageAttachmentType(att.type)) continue;
    candidates.push({
      label: `Anexo local: ${att.name}`,
      source: 'anexo-local',
      fingerprint: `local:${att.id}`,
      fetch: async () => (att.url?.startsWith('data:') ? att.url : null),
    });
  }

  const selected = candidates.slice(0, MAX_IMAGES);
  const imageParts: GeminiContentPart[] = [];
  const descriptors: TaskImageDescriptor[] = [];
  const summaryLines: string[] = [];

  if (!getJiraConfig() && selected.some(c => c.source !== 'anexo-local')) {
    logger.debug('Jira não configurado; imagens de anexos Jira podem ser omitidas', LOGGER_CONTEXT);
  }

  for (const candidate of selected) {
    try {
      const dataUrl = await candidate.fetch();
      if (!dataUrl) continue;
      const part = dataUrlToGeminiPart(dataUrl);
      if (!part) continue;
      imageParts.push(part);
      descriptors.push({
        label: candidate.label,
        source: candidate.source,
        fingerprint: candidate.fingerprint,
      });
      summaryLines.push(
        `- ${candidate.label} (origem: ${candidate.source}; conteúdo enviado como anexo multimodal)`
      );
      imageParts.push({
        text: `Legenda da imagem acima: ${candidate.label}`,
      });
    } catch (error) {
      logger.warn('Falha ao carregar imagem para contexto de IA', LOGGER_CONTEXT, {
        taskId: task.id,
        label: candidate.label,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const fingerprint = descriptors.map(d => d.fingerprint).sort().join('|');
  const imageSummary =
    summaryLines.length > 0
      ? summaryLines.join('\n')
      : '(nenhuma imagem disponível para análise visual)';

  return { imageParts, imageSummary, descriptors, fingerprint };
}

/** Indica se a tarefa provavelmente possui imagens (heurística síncrona). */
export function taskHasImages(task: JiraTask): boolean {
  const html = task.description ?? '';
  if (JiraContentSanitizer.extractImageUrls(html).length > 0) return true;
  if ((task.jiraAttachments ?? []).some(att => isImageFilename(att.filename))) return true;
  if (
    (task.attachments ?? []).some(
      att => isImageFilename(att.name) || isImageAttachmentType(att.type)
    )
  ) {
    return true;
  }
  return false;
}
