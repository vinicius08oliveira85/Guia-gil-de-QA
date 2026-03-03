import React, { useEffect, useMemo, useState } from 'react';
import { getJiraConfig, getJiraFields, getJiraCustomFieldOptions, type JiraCustomFieldOption } from '../../services/jiraService';
import {
    buildBacklogPrioritizationFieldMap,
    extractBacklogPrioritization,
    getImpactColorFromOptions,
    hasBacklogPrioritizationData,
    type BacklogPrioritizationData,
} from '../../utils/backlogPrioritization';
import type { JiraTask, Project } from '../../types';
import { ChevronDown } from 'lucide-react';

interface BacklogPrioritizationCardProps {
    task: JiraTask;
    project?: Project;
}

function hasConfigFieldMap(ids: { impactId?: string; confidenceId?: string; easeId?: string; scoreId?: string } | undefined): boolean {
    return !!(ids && (ids.impactId || ids.confidenceId || ids.easeId || ids.scoreId));
}

export const BacklogPrioritizationCard: React.FC<BacklogPrioritizationCardProps> = ({ task, project }) => {
    const [fields, setFields] = useState<Array<{ id: string; name: string }>>([]);
    const [impactOptions, setImpactOptions] = useState<JiraCustomFieldOption[]>([]);
    const [loading, setLoading] = useState(true);
    const configMap = project?.settings?.backlogPrioritizationFieldIds;

    useEffect(() => {
        if (hasConfigFieldMap(configMap)) {
            setLoading(false);
            return;
        }
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
    }, [configMap]);

    const fieldMap = useMemo(() => {
        if (hasConfigFieldMap(configMap)) return configMap!;
        return buildBacklogPrioritizationFieldMap(fields);
    }, [configMap, fields]);

    useEffect(() => {
        const impactId = fieldMap.impactId;
        if (!impactId) {
            setImpactOptions([]);
            return;
        }
        const config = getJiraConfig();
        if (!config) {
            setImpactOptions([]);
            return;
        }
        let cancelled = false;
        getJiraCustomFieldOptions(config, impactId)
            .then((opts) => {
                if (!cancelled) setImpactOptions(opts);
            })
            .catch(() => {
                if (!cancelled) setImpactOptions([]);
            });
        return () => { cancelled = true; };
    }, [fieldMap.impactId]);

    const data: BacklogPrioritizationData = useMemo(
        () => extractBacklogPrioritization(task.jiraCustomFields, fieldMap),
        [task.jiraCustomFields, fieldMap]
    );

    const hasData = hasBacklogPrioritizationData(data);
    const fieldMapEmpty = !fieldMap.impactId && !fieldMap.confidenceId && !fieldMap.easeId && !fieldMap.scoreId;
    const hasCustomFields = task.jiraCustomFields && Object.keys(task.jiraCustomFields).length > 0;
    const showFallbackMessage = fieldMapEmpty && hasCustomFields;

    if (loading) return null;

    const scoreDisplay = data.score != null ? String(data.score) : '—';
    const impactColor = getImpactColorFromOptions(data.impact, impactOptions);

    return (
        <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-base-200 flex items-center gap-2">
                <ChevronDown className="w-5 h-5 text-primary flex-shrink-0" aria-hidden />
                <h2 className="font-bold text-base-content">Backlog Prioritization</h2>
            </div>
            <div className="p-4 space-y-4">
                {!hasData && !showFallbackMessage && (
                    <p className="text-xs text-base-content/60">
                        Sincronize a tarefa do Jira (Atualizar do Jira) para preencher Score, Impact, Confidence e Ease, se o projeto usar esses campos.
                    </p>
                )}
                {showFallbackMessage && (
                    <p className="text-xs text-base-content/60">
                        Mapeamento por nome não encontrou Impact/Confidence/Ease/Score. Configure os IDs dos custom fields nas configurações do projeto.
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
            </div>
        </div>
    );
};

BacklogPrioritizationCard.displayName = 'BacklogPrioritizationCard';
