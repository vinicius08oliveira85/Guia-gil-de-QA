import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import type { BusinessRule, BusinessRuleScreenshot, Project } from '../../types';
import {
  formatKeywordsForInput,
  matchTasksForBusinessRule,
  parseKeywordsFromInput,
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
  onSaved: (project: Project) => void;
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

  const searchKeywords = useMemo(
    () => parseKeywordsFromInput(keywordsInput),
    [keywordsInput]
  );

  const matches = useMemo(
    () => matchTasksForBusinessRule(project.tasks, title, searchKeywords),
    [project.tasks, title, searchKeywords]
  );

  useEffect(() => {
    if (editingRule) return;
    if (selectedTaskIds.length > 0) return;
    if (searchKeywords.length === 0) return;
    const auto = matches.filter(m => m.confidence !== 'baixa').map(m => m.taskId);
    if (auto.length > 0) setSelectedTaskIds(auto);
  }, [matches, editingRule, selectedTaskIds.length, searchKeywords.length]);

  const toggleTask = (taskId: string, checked: boolean) => {
    setSelectedTaskIds(prev => {
      const s = new Set(prev);
      if (checked) s.add(taskId);
      else s.delete(taskId);
      return [...s];
    });
  };

  const canGenerate =
    title.trim().length > 0 && searchKeywords.length > 0 && selectedTaskIds.length > 0;

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

      const result = editingRule?.analysis
        ? await refreshBusinessRuleDossier(linkedProject, rule)
        : await generateBusinessRuleDossier(linkedProject, rule);

      const rules = linkedProject.businessRules.some(r => r.id === result.rule.id)
        ? linkedProject.businessRules.map(r => (r.id === result.rule.id ? result.rule : r))
        : [...linkedProject.businessRules, result.rule];

      onSaved({ ...linkedProject, businessRules: rules });
      handleSuccess(editingRule?.analysis ? 'Dossiê reanalisado com sucesso.' : 'Dossiê gerado com sucesso.');
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
          placeholder="Ex.: Foto do dia, Mapa de Internação"
          aria-describedby="br-dossier-keywords-hint"
        />
        <p id="br-dossier-keywords-hint" className={tasksPanelFormMutedClass}>
          Separe por vírgula. Usadas para encontrar tasks no Jira e montar o dossiê com IA.
        </p>
      </div>

      <BusinessRuleScreenshotUpload
        screenshots={screenshots}
        onChange={setScreenshots}
        disabled={isGenerating}
      />

      <div>
        <p className={tasksPanelFormFieldLabelClass}>Tasks relacionadas</p>
        {searchKeywords.length === 0 ? (
          <p className="text-sm text-base-content/60">
            Informe ao menos uma palavra-chave para buscar tasks relacionadas.
          </p>
        ) : matches.length === 0 ? (
          <p className="text-sm text-base-content/60">
            Nenhuma task encontrada para as palavras-chave. Ajuste os termos ou selecione tasks
            manualmente no projeto antes de gerar.
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
                  <label htmlFor={`br-task-${m.taskId}`} className="min-w-0 flex-1 cursor-pointer text-sm">
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
      </div>

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
          {editingRule?.analysis ? 'Reanalisar com IA' : 'Gerar análise com IA'}
        </button>
      </div>
    </div>
  );
};

BusinessRuleDossierForm.displayName = 'BusinessRuleDossierForm';
