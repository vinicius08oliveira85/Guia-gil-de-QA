import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  formatProjectActivityLabel,
  getLastOpenedProjectIds,
  getRecentProjectsForLanding,
  recordLastOpenedProject,
} from '../../utils/landingRecentProjects';
import type { Project } from '../../types';

const project = (id: string, name: string, updatedAt?: string, createdAt?: string): Project => ({
  id,
  name,
  description: '',
  documents: [],
  businessRules: [],
  tasks: [],
  phases: [],
  ...(updatedAt ? { updatedAt } : {}),
  ...(createdAt ? { createdAt } : {}),
});

describe('landingRecentProjects', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('ordena por updatedAt e limita a 3 quando não há aberturas', () => {
    const projects = [
      project('a', 'A', '2026-01-01T00:00:00.000Z'),
      project('b', 'B', '2026-03-01T00:00:00.000Z'),
      project('c', 'C', '2026-02-01T00:00:00.000Z'),
      project('d', 'D', '2026-04-01T00:00:00.000Z'),
    ];
    const recent = getRecentProjectsForLanding(projects, 3, []);
    expect(recent.map(p => p.id)).toEqual(['d', 'b', 'c']);
  });

  it('prioriza últimos abertos sobre updatedAt', () => {
    const projects = [
      project('a', 'A', '2026-04-01T00:00:00.000Z'),
      project('b', 'B', '2026-03-01T00:00:00.000Z'),
      project('c', 'C', '2026-02-01T00:00:00.000Z'),
    ];
    const recent = getRecentProjectsForLanding(projects, 2, ['c', 'b']);
    expect(recent.map(p => p.id)).toEqual(['c', 'b']);
  });

  it('recordLastOpenedProject move o id para o início', () => {
    recordLastOpenedProject('a');
    recordLastOpenedProject('b');
    recordLastOpenedProject('a');
    expect(getLastOpenedProjectIds()).toEqual(['a', 'b']);
  });

  it('usa createdAt quando updatedAt está ausente', () => {
    const projects = [
      project('old', 'Old', undefined, '2025-01-01T00:00:00.000Z'),
      project('new', 'New', undefined, '2026-06-01T00:00:00.000Z'),
    ];
    expect(getRecentProjectsForLanding(projects, 1, [])[0].id).toBe('new');
  });

  it('formatProjectActivityLabel descreve atividade recente', () => {
    const today = project('t', 'Today', new Date().toISOString());
    expect(formatProjectActivityLabel(today)).toBe('Atualizado hoje');
    expect(formatProjectActivityLabel(today, { wasLastOpened: true })).toBe('Aberto recentemente');
  });
});
