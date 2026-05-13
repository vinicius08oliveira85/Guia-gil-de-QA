import React from 'react';
import { JiraTaskType } from '../../types';
import { getJiraLastUrl } from '../../services/jira/config';

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
    className={`text-primary ${className}`}
  >
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
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
    className={`text-success ${className}`}
  >
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
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
    className={`text-info ${className}`}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

// Ícone oficial do Jira para Bug (quadrado vermelho com glifo branco)
export const BugIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={ICON_SIZE}
    height={ICON_SIZE}
    viewBox="0 0 16 16"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <rect x="1" y="1" width="14" height="14" rx="2" fill="#E5493A" />
    <path
      d="M11 8C11 9.657 9.657 11 8 11C6.343 11 5 9.657 5 8C5 6.343 6.343 5 8 5C9.657 5 11 6.343 11 8Z"
      fill="#FFFFFF"
    />
  </svg>
);

interface JiraIssueTypeIconProps {
  type: JiraTaskType;
  iconUrl?: string;
  className?: string;
  size?: number;
}

const DEFAULT_JIRA_ISSUE_TYPE_ICON_FILES: Record<JiraTaskType, string> = {
  Epic: 'epic.svg',
  História: 'story.svg',
  Tarefa: 'task.svg',
  Bug: 'bug.svg',
};

const normalizeBaseUrl = (value: string): string => value.trim().replace(/\/+$/, '');

const getSafeJiraBaseUrl = (): string => {
  if (typeof window === 'undefined') return '';

  try {
    return normalizeBaseUrl(getJiraLastUrl());
  } catch {
    return '';
  }
};

const toAbsoluteJiraIconUrl = (url: string | undefined, baseUrl: string): string | undefined => {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('/') && baseUrl) return `${baseUrl}${trimmed}`;
  return undefined;
};

const buildDefaultJiraIssueTypeIconUrl = (
  type: JiraTaskType,
  baseUrl: string
): string | undefined => {
  const fileName = DEFAULT_JIRA_ISSUE_TYPE_ICON_FILES[type];
  if (!fileName || !baseUrl) return undefined;
  return `${baseUrl}/images/icons/issuetypes/${fileName}`;
};

const IssueTypeGlyph: React.FC<{ type: JiraTaskType; className?: string; size?: number }> = ({
  type,
  className = '',
  size = 16,
}) => {
  const iconMap: Record<JiraTaskType, React.FC<{ className?: string }>> = {
    Epic: EpicIcon,
    História: StoryIcon,
    Tarefa: TaskIcon,
    Bug: BugIcon,
  };

  const Icon = iconMap[type];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Icon className="h-full w-full" />
    </span>
  );
};

