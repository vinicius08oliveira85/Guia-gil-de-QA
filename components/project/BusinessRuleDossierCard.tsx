import React, { useCallback } from 'react';
import { ChevronDown, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import type { BusinessRule } from '../../types';
import { isLegacyBusinessRule } from '../../utils/businessRuleDefaults';
import { SafeMarkdown } from '../common/SafeMarkdown';
import {
  businessRulesCardActionLabelClass,
  businessRulesCardBodyClass,
  businessRulesCardChevronClass,
  businessRulesCardClass,
  businessRulesCardDeleteBtnClass,
  businessRulesCardEditBtnClass,
  businessRulesCardLabelClass,
  businessRulesCardSummaryActionsClass,
  businessRulesCardSummaryClass,
  businessRulesCardSummaryHeaderClass,
  businessRulesCardTitleClass,
  businessRulesCategoryBadgeClass,
} from './businessRulesNeuUi';

export interface BusinessRuleDossierCardProps {
  rule: BusinessRule;
  isExpanded?: boolean;
  onExpandedChange?: (open: boolean) => void;
  isAnalyzing?: boolean;
  onEdit: (rule: BusinessRule) => void;
  onDelete: (ruleId: string) => void;
  onReanalyze: (rule: BusinessRule) => void;
  onConvertLegacy: (rule: BusinessRule) => void;
}

function stopSummaryToggle(e: React.MouseEvent | React.KeyboardEvent) {
  e.preventDefault();
  e.stopPropagation();
}

/**
 * Card de exibição do dossiê de uma regra de negócio.
 */
export const BusinessRuleDossierCard: React.FC<BusinessRuleDossierCardProps> = ({
  rule,
  isExpanded = false,
  onExpandedChange,
  isAnalyzing = false,
  onEdit,
  onDelete,
  onReanalyze,
  onConvertLegacy,
}) => {
  const legacy = isLegacyBusinessRule(rule);
  const outdated = rule.isOutdated && !isAnalyzing;

  const handleToggle = useCallback(
    (e: React.SyntheticEvent<HTMLDetailsElement>) => {
      onExpandedChange?.(e.currentTarget.open);
    },
    [onExpandedChange]
  );

  const renderActions = (className: string) => (
    <div
      className={className}
      role="group"
      aria-label={`Ações da regra ${rule.title}`}
      onClick={stopSummaryToggle}
      onKeyDown={stopSummaryToggle}
    >
      <button
        type="button"
        className={businessRulesCardEditBtnClass}
        onClick={() => onEdit(rule)}
        aria-label={`Editar regra ${rule.title}`}
      >
        <Pencil className="h-4 w-4 shrink-0" aria-hidden />
        <span className={businessRulesCardActionLabelClass}>Editar</span>
      </button>
      {rule.analysis ? (
        <button
          type="button"
          className={businessRulesCardEditBtnClass}
          onClick={() => onReanalyze(rule)}
          disabled={isAnalyzing}
          aria-label={`Reanalisar regra ${rule.title}`}
        >
          <RefreshCw className="h-4 w-4 shrink-0" aria-hidden />
          <span className={businessRulesCardActionLabelClass}>Reanalisar</span>
        </button>
      ) : null}
      <button
        type="button"
        className={businessRulesCardDeleteBtnClass}
        onClick={() => onDelete(rule.id)}
        aria-label={`Excluir regra ${rule.title}`}
      >
        <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
        <span className={businessRulesCardActionLabelClass}>Excluir</span>
      </button>
    </div>
  );

  return (
    <div className={businessRulesCardClass}>
      <details className="group" open={isExpanded} onToggle={handleToggle}>
        <summary className={businessRulesCardSummaryClass}>
          <div className={businessRulesCardSummaryHeaderClass}>
            <span className="min-w-0 flex-1">
              <span className={businessRulesCardTitleClass}>{rule.title}</span>
              <span className="mt-2 inline-flex flex-wrap items-center gap-2">
                {legacy ? (
                  <span className={businessRulesCategoryBadgeClass('warning')} role="status">
                    Legada
                  </span>
                ) : null}
                {outdated ? (
                  <span className={businessRulesCategoryBadgeClass('warning')} role="status">
                    Desatualizado
                  </span>
                ) : null}
                {isAnalyzing ? (
                  <span className={businessRulesCategoryBadgeClass('info')} role="status">
                    Analisando…
                  </span>
                ) : null}
                {rule.analysis ? (
                  <span className={businessRulesCategoryBadgeClass('secondary')} role="status">
                    v{rule.analysis.version} · {rule.linkedTaskIds.length} task(s)
                  </span>
                ) : null}
              </span>
            </span>
            <ChevronDown className={businessRulesCardChevronClass} aria-hidden />
          </div>
          {renderActions(businessRulesCardSummaryActionsClass)}
        </summary>

        <div className={businessRulesCardBodyClass}>
          {rule.searchKeywords && rule.searchKeywords.length > 0 ? (
            <div className="mb-3">
              <p className={businessRulesCardLabelClass}>Palavras-chave</p>
              <p className="text-sm text-base-content/80">{rule.searchKeywords.join(', ')}</p>
            </div>
          ) : null}

          {legacy && !rule.analysis ? (
            <div className="mb-3 rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
              Regra legada com descrição manual. Converta para dossiê IA para análise automática.
              <button
                type="button"
                className="btn btn-ghost btn-xs ml-2"
                onClick={() => onConvertLegacy(rule)}
              >
                Converter
              </button>
            </div>
          ) : null}

          {rule.analysis ? (
            <div>
              <p className={businessRulesCardLabelClass}>Dossiê</p>
              <SafeMarkdown source={rule.analysis.markdown} className="prose prose-sm max-w-none" />
            </div>
          ) : rule.description?.trim() ? (
            <div>
              <p className={businessRulesCardLabelClass}>Descrição legada</p>
              <SafeMarkdown source={rule.description} className="prose prose-sm max-w-none" />
            </div>
          ) : (
            <p className="text-sm text-base-content/60">Sem análise gerada.</p>
          )}

          {(rule.analysisHistory?.length ?? 0) > 0 ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium">Histórico de versões</summary>
              <ul className="mt-2 space-y-2 text-xs text-base-content/70" role="list">
                {rule.analysisHistory!.map(h => (
                  <li key={`${h.version}-${h.generatedAt}`}>
                    v{h.version} — {new Date(h.generatedAt).toLocaleString('pt-BR')}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      </details>
    </div>
  );
};

BusinessRuleDossierCard.displayName = 'BusinessRuleDossierCard';
