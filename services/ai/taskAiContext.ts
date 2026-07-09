import type { JiraTask, JiraTaskType, Project } from '../../types';
import { hashString } from '../../utils/hash';
import { isJiraIntegratedTask } from '../../utils/jiraAttachedFormsField';
import { getJiraConfig } from '../jiraService';
import {
  fetchIssueAttachedForms,
  formatJiraFormAnswerValue,
  hasAttachedFormsContent,
  type JiraAttachedForm,
} from '../jira/attachedForms';
import { formatBusinessRulesForPrompt } from './promptUtils';
import type { GeminiContentPart } from './geminiApiWrapper';
import { logger } from '../../utils/logger';
import { resolveTaskImageContext, taskHasImages } from './taskImageContext';
import { devStackIsConfigured } from '../../utils/devStackPresets';

const LOGGER_CONTEXT = 'taskAiContext';

const NO_DESCRIPTION = '(sem descrição)';
const NO_FORMS_JIRA = '(sem formulários anexados)';
const NO_FORMS_NON_JIRA = '(sem formulários anexados — tarefa não integrada ao Jira)';
const IMAGE_EXT_PATTERN = /\.(png|jpe?g|gif|webp)$/i;

export interface TaskAiContext {
  title: string;
  description: string;
  taskType?: JiraTaskType;
  attachedFormsContext: string;
  businessRulesBlock: string;
  imageParts: GeminiContentPart[];
  imageSummary: string;
  imageFingerprint: string;
  attachmentsContext: string;
  hasRealDescription: boolean;
  hasAttachedForms: boolean;
  hasImages: boolean;
  hasBusinessRules: boolean;
}

export interface ResolveTaskAiContextOptions {
  project?: Project | null;
  /** Quando false, não busca imagens (somente resumo textual). */
  includeImages?: boolean;
}

/**
 * Formata formulários anexados do Jira para injeção em prompts de IA.
 */
export function formatJiraAttachedFormsForPrompt(forms: JiraAttachedForm[]): string {
  if (!forms.length || !hasAttachedFormsContent(forms)) {
    return NO_FORMS_JIRA;
  }

  const blocks = forms.map(form => {
    const status = form.submitted ? 'Submetido' : 'Rascunho';
    const header = `Formulário: ${form.name} (${status})`;
    const lines = form.answers
      .map(answer => {
        const value = formatJiraFormAnswerValue(answer);
        if (value === '—') return null;
        const label = answer.label?.trim() || 'Campo';
        return `  - ${label}: ${value}`;
      })
      .filter((line): line is string => line != null);
    return lines.length > 0 ? `${header}\n${lines.join('\n')}` : header;
  });

  return blocks.join('\n\n');
}

function buildAttachmentsContext(task: JiraTask): string {
  const names: string[] = [];
  const imageExt = IMAGE_EXT_PATTERN;

  (task.attachments ?? []).forEach(att => {
    if (!imageExt.test(att.name) && !att.type.toLowerCase().startsWith('image/')) {
      names.push(att.name);
    }
  });
  (task.jiraAttachments ?? []).forEach(att => {
    if (!imageExt.test(att.filename)) {
      names.push(att.filename);
    }
  });

  if (names.length === 0) return '';
  return `Anexos não-imagem: ${names.join(', ')}.`;
}

async function resolveAttachedFormsContext(task: JiraTask): Promise<{
  text: string;
  hasContent: boolean;
}> {
  if (!isJiraIntegratedTask(task)) {
    return { text: NO_FORMS_NON_JIRA, hasContent: false };
  }

  const config = getJiraConfig();
  if (!config) {
    return { text: NO_FORMS_JIRA, hasContent: false };
  }

  try {
    const forms = await fetchIssueAttachedForms(config, task.id);
    const text = formatJiraAttachedFormsForPrompt(forms);
    return {
      text,
      hasContent: hasAttachedFormsContent(forms),
    };
  } catch (error) {
    logger.warn('Falha ao buscar formulários anexados para IA', LOGGER_CONTEXT, {
      taskId: task.id,
      error: error instanceof Error ? error.message : String(error),
    });
    return { text: NO_FORMS_JIRA, hasContent: false };
  }
}

