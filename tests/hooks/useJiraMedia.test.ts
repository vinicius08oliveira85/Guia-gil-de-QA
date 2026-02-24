import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useJiraMedia, useJiraMediaInfo } from '../../hooks/useJiraMedia';

// Mock do getJiraConfig
const mockGetJiraConfig = vi.fn();
vi.mock('../../services/jiraService', () => ({
  getJiraConfig: () => mockGetJiraConfig(),
}));

// Mock do logger
vi.mock('../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock do jiraMediaService
const mockIsJiraUrl = vi.fn();
const mockGetMediaInfo = vi.fn();
vi.mock('../../services/jiraMediaService', () => ({
  jiraMediaService: {
    isJiraUrl: (url: string) => mockIsJiraUrl(url),
    getMediaInfo: (attachment: any, jiraUrl?: string, config?: any) =>
      mockGetMediaInfo(attachment, jiraUrl, config),
  },
}));

// Mock do fetch global
global.fetch = vi.fn();

describe('useJiraMedia', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetJiraConfig.mockReturnValue({
      url: 'https://jira.example.com',
      email: 'user@example.com',
      apiToken: 'token123',
    });
    mockIsJiraUrl.mockReturnValue(true);
    mockGetMediaInfo.mockReturnValue({
      id: '123',
      filename: 'image.png',
      size: 1024,
      mediaType: 'image',
      mimeType: 'image/png',
      url: 'https://jira.example.com/secure/attachment/123/image.png',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve retornar estado inicial correto', () => {
    const { result } = renderHook(() => useJiraMedia('123', 'image.png', 1024));

    expect(result.current.objectUrl).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('deve obter informações da mídia', () => {
    const { result } = renderHook(() => useJiraMedia('123', 'image.png', 1024));

    expect(mockGetMediaInfo).toHaveBeenCalled();
    expect(result.current.mediaInfo).toBeTruthy();
  });

  it('não deve carregar blob para tipos não-imagem', async () => {
    mockGetMediaInfo.mockReturnValue({
      id: '123',
      filename: 'document.pdf',
      size: 2048,
      mediaType: 'pdf',
      mimeType: 'application/pdf',
      url: 'https://jira.example.com/secure/attachment/123/document.pdf',
    });

    const { result } = renderHook(() => useJiraMedia('123', 'document.pdf', 2048));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('deve carregar imagem via proxy quando é URL do Jira', async () => {
    const mockBlob = new Blob(['image data'], { type: 'image/png' });
    const mockResponse = {
      ok: true,
      blob: vi.fn().mockResolvedValue(mockBlob),
    };

    (global.fetch as unknown as vi.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useJiraMedia('123', 'image.png', 1024));

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/jira-proxy',
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('isBinary'),
      })
    );
  });

  it('deve carregar imagem externa diretamente quando não é do Jira', async () => {
    mockIsJiraUrl.mockReturnValue(false);
    mockGetMediaInfo.mockReturnValue({
      id: '123',
      filename: 'image.png',
      size: 1024,
      mediaType: 'image',
      mimeType: 'image/png',
      url: 'https://external.com/image.png',
    });

    const mockBlob = new Blob(['image data'], { type: 'image/png' });
    const mockResponse = {
      ok: true,
      blob: vi.fn().mockResolvedValue(mockBlob),
    };

    (global.fetch as unknown as vi.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useJiraMedia('123', 'image.png', 1024));

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );

    expect(global.fetch).toHaveBeenCalledWith(
      'https://external.com/image.png',
      expect.objectContaining({ mode: 'cors' })
    );
  });

  it('deve tratar erro ao carregar imagem', async () => {
    (global.fetch as unknown as vi.Mock).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useJiraMedia('123', 'image.png', 1024));

    await waitFor(
      () => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );
  });

  it('deve tratar erro quando config do Jira não está disponível', async () => {
    mockGetJiraConfig.mockReturnValue(null);

    const { result } = renderHook(() => useJiraMedia('123', 'image.png', 1024));

    await waitFor(
      () => {
        expect(result.current.loading).toBe(false);
      },
      { timeout: 3000 }
    );
    expect(result.current.error).toBe(null);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('deve limpar recursos ao desmontar', async () => {
    const mockBlob = new Blob(['image data'], { type: 'image/png' });
    const mockResponse = {
      ok: true,
      blob: vi.fn().mockResolvedValue(mockBlob),
    };

    (global.fetch as unknown as vi.Mock).mockResolvedValue(mockResponse);

    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

    const { result, unmount } = renderHook(() => useJiraMedia('123', 'image.png', 1024));

    await waitFor(() => expect(result.current.objectUrl).toBeTruthy(), { timeout: 3000 });

    unmount();

    // Verificar que revokeObjectURL foi chamado (pode ser chamado no cleanup)
    // Nota: Pode não ser chamado imediatamente se objectUrl ainda não foi criado
    expect(revokeObjectURLSpy).toHaveBeenCalled();
  });
});

describe('useJiraMediaInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetJiraConfig.mockReturnValue({
      url: 'https://jira.example.com',
    });
    mockGetMediaInfo.mockReturnValue({
      id: '123',
      filename: 'image.png',
      size: 1024,
      mediaType: 'image',
      mimeType: 'image/png',
      url: 'https://jira.example.com/secure/attachment/123/image.png',
    });
  });

  it('deve retornar informações da mídia', () => {
    const { result } = renderHook(() => useJiraMediaInfo('123', 'image.png', 1024));

    expect(result.current).toBeTruthy();
    expect(result.current?.id).toBe('123');
    expect(result.current?.filename).toBe('image.png');
    expect(mockGetMediaInfo).toHaveBeenCalled();
  });

  it('deve atualizar quando parâmetros mudam', () => {
    const { result, rerender } = renderHook(
      ({ id, filename }) => useJiraMediaInfo(id, filename, 1024),
      { initialProps: { id: '123', filename: 'image.png' } }
    );

    expect(result.current?.id).toBe('123');

    rerender({ id: '456', filename: 'image2.jpg' });

    expect(mockGetMediaInfo).toHaveBeenCalledTimes(2);
  });
});
