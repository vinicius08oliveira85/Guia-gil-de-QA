import { useMemo } from 'react';
import { Project, JiraTask } from '../types';

export interface Suggestion {
    id: string;
    message: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    type?: 'info' | 'tip' | 'warning';
    priority: number; // 1 = alta, 2 = média, 3 = baixa
}

export const useSuggestions = (project: Project): Suggestion[] => {
    return useMemo(() => {
        const suggestions: Suggestion[] = [];
        const tasks = project.tasks || [];

        // Sugestão 1: Criar primeira tarefa
        if (tasks.length === 0) {
            suggestions.push({
                id: 'create-first-task',
                message: 'Comece criando sua primeira tarefa para organizar seu trabalho de QA.',
                type: 'tip',
                priority: 1
            });
            return suggestions; // Retornar apenas esta se não houver tarefas
        }

        // Sugestão 2: Tarefas sem BDD
        const tasksWithoutBDD = tasks.filter(
            t => t.type !== 'Bug' && 
            (!t.bddScenarios || t.bddScenarios.length === 0) &&
            t.status !== 'Done'
        );
        if (tasksWithoutBDD.length > 0) {
            suggestions.push({
                id: 'add-bdd-scenarios',
                message: `${tasksWithoutBDD.length} tarefa(s) sem cenários BDD. Crie cenários BDD para definir o comportamento esperado.`,
                type: 'tip',
                priority: 2
            });
        }

        // Sugestão 3: Tarefas sem casos de teste
        const tasksWithoutTests = tasks.filter(
            t => t.type !== 'Bug' &&
            (!t.testCases || t.testCases.length === 0) &&
            t.status !== 'Done'
        );
        if (tasksWithoutTests.length > 0) {
            suggestions.push({
                id: 'add-test-cases',
                message: `${tasksWithoutTests.length} tarefa(s) sem casos de teste. Gere casos de teste para validar as funcionalidades.`,
                type: 'tip',
                priority: 2
            });
        }

        // Sugestão 4: Testes não executados
        const allTestCases = tasks.flatMap(t => t.testCases || []);
        const unexecutedTests = allTestCases.filter(tc => tc.status === 'Not Run');
        if (unexecutedTests.length > 0) {
            suggestions.push({
                id: 'execute-tests',
                message: `${unexecutedTests.length} caso(s) de teste não executado(s). Execute os testes para validar as funcionalidades.`,
                type: 'info',
                priority: 2
            });
        }

        // Sugestão 5: Bugs críticos abertos
        const criticalBugs = tasks.filter(
            t => t.type === 'Bug' &&
            t.severity === 'Crítico' &&
            t.status !== 'Done'
        );
        if (criticalBugs.length > 0) {
            suggestions.push({
                id: 'fix-critical-bugs',
                message: `${criticalBugs.length} bug(s) crítico(s) aberto(s). Priorize a correção desses bugs.`,
                type: 'warning',
                priority: 1
            });
        }

        // Sugestão 6: Tarefas sem descrição
        const tasksWithoutDescription = tasks.filter(
            t => !t.description || t.description.trim() === ''
        );
        if (tasksWithoutDescription.length > 0) {
            suggestions.push({
                id: 'add-descriptions',
                message: `${tasksWithoutDescription.length} tarefa(s) sem descrição. Adicione descrições detalhadas para melhor compreensão.`,
                type: 'info',
                priority: 3
            });
        }

        // Ordenar por prioridade (1 = alta, 2 = média, 3 = baixa)
        return suggestions.sort((a, b) => a.priority - b.priority);
    }, [project]);
};

