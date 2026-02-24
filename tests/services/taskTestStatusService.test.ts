import { describe, it, expect } from 'vitest';
import { calculateTaskTestStatus } from '../../services/taskTestStatusService';
import { JiraTask } from '../../types';

describe('taskTestStatusService', () => {
  const createMockTask = (id: string, type: 'Epic' | 'História' | 'Tarefa' | 'Bug', parentId?: string): JiraTask => ({
    id,
    type,
    parentId,
    title: `Task ${id}`,
    description: '',
    status: 'To Do',
    testCases: [],
    createdAt: new Date().toISOString()
  });

  describe('calculateTaskTestStatus', () => {
    it('should correctly calculate status for a simple task with no tests', () => {
      const task = createMockTask('T1', 'Tarefa');
      expect(calculateTaskTestStatus(task, [task])).toBe('testar');
    });

    it('should correctly calculate status for an Epic with subtasks', () => {
      const epic = createMockTask('E1', 'Epic');
      const t1 = createMockTask('T1', 'Tarefa', 'E1');
      const t2 = createMockTask('T2', 'Tarefa', 'E1');

      t1.testCases = [{ id: 'tc1', description: 'desc', expectedResult: 'exp', status: 'Passed', createdAt: '', updatedAt: '' }];
      t2.testCases = [{ id: 'tc2', description: 'desc', expectedResult: 'exp', status: 'Passed', createdAt: '', updatedAt: '' }];

      const allTasks = [epic, t1, t2];
      expect(calculateTaskTestStatus(epic, allTasks)).toBe('teste_concluido');
    });

    it('should use tasksByParent map if provided', () => {
      const epic = createMockTask('E1', 'Epic');
      const t1 = createMockTask('T1', 'Tarefa', 'E1');

      const tasksByParent = new Map<string, JiraTask[]>();
      tasksByParent.set('E1', [t1]);

      // If we don't provide allTasks but provide map, it should still work
      expect(calculateTaskTestStatus(epic, [], tasksByParent)).toBe('testar'); // t1 has no tests

      t1.testCases = [{ id: 'tc1', description: 'desc', expectedResult: 'exp', status: 'Passed', createdAt: '', updatedAt: '' }];
      expect(calculateTaskTestStatus(epic, [], tasksByParent)).toBe('teste_concluido');
    });

    describe('Benchmark', () => {
      it('should perform significantly better with tasksByParent map', () => {
        const numTasks = 1000;
        const allTasks: JiraTask[] = [];
        const epic = createMockTask('E1', 'Epic');
        allTasks.push(epic);

        for (let i = 0; i < numTasks; i++) {
          allTasks.push(createMockTask(`T${i}`, 'Tarefa', 'E1'));
        }

        // Pre-calculate map
        const tasksByParent = new Map<string, JiraTask[]>();
        allTasks.forEach(t => {
          if (t.parentId) {
            const children = tasksByParent.get(t.parentId) || [];
            children.push(t);
            tasksByParent.set(t.parentId, children);
          }
        });

        // Measure without map
        const startNoMap = performance.now();
        for (let i = 0; i < 10; i++) {
            calculateTaskTestStatus(epic, allTasks);
        }
        const endNoMap = performance.now();
        const timeNoMap = endNoMap - startNoMap;

        // Measure with map
        const startWithMap = performance.now();
        for (let i = 0; i < 10; i++) {
            calculateTaskTestStatus(epic, allTasks, tasksByParent);
        }
        const endWithMap = performance.now();
        const timeWithMap = endWithMap - startWithMap;

        console.log(`Benchmark (1000 tasks, 10 iterations):`);
        console.log(`Without map: ${timeNoMap.toFixed(4)}ms`);
        console.log(`With map: ${timeWithMap.toFixed(4)}ms`);
        console.log(`Speedup: ${(timeNoMap / timeWithMap).toFixed(2)}x`);

        expect(timeWithMap).toBeLessThan(timeNoMap);
      });
    });
  });
});
