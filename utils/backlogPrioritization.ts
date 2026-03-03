import type { JiraFieldInfo } from '../services/jiraService';

/** Nomes comuns usados por apps de Backlog Prioritization / ICE / RICE no Jira. */
const IMPACT_NAMES = ['Impact', 'Impacto', 'ICE Impact', 'RICE Impact', 'Backlog Impact', 'Prioritization Impact', 'impact'];
const CONFIDENCE_NAMES = ['Confidence', 'Confiança', 'ICE Confidence', 'RICE Confidence', 'Backlog Confidence', 'Prioritization Confidence', 'confidence'];
const EASE_NAMES = ['Ease', 'Facilidade', 'ICE Ease', 'RICE Ease', 'Ease of Implementation', 'Backlog Ease', 'Prioritization Ease', 'ease'];
const SCORE_NAMES = ['Score', 'Backlog Prioritization Score', 'ICE Score', 'RICE Score', 'Prioritization Score', 'Backlog Score', 'score'];

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
        if (typeof o.displayValue === 'string' || typeof o.displayValue === 'number') return o.displayValue;
        if (typeof o.id === 'string') return o.id;
        const child = o.child as Record<string, unknown> | undefined;
        if (child && typeof child === 'object') {
            if (typeof child.value === 'string' || typeof child.value === 'number') return child.value;
            if (typeof child.name === 'string') return child.name;
        }
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

/**
 * Extrai Impact, Confidence, Ease e Score de task.jiraCustomFields usando o mapa de ids.
 */
export function extractBacklogPrioritization(
    jiraCustomFields: { [key: string]: any } | undefined,
    fieldMap: { impactId?: string; confidenceId?: string; easeId?: string; scoreId?: string }
): BacklogPrioritizationData {
    return {
        score: getCustomFieldValue(jiraCustomFields, fieldMap.scoreId),
        impact: getCustomFieldValue(jiraCustomFields, fieldMap.impactId),
        confidence: getCustomFieldValue(jiraCustomFields, fieldMap.confidenceId),
        ease: getCustomFieldValue(jiraCustomFields, fieldMap.easeId),
    };
}

/**
 * Indica se há pelo menos um dado de Backlog Prioritization para exibir.
 */
export function hasBacklogPrioritizationData(data: BacklogPrioritizationData): boolean {
    return data.score != null || data.impact != null || data.confidence != null || data.ease != null;
}
