import { useMemo, useState } from 'react';
import { Project, JiraTask, ProjectDocument } from '../types';

export interface SearchResult {
  type: 'project' | 'task' | 'document' | 'testcase';
  id: string;
  title: string;
  description: string;
  projectId?: string;
  projectName?: string;
}

export const useSearch = (projects: Project[]) => {
  const [searchQuery, setSearchQuery] = useState('');

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase().trim();
    const results: SearchResult[] = [];

    projects.forEach(project => {
      // Buscar no nome e descrição do projeto
      if (
        project.name.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query)
      ) {
        results.push({
          type: 'project',
          id: project.id,
          title: project.name,
          description: project.description,
          projectId: project.id,
          projectName: project.name
        });
      }

      // Buscar em documentos
      project.documents.forEach(doc => {
        if (
          doc.name.toLowerCase().includes(query) ||
          doc.content.toLowerCase().includes(query)
        ) {
          results.push({
            type: 'document',
            id: doc.name,
            title: doc.name,
            description: doc.content.substring(0, 100),
            projectId: project.id,
            projectName: project.name
          });
        }
      });

      // Buscar em tarefas
      project.tasks.forEach(task => {
        if (
          task.id.toLowerCase().includes(query) ||
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query)
        ) {
          results.push({
            type: 'task',
            id: task.id,
            title: task.title,
            description: task.description.substring(0, 100),
            projectId: project.id,
            projectName: project.name
          });
        }

        // Buscar em casos de teste
        (task.testCases || []).forEach(tc => {
          if (
            tc.description.toLowerCase().includes(query) ||
            tc.expectedResult.toLowerCase().includes(query)
          ) {
            results.push({
              type: 'testcase',
              id: tc.id,
              title: tc.description,
              description: `Tarefa: ${task.title}`,
              projectId: project.id,
              projectName: project.name
            });
          }
        });
      });
    });

    return results;
  }, [projects, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    searchResults,
    hasResults: searchResults.length > 0
  };
};

