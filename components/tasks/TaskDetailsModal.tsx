import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { JiraTask, BddScenario, TestCaseDetailLevel, Project, TestCase } from '../../types';
import { Modal } from '../common/Modal';
import { Spinner } from '../common/Spinner';
import { PlusIcon, RefreshIcon } from '../common/Icons';
import { BddScenarioForm, BddScenarioItem } from './BddScenario';
import { TestCasesSection } from './TestCasesSection';
import { TestStrategyCard } from './TestStrategyCard';
import { ToolsSelector } from './ToolsSelector';
import { TestReportModal } from './TestReportModal';
import { CommentSection } from '../common/CommentSection';
import { AttachmentManager } from '../common/AttachmentManager';
import { ChecklistView } from '../common/ChecklistView';
import { EstimationInput } from '../common/EstimationInput';
import { QuickActions } from '../common/QuickActions';
import { getTagColor, getTaskVersions } from '../../utils/tagService';
import { getDisplayPriorityLabel } from '../../utils/taskHelpers';
import { VersionBadges } from './VersionBadge';
import { updateChecklistItem } from '../../utils/checklistService';
import { getNextStepForTask } from '../../utils/taskPhaseHelper';
import { EmptyState } from '../common/EmptyState';
import { LoadingSkeleton } from '../common/LoadingSkeleton';
import { parseJiraDescriptionHTML } from '../../utils/jiraDescriptionParser';
import { getJiraConfig } from '../../services/jiraService';
import { fetchJiraAttachmentAsDataUrl } from '../../utils/jiraAttachmentFetch';
import { TaskWithChildren } from './JiraTaskItem';
import { TaskLinksView } from './TaskLinksView';
import { getTaskDependents } from '../../utils/dependencyService';
import { TaskBusinessRulesLinker } from './TaskBusinessRulesLinker';
import { FileViewer } from '../common/FileViewer';
import { ImageModal } from '../common/ImageModal';
import { canViewInBrowser, detectFileType } from '../../services/fileViewerService';
import { JiraAttachment } from './JiraAttachment';
import { JiraRichContent } from './JiraRichContent';
import { Button } from '../common/Button';
import { BackButton } from '../common/BackButton';
import { Badge } from '../common/Badge';
import { useJiraAttachmentViewer } from '../../hooks/useJiraAttachmentViewer';
import { BarChart3, ClipboardList, Sparkles, Wrench, Link, Paperclip, Timer, Download, ChevronLeft, ChevronRight } from 'lucide-react';

type DetailSection = 'overview' | 'bdd' | 'tests' | 'businessRules' | 'planning' | 'collaboration';
type TestSubSection = 'strategy' | 'test-cases';

const CARD_TITLE_CLASS = 'text-sm sm:text-base font-bold text-base-content flex items-center gap-2';

/** Resolve o MIME type de um anexo pelo nome do arquivo */
function resolveMimeType(filename: string): string | undefined {
    const ext = filename.toLowerCase().split('.').pop();
    const map: Record<string, string> = {
        pdf: 'application/pdf',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        webp: 'image/webp',
        txt: 'text/plain',
        json: 'application/json',
        csv: 'text/csv',
    };
    return ext ? map[ext] : undefined;
}

// Componente para renderizar descrição com formatação rica do Jira
const DescriptionRenderer: React.FC<{ 
    description: string | any;
    jiraAttachments?: Array<{ id: string; filename: string; size: number; created: string; author: string }>;
}> = ({ description, jiraAttachments }) => {
    if (!description) {
        return <p className="text-base-content/70 italic">Sem descrição</p>;
    }
    
    const jiraConfig = getJiraConfig();
    const jiraUrl = jiraConfig?.url;
    
    let htmlContent = '';
    
    if (typeof description === 'string') {
        if (description.includes('<')) {
            htmlContent = description;
            if (jiraUrl && jiraAttachments && jiraAttachments.length > 0 && 
                /<img[^>]*src=["'][^"']*\.(png|jpg|jpeg|gif|webp)["']/i.test(htmlContent)) {
                const hasFileNames = /<img[^>]*src=["'](?!https?:\/\/|data:)([^"']+)["']/i.test(htmlContent);
                if (hasFileNames) {
                    htmlContent = parseJiraDescriptionHTML(description, jiraUrl, jiraAttachments);
                }
            }
        } else {
            htmlContent = parseJiraDescriptionHTML(description, jiraUrl, jiraAttachments);
        }
    } else {
        htmlContent = parseJiraDescriptionHTML(description, jiraUrl, jiraAttachments);
    }
    
    if (!htmlContent || htmlContent.trim() === '') {
        return <p className="text-base-content/70 italic">Sem descrição</p>;
    }
    
    return (
        <JiraRichContent 
            html={htmlContent}
            className=""
        />
    );
};