/** Ícone do tipo da issue preferindo a URL oficial do Jira e caindo para fallback local. */
export const JiraIssueTypeIcon: React.FC<JiraIssueTypeIconProps> = ({
  type,
  iconUrl,
  className = '',
  size = 16,
}) => {
  const [failed, setFailed] = React.useState(false);
  const resolvedIconUrl = React.useMemo(() => {
    const jiraBaseUrl = getSafeJiraBaseUrl();
    return (
      toAbsoluteJiraIconUrl(iconUrl, jiraBaseUrl) ??
      buildDefaultJiraIssueTypeIconUrl(type, jiraBaseUrl)
    );
  }, [iconUrl, type]);

  React.useEffect(() => {
    setFailed(false);
  }, [resolvedIconUrl]);

  if (resolvedIconUrl && !failed) {
    return (
      <img
        src={resolvedIconUrl}
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className={`shrink-0 object-contain ${className}`}
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${className}`}>
      <IssueTypeGlyph type={type} size={size} />
    </span>
  );
};

type BasicIconProps = { className?: string };

export const EditIcon: React.FC<BasicIconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={ICON_SIZE}
    height={ICON_SIZE}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

export const TrashIcon: React.FC<BasicIconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={ICON_SIZE}
    height={ICON_SIZE}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export const PlusIcon: React.FC<BasicIconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={ICON_SIZE}
    height={ICON_SIZE}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);
export const ChevronDownIcon: React.FC<BasicIconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={CHEVRON_SIZE}
    height={CHEVRON_SIZE}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
export const RefreshIcon: React.FC<BasicIconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={ICON_SIZE}
    height={ICON_SIZE}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
  </svg>
);
export const InfoIcon: React.FC<BasicIconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={ICON_SIZE}
    height={ICON_SIZE}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className || 'text-base-content/50 hover:text-base-content'}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>
);

export const CompassIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10"></circle>
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
  </svg>
);
export const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    ></path>
  </svg>
);
export const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
  </svg>
);

export const GridIcon: React.FC<BasicIconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={ICON_SIZE}
    height={ICON_SIZE}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="14" y="14" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
  </svg>
);
export const ListIcon: React.FC<BasicIconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={ICON_SIZE}
    height={ICON_SIZE}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="8" y1="6" x2="21" y2="6"></line>
    <line x1="8" y1="12" x2="21" y2="12"></line>
    <line x1="8" y1="18" x2="21" y2="18"></line>
    <line x1="3" y1="6" x2="3.01" y2="6"></line>
    <line x1="3" y1="12" x2="3.01" y2="12"></line>
    <line x1="3" y1="18" x2="3.01" y2="18"></line>
  </svg>
);
export const FilterIcon: React.FC<BasicIconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={ICON_SIZE}
    height={ICON_SIZE}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
  </svg>
);

export const TaskTypeIcon: React.FC<{ type: JiraTaskType; className?: string }> = React.memo(
  ({ type, className = '' }) => {
    // Cores semânticas do tema Dim (DaisyUI) por tipo de tarefa
    const typeConfig = {
      Epic: {
        icon: EpicIcon,
        bgColor: 'bg-primary/10',
        borderColor: 'border-primary/20',
        hoverColor: 'hover:bg-primary/20',
      },
      História: {
        icon: StoryIcon,
        bgColor: 'bg-success/10',
        borderColor: 'border-success/20',
        hoverColor: 'hover:bg-success/20',
      },
      Tarefa: {
        icon: TaskIcon,
        bgColor: 'bg-info/10',
        borderColor: 'border-info/20',
        hoverColor: 'hover:bg-info/20',
      },
      Bug: {
        icon: BugIcon,
        bgColor: 'bg-error/10',
        borderColor: 'border-error/20',
        hoverColor: 'hover:bg-error/20',
      },
    };

    const config = typeConfig[type];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <div
        className={`
                group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border 
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
  }
);

export const TaskStatusIcon: React.FC<{ status: 'To Do' | 'In Progress' | 'Done' | 'Blocked' }> =
  React.memo(({ status }) => {
    const statusMap = {
      'To Do': { icon: <circle cx="12" cy="12" r="10" />, color: 'text-base-content/45' },
      'In Progress': {
        icon: <path d="M21 12a9 9 0 1 1-6.219-8.56" />,
        color: 'text-warning animate-spin',
      },
      Done: {
        icon: (
          <>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </>
        ),
        color: 'text-success',
      },
      Blocked: {
        icon: (
          <>
            <circle cx="12" cy="12" r="10" />
            <line x1="8" y1="16" x2="16" y2="8" />
          </>
        ),
        color: 'text-error',
      },
    };
    const { icon, color } = statusMap[status];

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={ICON_SIZE}
        height={ICON_SIZE}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={color}
      >
        {icon}
      </svg>
    );
  });

/** Ícone para "Iniciar teste" (em progresso) — cor semântica `warning`. */
export const StartTestIcon = React.memo(() => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={ICON_SIZE}
      height={ICON_SIZE}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin text-warning"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
});

StartTestIcon.displayName = 'StartTestIcon';

/** Ícone para teste concluído — cor semântica `success`. */
export const CompleteTestIcon = React.memo(() => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={ICON_SIZE}
      height={ICON_SIZE}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin text-success"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
});

CompleteTestIcon.displayName = 'CompleteTestIcon';

/** Ícone para teste não iniciado — cor semântica `error` (destaque de atenção). */
export const ToDoTestIcon = React.memo(() => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={ICON_SIZE}
      height={ICON_SIZE}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="animate-spin text-error"
    >
      <circle cx="12" cy="12" r="10" />
    </svg>
  );
});

ToDoTestIcon.displayName = 'ToDoTestIcon';
