import { describe, it, expect, vi, afterEach } from 'vitest';
import { parentLinkCreatesCycle, normalizeTasksParentIdsAcyclic, withAcyclicTaskParents } from '../../utils/taskParentCycle';
import type { JiraTask, Project } from '../../types';
import { logger } from '../../utils/logger';

function mapFromNodes(nodes: { id: string; parentId?: string | null }[]) {
    return new Map(nodes.map((n) => [n.id, n]));
}

describe('parentLinkCreatesCycle', () => {
    it('retorna true quando o pai proposto é o próprio taskId (auto-loop)', () => {
        const m = mapFromNodes([{ id: 'A', parentId: 'A' }]);
        expect(parentLinkCreatesCycle(m, 'A', 'A')).toBe(true);
    });

    it('retorna true em ciclo A↔B (subir a partir do pai encontra taskId)', () => {
        const m = mapFromNodes([
            { id: 'A', parentId: 'B' },
            { id: 'B', parentId: 'A' },
        ]);
        expect(parentLinkCreatesCycle(m, 'A', 'B')).toBe(true);
        expect(parentLinkCreatesCycle(m, 'B', 'A')).toBe(true);
    });

    it('retorna false em cadeia acíclica simples', () => {
        const m = mapFromNodes([
            { id: 'root', parentId: undefined },
            { id: 'child', parentId: 'root' },
        ]);
        expect(parentLinkCreatesCycle(m, 'child', 'root')).toBe(false);
    });

    it('retorna true se a cadeia de parentId revisita um nó (ciclo longo nos dados)', () => {
        const m = mapFromNodes([
            { id: 'A', parentId: 'B' },
            { id: 'B', parentId: 'C' },
            { id: 'C', parentId: 'B' },
        ]);
        expect(parentLinkCreatesCycle(m, 'A', 'B')).toBe(true);
    });
});

describe('normalizeTasksParentIdsAcyclic', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    const minimalTask = (id: string, parentId?: string): JiraTask =>
        ({
            id,
            title: id,
            description: '',
            status: 'To Do',
            type: 'Tarefa',
            priority: 'Média',
            createdAt: new Date().toISOString(),
            tags: [],
            testCases: [],
            bddScenarios: [],
            comments: [],
            ...(parentId !== undefined ? { parentId } : {}),
        }) as JiraTask;

    it('remove parentId em ciclo A↔B e preserva referência do array quando não há mudança', () => {
        const acyclic = [minimalTask('A'), minimalTask('B', 'A')];
        expect(normalizeTasksParentIdsAcyclic(acyclic)).toBe(acyclic);

        const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const cyclic = [minimalTask('A', 'B'), minimalTask('B', 'A')];
        const out = normalizeTasksParentIdsAcyclic(cyclic);
        expect(out).not.toBe(cyclic);
        expect(out.find((t) => t.id === 'A')?.parentId).toBeUndefined();
        expect(out.find((t) => t.id === 'B')?.parentId).toBeUndefined();
        expect(warnSpy).toHaveBeenCalled();
    });

    it('não registra warn quando silent: true', () => {
        const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {});
        const cyclic = [minimalTask('A', 'B'), minimalTask('B', 'A')];
        normalizeTasksParentIdsAcyclic(cyclic, { silent: true });
        expect(warnSpy).not.toHaveBeenCalled();
    });
});

describe('withAcyclicTaskParents', () => {
    it('preserva referência do projeto quando tasks está vazio ou acíclico', () => {
        const empty = { id: 'p1', name: 'P', tasks: [] } as unknown as Project;
        expect(withAcyclicTaskParents(empty)).toBe(empty);

        const tasks = [{ id: 'A', parentId: undefined }] as JiraTask[];
        const p = { id: 'p2', name: 'P2', tasks } as unknown as Project;
        expect(withAcyclicTaskParents(p)).toBe(p);
    });
});
