import type { JiraFieldInfo } from '../services/jiraService';
import { logger } from './logger';

/** Nomes comuns usados por apps de Backlog Prioritization / ICE / RICE no Jira. */
const IMPACT_NAMES = [
    'Impact', 'Impacto', 'ICE Impact', 'RICE Impact', 'Impact (RICE)', 'Impacto RICE',
    'Backlog Impact', 'Prioritization Impact', 'impact'
];
const CONFIDENCE_NAMES = [
    'Confidence', 'Confiança', 'ICE Confidence', 'RICE Confidence', 'Confidence (RICE)',
    'Backlog Confidence', 'Prioritization Confidence', 'confidence'
];
const EASE_NAMES = [
    'Ease', 'Facilidade', 'Facilidade de implementação', 'ICE Ease', 'RICE Ease', 'Ease (RICE)',
    'Ease of Implementation', 'Backlog Ease', 'Prioritization Ease', 'ease'
];
const SCORE_NAMES = [
    'Score', 'Score RICE', 'Backlog Prioritization Score', 'ICE Score', 'RICE Score',
    'Prioritization Score', 'Backlog Score', 'score'
];

function normalizeFieldName(name: string): string {
    return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

/** 0 = não bate, 1 = match parcial (um contém o outro), 2 = match exato. */
function fieldNameMatchScore(name: string, patterns: string[]): 0 | 1 | 2 {
    const n = normalizeFieldName(name);
    let best: 0 | 1 | 2 = 0;
    for (const p of patterns) {
        const pn = normalizeFieldName(p);
        if (n === pn) return 2;
        if (n.includes(pn) || pn.includes(n)) best = 1;
    }
    return best;
}

/**
 * Constrói mapa de papel (impact | confidence | ease | score) -> field id
 * a partir da lista de campos do Jira, por nome.
 * Matching bidirecional (nome contém padrão ou padrão contém nome).
 * Preferência por match exato quando há vários candidatos.
 */
export function buildBacklogPrioritizationFieldMap(
    fields: JiraFieldInfo[]
): { impactId?: string; confidenceId?: string; easeId?: string; scoreId?: string } {
    const map: { impactId?: string; confidenceId?: string; easeId?: string; scoreId?: string } = {};
    const pickBest = (
        key: 'impactId' | 'confidenceId' | 'easeId' | 'scoreId',
        names: string[],
        list: JiraFieldInfo[]
    ) => {
        let bestId: string | undefined;
        let bestScore: 0 | 1 | 2 = 0;
        for (const f of list) {
            if (!f.id || !f.name) continue;
            const score = fieldNameMatchScore(f.name, names);
            if (score > bestScore) {
                bestScore = score;
                bestId = f.id;
            }
        }
        if (bestId) map[key] = bestId;
    };
    pickBest('impactId', IMPACT_NAMES, fields);
    pickBest('confidenceId', CONFIDENCE_NAMES, fields);
    pickBest('easeId', EASE_NAMES, fields);
    pickBest('scoreId', SCORE_NAMES, fields);

    const isEmpty = !map.impactId && !map.confidenceId && !map.easeId && !map.scoreId;
    if (isEmpty && fields.length > 0) {
        logger.debug(
            'buildBacklogPrioritizationFieldMap retornou mapa vazio; nomes dos campos disponíveis',
            'backlogPrioritization',
            { fieldNames: fields.map((f) => f.name) }
        );
    }

    return map;
}

/**
 * Extrai valor exibível de um campo custom do Jira (pode ser objeto, array ou primitivo).
 * Arrays são tratados usando o primeiro elemento. String vazia é considerada ausente (null).
 */
export function normalizeCustomFieldValue(value: unknown): string | number | null {
    if (value === null || value === undefined) return null;
    if (Array.isArray(value)) {
        const first = value[0];
        if (first === undefined) return null;
        return normalizeCustomFieldValue(first);
    }
    if (typeof value === 'string') return value.trim() === '' ? null : value;
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value !== null) {
        const o = value as Record<string, unknown>;
        if (typeof o.value === 'string' || typeof o.value === 'number') {
            const v = o.value;
            return typeof v === 'string' && v.trim() === '' ? null : (v as string | number);
        }
        if (typeof o.name === 'string') return o.name.trim() === '' ? null : o.name;
        if (typeof o.displayValue === 'string' || typeof o.displayValue === 'number') {
            const v = o.displayValue;
            return typeof v === 'string' && v.trim() === '' ? null : (v as string | number);
        }
        if (typeof o.id === 'string') return o.id;
        const child = o.child as Record<string, unknown> | undefined;
        if (child && typeof child === 'object') {
            if (typeof child.value === 'string' || typeof child.value === 'number') return child.value as string | number;
            if (typeof child.name === 'string') return child.name;
        }
        logger.debug(
            'normalizeCustomFieldValue retornou null para valor objeto com estrutura não reconhecida',
            'backlogPrioritization',
            { value: o }
        );
    }
    return null;
}

export interface BacklogPrioritizationData {
    score: string | number | null;
    impact: string | number | null;
    confidence: string | number | null;
    ease: string | number | null;
}

/**
 * Retorna o valor de um custom field; tenta tanto "id" quanto "customfield_Id" (Jira pode devolver id em formatos diferentes).
 */
