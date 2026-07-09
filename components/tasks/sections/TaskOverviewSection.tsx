import React, { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Sparkles,
  Download,
  Zap,
  User,
  UserCircle2,
  Flag,
  ShieldAlert,
  CalendarDays,
  CalendarClock,
  Server,
  ArrowRight,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { getDisplayPriorityLabel } from '../../../utils/taskHelpers';
import { getNextStepForTask } from '../../../utils/taskPhaseHelper';
import { getTagColor, getTaskVersions } from '../../../utils/tagService';
import { parseJiraDescriptionHTML } from '../../../utils/jiraDescriptionParser';
import { getJiraConfig } from '../../../services/jiraService';
import { JiraTaskSlaSummary } from '../JiraTaskSlaSummary';
import {
  TaskSummaryCommentsSection,
  JiraFilasExtraFieldsGrid,
} from '../JiraFilasSummarySections';
import { TaskAttachedFormsSection } from '../TaskAttachedFormsSection';
import { JiraAttachment } from '../JiraAttachment';
import { JiraRichContent } from '../JiraRichContent';
import { VersionBadges } from '../VersionBadge';
import { QuickActions } from '../../common/QuickActions';
import { Button } from '../../common/Button';
import { Spinner } from '../../common/Spinner';
import {
  taskUiTagClass,
  taskUiTagInfoClass,
  taskUiTagSuccessClass,
} from '../taskActionLayout';
import {
  leveSettingsSectionIconWrapClass,
  leveTaskModalAvatarClass,
  leveTaskModalFieldLabelClass,
  leveTaskModalMutedClass,
  leveTaskModalMutedXsClass,
  leveTaskModalSectionHeaderClass,
  leveTaskModalSectionTitleClass,
  leveTaskModalStrongClass,
} from '../../common/projectCardUi';
import {
  taskDetailsModalDescriptionClass,
  taskDetailsModalJiraBtnClass,
  taskDetailsModalSectionClass,
  taskDetailsModalWatchersClass,
  taskDetailsOverviewGridClass,
  taskDetailsOverviewLabelClass,
  taskDetailsOverviewMainClass,
  taskDetailsOverviewSectionClass,
} from '../taskDetailsNeuUi';
import { testReportGenerateRecordBtnClass } from '../testReportNeuUi';
import { OverviewStatTile, priorityTone, severityTone } from '../TaskOverviewSummaryTiles';
import { useTaskDetail } from './TaskDetailContext';

/** Resolve o MIME type de um anexo pelo nome do arquivo. */
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

function formatRelativeTimestamp(iso?: string): string | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  return formatDistanceToNow(parsed, { addSuffix: true, locale: ptBR });
}

/** Renderiza a descrição rica do Jira com sanitização central. */
const DescriptionRenderer: React.FC<{
  description: string | unknown;
  jiraAttachments?: Array<{
    id: string;
    filename: string;
    size: number;
    created: string;
    author: string;
  }>;
}> = ({ description, jiraAttachments }) => {
  if (!description) {
    return <p className={cn(leveTaskModalMutedClass, 'italic')}>Sem descrição</p>;
  }
  const jiraConfig = getJiraConfig();
  const htmlContent = parseJiraDescriptionHTML(description, jiraConfig?.url, jiraAttachments);
  if (!htmlContent || htmlContent.trim() === '') {
    return <p className={cn(leveTaskModalMutedClass, 'italic')}>Sem descrição</p>;
  }
  return (
    <JiraRichContent
      html={htmlContent}
      className="prose-p:mb-1 prose-li:mb-0 prose-ul:my-1 prose-ol:my-1 leading-snug"
    />
  );
};

