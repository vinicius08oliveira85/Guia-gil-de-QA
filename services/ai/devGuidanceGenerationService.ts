import { Type } from '@google/genai';
import type { DevGuidanceArtifact, DevGuidanceStep, JiraTask, Project } from '../../types';
import { hashString } from '../../utils/hash';
import { parseAiJsonText } from '../../utils/aiJsonParse';
import { logger } from '../../utils/logger';
import { callGeminiWithRetry, type GeminiContentPart } from './geminiApiWrapper';
import { GEMINI_DEFAULT_MODEL } from './geminiConstants';
import { buildDevGuidancePrompt } from './devGuidancePrompts';
import {
  computeTaskAiContextHash,
  resolveTaskAiContext,
  validateTaskAiContext,
} from './taskAiContext';
import { formatDevStackForPrompt } from '../../utils/devStackFormat';

function buildMultimodalContents(
  prompt: string,
  imageParts: GeminiContentPart[]
): string | GeminiContentPart[] {
  if (!imageParts.length) return prompt;
  return [{ text: prompt }, ...imageParts];
}

function validateTaskTitle(task: JiraTask): void {
  if (!task.title?.trim()) {
    throw new Error('Título da tarefa é obrigatório para geração com IA.');
  }
}

const LOGGER_CONTEXT = 'devGuidanceGenerationService';
const CACHE_TTL_MS = 1000 * 60 * 5;

export interface DevGuidanceGenerationResult extends DevGuidanceArtifact {
  snapshotHash: string;
  generatedAt: string;
}

interface CacheEntry {
  hash: string;
  expiresAt: number;
  result: DevGuidanceGenerationResult;
}

const cache = new Map<string, CacheEntry>();

const devGuidanceSchema = {
  type: Type.OBJECT,
  properties: {
    overview: { type: Type.STRING },
    prerequisites: { type: Type.ARRAY, items: { type: Type.STRING } },
    implementationSteps: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          order: { type: Type.NUMBER },
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          filesOrModules: { type: Type.ARRAY, items: { type: Type.STRING } },
          codeHints: { type: Type.STRING },
          validationChecklist: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['order', 'title', 'description'],
      },
    },
    dataModel: { type: Type.STRING },
    apiContracts: { type: Type.STRING },
    risksAndEdgeCases: { type: Type.ARRAY, items: { type: Type.STRING } },
    suggestedTests: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['overview', 'prerequisites', 'implementationSteps'],
};

function computeDevGuidanceHash(
  task: JiraTask,
  ctx: Awaited<ReturnType<typeof resolveTaskAiContext>>,
  project: Project | null | undefined
): string {
  const base = computeTaskAiContextHash(task, ctx, { detailLevel: 'dev-guidance' });
  const stack = formatDevStackForPrompt(project?.settings?.devStack);
  return hashString(`${base}||${stack}`);
}

function normalizeSteps(raw: unknown): DevGuidanceStep[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, index) => {
      const o = item as Record<string, unknown>;
      return {
        order: typeof o.order === 'number' ? o.order : index + 1,
        title: typeof o.title === 'string' ? o.title : `Passo ${index + 1}`,
        description: typeof o.description === 'string' ? o.description : '',
        filesOrModules: Array.isArray(o.filesOrModules)
          ? o.filesOrModules.filter((x): x is string => typeof x === 'string')
          : undefined,
        codeHints: typeof o.codeHints === 'string' ? o.codeHints : undefined,
        validationChecklist: Array.isArray(o.validationChecklist)
          ? o.validationChecklist.filter((x): x is string => typeof x === 'string')
          : undefined,
      };
    })
    .sort((a, b) => a.order - b.order);
}

