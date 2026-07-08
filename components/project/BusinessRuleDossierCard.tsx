import React, { useCallback } from 'react';
import { ChevronDown, Pencil, RefreshCw, Trash2 } from 'lucide-react';
import type { BusinessRule } from '../../types';
import type { DossierAiProgress } from '../../utils/businessRuleDossierProgress';
import { isLegacyBusinessRule } from '../../utils/businessRuleDefaults';
import { SafeMarkdown } from '../common/SafeMarkdown';
import { BusinessRuleDossierProgressBanner } from './BusinessRuleDossierProgressBanner';
import {
  businessRulesCardActionLabelClass,
  businessRulesCardBodyClass,
  businessRulesCardChevronClass,
  businessRulesCardClass,
  businessRulesCardDeleteBtnClass,
  businessRulesCardEditBtnClass,
  businessRulesCardKeywordsPanelClass,
  businessRulesCardLabelClass,
  businessRulesCardSectionClass,
  businessRulesCardSummaryActionsClass,
  businessRulesCardSummaryClass,
  businessRulesCardSummaryHeaderClass,
  businessRulesCardTitleClass,
  businessRulesCategoryBadgeClass,
  businessRulesDossierContentClass,
  businessRulesDossierProseClass,
  businessRulesHistoryPanelClass,
  businessRulesHistorySummaryClass,
  businessRulesKeywordChipClass,
  businessRulesKeywordsListClass,
  businessRulesLegacyBannerClass,
} from './businessRulesNeuUi';

export interface BusinessRuleDossierCardProps {
  rule: BusinessRule;
  isExpanded?: boolean;
  onExpandedChange?: (open: boolean) => void;
  isAnalyzing?: boolean;
  analyzingProgress?: DossierAiProgress | null;
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
  analyzingProgress = null,
  onEdit,
  onDelete,
  onReanalyze,
  onConvertLegacy,
}) => {
  const legacy = isLegacyBusinessRule(rule);
  const outdated = rule.isOutdated && !isAnalyzing;
  const keywordsSectionId = `br-keywords-${rule.id}`;
  const dossierSectionId = `br-dossier-${rule.id}`;
  const historySectionId = `br-history-${rule.id}`;

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
          {isAnalyzing && analyzingProgress ? (
            <BusinessRuleDossierProgressBanner progress={analyzingProgress} className="mb-3" />
          ) : null}

          {rule.searchKeywords && rule.searchKeywords.length > 0 ? (
            <section
              className={businessRulesCardSectionClass}
              aria-labelledby={keywordsSectionId}
            >
              <h4 id={keywordsSectionId} className={businessRulesCardLabelClass}>
                Palavras-chave
              </h4>
              <div className={businessRulesCardKeywordsPanelClass}>
                <ul className={businessRulesKeywordsListClass} role="list">
                  {rule.searchKeywords.map(keyword => (
                    <li key={keyword}>
                      <span className={businessRulesKeywordChipClass}>{keyword}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          {legacy && !rule.analysis ? (
            <section className={businessRulesCardSectionClass} aria-live="polite">
              <div className={businessRulesLegacyBannerClass}>
                <p>
                  Regra legada com descrição manual. Converta para dossiê IA para análise
                  automática.
                </p>
                <button
                  type="button"
                  className="btn btn-ghost btn-xs mt-2"
                  onClick={() => onConvertLegacy(rule)}
                >
                  Converter para dossiê
                </button>
              </div>
            </section>
          ) : null}

          {rule.analysis ? (
            <section className={businessRulesCardSectionClass} aria-labelledby={dossierSectionId}>
              <h4 id={dossierSectionId} className={businessRulesCardLabelClass}>
                Conteúdo do dossiê
              </h4>
              <div className={businessRulesDossierContentClass}>
                <SafeMarkdown
                  source={rule.analysis.markdown}
                  className={businessRulesDossierProseClass}
                />
              </div>
            </section>
          ) : rule.description?.trim() ? (
            <section className={businessRulesCardSectionClass} aria-labelledby={dossierSectionId}>
              <h4 id={dossierSectionId} className={businessRulesCardLabelClass}>
                Descrição legada
              </h4>
              <div className={businessRulesDossierContentClass}>
                <SafeMarkdown source={rule.description} className={businessRulesDossierProseClass} />
              </div>
            </section>
          ) : (
            <p className="text-sm italic text-base-content/72">
              Sem análise gerada.
            </p>
          )}

          {(rule.analysisHistory?.length ?? 0) > 0 ? (
            <section className={businessRulesCardSectionClass} aria-labelledby={historySectionId}>
              <details className="group/history">
                <summary className={businessRulesHistorySummaryClass} id={historySectionId}>
                  Histórico de versões ({rule.analysisHistory!.length})
                </summary>
                <div className={`${businessRulesHistoryPanelClass} mt-2`}>
                  <ul className="space-y-1.5" role="list">
                    {rule.analysisHistory!.map(h => (
                      <li
                        key={`${h.version}-${h.generatedAt}`}
                        className="flex flex-wrap items-baseline gap-x-2 text-xs leading-relaxed"
                      >
                        <span className="font-semibold text-base-content">
                          v{h.version}
                        </span>
                        <span aria-hidden>·</span>
                        <time dateTime={h.generatedAt}>
                          {new Date(h.generatedAt).toLocaleString('pt-BR')}
                        </time>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            </section>
          ) : null}
        </div>
      </details>
    </div>
  );
};

BusinessRuleDossierCard.displayName = 'BusinessRuleDossierCard';
