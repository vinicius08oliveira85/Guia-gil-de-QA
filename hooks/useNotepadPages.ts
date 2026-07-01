import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Project } from '../types';
import { useProjectsStore } from '../store/projectsStore';
import {
  addNotepadPage,
  clearNotepadPageContent,
  deleteNotepadPage,
  getNotepadPageById,
  MAX_NOTEPAD_PAGES,
  pickActiveNotepadPageId,
  renameNotepadPage,
  replaceNotepadPageContentFromFile,
  resolveNotepadPages,
  updateNotepadPageContent,
} from '../utils/notepadPages';
import { loadNotepadDockState, saveNotepadDockState } from '../utils/notepadDockStorage';

export function useNotepadPages(project: Project) {
  const upsertProjectInMemory = useProjectsStore(s => s.upsertProjectInMemory);
  const projectRef = useRef(project);

  const pages = useMemo(() => resolveNotepadPages(project), [project]);

  const [activePageId, setActivePageIdState] = useState(() =>
    pickActiveNotepadPageId(pages, loadNotepadDockState(project.id).activePageId)
  );

  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  useEffect(() => {
    const stored = loadNotepadDockState(project.id).activePageId;
    setActivePageIdState(pickActiveNotepadPageId(resolveNotepadPages(project), stored));
  }, [project.id]);

  useEffect(() => {
    if (pages.some(p => p.id === activePageId)) return;
    setActivePageIdState(pickActiveNotepadPageId(pages));
  }, [pages, activePageId]);

  const persistActivePageId = useCallback(
    (pageId: string) => {
      const dock = loadNotepadDockState(project.id);
      saveNotepadDockState(project.id, { ...dock, activePageId: pageId });
    },
    [project.id]
  );

  const setActivePageId = useCallback(
    (pageId: string) => {
      setActivePageIdState(pageId);
      persistActivePageId(pageId);
    },
    [persistActivePageId]
  );

  const applyProject = useCallback(
    (next: Project, nextActiveId?: string) => {
      upsertProjectInMemory(next);
      if (nextActiveId) {
        setActivePageId(nextActiveId);
      }
    },
    [setActivePageId, upsertProjectInMemory]
  );

  const activePage = useMemo(
    () => getNotepadPageById(pages, activePageId) ?? pages[0],
    [pages, activePageId]
  );

  const updateContent = useCallback(
    (content: string) => {
      if (!activePage) return;
      upsertProjectInMemory(updateNotepadPageContent(projectRef.current, activePage.id, content));
    },
    [activePage, upsertProjectInMemory]
  );

  const createPage = useCallback(
    (title?: string, content = '') => {
      const { project: next, pageId } = addNotepadPage(projectRef.current, title, content);
      if (!pageId) return null;
      applyProject(next, pageId);
      return pageId;
    },
    [applyProject]
  );

  const renamePage = useCallback(
    (pageId: string, title: string) => {
      applyProject(renameNotepadPage(projectRef.current, pageId, title));
    },
    [applyProject]
  );

  const clearPage = useCallback(
    (pageId: string) => {
      applyProject(clearNotepadPageContent(projectRef.current, pageId));
    },
    [applyProject]
  );

  const removePage = useCallback(
    (pageId: string) => {
      const { project: next, nextActiveId } = deleteNotepadPage(projectRef.current, pageId);
      applyProject(next, nextActiveId ?? undefined);
    },
    [applyProject]
  );

  const loadFileIntoPage = useCallback(
    (pageId: string, content: string, fileName?: string) => {
      applyProject(replaceNotepadPageContentFromFile(projectRef.current, pageId, content, fileName));
    },
    [applyProject]
  );

  return {
    pages,
    activePage,
    activePageId: activePage?.id ?? activePageId,
    setActivePageId,
    updateContent,
    createPage,
    renamePage,
    clearPage,
    removePage,
    loadFileIntoPage,
    canAddPage: pages.length < MAX_NOTEPAD_PAGES,
    maxPages: MAX_NOTEPAD_PAGES,
  };
}
