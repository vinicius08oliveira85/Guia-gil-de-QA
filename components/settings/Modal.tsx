import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  id?: string;
  containerClassName?: string;
  ariaLabelledBy?: string;
}

const Modal = ({ isOpen, onClose, title, children, id, containerClassName, ariaLabelledBy }: ModalProps) => {
  if (!isOpen) return null;

  return (
    <div className={`modal modal-open ${containerClassName || ''}`} id={id} aria-labelledby={ariaLabelledBy}>
      <div className="modal-box relative">
        <button 
          onClick={onClose}
          className="btn btn-sm btn-circle absolute right-2 top-2"
        >✕</button>
        <h3 className="text-lg font-bold mb-4" id={ariaLabelledBy}>{title}</h3>
        <div className="py-4">
          {children}
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </div>
    </div>
  );
};

export default Modal;