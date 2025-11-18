import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useBeginnerMode } from '../../hooks/useBeginnerMode';

interface TutorialStep {
    id: string;
    title: string;
    content: string;
    target?: string; // Seletor CSS do elemento a destacar
}

interface ContextualTutorialProps {
    tutorialId: string;
    steps: TutorialStep[];
    onComplete?: () => void;
}

export const ContextualTutorial: React.FC<ContextualTutorialProps> = ({
    tutorialId,
    steps,
    onComplete
}) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const { isBeginnerMode } = useBeginnerMode();
    const [completedTutorials, setCompletedTutorials] = useLocalStorage<string[]>(
        'completed_contextual_tutorials',
        []
    );

    useEffect(() => {
        // Verificar se deve mostrar o tutorial
        if (isBeginnerMode && !completedTutorials.includes(tutorialId)) {
            setIsOpen(true);
        }
    }, [tutorialId, isBeginnerMode, completedTutorials]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleSkip = () => {
        handleComplete();
    };

    const handleComplete = () => {
        setCompletedTutorials([...completedTutorials, tutorialId]);
        setIsOpen(false);
        onComplete?.();
    };

    if (!isOpen || steps.length === 0) return null;

    const currentStepData = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleSkip}
            title={currentStepData.title}
            size="md"
        >
            <div className="space-y-4">
                <div className="text-text-secondary whitespace-pre-line">
                    {currentStepData.content}
                </div>

                {/* Indicador de progresso */}
                <div className="flex gap-1">
                    {steps.map((_, index) => (
                        <div
                            key={index}
                            className={`h-2 flex-1 rounded ${
                                index <= currentStep
                                    ? 'bg-accent'
                                    : 'bg-surface-border'
                            }`}
                        />
                    ))}
                </div>

                {/* Botões */}
                <div className="flex justify-between pt-4 border-t border-surface-border">
                    <button
                        onClick={handleSkip}
                        className="btn btn-secondary"
                    >
                        Pular Tutorial
                    </button>
                    <button
                        onClick={handleNext}
                        className="btn btn-primary"
                    >
                        {isLastStep ? 'Entendi! ✓' : 'Próximo →'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

