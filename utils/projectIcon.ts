import type { LucideIcon } from 'lucide-react';
import {
  Layout,
  Globe,
  Smartphone,
  Plug,
  RefreshCw,
  Gauge,
  Shield,
  Stethoscope,
  Link2,
  FlaskConical,
  Building2,
} from 'lucide-react';
import type { Project } from '../types';

export type ProjectIconKind =
  | 'general'
  | 'web'
  | 'mobile'
  | 'api'
  | 'e2e'
  | 'performance'
  | 'security'
  | 'health'
  | 'jira'
  | 'enterprise';

export interface ProjectIconMeta {
  icon: LucideIcon;
  kind: ProjectIconKind;
  /** Rótulo curto para leitores de tela no ícone do card */
  label: string;
  containerClassName: string;
  iconClassName: string;
}

const KIND_META: Record<
  ProjectIconKind,
  Pick<ProjectIconMeta, 'icon' | 'kind' | 'label' | 'containerClassName' | 'iconClassName'>
> = {
  general: {
    icon: Layout,
    kind: 'general',
    label: 'Projeto geral',
    containerClassName: 'bg-base-200/80 text-primary ring-base-300/50',
    iconClassName: 'text-primary',
  },
  web: {
    icon: Globe,
    kind: 'web',
    label: 'Projeto web',
    containerClassName: 'bg-info/10 text-info ring-info/20',
    iconClassName: 'text-info',
  },
  mobile: {
    icon: Smartphone,
    kind: 'mobile',
    label: 'Projeto mobile',
    containerClassName: 'bg-secondary/15 text-secondary ring-secondary/25',
    iconClassName: 'text-secondary',
  },
  api: {
    icon: Plug,
    kind: 'api',
    label: 'Projeto API',
    containerClassName: 'bg-accent/30 text-accent-content ring-base-300/40',
    iconClassName: 'text-accent-content',
  },
  e2e: {
    icon: RefreshCw,
    kind: 'e2e',
    label: 'Projeto E2E',
    containerClassName: 'bg-primary/10 text-primary ring-primary/20',
    iconClassName: 'text-primary',
  },
  performance: {
    icon: Gauge,
    kind: 'performance',
    label: 'Projeto performance',
    containerClassName: 'bg-warning/10 text-warning ring-warning/25',
    iconClassName: 'text-warning',
  },
  security: {
    icon: Shield,
    kind: 'security',
    label: 'Projeto segurança',
    containerClassName: 'bg-error/10 text-error ring-error/20',
    iconClassName: 'text-error',
  },
  health: {
    icon: Stethoscope,
    kind: 'health',
    label: 'Projeto saúde',
    containerClassName:
      'bg-[color-mix(in_srgb,#e11d48_8%,transparent)] text-[#be123c] ring-[color-mix(in_srgb,#e11d48_18%,transparent)]',
    iconClassName: 'text-[#be123c]',
  },
  jira: {
    icon: Link2,
    kind: 'jira',
    label: 'Projeto Jira',
    containerClassName: 'bg-info/10 text-info ring-info/25',
    iconClassName: 'text-info',
  },
  enterprise: {
    icon: Building2,
    kind: 'enterprise',
    label: 'Projeto corporativo',
    containerClassName: 'bg-base-200/90 text-[var(--brand-text-strong)] ring-base-300/55',
    iconClassName: 'text-[var(--brand-text-strong)]',
  },
};

const TAG_KIND_MAP: Record<string, ProjectIconKind> = {
  web: 'web',
  mobile: 'mobile',
  api: 'api',
  e2e: 'e2e',
  performance: 'performance',
  seguranca: 'security',
  segurança: 'security',
  security: 'security',
  saude: 'health',
  saúde: 'health',
  health: 'health',
  jira: 'jira',
  geral: 'general',
  test: 'general',
  qa: 'general',
};

type KeywordRule = { kind: ProjectIconKind; patterns: RegExp[] };

const KEYWORD_RULES: KeywordRule[] = [
  {
    kind: 'health',
    patterns: [
      /\bpacient/,
      /\binternad/,
      /\bhospital/,
      /\bclinic/,
      /\bsaude\b/,
      /\bsaúde\b/,
      /\bmedic/,
      /\benfermag/,
      /\bprontuario/,
      /\bprontuário/,
    ],
  },
  {
    kind: 'mobile',
    patterns: [/\bmobile\b/, /\bandroid\b/, /\bios\b/, /\baplicativo\b/, /\bapp\b/],
  },
  {
    kind: 'api',
    patterns: [/\bapi\b/, /\brest\b/, /\bgraphql\b/, /\bintegrac/, /\bmicrosservic/],
  },
  {
    kind: 'web',
    patterns: [/\bweb\b/, /\bfrontend\b/, /\bportal\b/, /\bsite\b/, /\bnavegador/],
  },
  {
    kind: 'e2e',
    patterns: [/\be2e\b/, /\bend[- ]to[- ]end\b/, /\bfluxo completo/],
  },
  {
    kind: 'performance',
    patterns: [/\bperformance\b/, /\bcarga\b/, /\bstress\b/, /\blatencia/],
  },
  {
    kind: 'security',
    patterns: [/\bseguranc/, /\bpenetration\b/, /\bvulnerabil/],
  },
  {
    kind: 'enterprise',
    patterns: [/\berp\b/, /\bcorporativ/, /\bgestao empresarial/],
  },
];

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

function textBlob(project: Project): string {
  return normalizeText(`${project.name} ${project.description ?? ''}`);
}

function kindFromTags(project: Project): ProjectIconKind | null {
  for (const tag of project.tags ?? []) {
    const key = normalizeText(tag);
    if (TAG_KIND_MAP[key]) return TAG_KIND_MAP[key];
  }
  return null;
}

function kindFromKeywords(project: Project): ProjectIconKind | null {
  const blob = textBlob(project);
  for (const rule of KEYWORD_RULES) {
    if (rule.patterns.some(p => p.test(blob))) return rule.kind;
  }
  return null;
}

/** Heurística leve: tags → palavras-chave → Jira → ícone padrão. */
export function getProjectIconMeta(project: Project): ProjectIconMeta {
  const fromTags = kindFromTags(project);
  if (fromTags) return { ...KIND_META[fromTags] };

  const fromKeywords = kindFromKeywords(project);
  if (fromKeywords) return { ...KIND_META[fromKeywords] };

  if (project.settings?.jiraProjectKey) {
    const blob = textBlob(project);
    const hasTestFocus = /\btest|\bqa\b|\bcaso de teste/.test(blob);
    return { ...(hasTestFocus ? KIND_META.general : KIND_META.jira) };
  }

  const totalTests =
    project.tasks?.reduce((n, t) => n + (t.testCases?.length ?? 0), 0) ?? 0;
  if (totalTests > 0 && (project.tasks?.length ?? 0) <= 3) {
    return { ...KIND_META.general, icon: FlaskConical, label: 'Projeto com foco em testes' };
  }

  return { ...KIND_META.general };
}

export function getProjectIcon(project: Project): LucideIcon {
  return getProjectIconMeta(project).icon;
}
