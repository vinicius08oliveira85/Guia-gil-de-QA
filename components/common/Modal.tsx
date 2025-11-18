
import React from 'react';

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="mica rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden animate-fade-in" onClick={(e) => e.stopPropagation()}>
                {/* Title Bar */}
                <div className="flex justify-between items-center p-3 bg-white/5">
                    <h2 className="text-base font-semibold text-text-primary pl-2">{title}</h2>
                    <button onClick={onClose} className="w-8 h-8 flex justify-center items-center rounded-md text-text-secondary hover:bg-red-500 hover:text-white transition-colors">&times;</button>
                </div>
                {/* Content */}
                <div className="p-6">
                  {children}
                </div>
            </div>
        </div>
    );
};