function normalizeGuidance(parsed: Record<string, unknown>): DevGuidanceArtifact {
  return {
    overview: typeof parsed.overview === 'string' ? parsed.overview : '',
    prerequisites: Array.isArray(parsed.prerequisites)
      ? parsed.prerequisites.filter((x): x is string => typeof x === 'string')
      : [],
    implementationSteps: normalizeSteps(parsed.implementationSteps),
    dataModel: typeof parsed.dataModel === 'string' ? parsed.dataModel : undefined,
    apiContracts: typeof parsed.apiContracts === 'string' ? parsed.apiContracts : undefined,
    risksAndEdgeCases: Array.isArray(parsed.risksAndEdgeCases)
      ? parsed.risksAndEdgeCases.filter((x): x is string => typeof x === 'string')
      : undefined,
    suggestedTests: Array.isArray(parsed.suggestedTests)
      ? parsed.suggestedTests.filter((x): x is string => typeof x === 'string')
      : undefined,
  };
}

function readCache(taskId: string, hash: string): DevGuidanceGenerationResult | null {
  const entry = cache.get(taskId);
  if (!entry || entry.hash !== hash || entry.expiresAt < Date.now()) return null;
  return entry.result;
}

function writeCache(taskId: string, hash: string, result: DevGuidanceGenerationResult): void {
  cache.set(taskId, { hash, expiresAt: Date.now() + CACHE_TTL_MS, result });
}

export function isDevGuidanceOutdated(task: JiraTask): boolean {
  const entry = cache.get(task.id);
  if (entry && entry.expiresAt >= Date.now()) {
    if (task.devGuidanceSnapshotHash) {
      return entry.hash !== task.devGuidanceSnapshotHash;
    }
    return false;
  }
  if (task.devGuidanceSnapshotHash) return true;
  return !task.devGuidance;
}

export async function isDevGuidanceOutdatedAsync(
  task: JiraTask,
  project?: Project | null
): Promise<boolean> {
  if (!task.devGuidanceSnapshotHash) return true;
  const entry = cache.get(task.id);
  if (entry && entry.expiresAt >= Date.now() && entry.hash === task.devGuidanceSnapshotHash) {
    return false;
  }
  const ctx = await resolveTaskAiContext(task, { project });
  const currentHash = computeDevGuidanceHash(task, ctx, project);
  return currentHash !== task.devGuidanceSnapshotHash;
}

export interface GenerateDevGuidanceOptions {
  project?: Project | null;
  forceRefresh?: boolean;
  taskAiContext?: Awaited<ReturnType<typeof resolveTaskAiContext>>;
}

export async function generateDevGuidanceForTask(
  task: JiraTask,
  options: GenerateDevGuidanceOptions = {}
): Promise<DevGuidanceGenerationResult> {
  validateTaskTitle(task);
  const ctx = options.taskAiContext ?? (await resolveTaskAiContext(task, { project: options.project }));
  validateTaskAiContext(ctx);

  const snapshotHash = computeDevGuidanceHash(task, ctx, options.project);
  if (!options.forceRefresh) {
    const cached = readCache(task.id, snapshotHash);
    if (cached) return cached;
  }

  const prompt = await buildDevGuidancePrompt(ctx, options.project ?? null);
  logger.info(`Gerando guia Dev para tarefa ${task.id}`, LOGGER_CONTEXT);

  const response = await callGeminiWithRetry({
    model: GEMINI_DEFAULT_MODEL,
    contents: buildMultimodalContents(prompt, ctx.imageParts),
    config: {
      responseMimeType: 'application/json',
      responseSchema: devGuidanceSchema,
    },
  });

  const parsed = parseAiJsonText<Record<string, unknown>>(response.text);
  if (!parsed) {
    throw new Error('Resposta da IA com estrutura inválida (guia Dev).');
  }

  const guidance = normalizeGuidance(parsed);
  const generatedAt = new Date().toISOString();
  const result: DevGuidanceGenerationResult = {
    ...guidance,
    snapshotHash,
    generatedAt,
  };

  writeCache(task.id, snapshotHash, result);
  return result;
}

export function clearDevGuidanceCache(taskId?: string): void {
  if (taskId) cache.delete(taskId);
  else cache.clear();
}