/** Aba «Resumo» do detalhe da tarefa: coluna principal + sidebar do Jira. */
export const TaskOverviewSection: React.FC = () => {
  const {
    task,
    project,
    onUpdateProject,
    hideTestFeatures,
    devMode,
    onGenerateDevGuidance,
    isGeneratingDevGuidance,
    detailLevel,
    isGenerating,
    isGeneratingBdd,
    isGeneratingAll,
    onUpdateFromJira,
    isUpdatingFromJira,
    onGenerateAll,
    onAddComment,
    onEditComment,
    onDeleteComment,
    onShowTestReport,
    onViewJiraAttachment,
    loadingJiraAttachmentId,
  } = useTaskDetail();
  const nextStep = getNextStepForTask(task);
  const jiraSyncedRelative = useMemo(
    () => formatRelativeTimestamp(task.jiraSyncedAt),
    [task.jiraSyncedAt]
  );
  const generateAllRelative = useMemo(
    () => formatRelativeTimestamp(task.testCasesGeneratedAt),
    [task.testCasesGeneratedAt]
  );
  const hideQaUi = hideTestFeatures || devMode;
  const showJiraSync = Boolean(onUpdateFromJira && /^[A-Z]+-\d+$/.test(task.id));
  const showGenerateAll = Boolean(onGenerateAll && !hideQaUi);
  const showDevGuidanceAction =
    devMode &&
    Boolean(onGenerateDevGuidance) &&
    (task.type === 'Tarefa' || task.type === 'Bug');
  const isAiBusy = Boolean(isGenerating || isGeneratingBdd || isGeneratingAll || isGeneratingDevGuidance);

  const jiraAttachmentItems = useMemo(() => {
    const jiraUrl = getJiraConfig()?.url ?? '';
    return (task.jiraAttachments ?? []).map(att => ({
      ...att,
      attachmentUrl: jiraUrl
        ? `${jiraUrl}/secure/attachment/${att.id}/${encodeURIComponent(att.filename)}`
        : '',
      mimeType: resolveMimeType(att.filename),
    }));
  }, [task.jiraAttachments]);

  const hasJiraSidebarFields = !!(
    task.dueDate ||
    task.timeTracking ||
    task.components ||
    task.fixVersions ||
    task.environment ||
    task.reporter ||
    task.watchers ||
    task.issueLinks ||
    task.jiraAttachments?.length
  );

  return (
    <div className={taskDetailsOverviewGridClass}>
      {/* Coluna principal */}
      <div className={taskDetailsOverviewMainClass}>
        {hideTestFeatures ? (
          <>
            <JiraTaskSlaSummary task={task} />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {task.reporter?.displayName ? (
                <OverviewStatTile icon={User} label="Relator" value={task.reporter.displayName} tone="neutral" />
              ) : null}
              {(task.jiraAssignee?.displayName ?? task.assignee) ? (
                <OverviewStatTile
                  icon={UserCircle2}
                  label="Responsável"
                  value={task.jiraAssignee?.displayName ?? task.assignee}
                  tone="accent"
                />
              ) : null}
              {task.createdAt ? (
                <OverviewStatTile
                  icon={CalendarDays}
                  label="Data de criação"
                  value={new Date(task.createdAt).toLocaleDateString('pt-BR')}
                  tone="neutral"
                />
              ) : null}
            </div>
            <JiraFilasExtraFieldsGrid task={task} />
          </>
        ) : null}

        {/* Cartões de resumo no topo */}
        {!hideTestFeatures &&
        (task.priority ||
          task.severity ||
          task.owner ||
          task.assignee ||
          task.jiraAssignee?.displayName ||
          nextStep) && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {task.owner && (
              <OverviewStatTile icon={User} label="Owner" value={task.owner} tone="neutral" />
            )}
            {(task.jiraAssignee?.displayName ?? task.assignee) && (
              <OverviewStatTile
                icon={UserCircle2}
                label="Responsável"
                value={task.jiraAssignee?.displayName ?? task.assignee}
                tone="accent"
              />
            )}
            {(task.priority || task.jiraPriority) && (
              <OverviewStatTile
                icon={Flag}
                label="Prioridade"
                value={getDisplayPriorityLabel(task, project)}
                tone={priorityTone(getDisplayPriorityLabel(task, project))}
              />
            )}
            {task.severity && (
              <OverviewStatTile
                icon={ShieldAlert}
                label="Severidade"
                value={task.severity}
                tone={severityTone(task.severity)}
              />
            )}
            {nextStep && (
              <OverviewStatTile
                icon={ArrowRight}
                label="Próximo passo"
                value={nextStep}
                tone="accent"
                emphasis
                title={nextStep}
              />
            )}
          </div>
        )}

        {!hideQaUi &&
        (task.type === 'Tarefa' || task.type === 'Bug') &&
          (task.testCases?.length > 0 || (task.testStrategy?.length ?? 0) > 0) && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onShowTestReport}
                className={testReportGenerateRecordBtnClass}
                aria-label="Gerar registro de testes"
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span>Gerar Registro de Testes</span>
              </button>
            </div>
          )}

        <section className={taskDetailsOverviewSectionClass}>
          <h3 className={taskDetailsOverviewLabelClass}>Descrição</h3>
          <div className={taskDetailsModalDescriptionClass}>
            {task.description ? (
              <DescriptionRenderer
                description={task.description}
                jiraAttachments={task.jiraAttachments}
              />
            ) : (
              <p className={cn(leveTaskModalMutedClass, 'italic')}>Sem descrição</p>
            )}
          </div>
        </section>

        <TaskAttachedFormsSection task={task} />

        {(hideTestFeatures || onAddComment || (task.comments?.length ?? 0) > 0) && (
          <TaskSummaryCommentsSection
            task={task}
            onAddComment={hideTestFeatures ? undefined : onAddComment}
            onEditComment={hideTestFeatures ? undefined : onEditComment}
            onDeleteComment={hideTestFeatures ? undefined : onDeleteComment}
          />
        )}

        {(() => {
          const versions = getTaskVersions(task);
          const otherTags = task.tags?.filter(tag => !/^V\d+/i.test(tag.trim())) || [];
          return (
            (versions.length > 0 || otherTags.length > 0) && (
              <div className="space-y-1.5">
                {versions.length > 0 && (
                  <div>
                    <p className={cn(taskDetailsOverviewLabelClass, 'mb-1 block')}>
                      Versão do Projeto
                    </p>
                    <VersionBadges versions={versions} size="md" />
                  </div>
                )}
                {otherTags.length > 0 && (
                  <div>
                    {versions.length > 0 && (
                      <p className={cn(taskDetailsOverviewLabelClass, 'mb-1 block')}>Tags</p>
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
            )
          );
        })()}

        {jiraAttachmentItems.length > 0 && (
          <section className={taskDetailsOverviewSectionClass}>
            <h3 className={taskDetailsOverviewLabelClass}>Anexos do Jira</h3>
            <div className={cn(taskDetailsModalSectionClass, 'p-2.5')}>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
                {jiraAttachmentItems.map(att => (
                  <JiraAttachment
                    key={att.id}
                    id={att.id}
                    url={att.attachmentUrl}
                    filename={att.filename}
                    mimeType={att.mimeType}
                    size={att.size}
                    onView={onViewJiraAttachment}
                    isLoading={loadingJiraAttachmentId === att.id}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Sidebar: Atualizar do Jira + Gerar Tudo + Campos do Jira + Ações Rápidas */}
      <aside className="space-y-3">
        {(showJiraSync || showGenerateAll || showDevGuidanceAction) && (
          <div className={cn(taskDetailsModalSectionClass, 'space-y-4 p-4')}>
            {showJiraSync && (
              <div>
                <Button
                  variant="brandOutline"
                  size="sm"
                  className={taskDetailsModalJiraBtnClass}
                  onClick={() => onUpdateFromJira!(task.id)}
                  disabled={!!isUpdatingFromJira}
                  aria-label="Atualizar somente esta tarefa do Jira"
                >
                  {isUpdatingFromJira ? <Spinner small /> : <Download className="h-4 w-4" aria-hidden />}
                  {isUpdatingFromJira ? 'Atualizando…' : 'Atualizar do Jira (só esta tarefa)'}
                </Button>
                <p className={cn(leveTaskModalMutedXsClass, 'mt-2')}>
                  Busca apenas esta tarefa no Jira, sem carregar o projeto inteiro.
                </p>
                {jiraSyncedRelative ? (
                  <p className={cn(leveTaskModalMutedXsClass, 'mt-1.5')} title={task.jiraSyncedAt}>
                    Última atualização {jiraSyncedRelative}
                  </p>
                ) : (
                  <p className={cn(leveTaskModalMutedXsClass, 'mt-1.5 italic')}>
                    Ainda não atualizado desta forma
                  </p>
                )}
              </div>
            )}

            {showJiraSync && showGenerateAll && (
              <div className="border-t border-[color-mix(in_srgb,var(--leve-purple)_12%,transparent)]" />
            )}

            {showGenerateAll && (
              <div>
                <Button
                  variant="brandOutline"
                  size="sm"
                  className={taskDetailsModalJiraBtnClass}
                  onClick={() => onGenerateAll!(task.id, detailLevel)}
                  disabled={isAiBusy}
                  aria-label="Gerar BDD, estratégias e casos de teste com IA"
                >
                  {isGeneratingAll ? <Spinner small /> : <Zap className="h-4 w-4" aria-hidden />}
                  {isGeneratingAll ? 'Gerando…' : 'Gerar Tudo'}
                </Button>
                <p className={cn(leveTaskModalMutedXsClass, 'mt-2')}>
                  Gera cenários BDD, estratégias de teste e casos de teste com IA.
                </p>
                {generateAllRelative ? (
                  <p className={cn(leveTaskModalMutedXsClass, 'mt-1.5')} title={task.testCasesGeneratedAt}>
                    Última geração {generateAllRelative}
                  </p>
                ) : (
                  <p className={cn(leveTaskModalMutedXsClass, 'mt-1.5 italic')}>Ainda não gerado com IA</p>
                )}
              </div>
            )}

            {showDevGuidanceAction && (
              <div>
                {(showJiraSync || showGenerateAll) && (
                  <div className="mb-4 border-t border-[color-mix(in_srgb,var(--leve-purple)_12%,transparent)]" />
                )}
                <Button
                  variant="brandOutline"
                  size="sm"
                  className={taskDetailsModalJiraBtnClass}
                  onClick={() => void onGenerateDevGuidance!(task.id)}
                  disabled={isAiBusy}
                  aria-label="Gerar guia de implementação com IA"
                >
                  {isGeneratingDevGuidance ? (
                    <Spinner small />
                  ) : (
                    <Sparkles className="h-4 w-4" aria-hidden />
                  )}
                  {isGeneratingDevGuidance ? 'Gerando…' : task.devGuidance ? 'Regenerar guia' : 'Gerar guia com IA'}
                </Button>
                <p className={cn(leveTaskModalMutedXsClass, 'mt-2')}>
                  Monta passos de implementação, ferramentas e dicas alinhados à stack do projeto.
                </p>
                {task.devGuidanceGeneratedAt ? (
                  <p className={cn(leveTaskModalMutedXsClass, 'mt-1.5')} title={task.devGuidanceGeneratedAt}>
                    Última geração{' '}
                    {formatRelativeTimestamp(task.devGuidanceGeneratedAt) ?? task.devGuidanceGeneratedAt}
                  </p>
                ) : (
                  <p className={cn(leveTaskModalMutedXsClass, 'mt-1.5 italic')}>
                    Ainda sem guia — abra a aba Guia Dev para ver o resultado
                  </p>
                )}
              </div>
            )}
          </div>
        )}
        {hasJiraSidebarFields && (
          <div className={cn(taskDetailsModalSectionClass, 'overflow-visible')}>
            <div className={leveTaskModalSectionHeaderClass}>
              <span className={leveSettingsSectionIconWrapClass}>
                <Sparkles className="h-5 w-5" aria-hidden />
              </span>
              <h2 className={leveTaskModalSectionTitleClass}>Campos do Jira</h2>
            </div>
            <div className="p-4 space-y-3">
              {(task.reporter || task.dueDate || task.environment) && (
                <div className="space-y-2">
                  <p className={cn(leveTaskModalFieldLabelClass, 'mb-1 block')}>Informações Básicas</p>
                  {task.reporter && (
                    <div className="flex items-center gap-3">
                      <div className={leveTaskModalAvatarClass}>
                        {task.reporter.displayName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className={cn('truncate text-sm font-semibold', leveTaskModalStrongClass)}>
                          {task.reporter.displayName}
                        </p>
                        {task.reporter.emailAddress && (
                          <p className={cn(leveTaskModalMutedXsClass, 'truncate')}>
                            {task.reporter.emailAddress}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  {task.dueDate && (
                    <OverviewStatTile
                      icon={CalendarClock}
                      label="Due date"
                      value={new Date(task.dueDate).toLocaleDateString('pt-BR')}
                      tone="warning"
                    />
                  )}
                  {task.environment && (
                    <OverviewStatTile
                      icon={Server}
                      label="Environment"
                      value={task.environment}
                      tone="neutral"
                    />
                  )}
                </div>
              )}

              {task.timeTracking &&
                (task.timeTracking.originalEstimate ||
                  task.timeTracking.remainingEstimate ||
                  task.timeTracking.timeSpent) && (
                  <div>
                    <p className={cn(leveTaskModalFieldLabelClass, 'mb-2 block')}>Time Tracking</p>
                    <div className={cn('space-y-1 text-[11px]', leveTaskModalMutedXsClass)}>
                      {task.timeTracking.originalEstimate && (
                        <p>Estimado: {task.timeTracking.originalEstimate}</p>
                      )}
                      {task.timeTracking.remainingEstimate && (
                        <p>Restando: {task.timeTracking.remainingEstimate}</p>
                      )}
                      {task.timeTracking.timeSpent && <p>Gasto: {task.timeTracking.timeSpent}</p>}
                    </div>
                  </div>
                )}

              {(task.issueLinks?.length || task.watchers) && (
                <div>
                  <p className={cn(leveTaskModalFieldLabelClass, 'mb-2 block')}>Relacionamentos</p>
                  {task.issueLinks && task.issueLinks.length > 0 && (
                    <div className="space-y-1 mb-2">
                      {task.issueLinks.map(link => (
                        <div key={link.id} className={cn('text-sm', leveTaskModalStrongClass)}>
                          <span className={leveTaskModalMutedXsClass}>{link.type}</span> {link.relatedKey}
                        </div>
                      ))}
                    </div>
                  )}
                  {task.watchers && (
                    <div className={taskDetailsModalWatchersClass}>
                      <p className={cn(leveTaskModalFieldLabelClass, '!text-[10px] !pb-0')}>
                        Observadores
                      </p>
                      <p className={cn('mt-0.5 text-xs font-medium', leveTaskModalStrongClass)}>
                        {task.watchers.watchCount} observador(es)
                        {task.watchers.isWatching && ' • Você está observando'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {(task.components?.length || task.fixVersions?.length) && (
                <div>
                  <p className={cn(leveTaskModalFieldLabelClass, 'mb-2 block')}>Organização</p>
                  <div className="flex flex-wrap gap-1.5">
                    {task.components?.map(comp => (
                      <span key={comp.id} className={cn(taskUiTagClass, taskUiTagInfoClass, 'px-2 py-0.5')}>
                        {comp.name}
                      </span>
                    ))}
                    {task.fixVersions?.map(version => (
                      <span key={version.id} className={cn(taskUiTagClass, taskUiTagSuccessClass, 'px-2 py-0.5')}>
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
          <div className={cn(taskDetailsModalSectionClass, 'p-4')}>
            <h4 className={cn(leveTaskModalSectionTitleClass, 'mb-3')}>Ações Rápidas</h4>
            <QuickActions
              task={task}
              project={project}
              onUpdateProject={onUpdateProject}
              devMode={devMode}
            />
          </div>
        )}
      </aside>
    </div>
  );
};

TaskOverviewSection.displayName = 'TaskOverviewSection';
