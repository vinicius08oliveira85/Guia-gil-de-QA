import { describe, it, expect } from 'vitest';
import { buildTaskTreeSectionA11y } from '../../components/tasks/tasksViewHelpers';

describe('buildTaskTreeSectionA11y', () => {
  it('numera em DFS pré-ordem com setsize igual ao total de nós na seção', () => {
    const roots = [
      {
        id: 'a',
        children: [
          { id: 'a1', children: [] },
          { id: 'a2', children: [{ id: 'a2x', children: [] }] },
        ],
      },
      { id: 'b', children: [] },
    ];
    const map = buildTaskTreeSectionA11y(roots);
    expect(map.get('a')).toEqual({ posinset: 1, setsize: 5 });
    expect(map.get('a1')).toEqual({ posinset: 2, setsize: 5 });
    expect(map.get('a2')).toEqual({ posinset: 3, setsize: 5 });
    expect(map.get('a2x')).toEqual({ posinset: 4, setsize: 5 });
    expect(map.get('b')).toEqual({ posinset: 5, setsize: 5 });
  });

  it('lista vazia resulta em mapa vazio', () => {
    expect(buildTaskTreeSectionA11y([]).size).toBe(0);
  });
});
