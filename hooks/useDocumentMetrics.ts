import { useMemo } from 'react';
import { Project, ProjectDocument } from '../types';

/**
 * Detecta a categoria de um documento baseado no nome e conteúdo
 */
function detectCategory(name: string, content: string): string {
    const lowerName = name.toLowerCase();
    const lowerContent = content.toLowerCase();
    
    if (lowerName.includes('requisito') || lowerContent.includes('requisito') || lowerContent.includes('requirement')) {
        return 'requisitos';
    }
    if (lowerName.includes('teste') || lowerName.includes('test') || lowerContent.includes('caso de teste') || lowerContent.includes('test case')) {
        return 'testes';
    }
    if (lowerName.includes('arquitetura') || lowerName.includes('architecture') || lowerContent.includes('arquitetura')) {
        return 'arquitetura';
    }
    return 'outros';
}

/**
 * Hook para calcular métricas específicas de documentos
 */
export function useDocumentMetrics(project: Project) {
    return useMemo(() => {
        const documents = project.documents || [];
        const tasks = project.tasks || [];
        
        const total = documents.length;
        const withAnalysis = documents.filter(doc => doc.analysis && doc.analysis.length > 0).length;
        
        // Contar por categoria
        const byCategory = documents.reduce((acc, doc) => {
            const category = detectCategory(doc.name, doc.content);
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        // Documentos recentes (últimos 7 dias)
        // Em produção, seria necessário ter um campo createdAt no ProjectDocument
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const recent = documents.length; // Por enquanto, todos são considerados recentes
        
        // Documentos vinculados a tarefas
        const linkedToTasks = documents.filter(doc => {
            return tasks.some(task => 
                task.description?.toLowerCase().includes(doc.name.toLowerCase()) ||
                task.title?.toLowerCase().includes(doc.name.toLowerCase())
            );
        }).length;
        
        return {
            total,
            byCategory,
            withAnalysis,
            recent,
            linkedToTasks,
        };
    }, [project.documents, project.tasks]);
}

