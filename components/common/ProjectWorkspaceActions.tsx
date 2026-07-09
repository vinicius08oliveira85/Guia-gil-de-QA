import React, { useCallback, useState } from 'react';
import type { Project } from '../../types';
import { useProjectsStore } from '../../store/projectsStore';
import { useJiraSync } from '../../hooks/useJiraSync';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { FileExportModal } from './FileExportModal';
import { FileImportModal } from './FileImportModal';
import { ConfirmDialog } from './ConfirmDialog';
import { Modal } from './Modal';
import { AppSelect } from './AppSelect';
import { Spinner } from './Spinner';
import { JiraBrandIcon } from './JiraBrandIcon';
import { cn } from '../../utils/cn';
import {
  projectChromeSyncBtnClass,
  projectChromeDangerBtnClass,
  projectChromeToolbarDividerClass,
} from '../tasks/tasksPanelNeuStyles';
import {
  projectCardActionBtnClass,
  projectCardActionBtnDangerClass,
  projectCardActionDividerClass,
  projectCardActionTrackClass,
} from './projectCardUi';
import { normalizeProjectWorkflow } from '../../utils/projectWorkflow';
import {
  CheckCircle2,
  Download,
  Loader2,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';
import toast from 'react-hot-toast';

export interface ProjectWorkspaceActionsProps {
  project: Project;
  /** toolbar = barra do ProjectView; card = rodapé do card na listagem. */
  variant: 'toolbar' | 'card';
  /** Exibir exclusão (somente no card, conforme UX solicitada). */
  showDelete?: boolean;
  onDeleteProject?: () => void | Promise<void>;
  className?: string;
}

export const ProjectWorkspaceActions: React.FC<ProjectWorkspaceActionsProps> = ({
  project,
  variant,
  showDelete = false,
  onDeleteProject,
  className,
}) => {
  const saveProjectLocally = useProjectsStore(s => s.saveProjectLocally);
  const updateProject = useProjectsStore(s => s.updateProject);
  const { handleError, handleSuccess } = useErrorHandler();

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isDev = normalizeProjectWorkflow(project.workflow) === 'dev';

  const {
    handleSyncJira,
    isSyncingJira,
    showJiraProjectSelector,
    setShowJiraProjectSelector,
    availableJiraProjects,
    selectedJiraProjectKey,
    setSelectedJiraProjectKey,
    handleConfirmJiraProject,
  } = useJiraSync(project, updateProject);

  const btnClass =
    variant === 'toolbar' ? projectChromeSyncBtnClass : projectCardActionBtnClass;
  const dangerClass =
    variant === 'toolbar' ? projectChromeDangerBtnClass : projectCardActionBtnDangerClass;
  const dividerClass =
    variant === 'toolbar' ? projectChromeToolbarDividerClass : projectCardActionDividerClass;
  const trackClass =
    variant === 'toolbar'
      ? 'flex flex-wrap items-center gap-0'
      : cn(projectCardActionTrackClass, 'mt-3 w-full');

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      await saveProjectLocally(project.id);
      setSaveStatus('saved');
      toast.success(`Projeto "${project.name}" salvo localmente!`);
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      handleError(error, 'Salvar projeto');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  }, [project.id, project.name, saveProjectLocally, handleError]);

  const handleImportTasks = useCallback(
    (tasks: Project['tasks']) => {
      const merged = [...(project.tasks ?? []), ...tasks];
      void updateProject({ ...project, tasks: merged });
      handleSuccess(`${tasks.length} tarefa(s) importada(s) para o projeto.`);
    },
    [project, updateProject, handleSuccess]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!onDeleteProject) return;
    setIsDeleting(true);
    try {
      await onDeleteProject();
      setShowDeleteConfirm(false);
    } catch (error) {
      handleError(error, 'Excluir projeto');
    } finally {
      setIsDeleting(false);
    }
  }, [onDeleteProject, handleError]);

  const busy = isSaving || isSyncingJira || isDeleting;

  const actionButtons = (
    <>
      <button
        type="button"
        onClick={() => void handleSave()}
        disabled={busy}
        className={btnClass}
        aria-label={`Salvar projeto ${project.name} localmente`}
        title="Salvar apenas este projeto"
      >
        {isSaving ? (
          <Spinner size="sm" />
        ) : saveStatus === 'saved' ? (
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
        ) : (
          <Save className="h-3.5 w-3.5 shrink-0" aria-hidden />
        )}
        <span className={variant === 'card' ? 'text-xs' : 'hidden sm:inline'}>Salvar</span>
      </button>

      <button
        type="button"
        onClick={() => setShowImportModal(true)}
        disabled={busy}
        className={btnClass}
        aria-label="Importar tarefas para este projeto"
        title="Importar tarefas (CSV/Excel) neste projeto"
      >
        <Upload className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className={variant === 'card' ? 'text-xs' : 'hidden sm:inline'}>Importar</span>
      </button>

      <button
        type="button"
        onClick={() => setShowExportModal(true)}
        disabled={busy}
        className={btnClass}
        aria-label="Exportar este projeto"
        title="Exportar dados deste projeto"
      >
        <Download className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className={variant === 'card' ? 'text-xs' : 'hidden sm:inline'}>Exportar</span>
      </button>

      <button
        type="button"
        onClick={() => void handleSyncJira()}
        disabled={busy}
        className={btnClass}
        aria-label="Atualizar tarefas deste projeto a partir do Jira"
        title="Atualizar tarefas do Jira neste projeto"
      >
        {isSyncingJira ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" aria-hidden />
        ) : (
          <JiraBrandIcon className="h-3.5 w-3.5 shrink-0" />
        )}
        <span className={variant === 'card' ? 'text-xs' : 'hidden sm:inline'}>Jira</span>
      </button>

      {showDelete && onDeleteProject ? (
        <>
          <span className={dividerClass} aria-hidden />
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={busy}
            className={dangerClass}
            aria-label={`Excluir projeto ${project.name}`}
            title="Excluir este projeto"
          >
            <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className={variant === 'card' ? 'text-xs' : 'hidden sm:inline'}>Excluir</span>
          </button>
        </>
      ) : null}
    </>
  );

  return (
    <>
      <div
        className={cn(trackClass, className)}
        role="toolbar"
        aria-label={`Ações do projeto ${project.name}`}
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        {variant === 'toolbar' && saveStatus !== 'idle' ? (
          <>
            <div className="flex items-center gap-1.5 px-2 text-xs" role="status" aria-live="polite">
              {saveStatus === 'saving' && (
                <>
                  <Spinner size="sm" />
                  <span className="hidden text-info sm:inline">Salvando…</span>
                </>
              )}
              {saveStatus === 'saved' && (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" aria-hidden />
                  <span className="hidden text-success sm:inline">Salvo</span>
                </>
              )}
              {saveStatus === 'error' && (
                <span className="hidden text-error sm:inline">Erro ao salvar</span>
              )}
            </div>
            <span className={dividerClass} aria-hidden />
          </>
        ) : null}
        {actionButtons}
      </div>

      <FileExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        exportType="project"
        project={project}
        devMode={isDev}
      />

      <FileImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        importType="tasks"
        onImportTasks={handleImportTasks}
      />

      <Modal
        isOpen={showJiraProjectSelector}
        onClose={() => {
          setShowJiraProjectSelector(false);
          setSelectedJiraProjectKey('');
        }}
        title="Selecionar Projeto do Jira"
      >
        <div className="space-y-4">
          <p className="text-sm text-base-content/70">
            Selecione o projeto do Jira para atualizar as tarefas de{' '}
            <strong className="font-semibold">{project.name}</strong>:
          </p>
          <div>
            <label className="mb-2 block text-sm font-medium text-base-content">Projeto Jira</label>
            <AppSelect
              value={selectedJiraProjectKey}
              onChange={v => setSelectedJiraProjectKey(v)}
              className="select select-bordered w-full"
            >
              <option value="">Selecione um projeto…</option>
              {availableJiraProjects.map(proj => (
                <option key={proj.key} value={proj.key}>
                  {proj.name} ({proj.key})
                </option>
              ))}
            </AppSelect>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setShowJiraProjectSelector(false);
                setSelectedJiraProjectKey('');
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={!selectedJiraProjectKey || isSyncingJira}
              onClick={() => void handleConfirmJiraProject()}
            >
              {isSyncingJira ? 'Atualizando…' : 'Atualizar tarefas'}
            </button>
          </div>
        </div>
      </Modal>

      {showDelete && onDeleteProject ? (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => void handleConfirmDelete()}
          title={`Excluir "${project.name}"`}
          message="Esta ação não pode ser desfeita. Todas as tarefas, documentos e dados deste projeto serão removidos."
          confirmText="Sim, excluir"
          cancelText="Cancelar"
          variant="danger"
        />
      ) : null}
    </>
  );
};

ProjectWorkspaceActions.displayName = 'ProjectWorkspaceActions';
