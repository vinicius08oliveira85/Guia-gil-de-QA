import React, { useEffect, useMemo, useState } from 'react';
import { getJiraConfig, getJiraFields } from '../../services/jiraService';
import {
    buildBacklogPrioritizationFieldMap,
    extractBacklogPrioritization,
    hasBacklogPrioritizationData,
    normalizeCustomFieldValue,
    type BacklogPrioritizationData,
} from '../../utils/backlogPrioritization';
import type { JiraTask } from '../../types';
import { ChevronDown } from 'lucide-react';

interface BacklogPrioritizationCardProps {
    task: JiraTask;
}

/** Cor para valor de Impact (ex.: Very High = destaque). */
function getImpactColor(value: string | number | null): string {
    if (value == null) return 'bg-base-200';
    const s = String(value).toLowerCase();
    if (s.includes('very high') || s.includes('muito alto') || s.includes('crítico')) return 'bg-error/15 text-error border border-error/30';
    if (s.includes('high') || s.includes('alto')) return 'bg-warning/15 text-warning border border-warning/30';
    if (s.includes('medium') || s.includes('médio')) return 'bg-info/15 text-info border border-info/30';
    return 'bg-base-200 text-base-content';
}

export const BacklogPrioritizationCard: React.FC<BacklogPrioritizationCardProps> = ({ task }) => {
    const [fields, setFields] = useState<Array<{ id: string; name: string }>>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const config = getJiraConfig();
        if (!config) {
            setLoading(false);
            return;
        }
        getJiraFields(config)
            .then((list) => {
                if (!cancelled) setFields(list);
            })
            .catch(() => {
                if (!cancelled) setFields([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

    const fieldMap = useMemo(() => buildBacklogPrioritizationFieldMap(fields), [fields]);
    const data: BacklogPrioritizationData = useMemo(
        () => extractBacklogPrioritization(task.jiraCustomFields, fieldMap),
        [task.jiraCustomFields, fieldMap]
    );

    const hasData = hasBacklogPrioritizationData(data);
    const fieldMapEmpty = !fieldMap.impactId && !fieldMap.confidenceId && !fieldMap.easeId && !fieldMap.scoreId;
    const hasCustomFields = task.jiraCustomFields && Object.keys(task.jiraCustomFields).length > 0;
    const showFallbackCustomFields = fieldMapEmpty && hasCustomFields;

    if (loading) return null;

    const scoreDisplay = data.score != null ? String(data.score) : '—';
    const impactColor = getImpactColor(data.impact);

    return (
        <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-base-200 flex items-center gap-2">
                <ChevronDown className="w-5 h-5 text-primary flex-shrink-0" aria-hidden />
                <h2 className="font-bold text-base-content">Backlog Prioritization</h2>
            </div>
            <div className="p-4 space-y-4">
                {!hasData && !showFallbackCustomFields && (
                    <p className="text-xs text-base-content/60">
                        Sincronize a tarefa do Jira (Atualizar do Jira) para preencher Score, Impact, Confidence e Ease, se o projeto usar esses campos.
                    </p>
                )}
                {showFallbackCustomFields && (
                    <p className="text-xs text-base-content/60">
                        Campos do Jira disponíveis; mapeamento por nome não encontrou Impact/Confidence/Ease/Score. Valores abaixo:
                    </p>
                )}
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-bold text-primary tabular-nums">{scoreDisplay}</span>
                    <span className="text-sm font-semibold text-base-content/70">Score</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 bg-base-100 border border-base-300 rounded-xl shadow-sm">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-base-content/60 block mb-1">Impact</p>
                        <div className={`min-h-[20px] rounded px-2 py-1 text-sm font-medium ${impactColor}`}>
                            {data.impact != null && data.impact !== '' ? String(data.impact) : '—'}
                        </div>
                    </div>
                    <div className="p-3 bg-base-100 border border-base-300 rounded-xl shadow-sm">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-base-content/60 block mb-1">Confidence</p>
                        <div className="min-h-[20px] rounded px-2 py-1 text-sm font-medium bg-base-200 text-base-content">
                            {data.confidence != null && data.confidence !== '' ? String(data.confidence) : '—'}
                        </div>
                    </div>
                    <div className="p-3 bg-base-100 border border-base-300 rounded-xl shadow-sm">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-base-content/60 block mb-1">Ease</p>
                        <div className="min-h-[20px] rounded px-2 py-1 text-sm font-medium bg-base-200 text-base-content">
                            {data.ease != null && data.ease !== '' ? String(data.ease) : '—'}
                        </div>
                    </div>
                </div>
                {showFallbackCustomFields && task.jiraCustomFields && (
                    <div className="pt-2 border-t border-base-200">
                        <p className="text-[10px] uppercase tracking-wider font-bold text-base-content/60 mb-2">Campos customizados do Jira</p>
                        <ul className="space-y-1 text-xs text-base-content/80">
                            {Object.entries(task.jiraCustomFields).map(([key, val]) => {
                                const display = normalizeCustomFieldValue(val);
                                return (
                                    <li key={key} className="flex flex-wrap gap-x-2 gap-y-0.5">
                                        <span className="font-mono text-base-content/60">{key}</span>
                                        <span>{display != null ? String(display) : '(objeto)'}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

BacklogPrioritizationCard.displayName = 'BacklogPrioritizationCard';
