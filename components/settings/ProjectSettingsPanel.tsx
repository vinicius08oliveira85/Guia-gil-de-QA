import React, { useState, useEffect } from 'react';
import { Project, BacklogPrioritizationFieldIds } from '../../types';
import { getJiraConfig, getJiraFields, type JiraFieldInfo } from '../../services/jiraService';
import { Modal } from '../common/Modal';

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

    const [showJiraFieldsModal, setShowJiraFieldsModal] = useState(false);
    const [jiraFieldsList, setJiraFieldsList] = useState<JiraFieldInfo[]>([]);
    const [jiraFieldsLoading, setJiraFieldsLoading] = useState(false);
    const [jiraFieldsError, setJiraFieldsError] = useState<string | null>(null);
    const [filterCustomOnly, setFilterCustomOnly] = useState(false);

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

    const handleListJiraFields = async () => {
        setJiraFieldsError(null);
        setShowJiraFieldsModal(true);
        const config = getJiraConfig();
        if (!config) {
            setJiraFieldsError('Configure a integração Jira nas configurações gerais primeiro.');
            setJiraFieldsList([]);
            return;
        }
        setJiraFieldsLoading(true);
        try {
            const fields = await getJiraFields(config, { skipCache: true });
            setJiraFieldsList(fields);
        } catch {
            setJiraFieldsError('Erro ao buscar campos do Jira.');
            setJiraFieldsList([]);
        } finally {
            setJiraFieldsLoading(false);
        }
    };

    const hasAny = ids.impactId || ids.confidenceId || ids.easeId || ids.scoreId;
    const unchanged =
        (project.settings?.backlogPrioritizationFieldIds?.impactId ?? '') === (ids.impactId ?? '') &&
        (project.settings?.backlogPrioritizationFieldIds?.confidenceId ?? '') === (ids.confidenceId ?? '') &&
        (project.settings?.backlogPrioritizationFieldIds?.easeId ?? '') === (ids.easeId ?? '') &&
        (project.settings?.backlogPrioritizationFieldIds?.scoreId ?? '') === (ids.scoreId ?? '');

    const displayedFields = filterCustomOnly
        ? jiraFieldsList.filter((f) => f.custom)
        : jiraFieldsList;
    const sortedFields = [...displayedFields].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-base-300 bg-base-100 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-base-content mb-1">Preencher Backlog Prioritization no card da tarefa</h2>
                <p className="text-sm text-base-content/70 mb-4">
                    Estes IDs são usados para exibir Impact, Confidence, Ease e Score no bloco Backlog Prioritization que aparece no detalhe de cada tarefa. Se os valores não aparecerem após &quot;Atualizar do Jira&quot;, use &quot;Listar campos do Jira&quot; para ver os IDs ou informe manualmente (ex.: customfield_10050).
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
                    <button
                        type="button"
                        onClick={handleListJiraFields}
                        className="btn btn-outline btn-sm"
                    >
                        Listar campos do Jira
                    </button>
                    {hasAny && (
                        <span className="text-xs text-base-content/60">
                            Quando pelo menos um ID estiver definido, o card de Backlog Prioritization usará estes IDs em vez do mapeamento por nome.
                        </span>
                    )}
                </div>
            </div>

            <Modal
                isOpen={showJiraFieldsModal}
                onClose={() => {
                    setShowJiraFieldsModal(false);
                    setJiraFieldsError(null);
                }}
                title="Campos do Jira"
                size="2xl"
            >
                <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={filterCustomOnly}
                            onChange={(e) => setFilterCustomOnly(e.target.checked)}
                            className="checkbox checkbox-sm"
                        />
                        <span className="text-sm text-base-content/80">Apenas custom fields</span>
                    </label>
                    {jiraFieldsLoading && <p className="text-sm text-base-content/70">Carregando campos…</p>}
                    {jiraFieldsError && <p className="text-sm text-error">{jiraFieldsError}</p>}
                    {!jiraFieldsLoading && !jiraFieldsError && (
                        <div className="max-h-96 overflow-y-auto border border-base-300 rounded-lg">
                            <table className="table table-zebra table-pin-rows text-sm">
                                <thead>
                                    <tr>
                                        <th className="font-mono">ID</th>
                                        <th>Nome</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedFields.map((f) => (
                                        <tr key={f.id}>
                                            <td className="font-mono text-base-content/90">{f.id}</td>
                                            <td>{f.name}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {sortedFields.length === 0 && (
                                <p className="p-4 text-sm text-base-content/60">
                                    {filterCustomOnly ? 'Nenhum custom field encontrado.' : 'Nenhum campo retornado.'}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};

ProjectSettingsPanel.displayName = 'ProjectSettingsPanel';
