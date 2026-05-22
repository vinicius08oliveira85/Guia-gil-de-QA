import React from 'react';
import { Bookmark, Bug, CheckSquare, Zap } from 'lucide-react';
import { JiraTaskType } from '../../types';

const ICON_SIZE = 18;
const CHEVRON_SIZE = 18;
const ISSUE_TYPE_STROKE_WIDTH = 2.5;

const ISSUE_TYPE_COLORS: Record<JiraTaskType, string> = {
  Bug: '#E54937',
  Epic: '#904EE2',
  História: '#63BA3C',
  Tarefa: '#4BADE8',
};

type IssueTypeBaseIconProps = {
  className?: string;
  size?: number;
};

// Epic usa raio roxo para refletir a identidade visual pedida.
export const EpicIcon: React.FC<IssueTypeBaseIconProps> = ({
  className = '',
  size = ICON_SIZE,
}) => (
  <Zap
    size={size}
    strokeWidth={ISSUE_TYPE_STROKE_WIDTH}
    className={className}
    style={{ color: ISSUE_TYPE_COLORS.Epic, fill: ISSUE_TYPE_COLORS.Epic }}
    aria-hidden="true"
  />
);

// Ícone oficial do Jira para Story (bookmark verde)
export const StoryIcon: React.FC<IssueTypeBaseIconProps> = ({
  className = '',
  size = ICON_SIZE,
}) => (
  <Bookmark
    size={size}
    strokeWidth={ISSUE_TYPE_STROKE_WIDTH}
    className={className}
    style={{ color: ISSUE_TYPE_COLORS.História, fill: ISSUE_TYPE_COLORS.História }}
    aria-hidden="true"
  />
);

export const TaskIcon: React.FC<IssueTypeBaseIconProps> = ({
  className = '',
  size = ICON_SIZE,
}) => (
  <CheckSquare
    size={size}
    strokeWidth={ISSUE_TYPE_STROKE_WIDTH}
    className={className}
    style={{ color: ISSUE_TYPE_COLORS.Tarefa }}
    aria-hidden="true"
  />
);

export const BugIcon: React.FC<IssueTypeBaseIconProps> = ({
  className = '',
  size = ICON_SIZE,
}) => (
  <Bug
    size={size}
    strokeWidth={ISSUE_TYPE_STROKE_WIDTH}
    className={className}
    style={{ color: ISSUE_TYPE_COLORS.Bug }}
    aria-hidden="true"
  />
);

const ISSUE_TYPE_ICON_MAP: Record<JiraTaskType, React.FC<IssueTypeBaseIconProps>> = {
  Epic: EpicIcon,
  História: StoryIcon,
  Tarefa: TaskIcon,
  Bug: BugIcon,
};

/** Normaliza rótulos vindos do Jira ou dados legados para um `JiraTaskType` válido. */
export function resolveJiraTaskType(type: string | undefined | null): JiraTaskType {
  if (type && type in ISSUE_TYPE_ICON_MAP) {
    return type as JiraTaskType;
  }
  if (!type) return 'Tarefa';
  const normalized = type.toLowerCase();
  if (normalized.includes('epic')) return 'Epic';
  if (normalized.includes('story') || normalized.includes('hist')) return 'História';
  if (normalized.includes('bug') || normalized.includes('defect')) return 'Bug';
  return 'Tarefa';
}

interface JiraIssueTypeIconProps {
  type: JiraTaskType | string;
  iconUrl?: string;
  className?: string;
  size?: number;
}

const IssueTypeGlyph: React.FC<{ type: JiraTaskType | string; className?: string; size?: number }> = ({
  type,
  className = '',
  size = 16,
}) => {
  const resolved = resolveJiraTaskType(type);
  const Icon = ISSUE_TYPE_ICON_MAP[resolved] ?? TaskIcon;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Icon className="h-full w-full" size={size} />
    </span>
  );
};

/** Fonte única dos ícones de issue type padronizados visualmente para toda a UI. */
export const JiraIssueTypeIcon: React.FC<JiraIssueTypeIconProps> = ({
  type,
  iconUrl,
  className = '',
  size = 16,
}) => (
  <span
    className={`inline-flex shrink-0 items-center justify-center ${className}`}
    style={{ width: size, height: size }}
  >
    {iconUrl ? (
      <img
        src={iconUrl}
        alt=""
        width={size}
        height={size}
        className="h-full w-full object-contain"
        aria-hidden
      />
    ) : (
      <IssueTypeGlyph type={type} size={size} />
    )}
  </span>
);

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
