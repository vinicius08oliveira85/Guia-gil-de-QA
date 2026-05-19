import React from 'react';
import type { Project } from '../../types';
import type { TaskWorkflowBuckets } from '../../utils/workspaceAnalytics';
import { WorkspaceAlertsPanel } from './WorkspaceAlertsPanel';
import { ConsolidatedMetrics } from '../common/ConsolidatedMetrics';
import { TaskStatusDistributionBar } from './TaskStatusDistributionBar';
import { cn } from '../../utils/cn';

export interface ProjectsDashboardSidebarProps {
  projects: Project[];
  healthProjects: Project[];
  testExecutionAlertProjects: Project[];
  taskWorkflowBuckets: TaskWorkflowBuckets;
  onSelectProject: (id: string) => void;
  listFilterNeedsAttention: boolean;
  onToggleListFilterNeedsAttention: () => void;
  showAlerts: boolean;
  className?: string;
}

/**
 * Coluna lateral do dashboard: alertas de saúde + métricas globais.
 */
export const ProjectsDashboardSidebar: React.FC<ProjectsDashboardSidebarProps> = ({
  projects,
  healthProjects,
  testExecutionAlertProjects,
  taskWorkflowBuckets,
  onSelectProject,
  listFilterNeedsAttention,
  onToggleListFilterNeedsAttention,
  showAlerts,
  className,
}) => (
  <aside
    className={cn('flex min-w-0 flex-col gap-4 lg:sticky lg:top-[calc(var(--app-header-sticky-offset)+0.75rem)] lg:self-start', className)}
    aria-label="Painel lateral do workspace"
  >
    {showAlerts && (
      <WorkspaceAlertsPanel
        healthProjects={healthProjects}
        testExecutionAlertProjects={testExecutionAlertProjects}
        onSelectProject={onSelectProject}
        listFilterNeedsAttention={listFilterNeedsAttention}
        onToggleListFilterNeedsAttention={onToggleListFilterNeedsAttention}
      />
    )}
    <div className="flex flex-col gap-3 rounded-[var(--rounded-box)] border border-base-300/65 bg-base-100 p-3 soft-shadow ring-1 ring-base-content/[0.03] sm:p-4">
      <ConsolidatedMetrics projects={projects} variant="embedded" />
      <TaskStatusDistributionBar
        buckets={taskWorkflowBuckets}
        variant="embedded"
        className="border-0 bg-transparent p-0 shadow-none ring-0"
      />
    </div>
  </aside>
);
