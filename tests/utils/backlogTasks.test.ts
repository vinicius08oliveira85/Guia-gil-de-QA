import { describe, it, expect } from 'vitest';
import {
  filterBacklogTasks,
  getBacklogTaskComparator,
  isBacklogTask,
  isJiraBacklogLikeStatus,
  buildProjectBacklogSearch,
  formatBacklogShareLabel,
  backlogSharePercent,
} from '../../utils/backlogTasks';
import type { JiraTask } from '../../types';

function task(partial: Partial<JiraTask> & Pick<JiraTask, 'id' | 'type' | 'status'>): JiraTask {
  return {
    id: partial.id,
    title: partial.title ?? partial.id,
    description: '',
    status: partial.status,
    type: partial.type,
    testCases: [],
    ...partial,
  };
}

describe('backlogTasks', () => {
  it('isJiraBacklogLikeStatus reconhece fila/backlog e rejeita concluído', () => {
    expect(isJiraBacklogLikeStatus('Backlog')).toBe(true);
    expect(isJiraBacklogLikeStatus('A fazer')).toBe(true);
    expect(isJiraBacklogLikeStatus('Done')).toBe(false);
    expect(isJiraBacklogLikeStatus('Em Andamento')).toBe(false);
  });

  it('isBacklogTask: true para To Do que não é Epic', () => {
    expect(isBacklogTask(task({ id: 'A', type: 'Bug', status: 'To Do' }))).toBe(true);
    expect(isBacklogTask(task({ id: 'B', type: 'História', status: 'To Do' }))).toBe(true);
  });

  it('isBacklogTask: true para status Jira de backlog mesmo fora de To Do', () => {
    expect(
      isBacklogTask(
        task({ id: 'C', type: 'Tarefa', status: 'In Progress', jiraStatus: 'Backlog' })
      )
    ).toBe(true);
  });

  it('isBacklogTask: false para Epic ou status diferente de To Do sem jira backlog', () => {
    expect(isBacklogTask(task({ id: 'E', type: 'Epic', status: 'To Do' }))).toBe(false);
    expect(isBacklogTask(task({ id: 'D', type: 'Bug', status: 'Done' }))).toBe(false);
    expect(
      isBacklogTask(task({ id: 'P', type: 'Tarefa', status: 'In Progress', jiraStatus: 'Em Andamento' }))
    ).toBe(false);
  });

  it('filterBacklogTasks retorna apenas itens elegíveis', () => {
    const tasks = [
      task({ id: '1', type: 'Bug', status: 'To Do' }),
      task({ id: '2', type: 'Epic', status: 'To Do' }),
      task({ id: '3', type: 'Tarefa', status: 'Done' }),
      task({ id: '4', type: 'História', status: 'To Do' }),
      task({ id: '5', type: 'Bug', status: 'In Progress', jiraStatus: 'Backlog' }),
    ];
    expect(filterBacklogTasks(tasks).map(t => t.id)).toEqual(['1', '4', '5']);
  });

  it('buildProjectBacklogSearch gera query canônica', () => {
    expect(buildProjectBacklogSearch('proj-1')).toBe('?project=proj-1&subview=backlog');
  });

  it('getBacklogTaskComparator ordena por prioridade', () => {
    const tasks = [
      task({ id: 'X-1', type: 'Bug', status: 'To Do', priority: 'Baixa' }),
      task({ id: 'X-2', type: 'Bug', status: 'To Do', priority: 'Urgente' }),
    ];
    const sorted = [...tasks].sort(getBacklogTaskComparator('priority'));
    expect(sorted[0].id).toBe('X-2');
  });

  it('backlogSharePercent e formatBacklogShareLabel', () => {
    expect(backlogSharePercent(3, 10)).toBe(30);
    expect(formatBacklogShareLabel(3, 10)).toBe('30% do total');
    expect(backlogSharePercent(0, 0)).toBeNull();
  });

  it('getBacklogTaskComparator ordena por story points decrescente', () => {
    const tasks = [
      task({ id: 'SP-1', type: 'Bug', status: 'To Do', storyPoints: 2 }),
      task({ id: 'SP-2', type: 'Bug', status: 'To Do', storyPoints: 8 }),
    ];
    const sorted = [...tasks].sort(getBacklogTaskComparator('storyPoints'));
    expect(sorted[0].id).toBe('SP-2');
  });
});
