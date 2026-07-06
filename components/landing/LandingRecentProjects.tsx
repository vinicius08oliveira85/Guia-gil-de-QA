import React from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, ArrowRight } from 'lucide-react';
import type { Project } from '../../types';
import {
  formatProjectActivityLabel,
  getLastOpenedProjectIds,
} from '../../utils/landingRecentProjects';
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
  landingNeuRowClass,
  landingNeuSectionHeaderClass,
  landingNeuSectionLabelClass,
  landingTextMutedClass,
  landingTextStrongClass,
} from './landingNeuUi';
import { cn } from '../../utils/cn';

export interface LandingRecentProjectsProps {
  projects: Project[];
  /** `stack` para coluna lateral; `grid` para faixa horizontal. */
  layout?: 'grid' | 'stack';
}

/**
 * Lista compacta de projetos recentes na home (“Continuar”).
 */
export const LandingRecentProjects = React.memo<LandingRecentProjectsProps>(
  ({ projects, layout = 'grid' }) => {
    if (projects.length === 0) return null;

    const lastOpenedIds = new Set(getLastOpenedProjectIds());

    return (
      <section
        className={cn(landingNeuPanelClass, 'group h-full')}
        aria-labelledby="landing-continue-heading"
      >
        <div className={landingNeuAccentBarClass} aria-hidden />
        <div className={landingNeuOrbCtaClass} aria-hidden />
        <div className={landingNeuOrbHighlightClass} aria-hidden />

        <div className={landingNeuPanelBodyClass}>
          <div className={landingNeuSectionHeaderClass}>
            <h2
              id="landing-continue-heading"
              className={landingNeuSectionLabelClass}
            >
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
              'max-h-none space-y-2',
              layout === 'stack' ? 'grid-cols-1' : 'sm:max-h-[min(18rem,45vh)]'
            )}
            role="list"
          >
            {projects.map(project => {
              const wasLastOpened = lastOpenedIds.has(project.id);
              return (
                <li key={project.id}>
                  <Link
                    to={`/projects/${project.id}`}
                    aria-label={`Abrir projeto ${project.name}`}
                    className={cn(landingNeuRowClass, 'no-underline')}
                  >
                    <div className={landingNeuIconPlateClass} aria-hidden>
                      <FolderKanban
                        className={cn('h-4 w-4', landingAccentTextClass)}
                        aria-hidden
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p
                        className={cn(
                          'truncate text-sm font-semibold',
                          landingTextStrongClass,
                          'group-hover:text-[var(--project-card-accent)]'
                        )}
                      >
                        {project.name}
                      </p>
                      <p className={cn('mt-0.5 truncate text-xs', landingTextMutedClass)}>
                        {formatProjectActivityLabel(project, { wasLastOpened })}
                        {' · '}
                        {project.tasks?.length ?? 0} task(s)
                      </p>
                    </div>
                    <ArrowRight
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0 opacity-80 transition-transform duration-200 group-hover:translate-x-0.5',
                        landingAccentTextClass
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
