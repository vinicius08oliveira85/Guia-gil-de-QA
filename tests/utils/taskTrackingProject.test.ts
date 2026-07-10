import { describe, it, expect } from 'vitest';
import {
  TASK_TRACKING_ALL_PROJECTS,
  collectProjectKeysFromTasks,
  filterTasksByProjectFilter,
  mergeJiraStatusPalettes,
  resolveImportedProjectKeys,
  resolvePaletteForTask,
} from '../../utils/taskTrackingProject';
import type { JiraTask } from '../../types';

const task = (id: string): JiraTask => ({
  id,
  title: id,
  type: 'Tarefa',
  status: 'To Do',
});

describe('taskTrackingProject', () => {
  it('filtra tarefas por projeto', () => {
    const tasks = [task('SUS-1'), task('ME-2'), task('SUS-3')];
    expect(filterTasksByProjectFilter(tasks, 'SUS')).toHaveLength(2);
    expect(filterTasksByProjectFilter(tasks, TASK_TRACKING_ALL_PROJECTS)).toHaveLength(3);
  });

  it('resolve projetos importados da seleção e das tarefas', () => {
    const keys = resolveImportedProjectKeys([task('SUS-1'), task('ME-2')], ['SUS']);
    expect(keys).toEqual(['ME', 'SUS']);
  });

  it('coleta chaves únicas das tarefas', () => {
    expect(collectProjectKeysFromTasks([task('SUS-1'), task('ME-1')])).toEqual(['ME', 'SUS']);
  });

  it('mescla paletas sem duplicar nomes', () => {
    const merged = mergeJiraStatusPalettes([
      [{ name: 'Escalated', color: '#0052cc' }],
      [{ name: 'Escalated', color: '#ff0000' }, { name: 'Aberto', color: '#42526e' }],
    ]);
    expect(merged).toHaveLength(2);
    expect(merged[0].color).toBe('#0052cc');
  });

  it('resolve paleta por tarefa', () => {
    const palette = resolvePaletteForTask(task('SUS-99'), {
      SUS: [{ name: 'Done', color: '#00875a' }],
    });
    expect(palette[0].name).toBe('Done');
  });
});
