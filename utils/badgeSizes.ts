/**
 * Escala de tamanhos compartilhada entre Badge, TestTypeBadge, StatusBadge e VersionBadge.
 * Centraliza os valores de padding, tipografia e ícone para garantir consistência visual.
 */

export const BADGE_SIZE_CLASSES = {
  xs: 'px-2 py-0.5 text-[10px]',
  sm: 'px-2.5 py-0.5 text-xs',
  md: 'px-3 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
} as const;

export const BADGE_ICON_SIZES = {
  xs: 'h-2.5 w-2.5',
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
  lg: 'h-4 w-4',
} as const;

export type BadgeSize = keyof typeof BADGE_SIZE_CLASSES;
