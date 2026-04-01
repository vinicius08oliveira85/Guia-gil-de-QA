import { describe, it, expect, vi } from 'vitest';
import { validateProjectIntegrity } from '../../utils/dataIntegrityService';
import type { Project, JiraTask, TestCase } from '../../types';

function makeLargeProject(): Project {
  const tasks: JiraTask[] = [];
  for (let i = 0; i < 120; i++) {
    const testCases: TestCase[] = [];
    for (let j = 0; j < 40; j++) {
      testCases.push({
        id: `tc-${i}-${j}`,
        description: 'd',
        steps: ['s'],
        expectedResult: 'e',
        status: 'Not Run',
      });
    }
    tasks.push({
      id: `task-${i}`,
      title: `T${i}`,
      description: 'desc',
      status: 'To Do',
      type: 'Tarefa',
      testCases,
    });
  }
  return {
    id: 'large-integrity',
    name: 'Large',
    description: 'x',
    tasks,
    phases: [],
    documents: [{ name: 'doc.txt', content: 'c' }],
  };
}

describe('dataIntegrityService — impressão digital sem stringify completo', () => {
  it('validateProjectIntegrity não serializa o projeto inteiro com JSON.stringify', () => {
    const project = makeLargeProject();
    const stringifySpy = vi.spyOn(JSON, 'stringify');

    const result = validateProjectIntegrity(project);

    const serializedRootProject = stringifySpy.mock.calls.some((args) => args[0] === project);
    expect(serializedRootProject).toBe(false);

    expect(result).toHaveProperty('issues');
    expect(Array.isArray(result.issues)).toBe(true);

    stringifySpy.mockRestore();
  });
});
