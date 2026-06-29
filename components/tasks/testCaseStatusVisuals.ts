import type { TestCase } from '../../types';

export const TEST_CASE_STATUS_LABEL: Record<TestCase['status'], string> = {
  'Not Run': 'Não Executado',
  Passed: 'Aprovado',
  Failed: 'Reprovado',
  Blocked: 'Bloqueado',
};

/** Traçado SVG de cada status (mesmo desenho usado no seletor de execução). */
export const TEST_CASE_STATUS_GLYPH_PATH: Record<TestCase['status'], string> = {
  'Not Run': '',
  Passed: 'M20 6L9 17l-5-5',
  Failed: 'M18 6L6 18M6 6l12 12',
  Blocked:
    'M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
};

/** Cor do ícone por status, consistente com os botões Aprovar/Reprovar/Bloquear. */
export const TEST_CASE_STATUS_COLOR: Record<TestCase['status'], string> = {
  'Not Run': 'text-[var(--leve-header-text-muted)]',
  Passed: 'text-success',
  Failed: 'text-error',
  Blocked: 'text-warning',
};

/** Faixa lateral (border-left) do card por status — usa as cores do projeto. */
export const TEST_CASE_STATUS_BORDER: Record<TestCase['status'], string> = {
  'Not Run': 'border-l-[color-mix(in_srgb,var(--leve-header-text-muted)_45%,transparent)]',
  Passed: 'border-l-success',
  Failed: 'border-l-error',
  Blocked: 'border-l-warning',
};

/** Realce de contagem (badge) por status — fundo suave + texto na cor do status. */
export const TEST_CASE_STATUS_BADGE_TONE: Record<TestCase['status'], string> = {
  'Not Run':
    'bg-[color-mix(in_srgb,var(--leve-header-text-muted)_18%,transparent)] text-[var(--leve-header-text-muted)]',
  Passed: 'bg-success/15 text-success',
  Failed: 'bg-error/15 text-error',
  Blocked: 'bg-warning/15 text-warning',
};

/** Ponto colorido por status (chips de filtro ativo). */
export const TEST_CASE_STATUS_DOT_COLOR: Record<TestCase['status'], string> = {
  'Not Run': 'bg-[var(--leve-header-text-muted)]',
  Passed: 'bg-success',
  Failed: 'bg-error',
  Blocked: 'bg-warning',
};

/** Realce do total — usa o accent (laranja) do projeto. */
export const TEST_CASE_TOTAL_BADGE_TONE =
  'bg-[color-mix(in_srgb,var(--leve-header-accent)_16%,transparent)] text-[var(--leve-header-accent)]';
