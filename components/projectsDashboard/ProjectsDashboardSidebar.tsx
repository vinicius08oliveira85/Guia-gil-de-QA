import React from 'react';
import type { Project } from '../../types';
import type { TaskWorkflowBuckets } from '../../utils/workspaceAnalytics';
import { WorkspaceAlertsPanel } from './WorkspaceAlertsPanel';
import { ConsolidatedMetrics } from '../common/ConsolidatedMetrics';
import { TaskStatusDistributionBar } from './TaskStatusDistributionBar';
import { workspacePanelShellClass } from '../common/projectCardUi';
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
    <div className={cn(workspacePanelShellClass, 'gap-0 p-3 sm:p-3.5')}>
      <ConsolidatedMetrics projects={projects} variant="embedded" />
      <TaskStatusDistributionBar buckets={taskWorkflowBuckets} variant="embedded" />
    </div>
  </aside>
);
