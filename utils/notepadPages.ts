import type { NotepadPage, Project } from '../types';

export const MAX_NOTEPAD_PAGES = 30;
export const DEFAULT_NOTEPAD_PAGE_TITLE = 'Sem título';

export function createNotepadPage(title = DEFAULT_NOTEPAD_PAGE_TITLE, content = ''): NotepadPage {
  const now = new Date().toISOString();
  return {
    id: `notepad-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title: title.trim() || DEFAULT_NOTEPAD_PAGE_TITLE,
    content,
    createdAt: now,
    updatedAt: now,
  };
}

/** Resolve páginas do bloco de notas, migrando `notepadContent` legado se necessário. */
export function resolveNotepadPages(project: Project): NotepadPage[] {
  if (Array.isArray(project.notepadPages) && project.notepadPages.length > 0) {
    return project.notepadPages.map(sanitizeNotepadPage);
  }

  const legacy = project.notepadContent;
  if (typeof legacy === 'string' && legacy.length > 0) {
    return [createNotepadPage('Nota 1', legacy)];
  }

  return [createNotepadPage()];
}

function sanitizeNotepadPage(page: NotepadPage): NotepadPage {
  const now = new Date().toISOString();
  return {
    id: page.id?.trim() || `notepad-${Date.now()}`,
    title: page.title?.trim() || DEFAULT_NOTEPAD_PAGE_TITLE,
    content: typeof page.content === 'string' ? page.content : '',
    createdAt: page.createdAt || now,
    updatedAt: page.updatedAt || now,
  };
}

export function getNotepadPageById(pages: NotepadPage[], pageId: string): NotepadPage | undefined {
  return pages.find(p => p.id === pageId);
}

export function pickActiveNotepadPageId(pages: NotepadPage[], preferredId?: string | null): string {
  if (preferredId && pages.some(p => p.id === preferredId)) {
    return preferredId;
  }
  return pages[0]?.id ?? createNotepadPage().id;
}

export function projectWithNotepadPages(project: Project, pages: NotepadPage[]): Project {
  return {
    ...project,
    notepadPages: pages,
    notepadContent: undefined,
    updatedAt: new Date().toISOString(),
  };
}

export function updateNotepadPageContent(
  project: Project,
  pageId: string,
  content: string
): Project {
  const pages = resolveNotepadPages(project);
  const now = new Date().toISOString();
  const next = pages.map(p =>
    p.id === pageId ? { ...p, content, updatedAt: now } : p
  );
  return projectWithNotepadPages(project, next);
}

export function addNotepadPage(project: Project, title?: string, content = ''): {
  project: Project;
  pageId: string;
} {
  const pages = resolveNotepadPages(project);
  if (pages.length >= MAX_NOTEPAD_PAGES) {
    return { project, pageId: '' };
  }
  const page = createNotepadPage(title, content);
  return {
    project: projectWithNotepadPages(project, [...pages, page]),
    pageId: page.id,
  };
}

export function renameNotepadPage(project: Project, pageId: string, title: string): Project {
  const pages = resolveNotepadPages(project);
  const trimmed = title.trim() || DEFAULT_NOTEPAD_PAGE_TITLE;
  const now = new Date().toISOString();
  const next = pages.map(p => (p.id === pageId ? { ...p, title: trimmed, updatedAt: now } : p));
  return projectWithNotepadPages(project, next);
}

export function clearNotepadPageContent(project: Project, pageId: string): Project {
  return updateNotepadPageContent(project, pageId, '');
}

export function deleteNotepadPage(project: Project, pageId: string): {
  project: Project;
  nextActiveId: string | null;
} {
  const pages = resolveNotepadPages(project);
  if (pages.length <= 1) {
    return { project, nextActiveId: pages[0]?.id ?? null };
  }
  const index = pages.findIndex(p => p.id === pageId);
  if (index < 0) {
    return { project, nextActiveId: pages[0]?.id ?? null };
  }
  const nextPages = pages.filter(p => p.id !== pageId);
  const fallback = nextPages[Math.max(0, index - 1)] ?? nextPages[0];
  return {
    project: projectWithNotepadPages(project, nextPages),
    nextActiveId: fallback?.id ?? null,
  };
}

export function replaceNotepadPageContentFromFile(
  project: Project,
  pageId: string,
  content: string,
  fileName?: string
): Project {
  const pages = resolveNotepadPages(project);
  const now = new Date().toISOString();
  const baseTitle = fileName?.replace(/\.[^.]+$/, '').trim();
  const next = pages.map(p => {
    if (p.id !== pageId) return p;
    const shouldRename =
      p.title === DEFAULT_NOTEPAD_PAGE_TITLE && !p.content.trim() && baseTitle;
    return {
      ...p,
      content,
      title: shouldRename ? baseTitle : p.title,
      updatedAt: now,
    };
  });
  return projectWithNotepadPages(project, next);
}

export function notepadPagesFingerprint(pages: NotepadPage[]): string {
  return JSON.stringify(
    pages.map(p => ({
      id: p.id,
      title: p.title,
      content: p.content,
      updatedAt: p.updatedAt,
    }))
  );
}
