import { cn } from '../../utils/cn';
import {
  projectCardAccentBarClass,
  projectCardOrbCtaClass,
  projectCardOrbHighlightClass,
} from '../common/projectCardUi';

/**
 * Tokens de texto para superfícies claras da LandingPage.
 * Não usar `--project-card-text` (branco) em cards `app-surface` — é para cards escuros.
 */
export const landingTextStrongClass = 'text-[var(--brand-text-strong)]';

/** Secundário legível no bege/creme (sem opacidade extra). */
export const landingTextMutedClass =
  'text-[color-mix(in_srgb,var(--brand-text-strong)_78%,transparent)]';

/** Terciário (meta, rodapé) — ainda acima de WCAG AA em fundo claro. */
export const landingTextSubtleClass =
  'text-[color-mix(in_srgb,var(--brand-text-strong)_62%,transparent)]';

export const landingAccentTextClass = 'text-[var(--project-card-accent)]';

/** Container principal da home — largura total. */
export const landingPageContainerClass =
  'relative z-[1] flex w-full min-w-0 max-w-none flex-1 flex-col gap-6 sm:gap-7 lg:gap-8';

/** Shell da página — fundo ambient sutil (inspirado em hero SaaS / 21st). */
export const landingPageShellClass = cn(
  'landing-page-shell app-neu-scope relative flex min-h-screen flex-col',
  'px-3 pb-6 pt-6 sm:px-5 sm:pb-8 sm:pt-8 lg:px-6 lg:pb-10',
  'xl:px-8 2xl:px-10'
);

/** Barra superior — marca + ações (padrão nav flutuante 21st). */
export const landingTopBarClass = cn(
  'landing-top-bar relative z-[2] mb-4 flex w-full min-w-0 max-w-none items-center justify-between gap-3 sm:mb-5'
);

export const landingTopBarBrandClass = cn(
  'landing-top-bar-brand inline-flex min-w-0 items-center gap-2.5 no-underline',
  landingTextStrongClass
);

export const landingTopBarLogoClass = cn(
  'landing-top-bar-logo flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full sm:h-10 sm:w-10'
);

/** Painel do hero — card elevado com hierarquia clara. */
export const landingHeroShellClass = cn(
  'landing-hero-shell w-full p-4 sm:p-5 lg:p-6'
);

/** Hero horizontal em telas grandes. */
export const landingHeroClass =
  'flex flex-col items-center gap-4 text-center sm:gap-5 lg:flex-row lg:items-center lg:gap-8 lg:text-left';

/** Badge/eyebrow acima do título (announcement pill — SaaS hero). */
export const landingEyebrowClass = 'landing-eyebrow';

/** Coluna lateral (continuar / onboarding). */
export const landingAsideClass = 'flex flex-col gap-4 lg:col-span-5';

/** Área de navegação principal — layout bento. */
export const landingNavClass = 'flex flex-col gap-4 lg:col-span-7';

/** Grade bento dos cards de menu (21st bento grid). */
export const landingMenuGridClass = cn(
  'landing-bento-grid grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-2 lg:gap-5',
  'xl:grid-cols-3 xl:gap-5 2xl:grid-cols-3',
  'lg:auto-rows-[minmax(10.5rem,auto)]'
);

export const landingMenuCardPrimaryGridClass = 'sm:col-span-2 lg:col-span-2 lg:row-span-2';

export const landingMenuCardSecondaryGridClass = 'lg:col-span-1';

/** Grid principal aside + nav. */
export const landingMainGridClass =
  'grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-stretch lg:gap-6';

/** Chip de integração configurada — fundo suave + texto escuro. */
export const landingStatusChipOkClass = [
  'bg-[color-mix(in_srgb,var(--project-card-accent)_18%,white)]',
  'text-[var(--brand-text-strong)]',
  'ring-1 ring-[color-mix(in_srgb,var(--project-card-accent)_28%,transparent)]',
].join(' ');

/** Chip de integração pendente. */
export const landingStatusChipIdleClass = [
  'bg-[color-mix(in_srgb,var(--brand-text-strong)_6%,white)]',
  'text-[color-mix(in_srgb,var(--brand-text-strong)_72%,transparent)]',
  'ring-1 ring-[color-mix(in_srgb,var(--brand-text-strong)_12%,transparent)]',
].join(' ');

/** Painel neumórfico elevado (Continuar / Acompanhamento). */
export const landingNeuPanelClass = cn(
  'landing-neu-panel flex w-full flex-col gap-4 p-4 sm:gap-5 sm:p-5'
);

export const landingNeuPanelBodyClass = 'landing-neu-panel__body flex flex-col gap-4 sm:gap-5';

export const landingNeuAccentBarClass = projectCardAccentBarClass;

