import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import type {
  JiraSolusFixedTabId,
  ProjectFixedTabId,
  TaskTabLabel,
  WorkspaceTabId,
} from '../../utils/workspaceTabs';

export type WorkspaceFixedTabId = ProjectFixedTabId | JiraSolusFixedTabId;
import { isTaskTabId } from '../../utils/workspaceTabs';
import {
  projectChromeScrollFadeFromClass,
  projectChromeScrollFadeToClass,
  projectChromeScrollHintClass,
  projectChromeTabActiveClass,
  projectChromeTabIdleClass,
  projectChromeTabsDividerClass,
  projectChromeTabsNavClass,
  projectChromeTabsRowClass,
  projectChromeTaskTabActiveClass,
  projectChromeTaskTabCloseBtnClass,
  projectChromeTaskTabDividerClass,
  projectChromeTaskTabIdleClass,
} from '../tasks/tasksPanelNeuStyles';

export interface ProjectWorkspaceTabBarProps {
  fixedTabs: Array<{ id: WorkspaceFixedTabId; label: string }>;
  activeTab: WorkspaceTabId;
  taskTabs: TaskTabLabel[];
  onSelectTab: (tabId: WorkspaceTabId) => void;
  onCloseTaskTab: (taskId: string) => void;
  onTabKeyDown?: (e: React.KeyboardEvent) => void;
  backlogSlot?: React.ReactNode;
}

/**
 * Barra de abas do projeto: seções fixas + abas dinâmicas de tarefas (estilo console).
 */
export const ProjectWorkspaceTabBar: React.FC<ProjectWorkspaceTabBarProps> = ({
  fixedTabs,
  activeTab,
  taskTabs,
  onSelectTab,
  onCloseTaskTab,
  onTabKeyDown,
  backlogSlot,
}) => {
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    if (!tabsRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  useEffect(() => {
    checkScroll();
    const el = tabsRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll, activeTab, taskTabs.length, fixedTabs.length]);

  return (
    <div className={projectChromeTabsDividerClass}>
      {canScrollLeft ? <div className={projectChromeScrollFadeFromClass} aria-hidden /> : null}
      {canScrollRight ? <div className={projectChromeScrollFadeToClass} aria-hidden /> : null}

      <div className={projectChromeTabsRowClass}>
        <nav
          ref={tabsRef}
          className={projectChromeTabsNavClass}
          aria-label="Seções do projeto e tarefas abertas"
          role="tablist"
          aria-orientation="horizontal"
          onKeyDown={onTabKeyDown}
        >
          {fixedTabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectTab(tab.id)}
                className={isActive ? projectChromeTabActiveClass : projectChromeTabIdleClass}
                id={`tab-${tab.id}`}
                role="tab"
                tabIndex={isActive ? 0 : -1}
                aria-selected={isActive}
                aria-controls={`tab-panel-${tab.id}`}
              >
                {tab.label}
              </button>
            );
          })}

          {taskTabs.length > 0 ? (
            <span className={projectChromeTaskTabDividerClass} aria-hidden role="presentation" />
          ) : null}

          {taskTabs.map(taskTab => {
            const tabId: WorkspaceTabId = `task:${taskTab.taskId}`;
            const isActive = activeTab === tabId;
            const panelId = `tab-panel-task-${taskTab.taskId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
            return (
              <div
                key={taskTab.taskId}
                role="presentation"
                className={cn(
                  'inline-flex shrink-0 snap-start',
                  isActive ? projectChromeTaskTabActiveClass : projectChromeTaskTabIdleClass,
                  isActive && 'workspace-chrome-tab-active',
                  !isActive && 'workspace-chrome-tab-idle'
                )}
              >
                <button
                  type="button"
                  id={`tab-task-${taskTab.taskId}`}
                  role="tab"
                  tabIndex={isActive ? 0 : -1}
                  aria-selected={isActive}
                  aria-controls={panelId}
                  className="inline-flex min-w-0 flex-1 items-center gap-1.5 truncate text-left"
                  onClick={() => onSelectTab(tabId)}
                  title={`${taskTab.taskId} — ${taskTab.title}`}
                >
                  <span className="shrink-0 font-mono text-[10px] font-bold opacity-80 sm:text-[11px]">
                    {taskTab.taskId}
                  </span>
                  <span className="min-w-0 truncate">{taskTab.title}</span>
                </button>
                <button
                  type="button"
                  className={projectChromeTaskTabCloseBtnClass}
                  aria-label={`Fechar aba ${taskTab.taskId}`}
                  onClick={e => {
                    e.stopPropagation();
                    onCloseTaskTab(taskTab.taskId);
                  }}
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            );
          })}
        </nav>
        {backlogSlot}
      </div>
      {canScrollRight ? (
        <p className={projectChromeScrollHintClass} aria-live="polite">
          Deslize as abas para ver mais
        </p>
      ) : null}
    </div>
  );
};

export function isWorkspaceTaskPanelActive(activeTab: WorkspaceTabId): boolean {
  return isTaskTabId(activeTab);
}
