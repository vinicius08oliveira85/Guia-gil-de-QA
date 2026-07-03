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
