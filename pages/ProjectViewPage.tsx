import React, { Suspense, useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Project } from '../types';
import { useProjectsStore } from '../store/projectsStore';
import { recordLastOpenedProject } from '../utils/landingRecentProjects';
import { lazyWithRetry } from '../utils/lazyWithRetry';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ProjectsDashboardSkeleton } from '../components/projectsDashboard/ProjectsDashboardSkeleton';
import { appContentPaddingX } from '../components/common/viewUi';
import { cn } from '../utils/cn';

const ProjectView = lazyWithRetry(() =>
  import('../components/ProjectView').then(m => ({ default: m.ProjectView }))
);

export interface ProjectViewPageProps {
  onUpdateProject: (project: Project) => Promise<void>;
  onDeleteProject: (projectId: string) => Promise<void>;
}

/**
 * Rota `/projects/:id` — resolve o projeto na store e renderiza {@link ProjectView}.
 */
export const ProjectViewPage: React.FC<ProjectViewPageProps> = ({
  onUpdateProject,
  onDeleteProject,
}) => {
  const { id } = useParams<{ id: string }>();
  const isLoading = useProjectsStore(s => s.isLoading);
  const project = useProjectsStore(s => s.projects.find(p => p.id === id));

  useEffect(() => {
    if (id && project) {
      recordLastOpenedProject(id);
    }
  }, [id, project]);

  if (isLoading) {
    return <ProjectsDashboardSkeleton />;
  }

  if (!id || !project) {
    return <Navigate to="/projects/qa" replace />;
  }

  return (
    <Suspense
      fallback={
        <div className={cn('w-full min-w-0 max-w-none py-4 sm:py-6', appContentPaddingX)}>
          <LoadingSkeleton variant="card" count={3} />
        </div>
      }
    >
      <ProjectView
        project={project}
        onUpdateProject={onUpdateProject}
        onDeleteProject={onDeleteProject}
      />
    </Suspense>
  );
};