interface TaskDetailsModalProps {
    task: TaskWithChildren;
    isOpen: boolean;
    onClose: () => void;
    onTestCaseStatusChange: (testCaseId: string, status: 'Passed' | 'Failed') => void;
    onToggleTestCaseAutomated: (testCaseId: string, isAutomated: boolean) => void;
    onExecutedStrategyChange: (testCaseId: string, strategies: string[]) => void;
    onTaskToolsChange?: (tools: string[]) => void;
    onTestCaseToolsChange?: (testCaseId: string, tools: string[]) => void;
    onStrategyExecutedChange?: (strategyIndex: number, executed: boolean) => void;
    onStrategyToolsChange?: (strategyIndex: number, tools: string[]) => void;
    onGenerateTests: (taskId: string, detailLevel: TestCaseDetailLevel) => Promise<void>;
    isGenerating: boolean;
    onGenerateBddScenarios: (taskId: string) => Promise<void>;
    isGeneratingBdd: boolean;
    onGenerateAll?: (taskId: string, detailLevel?: TestCaseDetailLevel) => Promise<void>;
    isGeneratingAll?: boolean;
    onSaveBddScenario: (taskId: string, scenario: Omit<BddScenario, 'id'>, scenarioId?: string) => void;
    onDeleteBddScenario: (taskId: string, scenarioId: string) => void;
    onAddTestCaseFromTemplate?: (taskId: string) => void;
    onAddComment?: (content: string) => void;
    onEditComment?: (commentId: string, content: string) => void;
    onDeleteComment?: (commentId: string) => void;
    onEditTestCase?: (taskId: string, testCase: TestCase) => void;
    onDeleteTestCase?: (taskId: string, testCaseId: string) => void;
    onDuplicateTestCase?: (taskId: string, testCase: TestCase) => void;
    project?: Project;
    onUpdateProject?: (project: Project) => void;
    /** Navegação para outra aba do projeto (ex.: Documentos). */
    onNavigateToTab?: (tabId: string) => void;
    onOpenTask?: (task: JiraTask) => void;
    onUpdateFromJira?: (taskId: string) => Promise<void>;
    isUpdatingFromJira?: boolean;
}

