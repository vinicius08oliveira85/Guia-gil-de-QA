import React from 'react';
import { TaskDetailsView, type TaskDetailsViewProps } from './TaskDetailsView';

export interface TaskDetailsModalProps extends TaskDetailsViewProps {
  isOpen: boolean;
}

/**
 * Modal de detalhes da tarefa — wrapper fino sobre {@link TaskDetailsView}.
 */
export const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  isOpen,
  onClose,
  ...viewProps
}) => {
  if (!isOpen) return null;

  return (
    <TaskDetailsView
      {...viewProps}
      presentation="modal"
      onClose={onClose}
    />
  );
};

// Reexport para compatibilidade com imports existentes
export type { TaskDetailsViewProps };
export { TaskDetailsView };
