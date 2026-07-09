import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, Code2, ArrowRight } from 'lucide-react';
import type { Project } from '../../types';
import {
  formatProjectActivityLabel,
  getLastOpenedProjectIds,
} from '../../utils/landingRecentProjects';
import { normalizeProjectWorkflow } from '../../utils/projectWorkflow';
import {
  landingAccentTextClass,
  landingNeuAccentBarClass,
  landingNeuIconPlateClass,
  landingNeuLinkBtnClass,
  landingNeuListClass,
  landingNeuOrbCtaClass,
  landingNeuOrbHighlightClass,
  landingNeuPanelBodyClass,
  landingNeuPanelClass,
  landingNeuPanelCompactClass,
  landingNeuRowClass,
  landingNeuRowCompactClass,
  landingNeuSectionHeaderClass,
  landingNeuSectionLabelClass,
  landingTextMutedClass,
  landingTextStrongClass,
  landingWorkflowBadgeClass,
} from './landingNeuUi';
import { cn } from '../../utils/cn';

export interface LandingRecentProjectsProps {
  projects: Project[];
  /** `stack` para coluna lateral; `grid` para faixa horizontal. */
  layout?: 'grid' | 'stack';
  /** Limite de projetos exibidos (default: todos recebidos). */
  limit?: number;
  /** Reduz padding e tipografia do painel. */
  compact?: boolean;
}

/**
 * Lista compacta de projetos recentes na home (“Continuar”).
 */
export const LandingRecentProjects = React.memo<LandingRecentProjectsProps>(
  ({ projects, layout = 'grid', limit, compact = false }) => {
    const visibleProjects = useMemo(
      () => (limit != null ? projects.slice(0, limit) : projects),
      [projects, limit]
    );

    if (visibleProjects.length === 0) return null;

    const lastOpenedIds = new Set(getLastOpenedProjectIds());
    const panelClass = compact ? landingNeuPanelCompactClass : landingNeuPanelClass;
    const bodyGapClass = compact ? 'gap-2.5 sm:gap-3' : 'gap-4 sm:gap-5';
    const headerClass = compact ? 'pb-2 sm:pb-2.5' : undefined;
    const rowClass = compact ? landingNeuRowCompactClass : landingNeuRowClass;

    return (
      <section
        className={cn(panelClass, 'group h-full self-start')}
        aria-labelledby="landing-continue-heading"
      >
        <div className={landingNeuAccentBarClass} aria-hidden />
        <div className={landingNeuOrbCtaClass} aria-hidden />
        <div className={landingNeuOrbHighlightClass} aria-hidden />

        <div className={cn(landingNeuPanelBodyClass, bodyGapClass)}>
          <div className={cn(landingNeuSectionHeaderClass, headerClass)}>
            <h2 id="landing-continue-heading" className={landingNeuSectionLabelClass}>
              Continuar
            </h2>
            <Link to="/projects" className={landingNeuLinkBtnClass} aria-label="Ver todos os projetos">
              Ver todos
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>

          <ul
            className={cn(
              landingNeuListClass,
              'max-h-none space-y-1.5',
              compact && 'space-y-1',
              layout === 'stack' ? 'grid-cols-1' : 'sm:max-h-[min(18rem,45vh)]'
            )}
            role="list"
          >
            {visibleProjects.map(project => {
              const wasLastOpened = lastOpenedIds.has(project.id);
              const workflow = normalizeProjectWorkflow(project.workflow);
              const isDev = workflow === 'dev';
              const WorkflowIcon = isDev ? Code2 : LayoutGrid;
              const iconToneClass = isDev ? 'text-info' : landingAccentTextClass;

              return (
                <li key={project.id}>
                  <Link
                    to={`/projects/${project.id}`}
                    aria-label={`Abrir projeto ${isDev ? 'Dev' : 'QA'} ${project.name}`}
                    className={cn(rowClass, 'no-underline')}
                  >
                    <div
                      className={cn(
                        landingNeuIconPlateClass,
                        compact && 'h-8 w-8 shrink-0',
                        isDev && 'border-info/20 bg-info/5'
                      )}
                      aria-hidden
                    >
                      <WorkflowIcon className={cn('h-3.5 w-3.5', iconToneClass)} aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span
                          className={landingWorkflowBadgeClass(workflow)}
                          aria-label={isDev ? 'Projeto Dev' : 'Projeto QA'}
                        >
                          {isDev ? 'Dev' : 'QA'}
                        </span>
                        <p
                          className={cn(
                            'min-w-0 truncate text-sm font-semibold',
                            landingTextStrongClass,
                            'group-hover:text-[var(--project-card-accent)]'
                          )}
                        >
                          {project.name}
                        </p>
                      </div>
                      <p className={cn('mt-0.5 truncate text-[0.6875rem] sm:text-xs', landingTextMutedClass)}>
                        {formatProjectActivityLabel(project, { wasLastOpened })}
                        {' · '}
                        {project.tasks?.length ?? 0} task(s)
                      </p>
                    </div>
                    <ArrowRight
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 opacity-80 transition-transform duration-200 group-hover:translate-x-0.5',
                        iconToneClass
                      )}
                      aria-hidden
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    );
  }
);

LandingRecentProjects.displayName = 'LandingRecentProjects';
