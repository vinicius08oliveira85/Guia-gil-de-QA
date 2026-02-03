import React from 'react';
import { JiraTaskType } from '../../types';

const ICON_SIZE = 18;
const CHEVRON_SIZE = 18;

// Ícone oficial do Jira para Epic (losango roxo)
export const EpicIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={ICON_SIZE} 
        height={ICON_SIZE} 
        viewBox="0 0 24 24" 
        fill="currentColor"
        className={`text-[#5E4DB2] dark:text-[#7B68EE] ${className}`}
    >
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
    </svg>
);

// Ícone oficial do Jira para Story (bookmark verde)
export const StoryIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={ICON_SIZE} 
        height={ICON_SIZE} 
        viewBox="0 0 24 24" 
        fill="currentColor"
        className={`text-[#14892C] dark:text-[#4BCE97] ${className}`}
    >
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
);

// Ícone oficial do Jira para Task (círculo azul com checkmark)
export const TaskIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={ICON_SIZE} 
        height={ICON_SIZE} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={`text-[#0052CC] dark:text-[#2684FF] ${className}`}
    >
        <circle cx="12" cy="12" r="10"/>
        <path d="m9 12 2 2 4-4"/>
    </svg>
);

// Ícone oficial do Jira para Bug (inseto vermelho)
export const BugIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width={ICON_SIZE} 
        height={ICON_SIZE} 
        viewBox="0 0 24 24" 
        fill="currentColor"
        className={`text-[#DE350B] dark:text-[#FF5630] ${className}`}
    >
        <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7z"/>
        <circle cx="9" cy="9" r="1.5" fill="currentColor"/>
        <circle cx="15" cy="9" r="1.5" fill="currentColor"/>
        <path d="M12 13c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="currentColor"/>
    </svg>
);
type BasicIconProps = { className?: string };

export const EditIcon: React.FC<BasicIconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
);

export const TrashIcon: React.FC<BasicIconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
);

export const PlusIcon: React.FC<BasicIconProps> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
export const ChevronDownIcon: React.FC<BasicIconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={CHEVRON_SIZE} height={CHEVRON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="6 9 12 15 18 9" />
    </svg>
);
export const RefreshIcon: React.FC<BasicIconProps> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>;
export const InfoIcon: React.FC<BasicIconProps> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "text-gray-500 hover:text-gray-300"}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>;

export const CompassIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon></svg>;
export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>;
export const CheckIcon: React.FC<{ className?: string }> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>;

export const GridIcon: React.FC<BasicIconProps> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>;
export const ListIcon: React.FC<BasicIconProps> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>;
export const FilterIcon: React.FC<BasicIconProps> = ({ className }) => <svg xmlns="http://www.w3.org/2000/svg" width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>;

export const TaskTypeIcon: React.FC<{ type: JiraTaskType; className?: string }> = React.memo(({ type, className = '' }) => {
    // Cores oficiais do Jira para tipos de tarefa
    const typeConfig = {
        Epic: {
            icon: EpicIcon,
            color: 'text-[#5E4DB2] dark:text-[#7B68EE]',
            bgColor: 'bg-[#5E4DB2]/10 dark:bg-[#7B68EE]/20',
            borderColor: 'border-[#5E4DB2]/20 dark:border-[#7B68EE]/30',
            hoverColor: 'hover:bg-[#5E4DB2]/20 dark:hover:bg-[#7B68EE]/30',
        },
        História: {
            icon: StoryIcon,
            color: 'text-[#14892C] dark:text-[#4BCE97]',
            bgColor: 'bg-[#14892C]/10 dark:bg-[#4BCE97]/20',
            borderColor: 'border-[#14892C]/20 dark:border-[#4BCE97]/30',
            hoverColor: 'hover:bg-[#14892C]/20 dark:hover:bg-[#4BCE97]/30',
        },
        Tarefa: {
            icon: TaskIcon,
            color: 'text-[#0052CC] dark:text-[#2684FF]',
            bgColor: 'bg-[#0052CC]/10 dark:bg-[#2684FF]/20',
            borderColor: 'border-[#0052CC]/20 dark:border-[#2684FF]/30',
            hoverColor: 'hover:bg-[#0052CC]/20 dark:hover:bg-[#2684FF]/30',
        },
        Bug: {
            icon: BugIcon,
            color: 'text-[#DE350B] dark:text-[#FF5630]',
            bgColor: 'bg-[#DE350B]/10 dark:bg-[#FF5630]/20',
            borderColor: 'border-[#DE350B]/20 dark:border-[#FF5630]/30',
            hoverColor: 'hover:bg-[#DE350B]/20 dark:hover:bg-[#FF5630]/30',
        },
    };

    const config = typeConfig[type];
    if (!config) return null;

    const Icon = config.icon;

    return (
        <div
            className={`
                group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border 
                backdrop-blur-sm transition-all duration-300
                ${config.bgColor}
                ${config.borderColor}
                ${config.hoverColor}
                ${className}
            `}
        >
            <Icon />
        </div>
    );
});

export const TaskStatusIcon: React.FC<{ status: 'To Do' | 'In Progress' | 'Done' | 'Blocked' }> = React.memo(({ status }) => {
    const statusMap = {
        'To Do': { icon: <circle cx="12" cy="12" r="10" />, color: 'text-gray-500' },
        'In Progress': { icon: <path d="M21 12a9 9 0 1 1-6.219-8.56"/>, color: 'text-yellow-700 dark:text-yellow-400 animate-spin' },
        'Done': { icon: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>, color: 'text-green-700 dark:text-green-400' },
        'Blocked': { icon: <><circle cx="12" cy="12" r="10" /><line x1="8" y1="16" x2="16" y2="8" /></>, color: 'text-red-700 dark:text-red-400' }
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