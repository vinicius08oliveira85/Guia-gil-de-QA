import { describe, expect, it } from 'vitest';
import {
  addNotepadPage,
  createNotepadPage,
  deleteNotepadPage,
  resolveNotepadPages,
  updateNotepadPageContent,
} from '../../utils/notepadPages';
import type { Project } from '../../types';

const baseProject = (overrides?: Partial<Project>): Project =>
  ({
    id: 'p1',
    name: 'Projeto',
    description: '',
    documents: [],
    businessRules: [],
    tasks: [],
    phases: [],
    ...overrides,
  }) as Project;

describe('notepadPages', () => {
  it('migra notepadContent legado para uma página', () => {
    const pages = resolveNotepadPages(
      baseProject({ notepadContent: 'texto antigo', notepadPages: undefined })
    );
    expect(pages).toHaveLength(1);
    expect(pages[0]?.content).toBe('texto antigo');
    expect(pages[0]?.title).toBe('Nota 1');
  });

  it('adiciona nova aba e atualiza conteúdo', () => {
    let project = baseProject();
    const added = addNotepadPage(project, 'Reunião');
    project = added.project;
    expect(project.notepadPages).toHaveLength(2);
    project = updateNotepadPageContent(project, added.pageId, 'pauta');
    expect(project.notepadPages?.find(p => p.id === added.pageId)?.content).toBe('pauta');
  });

  it('não remove a última aba', () => {
    const page = createNotepadPage('Única');
    const project = baseProject({ notepadPages: [page] });
    const result = deleteNotepadPage(project, page.id);
    expect(resolveNotepadPages(result.project)).toHaveLength(1);
    expect(result.nextActiveId).toBe(page.id);
  });
});
