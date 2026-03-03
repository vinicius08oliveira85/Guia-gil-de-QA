import type { JiraFieldInfo } from '../services/jiraService';

/** Nomes comuns usados por apps de Backlog Prioritization / ICE no Jira. */
const IMPACT_NAMES = ['Impact', 'Impacto', 'ICE Impact', 'impact'];
const CONFIDENCE_NAMES = ['Confidence', 'Confiança', 'ICE Confidence', 'confidence'];
const EASE_NAMES = ['Ease', 'Facilidade', 'ICE Ease', 'Ease of Implementation', 'ease'];
const SCORE_NAMES = ['Score', 'Backlog Prioritization Score', 'ICE Score', 'Prioritization Score', 'score'];

function normalizeFieldName(name: string): string {
    return name.toLowerCase().replace(/\s+/g, ' ').trim();
}

function fieldNameMatches(name: string, patterns: string[]): boolean {
    const n = normalizeFieldName(name);
    return patterns.some(p => n === normalizeFieldName(p) || n.includes(normalizeFieldName(p)));
}

/**
 * Constrói mapa de papel (impact | confidence | ease | score) -> field id
 * a partir da lista de campos do Jira, por nome.
 */
export function buildBacklogPrioritizationFieldMap(
    fields: JiraFieldInfo[]
): { impactId?: string; confidenceId?: string; easeId?: string; scoreId?: string } {
    const map: { impactId?: string; confidenceId?: string; easeId?: string; scoreId?: string } = {};
    for (const f of fields) {
        if (!f.id || !f.name) continue;
        if (fieldNameMatches(f.name, IMPACT_NAMES) && !map.impactId) map.impactId = f.id;
        if (fieldNameMatches(f.name, CONFIDENCE_NAMES) && !map.confidenceId) map.confidenceId = f.id;
        if (fieldNameMatches(f.name, EASE_NAMES) && !map.easeId) map.easeId = f.id;
        if (fieldNameMatches(f.name, SCORE_NAMES) && !map.scoreId) map.scoreId = f.id;
    }
    return map;
}

/**
 * Extrai valor exibível de um campo custom do Jira (pode ser objeto ou primitivo).
 */
export function normalizeCustomFieldValue(value: unknown): string | number | null {
    if (value === null || value === undefined) return null;
    if (typeof value === 'string' || typeof value === 'number') return value;
    if (typeof value === 'object' && value !== null) {
        const o = value as Record<string, unknown>;
        if (typeof o.value === 'string' || typeof o.value === 'number') return o.value;
        if (typeof o.name === 'string') return o.name;
        if (typeof o.id === 'string') return o.id;
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
 * Extrai Impact, Confidence, Ease e Score de task.jiraCustomFields usando o mapa de ids.
 */
export function extractBacklogPrioritization(
    jiraCustomFields: { [key: string]: any } | undefined,
    fieldMap: { impactId?: string; confidenceId?: string; easeId?: string; scoreId?: string }
): BacklogPrioritizationData {
    const get = (id?: string) => (id && jiraCustomFields?.[id] != null ? normalizeCustomFieldValue(jiraCustomFields[id]) : null);
    return {
        score: get(fieldMap.scoreId),
        impact: get(fieldMap.impactId),
        confidence: get(fieldMap.confidenceId),
        ease: get(fieldMap.easeId),
    };
}

/**
 * Indica se há pelo menos um dado de Backlog Prioritization para exibir.
 */
export function hasBacklogPrioritizationData(data: BacklogPrioritizationData): boolean {
    return data.score != null || data.impact != null || data.confidence != null || data.ease != null;
}