export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
    task,
    isOpen,
    onClose,
    onTestCaseStatusChange,
    onToggleTestCaseAutomated,
    onExecutedStrategyChange,
    onTaskToolsChange,
    onTestCaseToolsChange,
    onStrategyExecutedChange,
    onStrategyToolsChange,
    onGenerateTests,
    isGenerating,
    onGenerateBddScenarios,
    isGeneratingBdd,
    onGenerateAll,
    isGeneratingAll,
    onSaveBddScenario,
    onDeleteBddScenario,
    onAddTestCaseFromTemplate,
    onAddComment,
    onEditComment,
    onDeleteComment,
    onEditTestCase,
    onDeleteTestCase,
    onDuplicateTestCase,
    project,
    onUpdateProject,
    onNavigateToTab,
    onOpenTask,
    onUpdateFromJira,
    isUpdatingFromJira,
}) => {
    const reduceMotion = useReducedMotion();
    const [editingBddScenario, setEditingBddScenario] = useState<BddScenario | null>(null);
    const [isCreatingBdd, setIsCreatingBdd] = useState(false);
    const [detailLevel, setDetailLevel] = useState<TestCaseDetailLevel>('Padrão');
    const [showTestReport, setShowTestReport] = useState(false);
    const { viewingJiraAttachment, setViewingJiraAttachment, loadingJiraAttachmentId, handleViewJiraAttachment } = useJiraAttachmentViewer();
    const [activeSection, setActiveSection] = useState<DetailSection>('overview');
    const [activeTestSubSection, setActiveTestSubSection] = useState<TestSubSection>('strategy');
    const nextStep = getNextStepForTask(task);
    const hasTests = task.testCases && task.testCases.length > 0;
    const safeDomId = useMemo(() => task.id.replace(/[^a-zA-Z0-9_-]/g, '_'), [task.id]);

    const jiraAttachmentItems = useMemo(() => {
        const jiraConfig = getJiraConfig();
        const jiraUrl = jiraConfig?.url ?? '';
        return (task.jiraAttachments ?? []).map((att) => ({
            ...att,
            attachmentUrl: jiraUrl
                ? `${jiraUrl}/secure/attachment/${att.id}/${encodeURIComponent(att.filename)}`
                : '',
            mimeType: resolveMimeType(att.filename),
        }));
    }, [task.jiraAttachments]);

    const sectionTabs = useMemo(() => {
        const tabs: { id: DetailSection; label: string; badge?: number }[] = [
            { id: 'overview', label: 'Resumo' }
        ];

        if (task.type === 'Tarefa' || task.type === 'Bug') {
            tabs.push({ id: 'bdd', label: 'Cenários BDD', badge: task.bddScenarios?.length || 0 });
        }

        if (task.type === 'Tarefa' || task.type === 'Bug') {
            tabs.push({ id: 'tests', label: 'Testes', badge: task.testCases?.length || 0 });
        }

        if (project && onUpdateProject) {
            const brLinkedCount = (task.linkedBusinessRuleIds ?? []).length;
            tabs.push({
                id: 'businessRules',
                label: 'Regras de negócio',
                badge: brLinkedCount > 0 ? brLinkedCount : undefined,
            });
            const dependentsCount = getTaskDependents(task.id, project).length;
            const planningBadge = (task.dependencies?.length || 0) + dependentsCount + (task.attachments?.length || 0) + (task.checklist?.length || 0) + (task.estimatedHours ? 1 : 0);
            tabs.push({ id: 'planning', label: 'Planejamento', badge: planningBadge });
        }

        if (onAddComment) {
            tabs.push({ id: 'collaboration', label: 'Colaboração', badge: task.comments?.length || 0 });
        }

        return tabs;
    }, [
        task.type,
        task.bddScenarios,
        task.testCases,
        task.dependencies,
        task.attachments,
        task.checklist,
        task.estimatedHours,
        task.comments,
        project,
        onUpdateProject,
        onAddComment,
        project?.tasks,
        task.linkedBusinessRuleIds,
    ]);

    const prevActiveSectionRef = useRef<DetailSection>(activeSection);
    const [sectionEnterDirection, setSectionEnterDirection] = useState<1 | -1>(1);

    useEffect(() => {
        const prev = prevActiveSectionRef.current;
        if (prev !== activeSection) {
            const oldIdx = sectionTabs.findIndex((t) => t.id === prev);
            const newIdx = sectionTabs.findIndex((t) => t.id === activeSection);
            if (oldIdx >= 0 && newIdx >= 0 && oldIdx !== newIdx) {
                setSectionEnterDirection(newIdx > oldIdx ? 1 : -1);
            }
            prevActiveSectionRef.current = activeSection;
        }
    }, [activeSection, sectionTabs]);

    useEffect(() => {
        if (!isOpen) return;
        const currentTabExists = sectionTabs.some(tab => tab.id === activeSection);
        if (!currentTabExists) {
            const next = sectionTabs[0]?.id ?? 'overview';
            if (next !== activeSection) setActiveSection(next);
            return;
        }
        if (activeSection === 'businessRules' && (!project || !onUpdateProject)) {
            setActiveSection(sectionTabs[0]?.id ?? 'overview');
            return;
        }
        if ((activeSection === 'tests' || activeSection === 'bdd') && task.type !== 'Tarefa' && task.type !== 'Bug') {
            setActiveSection('overview');
        }
    }, [isOpen, sectionTabs, activeSection, task.type, project, onUpdateProject]);

    const handleSaveScenario = (scenario: Omit<BddScenario, 'id'>) => {
        onSaveBddScenario(task.id, scenario, editingBddScenario?.id);
        setEditingBddScenario(null);
        setIsCreatingBdd(false);
    };

    const handleCancelBddForm = () => {
        setEditingBddScenario(null);
        setIsCreatingBdd(false);
    };

    const hasJiraSidebarFields = !!(
        task.dueDate || task.timeTracking || task.components || task.fixVersions ||
        task.environment || task.reporter || task.watchers || task.issueLinks ||
        task.jiraAttachments?.length
    );

    const renderBusinessRulesSection = () => {
        if (!project || !onUpdateProject) return null;
        return (
            <TaskBusinessRulesLinker
                task={task}
                project={project}
                onUpdateProject={onUpdateProject}
                onNavigateToTab={onNavigateToTab}
            />
        );
    };

    const renderOverviewSection = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Coluna principal */}
            <div className="lg:col-span-2 space-y-3">
                {/* Cartões de resumo no topo */}
                {(task.priority || task.severity || task.owner || task.assignee || task.jiraAssignee?.displayName || nextStep) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {task.owner && (
                            <div className="p-3 bg-base-100 border border-base-300 rounded-xl shadow-sm">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-base-content/60 block mb-1">Owner</p>
                                <p className="text-sm font-medium text-base-content">{task.owner}</p>
                            </div>
                        )}
                        {(task.jiraAssignee?.displayName ?? task.assignee) && (
                            <div className="p-3 bg-base-100 border border-base-300 rounded-xl shadow-sm">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-base-content/60 block mb-1">Responsável</p>
                                <p className="text-sm font-medium text-base-content">{task.jiraAssignee?.displayName ?? task.assignee}</p>
                            </div>
                        )}
                        {(task.priority || task.jiraPriority) && (
                            <div className="p-3 bg-base-100 border border-base-300 rounded-xl shadow-sm">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-base-content/60 block mb-1">Prioridade</p>
                                <p className="text-sm font-medium text-base-content">{getDisplayPriorityLabel(task, project)}</p>
                            </div>
                        )}
                        {task.severity && (
                            <div className="p-3 bg-base-100 border border-base-300 rounded-xl shadow-sm">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-base-content/60 block mb-1">Severidade</p>
                                <p className="text-sm font-medium text-base-content">{task.severity}</p>
                            </div>
                        )}
                        {nextStep && (
                            <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-brand-orange/30 rounded-xl shadow-sm">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-brand-orange block mb-1">Próximo passo</p>
                                <p className="text-[0.82rem] font-medium text-base-content line-clamp-2">{nextStep}</p>
                            </div>
                        )}
                    </div>
                )}

                {(task.type === 'Tarefa' || task.type === 'Bug') && (task.testCases?.length > 0 || (task.testStrategy?.length ?? 0) > 0) && (
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => setShowTestReport(true)}
                            className="btn btn-outline btn-sm flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Gerar Registro de Testes</span>
                        </button>
                    </div>
                )}

                <section className="space-y-2">
                    <h3 className="text-sm font-bold text-base-content/70 uppercase tracking-wide">Descrição</h3>
                    <div className="text-base-content/80">
                        {task.description ? (
                            <DescriptionRenderer
                                description={task.description}
                                jiraAttachments={task.jiraAttachments}
                            />
                        ) : (
                            <p className="text-base-content/70 italic">Sem descrição</p>
                        )}
                    </div>
                </section>

                {(() => {
                    const versions = getTaskVersions(task);
                    const otherTags = task.tags?.filter(tag => !/^V\d+/i.test(tag.trim())) || [];
                    return (versions.length > 0 || otherTags.length > 0) && (
                        <div className="space-y-2">
                            {versions.length > 0 && (
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-base-content/60 mb-1.5">Versão do Projeto</p>
                                    <VersionBadges versions={versions} size="md" />
                                </div>
                            )}
                            {otherTags.length > 0 && (
                                <div>
                                    {versions.length > 0 && (
                                        <p className="text-[10px] uppercase tracking-wider font-bold text-base-content/60 mb-1.5">Tags</p>
                                    )}
                                    <div className="flex flex-wrap gap-2">
                                        {otherTags.map(tag => (
                                            <span
                                                key={tag}
                                                className="text-xs px-2 py-0.5 rounded-full text-white"
                                                style={{ backgroundColor: getTagColor(tag) }}
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}

                {jiraAttachmentItems.length > 0 && (
                    <section className="space-y-2">
                        <h3 className="text-sm font-bold text-base-content/70 uppercase tracking-wide">Anexos do Jira</h3>
                        <div className="p-3 bg-base-100 border border-base-300 rounded-xl">
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {jiraAttachmentItems.map((att) => (
                                    <JiraAttachment
                                        key={att.id}
                                        id={att.id}
                                        url={att.attachmentUrl}
                                        filename={att.filename}
                                        mimeType={att.mimeType}
                                        size={att.size}
                                        onView={handleViewJiraAttachment}
                                        isLoading={loadingJiraAttachmentId === att.id}
                                    />
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </div>

            {/* Sidebar: Atualizar do Jira + Campos do Jira + Ações Rápidas */}
            <aside className="space-y-4">
                {onUpdateFromJira && /^[A-Z]+-\d+$/.test(task.id) && (
                    <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden shadow-sm p-4">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2 rounded-xl"
                            onClick={() => onUpdateFromJira(task.id)}
                            disabled={!!isUpdatingFromJira}
                            aria-label="Atualizar somente esta tarefa do Jira"
                        >
                            {isUpdatingFromJira ? (
                                <Spinner small />
                            ) : (
                                <Download className="w-4 h-4" aria-hidden />
                            )}
                            {isUpdatingFromJira ? 'Atualizando…' : 'Atualizar do Jira (só esta tarefa)'}
                        </Button>
                        <p className="text-[11px] text-base-content/60 mt-2">Busca apenas esta tarefa no Jira, sem carregar o projeto inteiro.</p>
                    </div>
                )}
                {hasJiraSidebarFields && (
                    <div className="bg-base-100 border border-base-300 rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-base-200 flex items-center gap-2">
                            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <h2 className="font-bold text-base-content">Campos do Jira</h2>
                        </div>
                        <div className="p-4 space-y-3">
                            {(task.reporter || task.dueDate || task.environment) && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-base-content/60 mb-2">Informações Básicas</p>
                                    <div className="space-y-2">
                                        {task.reporter && (
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-base-200 flex items-center justify-center font-bold text-base-content/80 text-sm flex-shrink-0">
                                                    {task.reporter.displayName.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-base-content truncate">{task.reporter.displayName}</p>
                                                    {task.reporter.emailAddress && (
                                                        <p className="text-[11px] text-base-content/60 truncate">{task.reporter.emailAddress}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                        {task.dueDate && (
                                            <p className="text-sm text-base-content">
                                                <span className="text-[10px] uppercase font-bold text-base-content/60">Due Date: </span>
                                                {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                                            </p>
                                        )}
                                        {task.environment && (
                                            <p className="text-sm text-base-content">
                                                <span className="text-[10px] uppercase font-bold text-base-content/60">Environment: </span>
                                                {task.environment}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {task.timeTracking && (task.timeTracking.originalEstimate || task.timeTracking.remainingEstimate || task.timeTracking.timeSpent) && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-base-content/60 mb-2">Time Tracking</p>
                                    <div className="space-y-1 text-[11px] text-base-content/70">
                                        {task.timeTracking.originalEstimate && <p>Estimado: {task.timeTracking.originalEstimate}</p>}
                                        {task.timeTracking.remainingEstimate && <p>Restando: {task.timeTracking.remainingEstimate}</p>}
                                        {task.timeTracking.timeSpent && <p>Gasto: {task.timeTracking.timeSpent}</p>}
                                    </div>
                                </div>
                            )}

                            {(task.issueLinks?.length || task.watchers) && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-base-content/60 mb-2">Relacionamentos</p>
                                    {task.issueLinks && task.issueLinks.length > 0 && (
                                        <div className="space-y-1 mb-2">
                                            {task.issueLinks.map((link) => (
                                                <div key={link.id} className="text-sm text-base-content">
                                                    <span className="text-base-content/70">{link.type}</span> {link.relatedKey}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {task.watchers && (
                                        <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                                            <p className="text-[10px] uppercase font-bold text-primary/90">Observadores</p>
                                            <p className="text-xs font-medium text-base-content mt-0.5">
                                                {task.watchers.watchCount} observador(es)
                                                {task.watchers.isWatching && ' • Você está observando'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {(task.components?.length || task.fixVersions?.length) && (
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-base-content/60 mb-2">Organização</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {task.components?.map((comp) => (
                                            <span key={comp.id} className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded">
                                                {comp.name}
                                            </span>
                                        ))}
                                        {task.fixVersions?.map((version) => (
                                            <span key={version.id} className="text-xs px-2 py-0.5 bg-green-500/20 text-green-700 dark:text-green-400 rounded">
                                                {version.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {project && onUpdateProject && (
                    <div className="bg-base-200 rounded-2xl p-4 border border-base-300">
                        <h4 className="font-bold text-base-content mb-3">Ações Rápidas</h4>
                        <QuickActions
                            task={task}
                            project={project}
                            onUpdateProject={onUpdateProject}
                        />
                    </div>
                )}
            </aside>
        </div>
    );

    const renderBddSection = () => {
        if (task.type !== 'Tarefa' && task.type !== 'Bug') {
            return null;
        }

        const bddCount = task.bddScenarios?.length || 0;
        const actionsDisabled = isGeneratingBdd || isCreatingBdd || !!editingBddScenario;

        return (
            <div className="space-y-4">
                <header className="mb-4">
                    <h2 className="text-xl font-bold text-base-content">Cenários de Teste BDD</h2>
                    <p className="text-sm text-base-content/70 mt-1">Gerencie e visualize seus critérios de aceite em formato Gherkin.</p>
                    <span className="text-xs text-base-content/60 mt-1 block">{bddCount} cenário(s)</span>
                </header>

                <div className="space-y-4">
                    {(task.bddScenarios || []).map(sc => (
                        editingBddScenario?.id === sc.id ? (
                            <BddScenarioForm key={sc.id} existingScenario={sc} onSave={handleSaveScenario} onCancel={handleCancelBddForm} />
                        ) : (
                            <BddScenarioItem key={sc.id} scenario={sc} onEdit={() => setEditingBddScenario(sc)} onDelete={() => onDeleteBddScenario(task.id, sc.id)} />
                        )
                    ))}
                </div>
                {isCreatingBdd && !editingBddScenario && (
                    <BddScenarioForm onSave={handleSaveScenario} onCancel={handleCancelBddForm} />
                )}
                {isGeneratingBdd && <div className="flex justify-center py-2"><Spinner small /></div>}

                <div className="flex flex-wrap items-center justify-center gap-4 px-5 py-3 bg-base-100/90 dark:bg-base-200/90 backdrop-blur-md rounded-full border border-base-300 shadow-lg w-fit mx-auto">
                    <button
                        type="button"
                        onClick={() => onGenerateBddScenarios(task.id)}
                        disabled={actionsDisabled}
                        className="flex items-center gap-2 bg-blue-500/20 hover:bg-blue-500/30 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-500/30 px-5 py-2.5 rounded-full font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Sparkles className="w-4 h-4" aria-hidden />
                        Gerar Cenários com IA
                    </button>
                    <div className="h-6 w-px bg-base-300 flex-shrink-0" aria-hidden />
                    <button
                        type="button"
                        onClick={() => setIsCreatingBdd(true)}
                        disabled={actionsDisabled}
                        className="flex items-center gap-2 bg-primary hover:opacity-90 text-primary-content px-5 py-2.5 rounded-full font-semibold text-sm shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <PlusIcon className="w-4 h-4" aria-hidden />
                        Adicionar Cenário Manualmente
                    </button>
                </div>
            </div>
        );
    };

    const renderTestsSection = () => {
        if (task.type !== 'Tarefa' && task.type !== 'Bug') {
            return null;
        }

        const canHaveTestCases = task.type === 'Tarefa' || task.type === 'Bug';
        
        return (
            <div className="space-y-4">
                <div className="flex flex-wrap gap-2 p-1.5 bg-base-200 rounded-xl w-fit" role="tablist" aria-label="Sub-abas de testes">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTestSubSection === 'strategy'}
                        onClick={() => setActiveTestSubSection('strategy')}
                        className={`px-2 py-1 text-xs rounded-xl font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-sm ${activeTestSubSection === 'strategy' ? 'bg-brand-orange-selected text-white shadow-md shadow-brand-orange-selected/20 hover:bg-brand-orange-selected-hover' : 'text-base-content/70 hover:text-base-content hover:bg-base-200'}`}
                    >
                        Estratégia
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTestSubSection === 'test-cases'}
                        onClick={() => setActiveTestSubSection('test-cases')}
                        className={`px-2 py-1 text-xs rounded-xl font-medium transition-colors flex items-center gap-1 sm:px-3 sm:py-1.5 sm:text-sm ${activeTestSubSection === 'test-cases' ? 'bg-brand-orange-selected text-white shadow-md shadow-brand-orange-selected/20 hover:bg-brand-orange-selected-hover' : 'text-base-content/70 hover:text-base-content hover:bg-base-200'}`}
                    >
                        Casos de teste
                        {task.testCases?.length ? (
                            <span className={`ml-1 px-1.5 py-0.5 rounded-md text-xs font-medium ${activeTestSubSection === 'test-cases' ? 'bg-white/20' : 'bg-base-300 text-base-content'}`}>
                                {task.testCases.length}
                            </span>
                        ) : null}
                    </button>
                </div>

                {activeTestSubSection === 'strategy' && (
                    <div>
                        <header className="flex items-center gap-3 mb-4">
                            <div className="p-1.5 bg-primary/10 rounded-lg">
                                <BarChart3 className="w-5 h-5 text-primary" aria-hidden />
                            </div>
                            <h2 className="text-lg font-bold text-base-content">Estratégia de Teste</h2>
                            <span className="text-xs font-medium text-base-content/70 bg-base-200 px-3 py-1 rounded-full">
                                {task.testStrategy?.length || 0} item(ns)
                            </span>
                        </header>
                        {isGenerating && <div className="flex justify-center py-2"><Spinner small /></div>}
                        {(task.testStrategy?.length ?? 0) > 0 ? (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                {(task.testStrategy ?? []).map((strategy, i) => {
                                    if (!strategy) return null;
                                    return (
                                        <TestStrategyCard 
                                            key={i} 
                                            strategy={strategy}
                                            strategyIndex={i}
                                            isExecuted={(task.executedStrategies && task.executedStrategies.includes(i)) || false}
                                            onToggleExecuted={onStrategyExecutedChange}
                                            toolsUsed={(task.strategyTools && task.strategyTools[i]) || []}
                                            onToolsChange={onStrategyToolsChange}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            !isGenerating && (
                                <EmptyState
                                    icon="📊"
                                    title="Nenhuma estratégia de teste gerada ainda"
                                    description="Gere uma estratégia de teste com IA para esta tarefa."
                                    action={{
                                        label: "Gerar Estratégia com IA",
                                        onClick: () => onGenerateTests(task.id, detailLevel)
                                    }}
                                    tip="A estratégia de teste ajuda a definir quais tipos de teste são necessários para validar esta funcionalidade."
                                />
                            )
                        )}
                    </div>
                )}

                {activeTestSubSection === 'test-cases' && canHaveTestCases && (
                    <TestCasesSection
                        task={task}
                        isGenerating={isGenerating}
                        onGenerateTests={onGenerateTests}
                        detailLevel={detailLevel}
                        onTestCaseStatusChange={onTestCaseStatusChange}
                        onToggleTestCaseAutomated={onToggleTestCaseAutomated}
                        onExecutedStrategyChange={onExecutedStrategyChange}
                        onTestCaseToolsChange={onTestCaseToolsChange}
                        onEditTestCase={onEditTestCase}
                        onDeleteTestCase={onDeleteTestCase}
                        onDuplicateTestCase={onDuplicateTestCase}
                        onAddTestCaseFromTemplate={onAddTestCaseFromTemplate}
                    />
                )}

                <section className="mt-6 bg-base-100 border border-base-300 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-5 flex flex-col lg:flex-row lg:items-center gap-6">
                        <div className="flex-grow">
                            {onTaskToolsChange && (
                                <>
                                    <h3 className="text-xs font-bold text-base-content mb-3 flex items-center gap-2">
                                        <Wrench className="w-5 h-5 text-primary" aria-hidden />
                                        Ferramentas Utilizadas (Geral)
                                    </h3>
                                    <ToolsSelector
                                        selectedTools={task.toolsUsed || []}
                                        onToolsChange={onTaskToolsChange}
                                        label=""
                                        compact={false}
                                    />
                                </>
                            )}
                            {!onTaskToolsChange && <div className="h-0" />}
                        </div>
                        <div className="lg:w-80 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-base-200 pt-5 lg:pt-0 lg:pl-6">
                            <div>
                                <label htmlFor={`detail-level-${task.id}`} className="block text-sm font-medium text-base-content/70 mb-1">
                                    Nível de Detalhe
                                </label>
                                <select
                                    id={`detail-level-${task.id}`}
                                    value={detailLevel}
                                    onChange={(e) => setDetailLevel(e.target.value as TestCaseDetailLevel)}
                                    className="select select-bordered select-sm w-full bg-base-100 border-base-300 text-base-content text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value="Padrão">Padrão</option>
                                    <option value="Resumido">Resumido</option>
                                    <option value="Detalhado">Detalhado</option>
                                </select>
                            </div>
                            {!isGenerating && (
                                <Button
                                    variant="default"
                                    size="sm"
                                    className="w-full rounded-xl"
                                    onClick={() => onGenerateTests(task.id, detailLevel)}
                                >
                                    <Sparkles className="w-4 h-4" aria-hidden />
                                    {hasTests ? 'Regerar com IA' : 'Gerar com IA'}
                                </Button>
                            )}
                            {isGenerating && (
                                <div className="flex items-center justify-center gap-2 py-2">
                                    <Spinner small />
                                    <span className="text-sm text-base-content/70">Gerando...</span>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>
        );
    };

    const renderPlanningSection = () => {
        if (!project || !onUpdateProject) {
            return (
                <p className="text-sm text-base-content/70">Conecte um projeto para gerenciar dependências e planejamento.</p>
            );
        }

        return (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
                {/* Coluna esquerda */}
                <div className="lg:col-span-7 space-y-3 sm:space-y-4 min-w-0">
                    <section className="bg-base-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-base-300 shadow-sm">
                        <h2 className={CARD_TITLE_CLASS + ' mb-3'}>
                            <Link className="w-4 h-4 sm:w-5 sm:h-5 text-primary/70 shrink-0" aria-hidden />
                            Dependências
                        </h2>
                        <TaskLinksView
                            task={task}
                            project={project}
                            onUpdateProject={onUpdateProject}
                            onOpenTask={onOpenTask}
                        />
                    </section>

                    <section className="bg-base-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-base-300 shadow-sm">
                        <h2 className={CARD_TITLE_CLASS + ' mb-3'}>
                            <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-primary/70 shrink-0" aria-hidden />
                            Anexos
                            <span className="bg-base-200 text-base-content/70 text-xs px-2 py-0.5 rounded-full font-normal">
                                {task.attachments?.length ?? 0}
                            </span>
                        </h2>
                        <AttachmentManager
                            task={task}
                            project={project}
                            onUpdateProject={onUpdateProject}
                            compact
                        />
                    </section>

                    {task.checklist && task.checklist.length > 0 && (
                        <section className="bg-base-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-base-300 shadow-sm">
                            <h2 className={CARD_TITLE_CLASS + ' mb-3'}>Checklist</h2>
                            <ChecklistView
                                checklist={task.checklist}
                                onToggleItem={(itemId) => {
                                    const updatedChecklist = updateChecklistItem(
                                        task.checklist!,
                                        itemId,
                                        { checked: !task.checklist!.find(i => i.id === itemId)?.checked }
                                    );
                                    const updatedTasks = project.tasks.map(t =>
                                        t.id === task.id ? { ...t, checklist: updatedChecklist } : t
                                    );
                                    onUpdateProject({ ...project, tasks: updatedTasks });
                                }}
                            />
                        </section>
                    )}
                </div>

                {/* Coluna direita - Estimativas (fixa ao lado ao rolar) */}
                <div className="lg:col-span-5 min-w-0 self-start">
                    <section className="bg-base-100 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-base-300 shadow-sm sticky top-20 lg:top-24">
                        <h2 className={CARD_TITLE_CLASS + ' mb-3'}>
                            <Timer className="w-4 h-4 sm:w-5 sm:h-5 text-primary/70 shrink-0" aria-hidden />
                            Estimativas
                        </h2>
                        <EstimationInput
                            task={task}
                            onSave={(estimatedHours, actualHours) => {
                                const updatedTasks = project.tasks.map(t =>
                                    t.id === task.id ? { ...t, estimatedHours, actualHours } : t
                                );
                                onUpdateProject({ ...project, tasks: updatedTasks });
                            }}
                        />
                    </section>
                </div>
            </div>
        );
    };

    const renderCollaborationSection = () => {
        if (!onAddComment) {
            return <p className="text-sm text-base-content/70">Comentários indisponíveis para esta tarefa.</p>;
        }

        return (
            <div>
                <h3 className="text-lg font-semibold text-base-content mb-3">Comentários</h3>
                <CommentSection
                    comments={task.comments || []}
                    onAddComment={(content) => onAddComment(content)}
                    onEditComment={onEditComment}
                    onDeleteComment={onDeleteComment}
                />
            </div>
        );
    };

    const renderSectionContent = () => {
        switch (activeSection) {
            case 'overview':
                return renderOverviewSection();
            case 'bdd':
                return renderBddSection();
            case 'tests':
                return renderTestsSection();
            case 'businessRules':
                return renderBusinessRulesSection();
            case 'planning':
                return renderPlanningSection();
            case 'collaboration':
                return renderCollaborationSection();
            default:
                return null;
        }
    };

    const renderNavigationFooter = () => {
        const currentIndex = sectionTabs.findIndex((tab) => tab.id === activeSection);
        const prevTab = sectionTabs[currentIndex - 1];
        const nextTab = sectionTabs[currentIndex + 1];
        return (
            <nav
                className="flex justify-between items-center gap-2 mt-5 pt-3 border-t border-base-200"
                aria-label="Navegação entre seções da tarefa"
            >
                {prevTab ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => setActiveSection(prevTab.id)}
                        aria-label={`Anterior: ${prevTab.label}`}
                    >
                        <ChevronLeft className="w-4 h-4 shrink-0" aria-hidden />
                        Anterior
                    </Button>
                ) : (
                    <span className="inline-flex min-w-[5rem]" aria-hidden />
                )}
                {nextTab ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="gap-1"
                        onClick={() => setActiveSection(nextTab.id)}
                        aria-label={`Próximo: ${nextTab.label}`}
                    >
                        Próximo
                        <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
                    </Button>
                ) : (
                    <span className="inline-flex min-w-[5rem]" aria-hidden />
                )}
            </nav>
        );
    };

    const modalTitle = (
        <div className="flex items-center gap-3 min-w-0 w-full pr-10 sm:pr-12">
            <span className="font-mono text-sm text-base-content/60 shrink-0">{task.id}</span>
            <span className="text-base-content truncate">{task.title}</span>
        </div>
    );

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={modalTitle}
                size="full"
            >
                <div className="flex flex-col gap-4">
                    <BackButton
                        className="self-start -ml-1"
                        onClick={onClose}
                        aria-label="Voltar para a lista de tarefas"
                    />
                    <div className="flex flex-wrap gap-2 p-1.5 bg-base-200 rounded-xl w-full overflow-x-auto" role="tablist" aria-label="Seções da tarefa">
                        {sectionTabs.map((tab) => {
                            const isActive = tab.id === activeSection;
                            const tabId = `task-${safeDomId}-tab-${tab.id}`;
                            const panelId = `task-${safeDomId}-panel-${tab.id}`;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    id={tabId}
                                    role="tab"
                                    aria-selected={isActive}
                                    aria-controls={panelId}
                                    className={`px-2 py-1 text-xs rounded-xl font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-sm ${isActive ? 'bg-brand-orange-selected text-white shadow-md shadow-brand-orange-selected/20 hover:bg-brand-orange-selected-hover' : 'text-base-content/70 hover:text-base-content hover:bg-base-200'}`}
                                    onClick={(e) => { e.stopPropagation(); setActiveSection(tab.id); }}
                                >
                                    <span>{tab.label}</span>
                                    {typeof tab.badge === 'number' && tab.badge > 0 ? (
                                        <Badge
                                            size="xs"
                                            appearance="pill"
                                            variant={isActive ? 'default' : 'neutral'}
                                            className={`ml-2 ${isActive ? 'bg-white/20 text-white border-0' : ''}`}
                                        >
                                            {tab.badge}
                                        </Badge>
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>

                    <div
                        id={`task-${safeDomId}-panel-${activeSection}`}
                        role="tabpanel"
                        aria-labelledby={`task-${safeDomId}-tab-${activeSection}`}
                        className="overflow-x-hidden"
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.div
                                key={activeSection}
                                initial={
                                    reduceMotion ? false : { opacity: 0, x: sectionEnterDirection * 28 }
                                }
                                animate={{ opacity: 1, x: 0 }}
                                exit={
                                    reduceMotion ? undefined : { opacity: 0, x: sectionEnterDirection * -28 }
                                }
                                transition={{
                                    duration: reduceMotion ? 0 : 0.22,
                                    ease: [0.25, 1, 0.5, 1],
                                }}
                            >
                                {renderSectionContent()}
                                {renderNavigationFooter()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </Modal>

            <TestReportModal
                isOpen={showTestReport}
                onClose={() => setShowTestReport(false)}
                task={task}
            />

            {/* Modal de Visualização de Anexo do Jira */}
            {viewingJiraAttachment && viewingJiraAttachment.content && (
                <FileViewer
                    content={viewingJiraAttachment.content}
                    fileName={viewingJiraAttachment.filename}
                    mimeType={viewingJiraAttachment.mimeType}
                    onClose={() => setViewingJiraAttachment(null)}
                    showDownload={true}
                    showViewInNewTab={true}
                />
            )}
            {viewingJiraAttachment && !viewingJiraAttachment.content && detectFileType(viewingJiraAttachment.filename, viewingJiraAttachment.mimeType) === 'image' && (
                <ImageModal
                    url={viewingJiraAttachment.url}
                    fileName={viewingJiraAttachment.filename}
                    onClose={() => setViewingJiraAttachment(null)}
                    fetchImage={() => fetchJiraAttachmentAsDataUrl(viewingJiraAttachment)}
                />
            )}
        </>
    );
};

