import React from 'react';
import { JiraTaskType } from '../../types';

const ICON_SIZE = 18;
const CHEVRON_SIZE = 18;

export const EpicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-700 dark:text-purple-400"><path d="m15.5 7.5 3 3-3 3"/><path d="M8.5 16.5 5.5 13.5 8.5 10.5"/><path d="m18.5 10.5-13 0"/></svg>;
export const StoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-700 dark:text-green-400"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>;
export const TaskIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-700 dark:text-blue-400"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="9" y1="9" x2="15" y2="15" /><line x1="15" y1="9" x2="9" y2="15" /></svg>;
export const BugIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-700 dark:text-red-400"><path d="M10 20.5c.5-.5.8-1.2.8-2 0-1.4-1.2-2.5-2.6-2.5-.9 0-1.7.5-2.2 1.3"/><path d="m14 16.5-4-4"/><path d="M16 14c-2-2-3-2-4 0"/><path d="M18 11.5c-1.5-1.5-1.5-2-1-4C17.5 6 18 5 18 5c-1 0-1.5 0-2.5 1-1.5 1.5-2.5 2.5-4 4C10 11.5 9.5 12 9 13c-1.5 1-3 2-3 4 0 1 .5 2.5 2 3.5C9.5 22 11 22 12 22c1.5 0 2.5-1.5 3.5-3 1-1 1-1.5 1.5-3 .5-.5 1-1.5 1-2.5 0-1-.5-1.5-1-2.5-1-1-2-2.5-3.5-4.5"/><path d="M18 5c-1-1-1-1.5-1-3"/><path d="m6 5 1-3"/><path d="M12 5V2"/><path d="M12 22v-2"/></svg>;
export const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>;
export const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
export const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
export const ChevronDownIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={CHEVRON_SIZE} height={CHEVRON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>;
export const RefreshIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>;
export const InfoIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500 hover:text-gray-300"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;

export const CompassIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>;
export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
export const CheckIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>;

export const GridIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
export const ListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>;
export const FilterIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>;

export const TaskTypeIcon: React.FC<{ type: JiraTaskType }> = React.memo(({ type }) => {
    switch (type) {
        case 'Epic': return <EpicIcon />;
        case 'História': return <StoryIcon />;
        case 'Tarefa': return <TaskIcon />;
        case 'Bug': return <BugIcon />;
        default: return null;
    }
});

export const TaskStatusIcon: React.FC<{ status: 'To Do' | 'In Progress' | 'Done' }> = React.memo(({ status }) => {
    const statusMap = {
        'To Do': { icon: <circle cx="12" cy="12" r="10" />, color: 'text-gray-500' },
        'In Progress': { icon: <path d="M21 12a9 9 0 1 1-6.219-8.56"/>, color: 'text-yellow-700 dark:text-yellow-400 animate-spin' },
        'Done': { icon: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>, color: 'text-green-700 dark:text-green-400' }
    };
    const { icon, color } = statusMap[status];

    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={color}>
            {icon}
        </svg>
    );
});

/**
 * Ícone específico para "Iniciar teste" (In Progress)
 * Cor amarela escura: #ffd300
 */
export const StartTestIcon = React.memo(() => {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width={ICON_SIZE} 
            height={ICON_SIZE} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#ffd300" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="animate-spin"
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
        </svg>
    );
});

StartTestIcon.displayName = 'StartTestIcon';

/**
 * Ícone específico para "Concluído o teste" (Done)
 * Cor verde: #00875a
 */
export const CompleteTestIcon = React.memo(() => {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width={ICON_SIZE} 
            height={ICON_SIZE} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#00875a" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="animate-spin"
        >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
    );
});

CompleteTestIcon.displayName = 'CompleteTestIcon';

/**
 * Ícone específico para "To Do" (não iniciado)
 * Cor vermelha: #dc2626
 */
export const ToDoTestIcon = React.memo(() => {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width={ICON_SIZE} 
            height={ICON_SIZE} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="#dc2626" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="animate-spin"
        >
            <circle cx="12" cy="12" r="10" />
        </svg>
    );
});

ToDoTestIcon.displayName = 'ToDoTestIcon';