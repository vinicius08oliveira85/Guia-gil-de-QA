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
• Automação do seu trabalho de QA

**Modo Iniciante Ativado:**
O modo iniciante (🎓) está ativado por padrão. Você verá:
• Explicações detalhadas em cada campo
• Dicas contextuais
• Guias passo a passo
• Marcos de processo visuais

Vamos começar? Clique em "Próximo" para continuar.`
    },
    {
        id: 'projects',
        title: 'Passo 1: Criar seu Primeiro Projeto',
        content: `Um projeto é o container principal para organizar suas atividades de QA.

**O que incluir:**
• Nome claro e descritivo (ex: "Sistema de Login")
• Descrição dos objetivos
• Template (opcional) para começar rapidamente

**Dica:** Use templates para projetos comuns como "Aplicação Web" ou "API REST" para ter uma estrutura inicial pronta.

**Próximo passo:** Depois de criar o projeto, você poderá adicionar tarefas e começar a trabalhar!`,
        target: '[data-onboarding="create-project"]'
    },
    {
        id: 'tasks',
        title: 'Passo 2: Criar Tarefas',
        content: `Tarefas representam funcionalidades ou bugs que precisam ser testados.

**Tipos de Tarefa:**
• **História**: Nova funcionalidade (ex: "Usuário pode fazer login")
• **Bug**: Defeito encontrado (ex: "Botão não funciona")
• **Tarefa**: Trabalho técnico (ex: "Configurar ambiente")
• **Epic**: Grupo de histórias relacionadas (ex: "Sistema de Autenticação")

**Dica:** Quando criar sua primeira tarefa, um guia passo a passo vai te ajudar!

**Marcos de Processo:**
Cada tarefa mostra em qual fase do projeto está (Request, Analysis, Design, Test, etc.)`,
        target: '[data-onboarding="tasks-tab"]'
    },
    {
        id: 'testcases',
        title: 'Passo 3: Criar Casos de Teste',
        content: `Casos de teste são passos específicos para validar uma funcionalidade.

**Estrutura:**
• **Descrição**: O que está sendo testado
• **Passos**: Como executar o teste
• **Resultado Esperado**: O que deveria acontecer

**Status:**
• **Não Executado**: Ainda não foi testado
• **Passou**: Teste executado com sucesso ✅
• **Falhou**: Teste encontrou um problema ❌

**Dica:** Use a IA para gerar casos de teste automaticamente, mas sempre revise e ajuste conforme necessário.

**Templates:** Use templates pré-definidos para acelerar a criação!`
    },
    {
        id: 'timeline',
        title: 'Passo 4: Acompanhar o Progresso',
        content: `O aplicativo mostra automaticamente em qual fase do projeto você está.

**Fases do Projeto:**
1. **Request**: Início - criar tarefas e documentos
2. **Analysis**: Criar cenários BDD
3. **Design**: Criar casos de teste
4. **Test**: Executar testes
5. **Release**: Preparar para produção
6. E mais...

**Marcos Visuais:**
• Cada tarefa mostra um badge com a fase atual
• A Timeline mostra o progresso completo
• Próximos passos são sugeridos automaticamente

**Dica:** Siga os "Próximos passos" sugeridos em cada tarefa para avançar no projeto!`
    },
    {
        id: 'complete',
        title: 'Pronto para Começar! 🚀',
        content: `Agora você está pronto para usar o aplicativo!

**Resumo do que você aprendeu:**
✅ Como criar projetos
✅ Como criar tarefas com explicações detalhadas
✅ Como criar casos de teste
✅ Como acompanhar o progresso com marcos visuais

**Recursos Disponíveis:**
• 🎓 Modo Iniciante: Ativado (veja o ícone no header)
• ℹ️ Tooltips: Passe o mouse sobre os ícones de ajuda
• 📋 Templates: Use para acelerar a criação
• 🧠 IA: Gere casos de teste e análises automaticamente
• 📊 Dashboard: Acompanhe métricas e progresso

**Próximos Passos:**
1. Crie seu primeiro projeto
2. Adicione uma tarefa (o wizard vai te guiar!)
3. Use os tooltips sempre que tiver dúvidas

**Lembre-se:** O modo iniciante está ativado. Você verá dicas e explicações em todo lugar!

Boa sorte! 🎉`
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

