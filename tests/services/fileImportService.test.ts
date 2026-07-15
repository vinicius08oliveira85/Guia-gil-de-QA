import { describe, it, expect } from 'vitest';
import { importTasksFromJSON } from '../../services/fileImportService';

function jsonFile(name: string, data: unknown): File {
  const content = JSON.stringify(data);
  return {
    name,
    type: 'application/json',
    size: content.length,
    text: async () => content,
  } as File;
}

describe('importTasksFromJSON', () => {
  it('importa array de tarefas', async () => {
    const result = await importTasksFromJSON(
      jsonFile('tasks.json', [
        { id: 'T-1', title: 'Primeira', type: 'Tarefa', status: 'To Do', priority: 'Alta' },
      ]),
      { validateData: true }
    );
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data?.[0].id).toBe('T-1');
  });

  it('extrai tarefas de export de projeto', async () => {
    const result = await importTasksFromJSON(
      jsonFile('project.json', {
        project: {
          id: 'proj-1',
          name: 'Demo',
          tasks: [
            { id: 'GDPI-1', title: 'Epic A', type: 'Epic', status: 'Done', priority: 'Média' },
            { id: 'GDPI-2', title: 'Story B', type: 'História', status: 'To Do', priority: 'Baixa' },
          ],
        },
      }),
      { validateData: true }
    );
    expect(result.success).toBe(true);
    expect(result.data?.map(t => t.id)).toEqual(['GDPI-1', 'GDPI-2']);
  });

  it('falha quando não há tarefas', async () => {
    const result = await importTasksFromJSON(jsonFile('empty.json', { foo: true }));
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/nenhuma tarefa/i);
  });
});
