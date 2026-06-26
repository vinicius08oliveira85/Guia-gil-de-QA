import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LANDING_SECTIONS } from '../landing/landingSections';
import { cn } from '../../utils/cn';
import type { JiraTask } from '../../types';
import { type JiraFilasFilter } from '../../utils/jiraFilasMetrics';
import {
  FILAS_PROJECT_STORAGE_KEY,
  FILAS_SLA_RISK_WINDOW_STORAGE_KEY,
  FILAS_TASKS_STORAGE_KEY,
  readTaskTrackingSnapshot,
  TASK_TRACKING_RESTORED_EVENT,
} from '../../services/taskTrackingStorage';
import { projectsListShell } from '../common/viewUi';
import { Breadcrumbs, type BreadcrumbItem } from '../common/Breadcrumbs';
import { JiraFilasPanel } from './JiraFilasPanel';
import { JiraFilasDashboardPanel } from './JiraFilasDashboardPanel';
import {
  projectChromeBreadcrumbsClass,
  projectChromeHeaderInnerClass,
  projectChromeHeaderShellClass,
  projectChromeTabActiveClass,
  projectChromeTabIdleClass,
  projectChromeTabsDividerClass,
  projectChromeTabsNavClass,
  projectChromeTabsRowClass,
} from '../tasks/tasksPanelNeuStyles';

type JiraSolusTab = 'dashboard' | 'filas';

const TABS: { id: JiraSolusTab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'filas', label: 'Filas (Jira)' },
];

function applySnapshotToState(
  snapshot: ReturnType<typeof readTaskTrackingSnapshot>,
  setters: {
    setTasks: React.Dispatch<React.SetStateAction<JiraTask[]>>;
    setSelectedProjectKey: React.Dispatch<React.SetStateAction<string>>;
    setSlaRiskWindowHours: React.Dispatch<React.SetStateAction<number>>;
  }
): void {
  setters.setTasks(snapshot.tasks);
  setters.setSelectedProjectKey(snapshot.selectedProjectKey);
  setters.setSlaRiskWindowHours(snapshot.slaRiskWindowHours);
}

/**
 * Tela Acompanhamento de Tarefas — abas Dashboard (indicadores de SLA/Status) e
 * Filas (Jira). O estado das tarefas é compartilhado entre as abas.
 */
