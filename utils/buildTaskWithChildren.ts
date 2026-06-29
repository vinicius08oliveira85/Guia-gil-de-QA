import type { JiraTask } from '../types';
import type { TaskWithChildren } from '../components/tasks/JiraTaskItem';

/**
 * Monta árvore de subtarefas para exibição no detalhe da tarefa.
 */
export function buildTaskWithChildren(
  tasks: JiraTask[],
  rootTask: JiraTask
): TaskWithChildren {
  const taskById = new Map(tasks.map(t => [t.id, t]));
  if (!taskById.has(rootTask.id)) {
    return { ...rootTask, children: [] };
  }

  const visited = new Set<string>();
  const queue: string[] = [rootTask.id];
  visited.add(rootTask.id);
  const order: string[] = [];

  while (queue.length > 0) {
    const id = queue.shift()!;
    order.push(id);
    const children = tasks.filter(c => c.parentId === id);
    for (const c of children) {
      if (!visited.has(c.id)) {
        visited.add(c.id);
        queue.push(c.id);
      }
    }
  }

  const built = new Map<string, TaskWithChildren>();
  for (let i = order.length - 1; i >= 0; i--) {
    const id = order[i];
    const t = taskById.get(id)!;
    const children = tasks
      .filter(c => c.parentId === id)
      .map(c => built.get(c.id) ?? ({ ...c, children: [] } as TaskWithChildren));
    built.set(id, { ...t, children } as TaskWithChildren);
  }

  return built.get(rootTask.id) ?? { ...rootTask, children: [] };
}
