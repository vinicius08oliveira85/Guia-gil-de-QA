/**
 * cn
 * Helper simples para combinar classes condicionalmente, sem dependências externas.
 */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
