/**
 * Paleta semântica do dashboard de qualidade.
 * Mantém o laranja da marca para KPIs “positivos/marca” e
 * diferencia estados com cores distintas para reduzir carga cognitiva.
 */
export const INSIGHT_COLORS = {
  brand: 'var(--project-dashboard-insight-accent)',
  brandSoft: 'color-mix(in srgb, var(--project-dashboard-insight-accent) 55%, white)',
  title: 'var(--project-dashboard-insight-title)',
  text: 'var(--project-dashboard-insight-text)',
  muted: 'var(--project-dashboard-insight-text-muted)',
  track: 'color-mix(in srgb, var(--project-dashboard-insight-text-muted) 28%, transparent)',
  passed: '#0d9488',
  failed: '#e54b4f',
  blocked: '#7c6a9a',
  pending: 'color-mix(in srgb, var(--project-dashboard-insight-text) 28%, transparent)',
  critical: '#e54b4f',
  high: '#ea580c',
  medium: '#ca8a04',
  low: 'color-mix(in srgb, var(--project-dashboard-insight-text) 32%, transparent)',
  todo: 'color-mix(in srgb, var(--project-dashboard-insight-title) 28%, transparent)',
  inProgress: 'color-mix(in srgb, var(--project-dashboard-insight-accent) 55%, white)',
  done: 'var(--project-dashboard-insight-accent)',
  automation: 'var(--project-dashboard-insight-accent)',
  manual: 'color-mix(in srgb, var(--project-dashboard-insight-title) 32%, transparent)',
} as const;

export type InsightTone = 'brand' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';

export const TONE_ACCENT: Record<InsightTone, string> = {
  brand: INSIGHT_COLORS.brand,
  success: INSIGHT_COLORS.passed,
  warning: INSIGHT_COLORS.medium,
  danger: INSIGHT_COLORS.failed,
  neutral: INSIGHT_COLORS.muted,
  info: INSIGHT_COLORS.blocked,
};
