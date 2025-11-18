import { JiraTask, PhaseName } from '../types';

/**
 * Determina em qual fase do projeto uma tarefa está baseado em seu status e características
 */
export const getTaskPhase = (task: JiraTask, projectPhases?: { name: PhaseName; status: string }[]): PhaseName | null => {
    // Se a tarefa está "Done", está na fase mais avançada possível
    if (task.status === 'Done') {
        // Se tem testes executados, está em Test ou posterior
        if (task.testCases && task.testCases.some(tc => tc.status !== 'Not Run')) {
            return 'Test';
        }
        // Se tem testes mas não executados, está em Design
        if (task.testCases && task.testCases.length > 0) {
            return 'Design';
        }
        // Se tem BDD, está em Analysis
        if (task.bddScenarios && task.bddScenarios.length > 0) {
            return 'Analysis';
        }
        // Caso contrário, está em Request
        return 'Request';
    }

    // Se está "In Progress"
    if (task.status === 'In Progress') {
        // Se tem testes executados, está em Test
        if (task.testCases && task.testCases.some(tc => tc.status !== 'Not Run')) {
            return 'Test';
        }
        // Se tem testes mas não executados, está em Design
        if (task.testCases && task.testCases.length > 0) {
            return 'Design';
        }
        // Se tem BDD, está em Analysis
        if (task.bddScenarios && task.bddScenarios.length > 0) {
            return 'Analysis';
        }
        // Caso contrário, está em Request
        return 'Request';
    }

    // Se está "To Do"
    // Se tem BDD, está em Analysis
    if (task.bddScenarios && task.bddScenarios.length > 0) {
        return 'Analysis';
    }
    // Caso contrário, está em Request
    return 'Request';
};

/**
 * Retorna a cor e ícone para a fase
 */
export const getPhaseBadgeStyle = (phase: PhaseName | null): { color: string; bg: string; icon: string } => {
    if (!phase) {
        return { color: 'text-gray-400', bg: 'bg-gray-500/20', icon: '📋' };
    }

    const phaseStyles: Record<PhaseName, { color: string; bg: string; icon: string }> = {
        'Request': { color: 'text-blue-400', bg: 'bg-blue-500/20', icon: '📝' },
        'Analysis': { color: 'text-purple-400', bg: 'bg-purple-500/20', icon: '🔍' },
        'Design': { color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: '✏️' },
        'Analysis and Code': { color: 'text-orange-400', bg: 'bg-orange-500/20', icon: '💻' },
        'Build': { color: 'text-indigo-400', bg: 'bg-indigo-500/20', icon: '🔨' },
        'Test': { color: 'text-green-400', bg: 'bg-green-500/20', icon: '✅' },
        'Release': { color: 'text-teal-400', bg: 'bg-teal-500/20', icon: '🚀' },
        'Deploy': { color: 'text-cyan-400', bg: 'bg-cyan-500/20', icon: '📦' },
        'Operate': { color: 'text-pink-400', bg: 'bg-pink-500/20', icon: '⚙️' },
        'Monitor': { color: 'text-red-400', bg: 'bg-red-500/20', icon: '📊' },
    };

    return phaseStyles[phase] || { color: 'text-gray-400', bg: 'bg-gray-500/20', icon: '📋' };
};

/**
 * Retorna o próximo passo sugerido para a tarefa
 */
export const getNextStepForTask = (task: JiraTask): string | null => {
    if (task.status === 'Done') {
        return null; // Tarefa concluída
    }

    // Se não tem BDD, sugerir criar BDD
    if (!task.bddScenarios || task.bddScenarios.length === 0) {
        return 'Criar cenários BDD para definir o comportamento esperado';
    }

    // Se não tem casos de teste, sugerir criar
    if (!task.testCases || task.testCases.length === 0) {
        return 'Gerar casos de teste para validar a funcionalidade';
    }

    // Se tem testes mas não executados, sugerir executar
    if (task.testCases.some(tc => tc.status === 'Not Run')) {
        return 'Executar casos de teste para validar a implementação';
    }

    // Se todos os testes passaram, sugerir marcar como Done
    if (task.testCases.every(tc => tc.status === 'Passed')) {
        return 'Todos os testes passaram! Marque a tarefa como concluída';
    }

    // Se algum teste falhou, sugerir corrigir
    if (task.testCases.some(tc => tc.status === 'Failed')) {
        return 'Alguns testes falharam. Revise e corrija os problemas encontrados';
    }

    return null;
};