/**
 * Resolve o contexto unificado da tarefa para geração de artefatos QA com IA.
 */
export async function resolveTaskAiContext(
  task: JiraTask,
  options: ResolveTaskAiContextOptions = {}
): Promise<TaskAiContext> {
  const { project = null, includeImages = true } = options;
  const title = task.title?.trim() ?? '';
  const rawDescription = task.description?.trim() ?? '';
  const description = rawDescription || NO_DESCRIPTION;
  const businessRulesBlock = formatBusinessRulesForPrompt(project, task);
  const hasBusinessRules = businessRulesBlock.trim().length > 0;

  const [formsResult, imageContext] = await Promise.all([
    resolveAttachedFormsContext(task),
    includeImages
      ? resolveTaskImageContext(task)
      : Promise.resolve({
          imageParts: [] as GeminiContentPart[],
          imageSummary: taskHasImages(task)
            ? '(imagens detectadas; análise visual omitida nesta chamada)'
            : '(nenhuma imagem disponível para análise visual)',
          descriptors: [],
          fingerprint: taskHasImages(task) ? 'images-detected' : '',
        }),
  ]);

  return {
    title,
    description,
    taskType: task.type,
    attachedFormsContext: formsResult.text,
    businessRulesBlock,
    imageParts: imageContext.imageParts,
    imageSummary: imageContext.imageSummary,
    imageFingerprint: imageContext.fingerprint,
    attachmentsContext: buildAttachmentsContext(task),
    hasRealDescription: rawDescription.length > 0,
    hasAttachedForms: formsResult.hasContent,
    hasImages: imageContext.descriptors.length > 0 || taskHasImages(task),
    hasBusinessRules,
  };
}

/** Valida se há conteúdo suficiente além do título para gerar artefatos QA. */
export function validateTaskAiContext(ctx: TaskAiContext): void {
  const hasSource =
    ctx.hasRealDescription ||
    ctx.hasAttachedForms ||
    ctx.hasImages ||
    ctx.hasBusinessRules;

  if (!hasSource) {
    throw new Error(
      'Tarefa sem conteúdo analisável: informe descrição, formulários anexados, imagens ou regras de negócio vinculadas.'
    );
  }
}

/**
 * Valida contexto para guia Dev: o título basta; descrição/stack enriquecem o prompt.
 * Tarefas Dev costumam ter só título até o Jira ser enriquecido.
 */
export function validateDevGuidanceContext(
  ctx: TaskAiContext,
  project?: Project | null
): void {
  if (!ctx.title.trim()) {
    throw new Error('Título da tarefa é obrigatório para geração com IA.');
  }

  const hasRichContext =
    ctx.hasRealDescription ||
    ctx.hasAttachedForms ||
    ctx.hasImages ||
    ctx.hasBusinessRules ||
    devStackIsConfigured(project?.settings?.devStack);

  if (!hasRichContext) {
    logger.debug(
      'Guia Dev com contexto mínimo (somente título) — recomenda-se descrição ou stack no Dashboard Dev',
      LOGGER_CONTEXT,
      { taskTitle: ctx.title }
    );
  }
}

/** Hash determinístico do contexto resolvido (cache e detecção de desatualização). */
export function computeTaskAiContextHash(
  task: JiraTask,
  ctx: TaskAiContext,
  extras: {
    detailLevel?: string;
    regenerateBdd?: boolean;
  } = {}
): string {
  const bddSignature = (task.bddScenarios ?? [])
    .map(scenario => `${scenario.id}:${scenario.gherkin}`)
    .join('|');
  const linkedIds = [...(task.linkedBusinessRuleIds ?? [])].sort().join(',');
  const linkedCategories = [...(task.linkedBusinessRuleCategories ?? [])]
    .sort()
    .join(',');

  const payload = [
    task.id,
    ctx.title,
    ctx.description,
    ctx.attachedFormsContext,
    ctx.imageFingerprint,
    ctx.attachmentsContext,
    task.type,
    bddSignature,
    linkedIds,
    linkedCategories,
    extras.detailLevel ?? 'Estruturado',
    extras.regenerateBdd ? 'regenBdd' : 'keepBdd',
  ].join('||');

  return hashString(payload);
}
