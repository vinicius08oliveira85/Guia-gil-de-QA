import React, { useMemo, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import type { BusinessRule, BusinessRuleScreenshot, Project } from '../../types';
import {
  DOSSIER_MAX_TASKS,
  formatKeywordsForInput,
  getSuggestedTaskIdsFromMatches,
  matchTasksForBusinessRule,
  parseKeywordsFromInput,
  resolveLinkedTasksForDossier,
  scoreLinkedTasksForRule,
  suggestKeywordsFromRuleTitle,
} from '../../utils/businessRuleTaskMatcher';
import { applyBusinessRuleTaskLinks } from '../../utils/businessRuleTaskLinking';
import {
  generateBusinessRuleDossier,
  refreshBusinessRuleDossier,
} from '../../services/ai/businessRuleDossierService';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import {
  tasksPanelFormFieldLabelClass,
  tasksPanelFormFooterClass,
  tasksPanelFormInputClass,
  tasksPanelFormListItemMetaClass,
  tasksPanelFormListItemTitleClass,
  tasksPanelFormListShellClass,
  tasksPanelFormMutedClass,
  tasksPanelFormCancelBtnClass,
  tasksPanelFormSaveBtnClass,
  tasksPanelFormTextareaClass,
} from '../tasks/tasksPanelNeuStyles';
import { BusinessRuleScreenshotUpload } from './BusinessRuleScreenshotUpload';

export interface BusinessRuleDossierFormProps {
  project: Project;
  editingRule?: BusinessRule | null;
  onClose: () => void;
  onSaved: (project: Project) => void | Promise<void>;
}

/**
 * Formulário para criar/editar regra e gerar dossiê com IA.
 */
export const BusinessRuleDossierForm: React.FC<BusinessRuleDossierFormProps> = ({
  project,
  editingRule,
  onClose,
  onSaved,
}) => {
  const { handleError, handleSuccess } = useErrorHandler();
  const [title, setTitle] = useState(editingRule?.title ?? '');
  const [keywordsInput, setKeywordsInput] = useState(() => {
    if (editingRule?.searchKeywords?.length) {
      return formatKeywordsForInput(editingRule.searchKeywords);
    }
    if (editingRule?.title) {
      return suggestKeywordsFromRuleTitle(editingRule.title);
    }
    return '';
  });
  const [screenshots, setScreenshots] = useState<BusinessRuleScreenshot[]>(
    editingRule?.screenshots ?? []
  );
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(
    editingRule?.linkedTaskIds ?? []
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [regenerateFromScratch, setRegenerateFromScratch] = useState(false);

  const searchKeywords = useMemo(
    () => parseKeywordsFromInput(keywordsInput),
    [keywordsInput]
  );

  const matches = useMemo(
    () => matchTasksForBusinessRule(project.tasks, title, searchKeywords),
    [project.tasks, title, searchKeywords]
  );

  const suggestedIds = useMemo(
    () => getSuggestedTaskIdsFromMatches(matches),
    [matches]
  );

  const draftRule = useMemo(
    (): Pick<BusinessRule, 'title' | 'searchKeywords' | 'linkedTaskIds'> => ({
      title: title.trim(),
      searchKeywords,
      linkedTaskIds: selectedTaskIds,
    }),
    [title, searchKeywords, selectedTaskIds]
  );

  const dossierPreview = useMemo(
    () => resolveLinkedTasksForDossier(project.tasks, draftRule),
    [project.tasks, draftRule]
  );

  const selectedScores = useMemo(
    () => scoreLinkedTasksForRule(project.tasks, draftRule),
    [project.tasks, draftRule]
  );

  const weakSelectedCount = selectedScores.filter(
    s => s.score > 0 && s.confidence === 'baixa'
  ).length;

  const matchById = useMemo(() => new Map(matches.map(m => [m.taskId, m])), [matches]);

  const applyHighConfidenceSuggestions = () => {
    setSelectedTaskIds(suggestedIds);
  };

  const clearSelection = () => {
    setSelectedTaskIds([]);
  };

  const toggleTask = (taskId: string, checked: boolean) => {
    setSelectedTaskIds(prev => {
      const s = new Set(prev);
      if (checked) s.add(taskId);
      else s.delete(taskId);
      return [...s];
    });
  };

  const canGenerate =
    title.trim().length > 0 && searchKeywords.length > 0 && dossierPreview.tasks.length > 0;

  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    try {
      const now = new Date().toISOString();
      const t = title.trim();
      let rule: BusinessRule = editingRule
        ? { ...editingRule, title: t, searchKeywords, screenshots }
        : {
            id: crypto.randomUUID(),
            title: t,
            searchKeywords,
            createdAt: now,
            linkedTaskIds: selectedTaskIds,
            screenshots,
          };

      const linkedProject = applyBusinessRuleTaskLinks(project, rule.id, selectedTaskIds);
      rule = { ...rule, linkedTaskIds: selectedTaskIds, screenshots, searchKeywords };

      const result =
        editingRule?.analysis && !regenerateFromScratch
          ? await refreshBusinessRuleDossier(linkedProject, rule)
          : editingRule?.analysis && regenerateFromScratch
            ? await refreshBusinessRuleDossier(linkedProject, rule, undefined, {
                regenerateFromScratch: true,
              })
            : await generateBusinessRuleDossier(linkedProject, rule);

      const rules = linkedProject.businessRules.some(r => r.id === result.rule.id)
        ? linkedProject.businessRules.map(r => (r.id === result.rule.id ? result.rule : r))
        : [...linkedProject.businessRules, result.rule];

      await onSaved({ ...linkedProject, businessRules: rules });

      const excluded = dossierPreview.excludedTaskIds.length;
      if (excluded > 0) {
        handleSuccess(
          `${editingRule?.analysis ? 'Dossiê reanalisado' : 'Dossiê gerado'} com ${dossierPreview.tasks.length} task(s). ${excluded} task(s) de baixa relevância foram ignoradas.`
        );
      } else {
        handleSuccess(
          editingRule?.analysis && !regenerateFromScratch
            ? 'Dossiê reanalisado com sucesso.'
            : 'Dossiê gerado com sucesso.'
        );
      }
      onClose();
    } catch (error) {
      handleError(error, 'Gerar dossiê de regra de negócio');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="br-dossier-title" className={tasksPanelFormFieldLabelClass}>
          Nome da regra
        </label>
        <input
          id="br-dossier-title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className={tasksPanelFormInputClass}
          placeholder="Ex.: RN-Mapa_de_Internação"
          autoComplete="off"
        />
        <p className={tasksPanelFormMutedClass}>
          Identificador da regra no projeto (código ou nome curto).
        </p>
      </div>

      <div>
        <label htmlFor="br-dossier-keywords" className={tasksPanelFormFieldLabelClass}>
          Palavras-chave
        </label>
        <textarea
          id="br-dossier-keywords"
          value={keywordsInput}
          onChange={e => setKeywordsInput(e.target.value)}
          className={tasksPanelFormTextareaClass}
          rows={3}
          placeholder="Ex.: Cirurgias Eletivas, Painel Eletivo"
          aria-describedby="br-dossier-keywords-hint"
        />
        <p id="br-dossier-keywords-hint" className={tasksPanelFormMutedClass}>
          Separe por vírgula. Use termos específicos do módulo — evite palavras genéricas que
          aparecem em vários painéis.
        </p>
      </div>

      <BusinessRuleScreenshotUpload
        screenshots={screenshots}
        onChange={setScreenshots}
        disabled={isGenerating}
      />

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className={tasksPanelFormFieldLabelClass}>Tasks relacionadas</p>
          {searchKeywords.length > 0 && suggestedIds.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-xs btn-ghost"
                onClick={applyHighConfidenceSuggestions}
                disabled={isGenerating}
              >
                Selecionar sugestões (alta confiança)
              </button>
              {selectedTaskIds.length > 0 ? (
                <button
                  type="button"
                  className="btn btn-xs btn-ghost"
                  onClick={clearSelection}
                  disabled={isGenerating}
                >
                  Limpar seleção
                </button>
              ) : null}
            </div>
          ) : null}
        </div>

        {selectedTaskIds.length > 0 ? (
          <p className="mb-2 text-xs text-base-content/70">
            {selectedTaskIds.length} selecionada(s) · até {DOSSIER_MAX_TASKS} entram no dossiê ·{' '}
            {dossierPreview.tasks.length} relevante(s) agora
            {dossierPreview.excludedTaskIds.length > 0
              ? ` · ${dossierPreview.excludedTaskIds.length} será(ão) ignorada(s) por baixa relevância`
              : ''}
          </p>
        ) : null}

        {weakSelectedCount > 0 ? (
          <p className="mb-2 text-xs text-warning">
            {weakSelectedCount} task(s) selecionada(s) com match fraco — desmarque as que não
            pertencem ao escopo antes de gerar.
          </p>
        ) : null}

        {searchKeywords.length === 0 ? (
          <p className="text-sm text-base-content/60">
            Informe ao menos uma palavra-chave para buscar tasks relacionadas.
          </p>
        ) : matches.length === 0 ? (
          <p className="text-sm text-base-content/60">
            Nenhuma task encontrada para as palavras-chave. Ajuste os termos ou vincule tasks
            manualmente no projeto.
          </p>
        ) : (
          <ul className={tasksPanelFormListShellClass} role="list">
            {matches.map(m => {
              const task = project.tasks.find(t => t.id === m.taskId);
              const checked = selectedTaskIds.includes(m.taskId);
              return (
                <li key={m.taskId} className="flex items-start gap-3 px-3 py-2">
                  <input
                    type="checkbox"
                    id={`br-task-${m.taskId}`}
                    className="checkbox checkbox-sm checkbox-primary mt-0.5 shrink-0"
                    checked={checked}
                    onChange={e => toggleTask(m.taskId, e.target.checked)}
                    aria-label={`Incluir task ${m.taskId}`}
                  />
                  <label
                    htmlFor={`br-task-${m.taskId}`}
                    className="min-w-0 flex-1 cursor-pointer text-sm"
                  >
                    <span className={tasksPanelFormListItemTitleClass}>
                      {task?.title ?? m.taskId}
                    </span>
                    <span className={tasksPanelFormListItemMetaClass}>
                      {m.taskId} · score {m.score} · {m.confidence}
                      {m.matchedTerms.length > 0 ? ` · ${m.matchedTerms.join(', ')}` : ''}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        {selectedTaskIds.some(id => !matchById.has(id)) ? (
          <div className="mt-3">
            <p className="mb-1 text-xs font-medium text-base-content/70">
              Selecionadas fora da busca atual
            </p>
            <ul className={tasksPanelFormListShellClass} role="list">
              {selectedTaskIds
                .filter(id => !matchById.has(id))
                .map(taskId => {
                  const task = project.tasks.find(t => t.id === taskId);
                  const score = selectedScores.find(s => s.taskId === taskId);
                  return (
                    <li key={taskId} className="flex items-start gap-3 px-3 py-2">
                      <input
                        type="checkbox"
                        id={`br-task-extra-${taskId}`}
                        className="checkbox checkbox-sm checkbox-primary mt-0.5 shrink-0"
                        checked
                        onChange={e => toggleTask(taskId, e.target.checked)}
                        aria-label={`Remover task ${taskId}`}
                      />
                      <label
                        htmlFor={`br-task-extra-${taskId}`}
                        className="min-w-0 flex-1 cursor-pointer text-sm"
                      >
                        <span className={tasksPanelFormListItemTitleClass}>
                          {task?.title ?? taskId}
                        </span>
                        <span className={tasksPanelFormListItemMetaClass}>
                          {taskId}
                          {score ? ` · score ${score.score} · ${score.confidence}` : ''}
                          {' · vínculo manual ou keywords antigas'}
                        </span>
                      </label>
                    </li>
                  );
                })}
            </ul>
          </div>
        ) : null}
      </div>

      {editingRule?.analysis ? (
        <label className="flex cursor-pointer items-start gap-2 text-sm text-base-content/80">
          <input
            type="checkbox"
            className="checkbox checkbox-sm checkbox-primary mt-0.5"
            checked={regenerateFromScratch}
            onChange={e => setRegenerateFromScratch(e.target.checked)}
            disabled={isGenerating}
          />
          <span>
            Gerar do zero (ignorar análise anterior v{editingRule.analysis.version}) — use se o
            dossiê misturou temas de outros módulos.
          </span>
        </label>
      ) : null}

      <div className={tasksPanelFormFooterClass}>
        <button
          type="button"
          className={tasksPanelFormCancelBtnClass}
          onClick={onClose}
          disabled={isGenerating}
        >
          Cancelar
        </button>
        <button
          type="button"
          className={tasksPanelFormSaveBtnClass}
          onClick={() => void handleGenerate()}
          disabled={!canGenerate || isGenerating}
        >
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Sparkles className="h-4 w-4" aria-hidden />
          )}
          {editingRule?.analysis && !regenerateFromScratch
            ? 'Reanalisar com IA'
            : 'Gerar análise com IA'}
        </button>
      </div>
    </div>
  );
};

BusinessRuleDossierForm.displayName = 'BusinessRuleDossierForm';
