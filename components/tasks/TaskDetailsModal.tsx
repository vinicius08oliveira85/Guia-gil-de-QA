import React, { useEffect, useMemo, useState } from 'react';
import { JiraTask, BddScenario, TestCaseDetailLevel, Project, TestCase } from '../../types';
import { Modal } from '../common/Modal';
import { Spinner } from '../common/Spinner';
import { PlusIcon, RefreshIcon } from '../common/Icons';
import { BddScenarioForm, BddScenarioItem } from './BddScenario';
import { TestCaseItem } from './TestCaseItem';
import { TestStrategyCard } from './TestStrategyCard';
import { ToolsSelector } from './ToolsSelector';
import { TestReportModal } from './TestReportModal';
import { CommentSection } from '../common/CommentSection';
import { DependencyManager } from '../common/DependencyManager';
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
import { FileViewer } from '../common/FileViewer';
import { ImageModal } from '../common/ImageModal';
import { canViewInBrowser, detectFileType } from '../../services/fileViewerService';
import { JiraAttachment } from './JiraAttachment';
import { JiraRichContent } from './JiraRichContent';
import { Button } from '../common/Button';
import { Sparkles } from 'lucide-react';

type DetailSection = 'overview' | 'bdd' | 'tests' | 'planning' | 'collaboration' | 'links';
type TestSubSection = 'strategy' | 'test-cases';

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
    project?: Project;
    onUpdateProject?: (project: Project) => void;
    onOpenTask?: (task: JiraTask) => void;
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
    project,
    onUpdateProject,
    onOpenTask,
}) => {
    const [editingBddScenario, setEditingBddScenario] = useState<BddScenario | null>(null);
    const [isCreatingBdd, setIsCreatingBdd] = useState(false);
    const [detailLevel, setDetailLevel] = useState<TestCaseDetailLevel>('Padrão');
    const [showDependencies, setShowDependencies] = useState(false);
    const [showAttachments, setShowAttachments] = useState(false);
    const [showEstimation, setShowEstimation] = useState(false);
    const [showTestReport, setShowTestReport] = useState(false);
    const [viewingJiraAttachment, setViewingJiraAttachment] = useState<{ id: string; filename: string; url: string; mimeType: string; content?: string } | null>(null);
    const [loadingJiraAttachmentId, setLoadingJiraAttachmentId] = useState<string | null>(null);
    const [activeSection, setActiveSection] = useState<DetailSection>('overview');
    const [activeTestSubSection, setActiveTestSubSection] = useState<TestSubSection>('strategy');
    const nextStep = getNextStepForTask(task);
    const hasTests = task.testCases && task.testCases.length > 0;
    const safeDomId = useMemo(() => task.id.replace(/[^a-zA-Z0-9_-]/g, '_'), [task.id]);

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
            const planningBadge = (task.dependencies?.length || 0) + (task.attachments?.length || 0) + (task.checklist?.length || 0) + (task.estimatedHours ? 1 : 0);
            tabs.push({ id: 'planning', label: 'Planejamento', badge: planningBadge });
        }

        if (project && onUpdateProject) {
            const dependenciesCount = task.dependencies?.length || 0;
            const dependentsCount = getTaskDependents(task.id, project).length;
            const linksBadge = dependenciesCount + dependentsCount;
            tabs.push({ id: 'links', label: '🔗 Vínculos', badge: linksBadge > 0 ? linksBadge : undefined });
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
        project?.tasks
    ]);

    useEffect(() => {
        if (!isOpen) return;
        const currentTabExists = sectionTabs.some(tab => tab.id === activeSection);
        if (!currentTabExists) {
            const next = sectionTabs[0]?.id ?? 'overview';
            if (next !== activeSection) setActiveSection(next);
            return;
        }
        if ((activeSection === 'tests' || activeSection === 'bdd') && task.type !== 'Tarefa' && task.type !== 'Bug') {
            if (activeSection !== 'overview') setActiveSection('overview');
        }
    }, [isOpen, sectionTabs, activeSection, task.type]);

    const handleSaveScenario = (scenario: Omit<BddScenario, 'id'>) => {
        onSaveBddScenario(task.id, scenario, editingBddScenario?.id);
        setEditingBddScenario(null);
        setIsCreatingBdd(false);
    };

    const handleCancelBddForm = () => {
        setEditingBddScenario(null);
        setIsCreatingBdd(false);
    };

    const handleViewJiraAttachment = async (attachment: { id: string; filename: string; url: string; mimeType: string }) => {
        const isImage = detectFileType(attachment.filename, attachment.mimeType) === 'image';
        setLoadingJiraAttachmentId(attachment.id);
        try {
            // Fazer fetch do anexo através do proxy do Jira se necessário
            const jiraConfig = getJiraConfig();
            if (!jiraConfig) {
                if (isImage) {
                    setViewingJiraAttachment({ ...attachment });
                } else {
                    window.open(attachment.url, '_blank');
                }
                setLoadingJiraAttachmentId(null);
                return;
            }

            // Tentar fazer fetch do anexo
            const endpoint = `/secure/attachment/${attachment.id}/${encodeURIComponent(attachment.filename)}`;
            const response = await fetch('/api/jira-proxy', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    url: jiraConfig.url,
                    email: jiraConfig.email,
                    apiToken: jiraConfig.apiToken,
                    endpoint,
                    method: 'GET',
                }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                    setViewingJiraAttachment({
                        ...attachment,
                        content: reader.result as string
                    });
                    setLoadingJiraAttachmentId(null);
                };
                reader.readAsDataURL(blob);
            } else {
                if (isImage) {
                    setViewingJiraAttachment({ ...attachment });
                } else {
                    window.open(attachment.url, '_blank');
                }
                setLoadingJiraAttachmentId(null);
            }
        } catch (error) {
            if (isImage) {
                setViewingJiraAttachment({ ...attachment });
            } else {
                window.open(attachment.url, '_blank');
            }
            setLoadingJiraAttachmentId(null);
        }
    };

    const hasJiraSidebarFields = /^[A-Z]+-\d+$/.test(task.id) && (
        task.dueDate || task.timeTracking || task.components || task.fixVersions ||
        task.environment || task.reporter || task.watchers || task.issueLinks
    );

    const renderOverviewSection = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Coluna principal */}
            <div className="lg:col-span-2 space-y-3">
                {/* Cartões de resumo no topo */}
                {(task.priority || task.severity || task.owner || task.assignee || nextStep) && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {task.owner && (
                            <div className="p-3 bg-base-100 border border-base-300 rounded-xl shadow-sm">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-base-content/60 block mb-1">Owner</p>
                                <p className="text-sm font-medium text-base-content">{task.owner}</p>
                            </div>
                        )}
                        {task.assignee && (
                            <div className="p-3 bg-base-100 border border-base-300 rounded-xl shadow-sm">
                                <p className="text-[10px] uppercase tracking-wider font-bold text-base-content/60 block mb-1">Responsável</p>
                                <p className="text-sm font-medium text-base-content">{task.assignee}</p>
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

                {task.jiraAttachments && task.jiraAttachments.length > 0 && (
                    <section className="space-y-2">
                        <h3 className="text-sm font-bold text-base-content/70 uppercase tracking-wide">Anexos do Jira</h3>
                        <div className="p-3 bg-base-100 border border-base-300 rounded-xl">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {task.jiraAttachments.map((att) => {
                                    const jiraConfig = getJiraConfig();
                                    const jiraUrl = jiraConfig?.url;
                                    const attachmentUrl = jiraUrl ? `${jiraUrl}/secure/attachment/${att.id}/${encodeURIComponent(att.filename)}` : '';
                                    const fileType = detectFileType(att.filename, '');
                                    let mimeType: string | undefined;
                                    if (fileType === 'pdf') mimeType = 'application/pdf';
                                    else if (fileType === 'image') {
                                        const ext = att.filename.toLowerCase().split('.').pop();
                                        if (ext === 'png') mimeType = 'image/png';
                                        else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
                                        else if (ext === 'gif') mimeType = 'image/gif';
                                        else if (ext === 'webp') mimeType = 'image/webp';
                                        else mimeType = 'image/*';
                                    } else if (fileType === 'text') mimeType = 'text/plain';
                                    else if (fileType === 'json') mimeType = 'application/json';
                                    else if (fileType === 'csv') mimeType = 'text/csv';
                                    return (
                                        <JiraAttachment
                                            key={att.id}
                                            id={att.id}
                                            url={attachmentUrl}
                                            filename={att.filename}
                                            mimeType={mimeType}
                                            size={att.size}
                                            onView={handleViewJiraAttachment}
                                            isLoading={loadingJiraAttachmentId === att.id}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}
            </div>

            {/* Sidebar: Campos do Jira + Ações Rápidas */}
            <aside className="space-y-4">
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
                        className={`px-2 py-1 text-xs rounded-xl font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-sm ${activeTestSubSection === 'strategy' ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/20' : 'text-base-content/70 hover:text-base-content hover:bg-base-200'}`}
                    >
                        Estratégia
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={activeTestSubSection === 'test-cases'}
                        onClick={() => setActiveTestSubSection('test-cases')}
                        className={`px-2 py-1 text-xs rounded-xl font-medium transition-colors flex items-center gap-1 sm:px-3 sm:py-1.5 sm:text-sm ${activeTestSubSection === 'test-cases' ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/20' : 'text-base-content/70 hover:text-base-content hover:bg-base-200'}`}
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
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-lg font-semibold text-base-content">Estratégia de Teste</h3>
                            <span className="text-xs text-base-content/70">{task.testStrategy?.length || 0} item(ns)</span>
                        </div>
                        {isGenerating && <div className="flex justify-center py-2"><Spinner small /></div>}
                        {(task.testStrategy?.length ?? 0) > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
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
                    <div>
                        <div className="flex items-center justify-between gap-2">
                            <h3 className="text-lg font-semibold text-base-content">Casos de Teste</h3>
                            <span className="text-xs text-base-content/70">{task.testCases?.length || 0} caso(s)</span>
                        </div>
                        {isGenerating ? (
                            <div className="space-y-3 mt-4">
                                <LoadingSkeleton variant="task" count={3} />
                                <div className="flex flex-col items-center justify-center py-4">
                                    <Spinner small />
                                    <p className="mt-2 text-sm text-base-content/70">Gerando casos de teste com IA...</p>
                                    <p className="mt-1 text-xs text-base-content/70">⏱️ Isso pode levar 10-30 segundos</p>
                                </div>
                            </div>
                        ) : (task.testCases || []).length > 0 ? (
                            <div className="space-y-3 mt-4">
                                {task.testCases.map(tc => (
                                    <TestCaseItem 
                                        key={tc.id} 
                                        testCase={tc} 
                                        onStatusChange={(status) => onTestCaseStatusChange(tc.id, status)}
                                        onToggleAutomated={(isAutomated) => onToggleTestCaseAutomated(tc.id, isAutomated)}
                                        onExecutedStrategyChange={(strategies) => onExecutedStrategyChange(tc.id, strategies)}
                                        onToolsChange={onTestCaseToolsChange ? (tools) => onTestCaseToolsChange(tc.id, tools) : undefined}
                                        onEdit={onEditTestCase ? () => onEditTestCase(task.id, tc) : undefined}
                                        onDelete={onDeleteTestCase ? () => onDeleteTestCase(task.id, tc.id) : undefined}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="mt-4">
                                <EmptyState
                                    icon="🧪"
                                    title="Nenhum caso de teste ainda"
                                    description="Comece gerando casos de teste com IA ou adicione manualmente."
                                    action={{
                                        label: "Gerar com IA",
                                        onClick: () => onGenerateTests(task.id, detailLevel)
                                    }}
                                    secondaryAction={onAddTestCaseFromTemplate ? {
                                        label: "Usar Template",
                                        onClick: () => {
                                            onAddTestCaseFromTemplate(task.id);
                                        }
                                    } : undefined}
                                />
                            </div>
                        )}
                    </div>
                )}

                {onTaskToolsChange && (
                    <div className="mt-4 p-3 bg-base-100 rounded-[var(--rounded-box)] border border-base-300">
                        <ToolsSelector
                            selectedTools={task.toolsUsed || []}
                            onToolsChange={onTaskToolsChange}
                            label="Ferramentas Utilizadas (Geral)"
                            compact={false}
                        />
                    </div>
                )}

                {!isGenerating && (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                        <Button variant="brand" size="panelSm" onClick={() => onGenerateTests(task.id, detailLevel)}>
                            {hasTests ? <RefreshIcon /> : <PlusIcon />}
                            {hasTests ? 'Regerar com IA' : 'Gerar com IA'}
                        </Button>
                        <div className="flex-1">
                            <label htmlFor={`detail-level-${task.id}`} className="block text-sm text-base-content/70 mb-1">Nível de Detalhe</label>
                            <select
                                id={`detail-level-${task.id}`}
                                value={detailLevel}
                                onChange={(e) => setDetailLevel(e.target.value as TestCaseDetailLevel)}
                                className="select select-bordered select-sm w-full"
                            >
                                <option value="Padrão">Padrão</option>
                                <option value="Resumido">Resumido</option>
                                <option value="Detalhado">Detalhado</option>
                            </select>
                        </div>
                    </div>
                )}
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
            <div className="space-y-4">
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-base-content">Dependências</h3>
                        <button
                            onClick={() => setShowDependencies(!showDependencies)}
                            className="text-sm text-primary hover:opacity-80"
                        >
                            {showDependencies ? 'Ocultar' : 'Gerenciar'}
                        </button>
                    </div>
                    {showDependencies && (
                        <DependencyManager
                            task={task}
                            project={project}
                            onUpdateProject={onUpdateProject}
                            onClose={() => setShowDependencies(false)}
                        />
                    )}
                </div>

                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-base-content">Anexos</h3>
                        <button
                            onClick={() => setShowAttachments(!showAttachments)}
                            className="text-sm text-primary hover:opacity-80"
                        >
                            {showAttachments ? 'Ocultar' : 'Gerenciar'}
                        </button>
                    </div>
                    {showAttachments && (
                        <AttachmentManager
                            task={task}
                            project={project}
                            onUpdateProject={onUpdateProject}
                            onClose={() => setShowAttachments(false)}
                        />
                    )}
                </div>

                <div>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-base-content">Estimativas</h3>
                        <button
                            onClick={() => setShowEstimation(!showEstimation)}
                            className="text-sm text-primary hover:opacity-80"
                        >
                            {showEstimation ? 'Ocultar' : task.estimatedHours ? 'Editar' : 'Adicionar'}
                        </button>
                    </div>
                    {showEstimation && (
                        <EstimationInput
                            task={task}
                            onSave={(estimatedHours, actualHours) => {
                                const updatedTasks = project.tasks.map(t =>
                                    t.id === task.id
                                        ? { ...t, estimatedHours, actualHours }
                                        : t
                                );
                                onUpdateProject({ ...project, tasks: updatedTasks });
                                setShowEstimation(false);
                            }}
                            onCancel={() => setShowEstimation(false)}
                        />
                    )}
                    {!showEstimation && task.estimatedHours && (
                        <div className="p-3 bg-base-100 border border-base-300 rounded-xl">
                            <div className="flex items-center justify-between">
                                <span className="text-base-content/70">Estimado:</span>
                                <span className="font-semibold text-base-content">{task.estimatedHours}h</span>
                            </div>
                            {task.actualHours && (
                                <>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-base-content/70">Real:</span>
                                        <span className={`font-semibold ${
                                            task.actualHours <= task.estimatedHours ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'
                                        }`}>
                                            {task.actualHours}h
                                        </span>
                                    </div>
                                    <div className="mt-2 text-xs text-base-content/70">
                                        {task.actualHours <= task.estimatedHours
                                            ? `✅ Dentro do estimado (${task.estimatedHours - task.actualHours}h restantes)`
                                            : `⚠️ Acima do estimado (+${task.actualHours - task.estimatedHours}h)`
                                        }
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {task.checklist && task.checklist.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold text-base-content mb-3">Checklist</h3>
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
                    </div>
                )}
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

    const renderLinksSection = () => {
        if (!project || !onUpdateProject) {
            return (
                <p className="text-sm text-base-content/70">Conecte um projeto para visualizar vínculos e dependências.</p>
            );
        }

        return (
            <TaskLinksView
                task={task}
                project={project}
                onUpdateProject={onUpdateProject}
                onOpenTask={onOpenTask}
            />
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
            case 'planning':
                return renderPlanningSection();
            case 'links':
                return renderLinksSection();
            case 'collaboration':
                return renderCollaborationSection();
            default:
                return null;
        }
    };

    const modalTitle = (
        <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-base-content/60">{task.id}</span>
            <span className="text-base-content">{task.title}</span>
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
                                    className={`px-2 py-1 text-xs rounded-xl font-medium transition-colors sm:px-3 sm:py-1.5 sm:text-sm ${isActive ? 'bg-brand-orange text-white shadow-md shadow-brand-orange/20' : 'text-base-content/70 hover:text-base-content hover:bg-base-200'}`}
                                    onClick={(e) => { e.stopPropagation(); setActiveSection(tab.id); }}
                                >
                                    <span>{tab.label}</span>
                                    {typeof tab.badge === 'number' && tab.badge > 0 ? (
                                        <span className={`ml-2 px-1.5 py-0.5 rounded-md text-xs font-medium ${isActive ? 'bg-white/20' : 'bg-base-300 text-base-content'}`}>
                                            {tab.badge}
                                        </span>
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>

                    {(task.type === 'Tarefa' || task.type === 'Bug') && onGenerateAll && (
                        <div className="flex justify-end">
                            <Button
                                type="button"
                                variant="brand"
                                size="panel"
                                onClick={() => onGenerateAll(task.id)}
                                disabled={isGeneratingAll || isGenerating || isGeneratingBdd}
                            >
                                {isGeneratingAll ? (
                                    <>
                                        <Spinner small />
                                        Gerando...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        Gerar Tudo
                                    </>
                                )}
                            </Button>
                        </div>
                    )}

                    <div
                        id={`task-${safeDomId}-panel-${activeSection}`}
                        role="tabpanel"
                        aria-labelledby={`task-${safeDomId}-tab-${activeSection}`}
                    >
                        {renderSectionContent()}
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

