import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';

const { createRootMock, rootInstances } = vi.hoisted(() => {
  const roots: Array<{ render: ReturnType<typeof vi.fn>; unmount: ReturnType<typeof vi.fn> }> = [];
  const createRoot = vi.fn((element: Element) => {
    const root = {
      render: vi.fn(() => {
        if (element instanceof HTMLElement) {
          element.setAttribute('data-jira-image-mounted', 'true');
        }
      }),
      unmount: vi.fn(),
    };
    roots.push(root);
    return root;
  });

  return {
    createRootMock: createRoot,
    rootInstances: roots,
  };
});

vi.mock('react-dom/client', () => ({
  createRoot: createRootMock,
}));

vi.mock('../../../components/jira/JiraImage', () => ({
  JiraImage: ({ alt }: { alt?: string }) => <div data-testid="jira-image-component">{alt || 'imagem'}</div>,
}));

import { JiraRichContent } from '../../../components/tasks/JiraRichContent';

describe('JiraRichContent', () => {
  beforeEach(() => {
    createRootMock.mockClear();
    rootInstances.length = 0;
  });

  it('converte imagens Jira existentes no HTML em mounts React uma única vez', async () => {
    const html =
      '<p>Descrição</p><img class="jira-image" src="https://jira.example.com/secure/attachment/123/teste.png" data-jira-url="https://jira.example.com/secure/attachment/123/teste.png" alt="Evidência" />';

    const { container } = render(<JiraRichContent html={html} />);

    await waitFor(() => {
      expect(createRootMock).toHaveBeenCalledTimes(1);
    });

    expect(container.querySelector('[data-jira-image-react-root="true"]')).toBeInTheDocument();
    expect(container.querySelector('img.jira-image')).not.toBeInTheDocument();
    expect(rootInstances[0]?.render).toHaveBeenCalledTimes(1);
  });

  it('desmonta os roots criados ao desmontar o conteúdo', async () => {
    const html =
      '<img class="jira-image" src="https://jira.example.com/secure/attachment/456/teste-2.png" data-jira-url="https://jira.example.com/secure/attachment/456/teste-2.png" alt="Outra evidência" />';

    const { unmount } = render(<JiraRichContent html={html} />);

    await waitFor(() => {
      expect(createRootMock).toHaveBeenCalledTimes(1);
    });

    unmount();

    expect(rootInstances[0]?.unmount).toHaveBeenCalledTimes(1);
  });
});
