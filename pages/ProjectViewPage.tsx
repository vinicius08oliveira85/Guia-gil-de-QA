import React, { Suspense } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Project } from '../types';
import { useProjectsStore } from '../store/projectsStore';
import { lazyWithRetry } from '../utils/lazyWithRetry';
import { LoadingSkeleton } from '../components/common/LoadingSkeleton';
import { ProjectsDashboardSkeleton } from '../components/projectsDashboard/ProjectsDashboardSkeleton';

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

  if (isLoading) {
    return <ProjectsDashboardSkeleton />;
  }

  if (!id || !project) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-4 sm:p-6">
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