function getCustomFieldValue(
    jiraCustomFields: { [key: string]: any } | undefined,
    id: string | undefined
): string | number | null {
    if (!id || !jiraCustomFields) return null;
    const raw = jiraCustomFields[id] ?? jiraCustomFields[id.startsWith('customfield_') ? id : `customfield_${id}`];
    return raw != null ? normalizeCustomFieldValue(raw) : null;
}

/** Task (ou objeto parcial) com propriedades de priorização de primeira classe e/ou jiraCustomFields. */
export type TaskWithPrioritization = {
    impact?: number | string;
    confidence?: number | string;
    ease?: number | string;
    score?: number;
    jiraCustomFields?: { [key: string]: any };
};

function toScalar(value: number | string | undefined | null): string | number | null {
    if (value === undefined || value === null) return null;
    return typeof value === 'number' ? value : String(value);
}

/**
 * Extrai Impact, Confidence, Ease e Score da task. Preferência para propriedades de primeira classe (task.impact, etc.); fallback para task.jiraCustomFields usando o mapa de ids.
 */
export function extractBacklogPrioritization(
    task: TaskWithPrioritization,
    fieldMap: { impactId?: string; confidenceId?: string; easeId?: string; scoreId?: string }
): BacklogPrioritizationData {
    return {
        score: task.score !== undefined ? toScalar(task.score) : getCustomFieldValue(task.jiraCustomFields, fieldMap.scoreId),
        impact: task.impact !== undefined ? toScalar(task.impact) : getCustomFieldValue(task.jiraCustomFields, fieldMap.impactId),
        confidence: task.confidence !== undefined ? toScalar(task.confidence) : getCustomFieldValue(task.jiraCustomFields, fieldMap.confidenceId),
        ease: task.ease !== undefined ? toScalar(task.ease) : getCustomFieldValue(task.jiraCustomFields, fieldMap.easeId),
    };
}

/**
 * Indica se há pelo menos um dado de Backlog Prioritization para exibir.
 */
export function hasBacklogPrioritizationData(data: BacklogPrioritizationData): boolean {
    return data.score != null || data.impact != null || data.confidence != null || data.ease != null;
}

/** Classes CSS para cor por nível de impacto (alto = destaque). */
const IMPACT_COLOR_HIGH = 'bg-error/15 text-error border border-error/30';
const IMPACT_COLOR_MEDIUM_HIGH = 'bg-warning/15 text-warning border border-warning/30';
const IMPACT_COLOR_MEDIUM = 'bg-info/15 text-info border border-info/30';
const IMPACT_COLOR_DEFAULT = 'bg-base-200 text-base-content';

/**
 * Cor do Impact com base em texto (fallback quando não há opções da API).
 * Suporta rótulos em inglês (Very High, High, Medium, Low, Very Low, Almost Zero) e português.
 */
function getImpactColorByText(value: string | number | null): string {
    if (value == null) return IMPACT_COLOR_DEFAULT;
    const s = String(value).toLowerCase();
    if (s.includes('very high') || s.includes('muito alto') || s.includes('crítico')) return IMPACT_COLOR_HIGH;
    if (s.includes('high') || s.includes('alto')) return IMPACT_COLOR_MEDIUM_HIGH;
    if (s.includes('medium') || s.includes('médio')) return IMPACT_COLOR_MEDIUM;
    if (s.includes('low') || s.includes('baixo') || s.includes('almost zero')) return IMPACT_COLOR_DEFAULT;
    return IMPACT_COLOR_DEFAULT;
}

/**
 * Retorna o rótulo do Impact para exibição (ex.: id "13" → "Very High").
 * Quando há opções da API, procura por id ou value e retorna option.value; senão retorna o valor como string.
 */
export function getImpactDisplayLabel(
    value: string | number | null,
    options: Array<{ id: string; value: string }>
): string {
    if (value == null || value === '') return '—';
    const valueStr = String(value).trim();
    if (options.length > 0) {
        const option = options.find(
            (o) =>
                o.value.trim().toLowerCase() === valueStr.toLowerCase() ||
                String(o.id) === valueStr
        );
        if (option) return option.value;
    }
    return valueStr;
}

/**
 * Retorna a classe CSS de cor para o valor de Impact.
 * Se options tiver itens (da API do Jira), usa a posição na lista (últimos = maior impacto).
 * Caso contrário, usa fallback por texto (very high, alto, médio, etc.).
 */
export function getImpactColorFromOptions(
    value: string | number | null,
    options: Array<{ id: string; value: string }>
): string {
    if (options.length === 0) return getImpactColorByText(value);
    if (value == null) return IMPACT_COLOR_DEFAULT;
    const valueStr = String(value).trim();
    const index = options.findIndex(
        (o) =>
            o.value.trim().toLowerCase() === valueStr.toLowerCase() ||
            String(o.id) === valueStr
    );
    if (index < 0) return getImpactColorByText(value);
    const n = options.length;
    const ratio = n <= 1 ? 0 : index / (n - 1);
    if (ratio >= 2 / 3) return IMPACT_COLOR_HIGH;
    if (ratio >= 1 / 3) return IMPACT_COLOR_MEDIUM_HIGH;
    if (ratio > 0 || n === 1) return IMPACT_COLOR_MEDIUM;
    return IMPACT_COLOR_DEFAULT;
}
