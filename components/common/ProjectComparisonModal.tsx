import React from 'react';
import { Modal } from './Modal';
import { ProjectComparison } from './ProjectComparison';
import { Project } from '../../types';

interface ProjectComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onProjectSelect: (projectId: string) => void;
}

export const ProjectComparisonModal: React.FC<ProjectComparisonModalProps> = ({
  isOpen,
  onClose,
  projects,
  onProjectSelect,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Comparar Projetos">
      <ProjectComparison projects={projects} onProjectSelect={onProjectSelect} />
    </Modal>
  );
};
