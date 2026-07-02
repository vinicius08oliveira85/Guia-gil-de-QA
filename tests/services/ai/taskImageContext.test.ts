import { describe, it, expect } from 'vitest';
import type { JiraTask } from '../../../types';
import { taskHasImages } from '../../../services/ai/taskImageContext';

describe('taskHasImages', () => {
  it('detecta imagem inline na descrição HTML', () => {
    const task: JiraTask = {
      id: 'T-1',
      title: 'T',
      description: '<p>ver print <img src="/x.png" alt="tela" /></p>',
      status: 'To Do',
      type: 'Tarefa',
      testCases: [],
    };
    expect(taskHasImages(task)).toBe(true);
  });

  it('detecta anexo Jira com extensão de imagem', () => {
    const task: JiraTask = {
      id: 'T-2',
      title: 'T',
      description: '',
      status: 'To Do',
      type: 'Tarefa',
      testCases: [],
      jiraAttachments: [{ id: '1', filename: 'evidencia.png', size: 1, created: '', author: '' }],
    };
    expect(taskHasImages(task)).toBe(true);
  });
});
