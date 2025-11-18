import React from 'react';
import { Modal } from '../common/Modal';
import { Project } from '../../types';

interface AnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ isOpen, onClose, title, children }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg" maxHeight="90vh">
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
                {children}
            </div>
        </Modal>
    );
};

