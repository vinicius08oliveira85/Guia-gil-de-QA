import React from 'react';
import {
    Menubar,
    MenubarContent,
    MenubarMenu,
    MenubarTrigger,
} from '../ui/menubar';
import { cn } from '../../lib/utils';

export interface TaskSectionTab {
    id: string;
    label: string;
    badge?: number;
}

interface TaskSectionMenubarProps {
    tabs: TaskSectionTab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
    className?: string;
    safeDomId?: string;
}

/**
 * Componente Menubar para substituir tabs de seções de tarefas
 * Mantém funcionalidade de badges e estados ativos
 * Funciona como tabs horizontais (sem dropdown)
 */
export const TaskSectionMenubar: React.FC<TaskSectionMenubarProps> = ({
    tabs,
    activeTab,
    onTabChange,
    className,
    safeDomId,
}) => {
    return (
        <Menubar
            className={cn(
                'bg-base-200 border-base-300 p-1 w-full md:w-fit overflow-x-auto shadow-sm',
                className
            )}
            role="tablist"
            aria-label="Seções da tarefa"
        >
            {tabs.map((tab) => {
                const isActive = tab.id === activeTab;
                const tabId = safeDomId ? `task-${safeDomId}-tab-${tab.id}` : undefined;
                const panelId = safeDomId ? `task-${safeDomId}-panel-${tab.id}` : undefined;

                return (
                    <MenubarMenu key={tab.id}>
                        <MenubarTrigger
                            id={tabId}
                            role="tab"
                            aria-selected={isActive}
                            aria-controls={panelId}
                            onClick={() => onTabChange(tab.id)}
                            className={cn(
                                'flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-sm transition-colors',
                                isActive
                                    ? 'bg-primary text-primary-content shadow-sm'
                                    : 'hover:bg-base-300 text-base-content'
                            )}
                        >
                            <span>{tab.label}</span>
                            {typeof tab.badge === 'number' && tab.badge > 0 && (
                                <span className="badge badge-primary badge-sm ml-1">
                                    {tab.badge}
                                </span>
                            )}
                        </MenubarTrigger>
                        {/* MenubarContent necessário para Radix UI, mas oculto pois queremos comportamento de tabs */}
                        <MenubarContent className="hidden" />
                    </MenubarMenu>
                );
            })}
        </Menubar>
    );
};

