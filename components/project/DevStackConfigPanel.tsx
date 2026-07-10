import React, { useCallback, useMemo } from 'react';
import type { DevStackConfig, Project } from '../../types';
import {
  DEV_STACK_PRESETS,
  EMPTY_DEV_STACK,
  normalizeDevStackConfig,
} from '../../utils/devStackPresets';
import { formatDevStackSummary } from '../../utils/devStackFormat';
import { useProjectsStore } from '../../store/projectsStore';
import { cn } from '../../utils/cn';
import { dashboardPanelClass } from '../dashboard/dashboardNeuUi';
import { AppSelect } from '../common/AppSelect';

export interface DevStackConfigPanelProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  className?: string;
}

function toggleItem(list: string[], value: string): string[] {
  const v = value.trim();
  if (!v) return list;
  return list.includes(v) ? list.filter(x => x !== v) : [...list, v];
}

const SUGGESTED_LANGUAGES = ['TypeScript', 'JavaScript', 'Python', 'Java', 'C#', 'Go'];
const SUGGESTED_FRAMEWORKS = ['React', 'Vite', 'NestJS', 'FastAPI', 'Next.js', 'Express'];
const SUGGESTED_DATABASES = ['PostgreSQL', 'MySQL', 'MongoDB', 'Supabase', 'Redis'];
const SUGGESTED_TOOLS = ['Cursor AI', 'Docker', 'Prisma', 'ESLint', 'Vitest', 'Jest', 'GitHub Actions'];

function ChipGroup({
  label,
  items,
  selected,
  onToggle,
}: {
  label: string;
  items: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-base-content/70">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {items.map(item => {
          const active = selected.includes(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => onToggle(item)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                active
                  ? 'border-primary/40 bg-primary/15 text-primary'
                  : 'border-base-300 bg-base-100 text-base-content/80 hover:border-primary/30'
              )}
              aria-pressed={active}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export const DevStackConfigPanel: React.FC<DevStackConfigPanelProps> = ({
  project,
  onUpdateProject,
  className,
}) => {
  const stack = useMemo(
    () => normalizeDevStackConfig(project.settings?.devStack),
    [project.settings?.devStack]
  );

  const persist = useCallback(
    (next: DevStackConfig) => {
      const latest =
        useProjectsStore.getState().projects.find(p => p.id === project.id) ?? project;
      onUpdateProject({
        ...latest,
        settings: {
          ...latest.settings,
          devStack: next,
        },
      });
    },
    [project.id, onUpdateProject]
  );

  const applyPreset = useCallback(
    (presetId: string) => {
      const preset = DEV_STACK_PRESETS.find(p => p.id === presetId);
      if (!preset) return;
      persist(normalizeDevStackConfig(preset.config));
    },
    [persist]
  );

  const updateField = useCallback(
    (patch: Partial<DevStackConfig>) => {
      persist({ ...stack, ...patch });
    },
    [stack, persist]
  );

  return (
    <section className={cn(dashboardPanelClass, className)} aria-labelledby="dev-stack-heading">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="dev-stack-heading" className="text-lg font-bold text-base-content">
            Stack do projeto
          </h2>
          <p className="text-sm text-base-content/70">
            A IA usa esta configuração para orientar a implementação via{' '}
            <strong className="font-semibold">Cursor AI (Agente)</strong>. {formatDevStackSummary(stack)}
          </p>
        </div>
        <div className="mt-2 sm:mt-0 sm:min-w-[14rem]">
          <label htmlFor="dev-stack-preset" className="sr-only">
            Aplicar preset de stack
          </label>
          <AppSelect
            id="dev-stack-preset"
            value=""
            onChange={value => {
              if (value) applyPreset(value);
            }}
            className="w-full text-sm"
          >
            <option value="">Aplicar preset…</option>
            {DEV_STACK_PRESETS.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </AppSelect>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChipGroup
          label="Linguagens"
          items={SUGGESTED_LANGUAGES}
          selected={stack.languages}
          onToggle={v => updateField({ languages: toggleItem(stack.languages, v) })}
        />
        <ChipGroup
          label="Frameworks"
          items={SUGGESTED_FRAMEWORKS}
          selected={stack.frameworks}
          onToggle={v => updateField({ frameworks: toggleItem(stack.frameworks, v) })}
        />
        <ChipGroup
          label="Bancos de dados"
          items={SUGGESTED_DATABASES}
          selected={stack.databases}
          onToggle={v => updateField({ databases: toggleItem(stack.databases, v) })}
        />
        <ChipGroup
          label="Ferramentas"
          items={SUGGESTED_TOOLS}
          selected={stack.tools}
          onToggle={v => updateField({ tools: toggleItem(stack.tools, v) })}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-base-content/80">Estilo de arquitetura</span>
          <input
            type="text"
            value={stack.architectureStyle ?? ''}
            onChange={e => updateField({ architectureStyle: e.target.value })}
            className="input input-bordered input-sm w-full"
            placeholder="Ex.: Clean Architecture, MVC…"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium text-base-content/80">Abordagem de testes</span>
          <input
            type="text"
            value={stack.testingApproach ?? ''}
            onChange={e => updateField({ testingApproach: e.target.value })}
            className="input input-bordered input-sm w-full"
            placeholder="Ex.: TDD com Vitest…"
          />
        </label>
      </div>

      <label className="mt-3 block space-y-1 text-sm">
        <span className="font-medium text-base-content/80">Notas adicionais</span>
        <textarea
          value={stack.notes ?? ''}
          onChange={e => updateField({ notes: e.target.value })}
          className="textarea textarea-bordered min-h-[4.5rem] w-full text-sm"
          placeholder="Convenções do time, padrões de pasta, CI/CD…"
        />
      </label>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="btn btn-ghost btn-xs"
          onClick={() => persist({ ...EMPTY_DEV_STACK })}
        >
          Limpar stack
        </button>
      </div>
    </section>
  );
};

DevStackConfigPanel.displayName = 'DevStackConfigPanel';
