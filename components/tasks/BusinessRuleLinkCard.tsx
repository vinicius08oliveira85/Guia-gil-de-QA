import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { BusinessRule } from '../../types';
import { cn } from '../../utils/cn';
import { getBusinessRulePromptText } from '../../utils/businessRulePromptText';
import {
  leveTaskModalCategoryBadgeClass,
  leveTaskModalMutedClass,
  leveTaskModalMutedXsClass,
  leveTaskModalSectionClass,
} from '../common/projectCardUi';

export interface BusinessRuleLinkCardProps {
  rule: BusinessRule;
  checked: boolean;
  onToggle: (checked: boolean) => void;
  /** Prefixo único (id da tarefa saneado) para os ids dos inputs. */
  domIdPrefix: string;
  /** Distingue listas diferentes no mesmo container (ex.: ocultas pelo filtro). */
  variant?: string;
  /** Indica que a regra já entra no prompt por causa da categoria vinculada. */
  coveredByCategory?: boolean;
}

/**
 * Cartão de uma regra de negócio na seleção por regra: checkbox + título com
 * categoria e descrição expansível. Destaca visualmente quando selecionada.
 */
export const BusinessRuleLinkCard: React.FC<BusinessRuleLinkCardProps> = ({
  rule,
  checked,
  onToggle,
  domIdPrefix,
  variant = 'main',
  coveredByCategory = false,
}) => {
  const inputId = `br-cb-${variant}-${domIdPrefix}-${rule.id}`;

  return (
    <div
      className={cn(
        leveTaskModalSectionClass,
        'flex overflow-hidden transition-[border-color,box-shadow,background-color]',
        checked
          ? 'border-[color-mix(in_srgb,var(--leve-header-accent)_55%,transparent)] bg-[color-mix(in_srgb,var(--leve-header-accent)_7%,var(--leve-neu-bg))]'
          : 'hover:border-[color-mix(in_srgb,var(--leve-header-accent)_30%,transparent)]'
      )}
    >
      <label className="flex shrink-0 cursor-pointer items-start p-3" htmlFor={inputId}>
        <input
          id={inputId}
          type="checkbox"
          className="checkbox checkbox-highlight mt-0.5 shrink-0"
          checked={checked}
          onChange={e => onToggle(e.target.checked)}
          aria-label={`${checked ? 'Desmarcar' : 'Marcar'} vínculo da regra: ${rule.title}`}
        />
      </label>
      <details className="group min-w-0 flex-1 border-l border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)]">
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 py-3 pr-3 text-left text-sm font-medium text-[var(--leve-header-text)] transition-[background-color,box-shadow] hover:bg-[color-mix(in_srgb,var(--leve-header-accent)_6%,var(--leve-neu-bg))] focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[color-mix(in_srgb,var(--leve-header-accent)_35%,transparent)] [&::-webkit-details-marker]:hidden">
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <span className="truncate">{rule.title}</span>
            <span className={leveTaskModalCategoryBadgeClass}>{rule.category ?? 'Geral'}</span>
            {coveredByCategory && (
              <span
                className="leve-neu-pill shrink-0 px-2 py-0.5 font-sans text-[10px] font-semibold text-[var(--leve-header-text-muted)]"
                title="Já incluída no prompt pela categoria vinculada"
              >
                via categoria
              </span>
            )}
          </span>
          <ChevronDown
            className="h-5 w-5 shrink-0 text-[var(--leve-header-text-muted)] transition-transform group-open:rotate-180"
            aria-hidden
          />
        </summary>
        <div
          className={cn(
            'whitespace-pre-wrap border-t border-[var(--leve-header-border)] pb-3 pr-3 pt-2 text-sm',
            leveTaskModalMutedClass
          )}
        >
          {(() => {
            const text = getBusinessRulePromptText(rule).trim();
            return text ? (
              text
            ) : (
              <span className={cn('italic', leveTaskModalMutedXsClass)}>Sem conteúdo</span>
            );
          })()}
        </div>
      </details>
    </div>
  );
};

BusinessRuleLinkCard.displayName = 'BusinessRuleLinkCard';
