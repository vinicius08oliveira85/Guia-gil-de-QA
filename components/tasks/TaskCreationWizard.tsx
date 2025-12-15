import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useBeginnerMode } from '../../hooks/useBeginnerMode';

interface TaskCreationWizardProps {
    isOpen: boolean;
    onClose: () => void;
    onStart: () => void;
}

const wizardSteps = [
    {
        id: 'welcome',
        title: 'Bem-vindo ao Criador de Tarefas! 🎉',
        content: `Vamos criar sua primeira tarefa passo a passo.

**O que você vai aprender:**
• Como preencher cada campo
• O que significa cada tipo de tarefa
• Como organizar seu trabalho

Este guia vai te ajudar a criar tarefas de forma correta desde o início.`
    },
    {
        id: 'id',
        title: 'Passo 1: ID da Tarefa',
        content: `O ID é como um "número de identificação" da sua tarefa.

**Formato recomendado:**
• PROJ-001 (primeira tarefa do projeto)
• LOGIN-001 (tarefa relacionada a login)
• BUG-042 (bug número 42)

**Dica:** Use um padrão consistente. Se começar com PROJ-001, continue com PROJ-002, PROJ-003, etc.`,
        field: 'id'
    },
    {
        id: 'title',
        title: 'Passo 2: Título',
        content: `O título deve ser claro e descritivo.

**Bom exemplo:**
• "Implementar login com email e senha"
• "Corrigir erro ao salvar formulário"

**Evite:**
• "Tarefa 1" (muito genérico)
• "Corrigir bug" (não especifica qual)

**Dica:** Qualquer pessoa deve entender o que precisa ser feito só lendo o título.`,
        field: 'title'
    },
    {
        id: 'type',
        title: 'Passo 3: Tipo de Tarefa',
        content: `Escolha o tipo que melhor descreve sua tarefa:

**Epic:** Grupo grande de funcionalidades
• Exemplo: "Sistema de Autenticação"

**História:** Nova funcionalidade
• Exemplo: "Usuário pode fazer login"

**Tarefa:** Trabalho técnico
• Exemplo: "Configurar ambiente"

**Bug:** Defeito encontrado
• Exemplo: "Botão não funciona"`,
        field: 'type'
    },
    {
        id: 'description',
        title: 'Passo 4: Descrição',
        content: `A descrição deve explicar detalhadamente o que precisa ser feito.

**Inclua:**
• **Contexto:** Por que isso é necessário?
• **Requisitos:** O que deve ser feito?
• **Critérios de aceite:** Como saber se está completo?

**Exemplo:**
"Implementar login com email e senha.

**Contexto:** Usuários precisam acessar o sistema.

**Requisitos:**
- Campo de email
- Campo de senha
- Botão de login

**Critérios de aceite:**
- Login funciona com email válido
- Erro exibido para email inválido"`,
        field: 'description'
    },
    {
        id: 'priority',
        title: 'Passo 5: Prioridade',
        content: `A prioridade indica a importância:

**Urgente:** Deve ser feito imediatamente
**Alta:** Importante, fazer em breve
**Média:** Importante, mas pode esperar
**Baixa:** Pode ser feito quando houver tempo

**Dica:** Priorize baseado no impacto no negócio, não apenas na dificuldade.`,
        field: 'priority'
    },
    {
        id: 'complete',
        title: 'Pronto para começar! 🚀',
        content: `Agora você sabe como criar tarefas!

**Próximos passos:**
1. Clique em "Adicionar Tarefa"
2. Preencha os campos seguindo o que aprendeu
3. Use os ícones de ajuda (ℹ️) se tiver dúvidas
4. Complete a tarefa seguindo os marcos do projeto

**Lembre-se:**
• O modo iniciante (🎓) está ativado - você verá dicas extras
• Cada tarefa mostra em qual fase do projeto está
• Siga os "Próximos passos" sugeridos em cada tarefa`
    }
];

export const TaskCreationWizard: React.FC<TaskCreationWizardProps> = ({ isOpen, onClose, onStart }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const { isBeginnerMode } = useBeginnerMode();

    if (!isBeginnerMode) {
        return null; // Não mostrar wizard se modo iniciante estiver desativado
    }

    const currentStepData = wizardSteps[currentStep];
    const isLastStep = currentStep === wizardSteps.length - 1;

    const handleNext = () => {
        if (currentStep < wizardSteps.length - 1) {
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
        onStart();
        onClose();
        setCurrentStep(0);
    };

    const handleSkip = () => {
        onClose();
        setCurrentStep(0);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleSkip}
            title={currentStepData.title}
            size="lg"
        >
            <div className="space-y-4">
                <div className="text-text-secondary whitespace-pre-line">
                    {currentStepData.content}
                </div>

                {/* Indicador de progresso */}
                <div className="flex gap-1">
                    {wizardSteps.map((_, index) => (
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
                            Pular Tutorial
                        </button>
                    </div>
                    <button
                        onClick={handleNext}
                        className="btn btn-primary"
                    >
                        {isLastStep ? 'Começar a Criar! 🚀' : 'Próximo →'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

