import React from 'react';
import { Link } from 'react-router-dom';
import { FolderKanban, ArrowRight } from 'lucide-react';
import type { Project } from '../../types';
import {
  formatProjectActivityLabel,
  getLastOpenedProjectIds,
} from '../../utils/landingRecentProjects';
import { projectCardIconWrapClass } from '../common/projectCardUi';
import {
  landingAccentTextClass,
  landingTextMutedClass,
  landingTextStrongClass,
} from './landingNeuUi';
import { cn } from '../../utils/cn';

export interface LandingRecentProjectsProps {
  projects: Project[];
}

/**
 * Lista compacta de projetos recentes na home (“Continuar”).
 */
export const LandingRecentProjects = React.memo<LandingRecentProjectsProps>(({ projects }) => {
  if (projects.length === 0) return null;

  const lastOpenedIds = new Set(getLastOpenedProjectIds());

  return (
    <section className="w-full text-left" aria-labelledby="landing-continue-heading">
      <div className="mb-3 flex items-end justify-between gap-2">
        <h2
          id="landing-continue-heading"
          className={cn(
            'text-sm font-bold uppercase tracking-wide',
            landingTextStrongClass
          )}
        >
          Continuar
        </h2>
        <Link
          to="/projects"
          className={cn(
            'text-xs font-semibold underline-offset-2 hover:underline',
            landingAccentTextClass,
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--project-card-accent)]'
          )}
        >
          Ver todos
        </Link>
      </div>
      <ul className="grid w-full grid-cols-1 gap-2.5 sm:grid-cols-3" role="list">
        {projects.map(project => {
          const wasLastOpened = lastOpenedIds.has(project.id);
          return (
            <li key={project.id}>
              <Link
                to={`/projects/${project.id}`}
                aria-label={`Abrir projeto ${project.name}`}
                className={cn(
                  'app-surface group flex h-full items-start gap-3 rounded-[calc(var(--project-card-radius)-4px)] p-3.5 text-left no-underline',
                  'transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--project-card-accent)]',
                  'motion-reduce:transform-none'
                )}
              >
                <div className={cn(projectCardIconWrapClass, 'h-9 w-9 sm:h-9 sm:w-9')} aria-hidden>
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
                    'mt-1 h-4 w-4 shrink-0 opacity-80 transition-transform duration-200 group-hover:translate-x-0.5',
                    landingAccentTextClass
                  )}
                  aria-hidden
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
});

LandingRecentProjects.displayName = 'LandingRecentProjects';
