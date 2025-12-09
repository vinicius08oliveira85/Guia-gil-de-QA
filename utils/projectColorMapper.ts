import { Project } from '../types';

/**
 * Cores disponíveis para o GlowCard
 */
export type GlowColor = 'blue' | 'purple' | 'green' | 'red' | 'orange';

/**
 * Mapeamento manual de tags para cores do GlowCard
 */
const TAG_TO_COLOR_MAP: Record<string, GlowColor> = {
  // API e Backend
  'api': 'purple',
  'backend': 'red',
  
  // Frontend e Web
  'web': 'blue',
  'frontend': 'blue',
  
  // Mobile
  'mobile': 'green',
  
  // Testes
  'e2e': 'orange',
  'automação': 'orange',
  'automation': 'orange',
  
  // Jira (quando há jiraProjectKey, será tratado separadamente)
};

/**
 * Determina a cor do GlowCard baseada nas tags do projeto
 * 
 * @param project - Projeto do qual extrair a cor
 * @returns Cor do GlowCard baseada nas tags ou fallback
 * 
 * @example
 * ```ts
 * const color = getGlowColorForProject(project);
 * <GlowCard glowColor={color}>...</GlowCard>
 * ```
 */
export const getGlowColorForProject = (project: Project): GlowColor => {
  // Se o projeto tem jiraProjectKey, prioriza blue
  if (project.settings?.jiraProjectKey) {
    return 'blue';
  }

  // Busca nas tags do projeto
  const tags = project.tags || [];
  
  // Procura a primeira tag que tenha mapeamento
  for (const tag of tags) {
    const normalizedTag = tag.toLowerCase().trim();
    const color = TAG_TO_COLOR_MAP[normalizedTag];
    if (color) {
      return color;
    }
  }

  // Fallback: cor padrão
  return 'blue';
};

