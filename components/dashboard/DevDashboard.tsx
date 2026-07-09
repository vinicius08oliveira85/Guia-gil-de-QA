import React, { useMemo, useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { Project } from '../../types';
import { useProjectsStore } from '../../store/projectsStore';
import { useDashboardMetrics } from '../../hooks/useDashboardMetrics';
import { DevStackConfigPanel } from '../project/DevStackConfigPanel';
import { ProjectDevAnalysesBoard } from './ProjectDevAnalysesBoard';
import { RecentActivity } from './RecentActivity';
import { EmptyState } from '../common/EmptyState';
import { generateAndAppendDevProjectAnalysis } from '../../services/ai/projectDevFullAnalysisService';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { toToastableAiError } from '../../utils/aiErrorMapper';
import { GlassIndicatorCards, type SmallIndicatorItem } from './GlassIndicatorCards';
import { Code2, ListTodo, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import { cn } from '../../utils/cn';
import {
  dashboardHeroChromeClass,
  dashboardHeroShellClass,
  dashboardMainStackClass,
  dashboardNeuScopeClass,
  dashboardEyebrowClass,
  dashboardHeroTitleClass,
  dashboardHeroSubtitleClass,
  dashboardHeroMutedClass,
  dashboardHeroJiraBadgeClass,
} from './dashboardNeuUi';

export interface DevDashboardProps {
  project: Project;
  onUpdateProject?: (project: Project) => void;
  onNavigateToTab?: (tabId: string) => void;
  syncLoading?: boolean;
  syncError?: Error | null;
}

export const DevDashboard: React.FC<DevDashboardProps> = ({
  project,
  onUpdateProject,
  onNavigateToTab,
  syncLoading,
  syncError,
}) => {
  const { projects, selectedProjectId, isLoading, error } = useProjectsStore();
  const { handleError, handleSuccess } = useErrorHandler();
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState(false);

  const showLoadingBanner = syncLoading !== undefined ? syncLoading : isLoading;
  const displayError = syncError !== undefined ? syncError : error;

  const liveProject = useMemo(() => {
    const fromStore = projects.find(p => p.id === selectedProjectId);
    if (fromStore && fromStore.id === project.id) return fromStore;
    return project;
  }, [projects, selectedProjectId, project]);

  const dashboardMetrics = useDashboardMetrics(liveProject);
  const tasks = liveProject.tasks ?? [];
  const withGuidance = tasks.filter(t => t.devGuidance).length;
  const doneTasks = tasks.filter(t => t.status === 'Done').length;

  const lastUpdatedText = useMemo(() => {
    const date = liveProject.updatedAt || liveProject.createdAt;
    if (!date) return null;
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
    } catch {
      return null;
    }
  }, [liveProject.updatedAt, liveProject.createdAt]);

  const indicatorItems: SmallIndicatorItem[] = [
    {
      label: 'Tarefas',
      value: tasks.length,
      modifier: 'no escopo',
      icon: ListTodo,
      colorTheme: 'primary',
      onClick: onNavigateToTab ? () => onNavigateToTab('tasks') : undefined,
    },
    {
      label: 'Concluídas',
      value: doneTasks,
      modifier: tasks.length > 0 ? `${Math.round((doneTasks / tasks.length) * 100)}%` : '0%',
      icon: CheckCircle2,
      colorTheme: 'success',
    },
    {
      label: 'Com guia IA',
      value: withGuidance,
      modifier: 'tarefas com guia',
      icon: Sparkles,
      colorTheme: 'info',
      onClick: onNavigateToTab ? () => onNavigateToTab('tasks') : undefined,
    },
    {
      label: 'Documentos',
      value: liveProject.documents?.length ?? 0,
      modifier: 'anexos',
      icon: FileText,
      colorTheme: 'neutral',
      onClick: onNavigateToTab ? () => onNavigateToTab('documents') : undefined,
    },
  ];

  const handleGenerateAnalysis = useCallback(async () => {
    if (!onUpdateProject) return;
    setIsGeneratingAnalysis(true);
    try {
      const { project: updated } = await generateAndAppendDevProjectAnalysis(liveProject);
      await onUpdateProject(updated);
      handleSuccess('Análise Dev do projeto gerada.');
    } catch (err) {
      handleError(toToastableAiError(err), 'Análise Dev');
    } finally {
      setIsGeneratingAnalysis(false);
    }
  }, [liveProject, onUpdateProject, handleSuccess, handleError]);

  const jiraKey = liveProject.settings?.jiraProjectKey;

  return (
    <div className={dashboardNeuScopeClass}>
      <div className={dashboardMainStackClass}>
        {displayError ? (
          <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {displayError.message}
          </div>
        ) : null}

        <div className={dashboardHeroShellClass}>
          <div className={dashboardHeroChromeClass}>
            <span className={dashboardEyebrowClass}>
              <Code2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Projeto Dev · Implementação
            </span>
            <div className="mb-1.5 mt-2.5 flex flex-wrap items-center gap-2">
              <h1 className={dashboardHeroTitleClass}>Dashboard Dev</h1>
              {jiraKey ? (
                <span className={dashboardHeroJiraBadgeClass}>Jira · {jiraKey}</span>
              ) : null}
            </div>
            <p className={dashboardHeroSubtitleClass}>
              Stack, tarefas e guias de implementação com IA alinhados ao seu projeto.
            </p>
            {lastUpdatedText ? (
              <p className={cn(dashboardHeroMutedClass, 'mt-1 text-xs')}>
                Projeto atualizado {lastUpdatedText}
              </p>
            ) : null}

            <section className="mt-4" aria-label="Indicadores do projeto Dev">
              <GlassIndicatorCards items={indicatorItems} columns={4} />
            </section>
          </div>
        </div>

        {onUpdateProject ? (
          <DevStackConfigPanel project={liveProject} onUpdateProject={onUpdateProject} />
        ) : null}

        <ProjectDevAnalysesBoard
          analyses={liveProject.devProjectFullAnalyses ?? []}
          onGenerateAnalysis={onUpdateProject ? handleGenerateAnalysis : undefined}
          isGenerating={isGeneratingAnalysis}
        />

        {!showLoadingBanner && dashboardMetrics.totalTasks === 0 ? (
          <EmptyState
            compact
            title="Nenhuma tarefa no projeto"
            description="Importe do Jira ou crie tarefas na aba Tarefas & Implementação."
            icon="🛠️"
            secondaryAction={
              onNavigateToTab
                ? { label: 'Ir para Tarefas', onClick: () => onNavigateToTab('tasks') }
                : undefined
            }
          />
        ) : null}

        <RecentActivity project={liveProject} onViewAll={onNavigateToTab ? () => onNavigateToTab('tasks') : undefined} />
      </div>
    </div>
  );
};

DevDashboard.displayName = 'DevDashboard';
