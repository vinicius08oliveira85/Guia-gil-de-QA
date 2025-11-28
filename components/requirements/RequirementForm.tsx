import React, { useState, useEffect } from 'react';
import { Requirement, STLCPhaseName, RequirementType, TaskPriority, RequirementStatus } from '../../types';
import { validateRequirement } from '../../utils/validation';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';

interface RequirementFormProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (requirement: Omit<Requirement, 'id' | 'createdAt' | 'updatedAt'>) => void;
    initialData?: Requirement | null;
    currentPhase: STLCPhaseName;
}

export const RequirementForm: React.FC<RequirementFormProps> = ({
    isOpen,
    onClose,
    onSubmit,
    initialData,
    currentPhase,
}) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'Funcional' as RequirementType,
        priority: 'Média' as TaskPriority,
        stlcPhase: currentPhase as STLCPhaseName,
        acceptanceCriteria: [''],
        relatedTasks: [] as string[],
        testCases: [] as string[],
        status: 'Rascunho' as RequirementStatus,
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [criteriaInput, setCriteriaInput] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                title: initialData.title,
                description: initialData.description,
                type: initialData.type,
                priority: initialData.priority,
                stlcPhase: initialData.stlcPhase,
                acceptanceCriteria: initialData.acceptanceCriteria.length > 0 
                    ? initialData.acceptanceCriteria 
                    : [''],
                relatedTasks: initialData.relatedTasks,
                testCases: initialData.testCases,
                status: initialData.status,
            });
        } else {
            // Reset form
            setFormData({
                title: '',
                description: '',
                type: 'Funcional',
                priority: 'Média',
                stlcPhase: currentPhase,
                acceptanceCriteria: [''],
                relatedTasks: [],
                testCases: [],
                status: 'Rascunho',
            });
        }
        setErrors({});
        setCriteriaInput('');
    }, [initialData, isOpen, currentPhase]);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleAddCriteria = () => {
        if (criteriaInput.trim()) {
            handleChange('acceptanceCriteria', [...formData.acceptanceCriteria, criteriaInput.trim()]);
            setCriteriaInput('');
        }
    };

    const handleRemoveCriteria = (index: number) => {
        const newCriteria = formData.acceptanceCriteria.filter((_, i) => i !== index);
        handleChange('acceptanceCriteria', newCriteria.length > 0 ? newCriteria : ['']);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validar critérios de aceitação
        const validCriteria = formData.acceptanceCriteria.filter(c => c.trim().length > 0);
        if (validCriteria.length === 0) {
            setErrors({ acceptanceCriteria: 'Pelo menos um critério de aceitação é necessário' });
            return;
        }

        const requirementData = {
            ...formData,
            acceptanceCriteria: validCriteria,
        };

        // Validação com Zod (simulada - precisa do ID para validação completa)
        const validation = validateRequirement({
            ...requirementData,
            id: initialData?.id || 'R-000', // Placeholder para validação
            createdAt: initialData?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        if (!validation.success) {
            const newErrors: Record<string, string> = {};
            validation.error.errors.forEach(err => {
                if (err.path.length > 0) {
                    newErrors[err.path[0].toString()] = err.message;
                }
            });
            setErrors(newErrors);
            return;
        }

        onSubmit(requirementData);
        onClose();
    };

    const stlcPhases: STLCPhaseName[] = [
        'Análise de Requisitos',
        'Planejamento de Testes',
        'Desenvolvimento de Casos de Teste',
        'Execução de Testes',
        'Encerramento do Teste',
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={initialData ? 'Editar Requisito' : 'Novo Requisito'}
            size="lg"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                        Título *
                    </label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-surface-border bg-surface-card text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                        placeholder="Ex: Sistema deve permitir login de usuários"
                        required
                    />
                    {errors.title && (
                        <p className="mt-1 text-sm text-danger">{errors.title}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                        Descrição *
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 rounded-xl border border-surface-border bg-surface-card text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                        placeholder="Descreva o requisito em detalhes..."
                        required
                    />
                    {errors.description && (
                        <p className="mt-1 text-sm text-danger">{errors.description}</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-text-primary mb-2">
                            Tipo *
                        </label>
                        <select
                            value={formData.type}
                            onChange={(e) => handleChange('type', e.target.value as RequirementType)}
                            className="w-full px-4 py-2 rounded-xl border border-surface-border bg-surface-card text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                        >
                            <option value="Funcional">Funcional</option>
                            <option value="Não Funcional">Não Funcional</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-text-primary mb-2">
                            Prioridade *
                        </label>
                        <select
                            value={formData.priority}
                            onChange={(e) => handleChange('priority', e.target.value as TaskPriority)}
                            className="w-full px-4 py-2 rounded-xl border border-surface-border bg-surface-card text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                        >
                            <option value="Baixa">Baixa</option>
                            <option value="Média">Média</option>
                            <option value="Alta">Alta</option>
                            <option value="Urgente">Urgente</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                        Fase STLC *
                    </label>
                    <select
                        value={formData.stlcPhase}
                        onChange={(e) => handleChange('stlcPhase', e.target.value as STLCPhaseName)}
                        className="w-full px-4 py-2 rounded-xl border border-surface-border bg-surface-card text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                    >
                        {stlcPhases.map(phase => (
                            <option key={phase} value={phase}>
                                {phase}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                        Critérios de Aceitação *
                    </label>
                    <div className="space-y-2">
                        {formData.acceptanceCriteria.map((criteria, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    value={criteria}
                                    onChange={(e) => {
                                        const newCriteria = [...formData.acceptanceCriteria];
                                        newCriteria[index] = e.target.value;
                                        handleChange('acceptanceCriteria', newCriteria);
                                    }}
                                    className="flex-1 px-4 py-2 rounded-xl border border-surface-border bg-surface-card text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                                    placeholder="Critério de aceitação"
                                />
                                {formData.acceptanceCriteria.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveCriteria(index)}
                                        className="px-3 py-2 text-danger hover:bg-danger/10 rounded-xl transition-colors"
                                    >
                                        Remover
                                    </button>
                                )}
                            </div>
                        ))}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={criteriaInput}
                                onChange={(e) => setCriteriaInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddCriteria();
                                    }
                                }}
                                className="flex-1 px-4 py-2 rounded-xl border border-surface-border bg-surface-card text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                                placeholder="Adicionar critério de aceitação"
                            />
                            <button
                                type="button"
                                onClick={handleAddCriteria}
                                className="px-4 py-2 bg-accent text-white rounded-xl hover:bg-accent-light transition-colors"
                            >
                                Adicionar
                            </button>
                        </div>
                    </div>
                    {errors.acceptanceCriteria && (
                        <p className="mt-1 text-sm text-danger">{errors.acceptanceCriteria}</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                        Status
                    </label>
                    <select
                        value={formData.status}
                        onChange={(e) => handleChange('status', e.target.value as RequirementStatus)}
                        className="w-full px-4 py-2 rounded-xl border border-surface-border bg-surface-card text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/30"
                    >
                        <option value="Rascunho">Rascunho</option>
                        <option value="Aprovado">Aprovado</option>
                        <option value="Em Teste">Em Teste</option>
                        <option value="Validado">Validado</option>
                    </select>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-surface-border">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 rounded-xl border border-surface-border bg-surface-card text-text-primary hover:bg-surface-hover transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 rounded-xl bg-accent text-white hover:bg-accent-light transition-colors"
                    >
                        {initialData ? 'Salvar' : 'Criar'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

