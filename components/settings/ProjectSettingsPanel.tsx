import React, { useState, useEffect } from 'react';
import { Project, BacklogPrioritizationFieldIds } from '../../types';

interface ProjectSettingsPanelProps {
    project: Project;
    onUpdateProject: (project: Project) => void;
}

const FIELD_LABELS: { key: keyof BacklogPrioritizationFieldIds; label: string }[] = [
    { key: 'impactId', label: 'ID do campo Impact' },
    { key: 'confidenceId', label: 'ID do campo Confidence' },
    { key: 'easeId', label: 'ID do campo Ease' },
    { key: 'scoreId', label: 'ID do campo Score' },
];

export const ProjectSettingsPanel: React.FC<ProjectSettingsPanelProps> = ({ project, onUpdateProject }) => {
    const [ids, setIds] = useState<BacklogPrioritizationFieldIds>(() => ({
        impactId: project.settings?.backlogPrioritizationFieldIds?.impactId ?? '',
        confidenceId: project.settings?.backlogPrioritizationFieldIds?.confidenceId ?? '',
        easeId: project.settings?.backlogPrioritizationFieldIds?.easeId ?? '',
        scoreId: project.settings?.backlogPrioritizationFieldIds?.scoreId ?? '',
    }));

    useEffect(() => {
        setIds({
            impactId: project.settings?.backlogPrioritizationFieldIds?.impactId ?? '',
            confidenceId: project.settings?.backlogPrioritizationFieldIds?.confidenceId ?? '',
            easeId: project.settings?.backlogPrioritizationFieldIds?.easeId ?? '',
            scoreId: project.settings?.backlogPrioritizationFieldIds?.scoreId ?? '',
        });
    }, [project.id, project.settings?.backlogPrioritizationFieldIds]);

    const handleChange = (key: keyof BacklogPrioritizationFieldIds, value: string) => {
        setIds((prev) => ({ ...prev, [key]: value.trim() || undefined }));
    };

    const handleSave = () => {
        const next = {
            ...project,
            settings: {
                ...project.settings,
                backlogPrioritizationFieldIds: {
                    impactId: ids.impactId || undefined,
                    confidenceId: ids.confidenceId || undefined,
                    easeId: ids.easeId || undefined,
                    scoreId: ids.scoreId || undefined,
                },
            },
        };
        onUpdateProject(next);
    };

    const hasAny = ids.impactId || ids.confidenceId || ids.easeId || ids.scoreId;
    const unchanged =
        (project.settings?.backlogPrioritizationFieldIds?.impactId ?? '') === (ids.impactId ?? '') &&
        (project.settings?.backlogPrioritizationFieldIds?.confidenceId ?? '') === (ids.confidenceId ?? '') &&
        (project.settings?.backlogPrioritizationFieldIds?.easeId ?? '') === (ids.easeId ?? '') &&
        (project.settings?.backlogPrioritizationFieldIds?.scoreId ?? '') === (ids.scoreId ?? '');

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-base-content mb-1">Preencher Backlog Prioritization no card da tarefa</h2>
                <p className="text-sm text-base-content/70 mb-4">
                    Estes IDs são usados para exibir Impact, Confidence, Ease e Score no bloco Backlog Prioritization que aparece no detalhe de cada tarefa. Se os valores não aparecerem após &quot;Atualizar do Jira&quot;, informe os IDs dos custom fields do seu Jira (ex.: customfield_10050). Você pode obter os IDs em GET /rest/api/3/field ou na seção &quot;Campos customizados do Jira&quot; no card da tarefa.
                </p>
                <div className="space-y-4">
                    {FIELD_LABELS.map(({ key, label }) => (
                        <div key={key}>
                            <label htmlFor={`bp-${key}`} className="block text-sm font-medium text-base-content/80 mb-1">
                                {label}
                            </label>
                            <input
                                id={`bp-${key}`}
                                type="text"
                                value={ids[key] ?? ''}
                                onChange={(e) => handleChange(key, e.target.value)}
                                placeholder="ex.: customfield_10050"
                                className="input input-bordered w-full bg-base-100 border-base-300 text-base-content focus:outline-none focus:border-primary font-mono text-sm"
                            />
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={unchanged}
                        className="btn btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Salvar
                    </button>
                    {hasAny && (
                        <span className="text-xs text-base-content/60">
                            Quando pelo menos um ID estiver definido, o card de Backlog Prioritization usará estes IDs em vez do mapeamento por nome.
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

ProjectSettingsPanel.displayName = 'ProjectSettingsPanel';
