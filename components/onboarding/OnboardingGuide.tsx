import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { helpContent } from '../../utils/helpContent';

interface OnboardingStep {
    id: string;
    title: string;
    content: string;
    target?: string; // Seletor CSS do elemento a destacar
    position?: 'top' | 'bottom' | 'left' | 'right';
}

const onboardingSteps: OnboardingStep[] = [
    {
        id: 'welcome',
        title: 'Bem-vindo ao QA Agile Guide! 🎉',
        content: `Este aplicativo vai te ensinar Quality Assurance de forma prática e progressiva.

**O que você vai aprender:**
• Conceitos fundamentais de QA
• Como criar e executar testes
• Métricas e análise de qualidade
• BDD e outras metodologias

Vamos começar? Clique em "Próximo" para continuar.`
    },
    {
        id: 'projects',
        title: 'Projetos',
        content: helpContent.project.create.content,
        target: '[data-onboarding="create-project"]'
    },
    {
        id: 'tasks',
        title: 'Tarefas e Casos de Teste',
        content: helpContent.task.testCases.content,
        target: '[data-onboarding="tasks-tab"]'
    },
    {
        id: 'learning',
        title: 'Trilha de Aprendizado',
        content: `A aba "🎓 Aprender QA" contém módulos progressivos que vão te ensinar QA passo a passo.

**Como funciona:**
• Complete módulos em ordem
• Cada módulo tem lições teóricas e práticas
• Tarefas práticas criam projetos reais
• Seu progresso é salvo automaticamente

Comece pelo módulo "Fundamentos de QA" para aprender o básico!`
    }
];

export const OnboardingGuide: React.FC = () => {
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useLocalStorage<boolean>(
        'onboarding_completed',
        false
    );
    const [currentStep, setCurrentStep] = useState(0);
    const [isOpen, setIsOpen] = useState(!hasCompletedOnboarding);

    const handleNext = () => {
        if (currentStep < onboardingSteps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = () => {
        setHasCompletedOnboarding(true);
        setIsOpen(false);
    };

    const handleSkip = () => {
        setHasCompletedOnboarding(true);
        setIsOpen(false);
    };

    const currentStepData = onboardingSteps[currentStep];

    useEffect(() => {
        if (isOpen && currentStepData?.target) {
            // Scroll para o elemento alvo
            const element = document.querySelector(currentStepData.target);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [currentStep, isOpen, currentStepData]);

    if (hasCompletedOnboarding && !isOpen) {
        return null;
    }

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
                    {onboardingSteps.map((_, index) => (
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
                    <div className="flex gap-2">
                        {currentStep > 0 && (
                            <button
                                onClick={handlePrevious}
                                className="btn btn-secondary"
                            >
                                ← Anterior
                            </button>
                        )}
                        <button
                            onClick={handleSkip}
                            className="btn btn-secondary"
                        >
                            Pular Tour
                        </button>
                    </div>
                    <button
                        onClick={handleNext}
                        className="btn btn-primary"
                    >
                        {currentStep === onboardingSteps.length - 1 ? 'Finalizar' : 'Próximo →'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

