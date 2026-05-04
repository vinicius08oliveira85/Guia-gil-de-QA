import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRouterSync } from '../../hooks/useRouterSync';
import type { Project } from '../../types';

const emptyProjects: Project[] = [];

describe('useRouterSync', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('hidrata a seleção a partir de ?project= na URL (useLayoutEffect antes do estado→URL)', () => {
    window.history.replaceState({}, '', '/?project=proj-hidratado');
    const selectProject = vi.fn();
    const setShowSettings = vi.fn();

    renderHook(() =>
      useRouterSync({
        selectedProjectId: null,
        projects: emptyProjects,
        showSettings: false,
        setShowSettings,
        selectProject,
        isLoading: false,
      })
    );

    expect(selectProject).toHaveBeenCalledTimes(1);
    expect(selectProject).toHaveBeenCalledWith('proj-hidratado');
  });

  it('não chama replaceState do efeito estado→URL enquanto isLoading é true (só layout/normalização pode usar replaceState)', () => {
    window.history.replaceState({}, '', '/?project=proj-loading');
    const replaceSpy = vi.spyOn(window.history, 'replaceState');
    const selectProject = vi.fn();
    const setShowSettings = vi.fn();

    renderHook(() =>
      useRouterSync({
        selectedProjectId: null,
        projects: emptyProjects,
        showSettings: false,
        setShowSettings,
        selectProject,
        isLoading: true,
      })
    );

    const callsForStateToUrl = replaceSpy.mock.calls.filter(
      c => typeof c[2] === 'string' && String(c[2]).startsWith('/')
    );
    expect(callsForStateToUrl.length).toBe(0);
  });

  it('após isLoading passar a false, sincroniza estado→URL com replaceState', () => {
    window.history.replaceState({}, '', '/?project=orphan');
    const replaceSpy = vi.spyOn(window.history, 'replaceState');
    const selectProject = vi.fn();
    const setShowSettings = vi.fn();

    const { rerender } = renderHook(
      (p: { loading: boolean }) =>
        useRouterSync({
          selectedProjectId: null,
          projects: emptyProjects,
          showSettings: false,
          setShowSettings,
          selectProject,
          isLoading: p.loading,
        }),
      { initialProps: { loading: true } }
    );

    const countAfterLoading = replaceSpy.mock.calls.length;

    act(() => {
      rerender({ loading: false });
    });

    expect(replaceSpy.mock.calls.length).toBeGreaterThan(countAfterLoading);
    const last = replaceSpy.mock.calls[replaceSpy.mock.calls.length - 1];
    expect(last?.[2]).toBeDefined();
    expect(String(last[2])).toMatch(/^\/(\?|$)/);
  });

  it('usa replaceState (não pushState) no efeito estado→URL após carregar', () => {
    window.history.replaceState({}, '', '/?project=old');
    const pushSpy = vi.spyOn(window.history, 'pushState');
    const replaceSpy = vi.spyOn(window.history, 'replaceState');

    const { rerender } = renderHook(
      (p: { loading: boolean; id: string | null }) =>
        useRouterSync({
          selectedProjectId: p.id,
          projects: emptyProjects,
          showSettings: false,
          setShowSettings: vi.fn(),
          selectProject: vi.fn(),
          isLoading: p.loading,
        }),
      { initialProps: { loading: true, id: null as string | null } }
    );

    act(() => {
      rerender({ loading: false, id: null });
    });

    const pushAfterSync = pushSpy.mock.calls.length;
    expect(replaceSpy.mock.calls.length).toBeGreaterThan(0);
    expect(pushAfterSync).toBe(0);
  });
});