export const landingNeuOrbCtaClass = projectCardOrbCtaClass;

export const landingNeuOrbHighlightClass = projectCardOrbHighlightClass;

export const landingNeuSectionHeaderClass = cn(
  'flex items-end justify-between gap-2 border-b border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)] pb-3'
);

export const landingNeuSectionLabelClass = 'landing-neu-section-label';

export const landingNeuSectionDescClass = cn(
  'mt-1 font-sans text-xs font-medium leading-relaxed sm:text-sm',
  landingTextMutedClass
);

export const landingNeuLogoPlateClass = cn(
  'landing-neu-logo-plate',
  'motion-reduce:transform-none'
);

export const landingNeuActionBtnClass = cn(
  'landing-neu-action-btn',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--project-card-accent)]',
  'motion-reduce:transform-none'
);

export function landingNeuStatusChipClass(ok: boolean): string {
  return cn(
    'landing-neu-status-chip',
    ok ? 'landing-neu-status-chip--ok' : 'landing-neu-status-chip--idle'
  );
}

export const landingNeuCtaBtnClass = cn(
  'landing-neu-cta-btn',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--project-card-accent)]',
  'motion-reduce:transform-none'
);

export const landingNeuFooterClass = 'landing-neu-footer';

export const landingNeuIconPlateClass = 'landing-neu-icon-plate';

export const landingNeuLinkBtnClass = cn(
  'landing-neu-link-btn no-underline',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--project-card-accent)]'
);

export const landingNeuSummaryClass = 'landing-neu-summary';

export const landingNeuSummaryStatClass = 'landing-neu-summary-stat';

export const landingNeuFilterToolbarClass = 'landing-neu-filter-toolbar w-full';

export function landingNeuFilterBtnClass(active: boolean): string {
  return cn(
    'landing-neu-filter-btn',
    active && 'landing-neu-filter-btn--active',
    'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--project-card-accent)]',
    'motion-reduce:transform-none'
  );
}

export const landingNeuFilterCountClass = 'landing-neu-filter-count';

export const landingNeuListClass = cn(
  'landing-neu-list custom-scrollbar max-h-[min(20rem,50vh)] space-y-2 overflow-y-auto overscroll-contain'
);

export const landingNeuRowClass = cn(
  'landing-neu-row group cursor-pointer',
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--project-card-accent)]',
  'motion-reduce:transform-none sm:items-center'
);

export const landingNeuEmptyClass = cn(
  'landing-neu-empty px-3 py-4 text-center text-sm font-medium',
  landingTextMutedClass
);

/** Badge SLA compacto na linha — cores mantidas, relevo neumórfico. */
export function landingNeuSlaBadgeClass(bucket: 'onTrack' | 'atRisk' | 'overdue' | 'noDueDate'): string {
  const tone =
    bucket === 'overdue'
      ? 'text-error border border-[color-mix(in_srgb,#e54b4f_25%,transparent)] bg-[color-mix(in_srgb,#e54b4f_10%,var(--leve-neu-bg))]'
      : bucket === 'atRisk'
        ? 'text-warning border border-[color-mix(in_srgb,#f59e0b_25%,transparent)] bg-[color-mix(in_srgb,#f59e0b_10%,var(--leve-neu-bg))]'
        : bucket === 'onTrack'
          ? 'text-success border border-[color-mix(in_srgb,#22c55e_25%,transparent)] bg-[color-mix(in_srgb,#22c55e_10%,var(--leve-neu-bg))]'
          : 'text-[color-mix(in_srgb,var(--brand-text-strong)_72%,transparent)] border border-[color-mix(in_srgb,var(--leve-neu-light)_35%,transparent)] bg-[color-mix(in_srgb,var(--leve-neu-dark)_6%,var(--leve-neu-bg))]';
  return cn('landing-neu-sla-badge', tone);
}

/** @deprecated Use landingNeuPanelClass */
export const landingFollowUpPanelClass = landingNeuPanelClass;

/** @deprecated Use landingNeuFilterBtnClass */
export function landingFollowUpChipClass(active: boolean): string {
  return landingNeuFilterBtnClass(active);
}

/** @deprecated Use landingNeuFilterCountClass */
export const landingFollowUpChipCountClass = landingNeuFilterCountClass;

/** @deprecated Use landingNeuListClass */
export const landingFollowUpListClass = landingNeuListClass;

/** @deprecated Use landingNeuRowClass */
export const landingFollowUpRowClass = landingNeuRowClass;

/** @deprecated Use landingNeuSlaBadgeClass */
export function landingFollowUpSlaBadgeClass(bucket: 'onTrack' | 'atRisk' | 'overdue' | 'noDueDate'): string {
  return landingNeuSlaBadgeClass(bucket);
}
