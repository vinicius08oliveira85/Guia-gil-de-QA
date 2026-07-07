import React from 'react';
import { Link, Paperclip, Timer } from 'lucide-react';
import { cn } from '../../../utils/cn';
import { updateChecklistItem } from '../../../utils/checklistService';
import { AttachmentManager } from '../../common/AttachmentManager';
import { ChecklistView } from '../../common/ChecklistView';
import { EstimationInput } from '../../common/EstimationInput';
import { TaskLinksView } from '../TaskLinksView';
import {
  leveTaskModalFieldLabelClass,
  leveTaskModalMutedClass,
  leveTaskModalPageTitleClass,
  leveTaskModalTabBadgeIdleClass,
} from '../../common/projectCardUi';
import { taskDetailsModalSectionClass } from '../taskDetailsNeuUi';
import { useTaskDetail } from './TaskDetailContext';

const CARD_TITLE_CLASS = cn(
  leveTaskModalFieldLabelClass,
  'mb-3 flex items-center gap-2 !border-b-0 !pb-0 normal-case tracking-normal'
);

/** Aba «Planejamento»: dependências, anexos, checklist e estimativas. */
export const TaskPlanningSection: React.FC = () => {
  const { task, project, onUpdateProject, onOpenTask } = useTaskDetail();
  if (!project || !onUpdateProject) {
    return (
      <p className={leveTaskModalMutedClass}>
        Conecte um projeto para gerenciar dependências e planejamento.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <header className={cn(taskDetailsModalSectionClass, 'p-4')}>
        <h2 className={leveTaskModalPageTitleClass}>Planejamento</h2>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12">
        <div className="min-w-0 space-y-3 sm:space-y-4 lg:col-span-7">
          <section className={cn(taskDetailsModalSectionClass, 'p-3 sm:p-4')}>
            <h2 className={CARD_TITLE_CLASS}>
              <Link className="h-4 w-4 shrink-0 text-[var(--leve-header-accent)] sm:h-5 sm:w-5" aria-hidden />
              Dependências
            </h2>
            <TaskLinksView
              task={task}
              project={project}
              onUpdateProject={onUpdateProject}
              onOpenTask={onOpenTask}
            />
          </section>

          <section className={cn(taskDetailsModalSectionClass, 'p-3 sm:p-4')}>
            <h2 className={CARD_TITLE_CLASS}>
              <Paperclip className="h-4 w-4 shrink-0 text-[var(--leve-header-accent)] sm:h-5 sm:w-5" aria-hidden />
              Anexos
              <span
                className={cn(
                  leveTaskModalTabBadgeIdleClass,
                  'rounded-full px-2 py-0.5 font-normal normal-case'
                )}
              >
                {task.attachments?.length ?? 0}
              </span>
            </h2>
            <AttachmentManager task={task} project={project} onUpdateProject={onUpdateProject} compact />
          </section>

          {task.checklist && task.checklist.length > 0 && (
            <section className={cn(taskDetailsModalSectionClass, 'p-3 sm:p-4')}>
              <h2 className={CARD_TITLE_CLASS}>Checklist</h2>
              <ChecklistView
                checklist={task.checklist}
                onToggleItem={itemId => {
                  const updatedChecklist = updateChecklistItem(task.checklist!, itemId, {
                    checked: !task.checklist!.find(i => i.id === itemId)?.checked,
                  });
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
          <section className={cn(taskDetailsModalSectionClass, 'sticky top-20 p-3 sm:p-4 lg:top-24')}>
            <h2 className={CARD_TITLE_CLASS}>
              <Timer className="h-4 w-4 shrink-0 text-[var(--leve-header-accent)] sm:h-5 sm:w-5" aria-hidden />
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
    </div>
  );
};

TaskPlanningSection.displayName = 'TaskPlanningSection';