export const JiraSolusView = React.memo(() => {
  const [activeTab, setActiveTab] = useState<JiraSolusTab>('dashboard');

  const initialSnapshot = useMemo(() => readTaskTrackingSnapshot(), []);
  const [tasks, setTasks] = useState<JiraTask[]>(() => initialSnapshot.tasks);
  const [selectedProjectKey, setSelectedProjectKey] = useState(
    () => initialSnapshot.selectedProjectKey
  );
  const [jiraStatuses, setJiraStatuses] = useState<Array<{ name: string; color: string }>>([]);
  const [slaRiskWindowHours, setSlaRiskWindowHours] = useState(
    () => initialSnapshot.slaRiskWindowHours
  );
  const [activeFilter, setActiveFilter] = useState<JiraFilasFilter>({ kind: 'all' });

  useEffect(() => {
    const handleRestored = () => {
      applySnapshotToState(readTaskTrackingSnapshot(), {
        setTasks,
        setSelectedProjectKey,
        setSlaRiskWindowHours,
      });
    };
    window.addEventListener(TASK_TRACKING_RESTORED_EVENT, handleRestored);
    return () => window.removeEventListener(TASK_TRACKING_RESTORED_EVENT, handleRestored);
  }, []);

  useEffect(() => {
    try {
      if (selectedProjectKey) {
        sessionStorage.setItem(FILAS_PROJECT_STORAGE_KEY, selectedProjectKey);
      } else {
        sessionStorage.removeItem(FILAS_PROJECT_STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, [selectedProjectKey]);

  useEffect(() => {
    try {
      localStorage.setItem(FILAS_TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      /* ignore */
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(FILAS_SLA_RISK_WINDOW_STORAGE_KEY, String(slaRiskWindowHours));
    } catch {
      /* ignore */
    }
  }, [slaRiskWindowHours]);

  const handleApplyFilter = useCallback((filter: JiraFilasFilter) => {
    setActiveFilter(filter);
    setActiveTab('filas');
  }, []);

  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const index = TABS.findIndex(t => t.id === activeTab);
      if (index < 0) return;
      let nextIndex = index;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = (index + 1) % TABS.length;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = (index - 1 + TABS.length) % TABS.length;
      } else if (e.key === 'Home') {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === 'End') {
        e.preventDefault();
        nextIndex = TABS.length - 1;
      } else return;
      if (nextIndex !== index) setActiveTab(TABS[nextIndex].id);
    },
    [activeTab]
  );

  const breadcrumbItems = useMemo((): BreadcrumbItem[] => {
    const items: BreadcrumbItem[] = [
      {
        label: LANDING_SECTIONS.jiraSolus.title,
        onClick: activeTab !== 'dashboard' ? () => setActiveTab('dashboard') : undefined,
      },
    ];
    const activeLabel = TABS.find(t => t.id === activeTab)?.label;
    if (activeLabel && activeTab !== 'dashboard') {
      items.push({ label: activeLabel });
    }
    return items;
  }, [activeTab]);

  return (
    <div className={projectsListShell}>
      <div className={projectChromeHeaderShellClass}>
        <div className={cn('flex min-w-0 flex-col gap-1', projectChromeHeaderInnerClass)}>
          <div className="project-chrome-header-row flex min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-1 max-md:flex-nowrap max-md:items-center max-md:gap-1 max-md:gap-y-0">
            <div className="min-w-0 max-w-full flex-1 overflow-x-auto max-md:overflow-hidden sm:overflow-visible">
              <Breadcrumbs
                items={breadcrumbItems}
                showHome={false}
                align="left"
                dense
                className={cn(projectChromeBreadcrumbsClass, 'w-full min-w-0 max-w-full')}
              />
            </div>
          </div>
        </div>
        <div className={projectChromeTabsDividerClass}>
          <div className={projectChromeTabsRowClass}>
            <nav
              className={projectChromeTabsNavClass}
              aria-label="Seções de Acompanhamento de Tarefas"
              role="tablist"
              aria-orientation="horizontal"
              onKeyDown={handleTabKeyDown}
            >
              {TABS.map(tab => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={isActive ? projectChromeTabActiveClass : projectChromeTabIdleClass}
                    id={`jira-solus-tab-${tab.id}`}
                    role="tab"
                    tabIndex={isActive ? 0 : -1}
                    aria-selected={isActive}
                    aria-controls={`jira-solus-panel-${tab.id}`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      <div
        id="jira-solus-panel-dashboard"
        role="tabpanel"
        aria-labelledby="jira-solus-tab-dashboard"
        hidden={activeTab !== 'dashboard'}
      >
        {activeTab === 'dashboard' && (
          <JiraFilasDashboardPanel
            tasks={tasks}
            selectedProjectKey={selectedProjectKey}
            slaRiskWindowHours={slaRiskWindowHours}
            onSlaRiskWindowHoursChange={setSlaRiskWindowHours}
            activeFilter={activeFilter}
            onApplyFilter={handleApplyFilter}
          />
        )}
      </div>
      <div
        id="jira-solus-panel-filas"
        role="tabpanel"
        aria-labelledby="jira-solus-tab-filas"
        hidden={activeTab !== 'filas'}
      >
        {activeTab === 'filas' && (
          <JiraFilasPanel
            tasks={tasks}
            setTasks={setTasks}
            selectedProjectKey={selectedProjectKey}
            setSelectedProjectKey={setSelectedProjectKey}
            jiraStatuses={jiraStatuses}
            setJiraStatuses={setJiraStatuses}
            activeFilter={activeFilter}
            onClearFilter={() => setActiveFilter({ kind: 'all' })}
            slaRiskWindowHours={slaRiskWindowHours}
          />
        )}
      </div>
    </div>
  );
});

JiraSolusView.displayName = 'JiraSolusView';
