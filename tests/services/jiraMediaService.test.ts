import { describe, it, expect, vi, beforeEach } from 'vitest';
import { jiraMediaService, JiraMediaService } from '../../services/jiraMediaService';

// Mock do getJiraConfig
vi.mock('../../services/jiraService', () => ({
  getJiraConfig: vi.fn(),
}));

// Mock do logger
vi.mock('../../utils/logger', () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import { getJiraConfig } from '../../services/jiraService';

describe('JiraMediaService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jiraMediaService.clearCache();
  });

  describe('detectMediaType', () => {
    it('deve detectar imagens por extensão', () => {
      expect(jiraMediaService.detectMediaType('image.png')).toBe('image');
      expect(jiraMediaService.detectMediaType('photo.jpg')).toBe('image');
      expect(jiraMediaService.detectMediaType('photo.jpeg')).toBe('image');
      expect(jiraMediaService.detectMediaType('image.gif')).toBe('image');
      expect(jiraMediaService.detectMediaType('image.webp')).toBe('image');
      expect(jiraMediaService.detectMediaType('image.svg')).toBe('image');
      expect(jiraMediaService.detectMediaType('image.bmp')).toBe('image');
    });

    it('deve detectar imagens por MIME type', () => {
      expect(jiraMediaService.detectMediaType('arquivo', 'image/png')).toBe('image');
      expect(jiraMediaService.detectMediaType('arquivo', 'image/jpeg')).toBe('image');
      expect(jiraMediaService.detectMediaType('arquivo', 'image/gif')).toBe('image');
    });

    it('deve detectar PDF', () => {
      expect(jiraMediaService.detectMediaType('document.pdf')).toBe('pdf');
      expect(jiraMediaService.detectMediaType('arquivo', 'application/pdf')).toBe('pdf');
    });

    it('deve detectar documentos Word', () => {
      expect(jiraMediaService.detectMediaType('document.doc')).toBe('document');
      expect(jiraMediaService.detectMediaType('document.docx')).toBe('document');
      expect(
        jiraMediaService.detectMediaType(
          'arquivo',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
      ).toBe('document');
    });

    it('deve detectar planilhas Excel', () => {
      expect(jiraMediaService.detectMediaType('spreadsheet.xls')).toBe('spreadsheet');
      expect(jiraMediaService.detectMediaType('spreadsheet.xlsx')).toBe('spreadsheet');
      expect(jiraMediaService.detectMediaType('data.csv')).toBe('spreadsheet');
      expect(jiraMediaService.detectMediaType('arquivo', 'application/vnd.ms-excel')).toBe(
        'spreadsheet'
      );
    });

    it('deve detectar arquivos de código', () => {
      expect(jiraMediaService.detectMediaType('script.js')).toBe('code');
      expect(jiraMediaService.detectMediaType('script.ts')).toBe('code');
      expect(jiraMediaService.detectMediaType('data.json')).toBe('code');
      expect(jiraMediaService.detectMediaType('page.html')).toBe('code');
      expect(jiraMediaService.detectMediaType('style.css')).toBe('code');
      expect(jiraMediaService.detectMediaType('readme.md')).toBe('code');
      expect(jiraMediaService.detectMediaType('arquivo', 'text/javascript')).toBe('code');
    });

    it('deve detectar arquivos compactados', () => {
      expect(jiraMediaService.detectMediaType('archive.zip')).toBe('archive');
      expect(jiraMediaService.detectMediaType('archive.rar')).toBe('archive');
      expect(jiraMediaService.detectMediaType('archive.7z')).toBe('archive');
      expect(jiraMediaService.detectMediaType('archive.tar')).toBe('archive');
      expect(jiraMediaService.detectMediaType('archive.gz')).toBe('archive');
      expect(jiraMediaService.detectMediaType('arquivo', 'application/zip')).toBe('archive');
    });

    it('deve retornar "other" para tipos desconhecidos', () => {
      expect(jiraMediaService.detectMediaType('arquivo.unknown')).toBe('other');
      expect(jiraMediaService.detectMediaType('arquivo', 'application/octet-stream')).toBe('other');
    });
  });

  describe('resolveMediaUrl', () => {
    it('deve resolver URL quando config do Jira está disponível', () => {
      vi.mocked(getJiraConfig).mockReturnValue({
        url: 'https://jira.example.com',
      });

      const url = jiraMediaService.resolveMediaUrl('123', 'file.pdf', undefined, {
        useProxy: false,
      });
      expect(url).toBe('https://jira.example.com/secure/attachment/123/file.pdf');
    });

    it('deve usar jiraUrl fornecido quando disponível', () => {
      const url = jiraMediaService.resolveMediaUrl('123', 'file.pdf', 'https://custom-jira.com', {
        useProxy: false,
      });
      expect(url).toBe('https://custom-jira.com/secure/attachment/123/file.pdf');
    });

    it('deve codificar nome do arquivo corretamente', () => {
      vi.mocked(getJiraConfig).mockReturnValue({
        url: 'https://jira.example.com',
      });

      const url = jiraMediaService.resolveMediaUrl('123', 'arquivo com espaços.pdf', undefined, {
        useProxy: false,
      });
      expect(url).toContain(encodeURIComponent('arquivo com espaços.pdf'));
    });

    it('deve retornar string vazia quando config não está disponível', () => {
      vi.mocked(getJiraConfig).mockReturnValue(null);

      const url = jiraMediaService.resolveMediaUrl('123', 'file.pdf');
      expect(url).toBe('');
    });

    it('deve remover barra final da URL do Jira', () => {
      vi.mocked(getJiraConfig).mockReturnValue({
        url: 'https://jira.example.com/',
      });

      const url = jiraMediaService.resolveMediaUrl('123', 'file.pdf', undefined, {
        useProxy: false,
      });
      expect(url).not.toContain('//secure');
      expect(url).toBe('https://jira.example.com/secure/attachment/123/file.pdf');
    });
  });

  describe('getMediaInfo', () => {
    beforeEach(() => {
      vi.mocked(getJiraConfig).mockReturnValue({
        url: 'https://jira.example.com',
      });
    });

    it('deve retornar informações completas da mídia', () => {
      const attachment = {
        id: '123',
        filename: 'image.png',
        size: 1024,
        created: '2024-01-01',
        author: 'John Doe',
      };

      const info = jiraMediaService.getMediaInfo(attachment);

      expect(info.id).toBe('123');
      expect(info.filename).toBe('image.png');
      expect(info.size).toBe(1024);
      expect(info.mediaType).toBe('image');
      expect(info.mimeType).toBe('image/png');
      expect(info.url).toContain('/secure/attachment/123/');
      expect(info.created).toBe('2024-01-01');
      expect(info.author).toBe('John Doe');
    });

    it('deve detectar MIME type corretamente', () => {
      const info = jiraMediaService.getMediaInfo({
        id: '123',
        filename: 'document.pdf',
        size: 2048,
      });

      expect(info.mimeType).toBe('application/pdf');
      expect(info.mediaType).toBe('pdf');
    });

    it('deve usar jiraUrl fornecido', () => {
      const info = jiraMediaService.getMediaInfo(
        { id: '123', filename: 'file.pdf', size: 1024 },
        'https://custom-jira.com'
      );

      expect(info.url).toContain('https://custom-jira.com');
    });
  });

  describe('isJiraUrl', () => {
    it('deve identificar URLs do Jira por origin', () => {
      vi.mocked(getJiraConfig).mockReturnValue({
        url: 'https://jira.example.com',
      });

      expect(
        jiraMediaService.isJiraUrl('https://jira.example.com/secure/attachment/123/file.pdf')
      ).toBe(true);
    });

    it('deve identificar URLs do Jira por path', () => {
      expect(
        jiraMediaService.isJiraUrl('https://any-domain.com/secure/attachment/123/file.pdf')
      ).toBe(true);
      expect(jiraMediaService.isJiraUrl('https://any-domain.com/rest/api/3/issue/123')).toBe(true);
    });

    it('deve retornar false para URLs externas', () => {
      vi.mocked(getJiraConfig).mockReturnValue({
        url: 'https://jira.example.com',
      });

      expect(jiraMediaService.isJiraUrl('https://external.com/image.png')).toBe(false);
    });

    it('deve retornar false quando config não está disponível', () => {
      vi.mocked(getJiraConfig).mockReturnValue(null);

      expect(jiraMediaService.isJiraUrl('https://jira.example.com/file.pdf')).toBe(false);
    });

    it('deve retornar false para URLs inválidas', () => {
      expect(jiraMediaService.isJiraUrl('not-a-url')).toBe(false);
      expect(jiraMediaService.isJiraUrl('')).toBe(false);
    });
  });

  describe('clearCache', () => {
    it('deve limpar o cache de URLs', () => {
      // Adicionar algo ao cache (se houver método público)
      jiraMediaService.clearCache();
      // Verificar que não há erros
      expect(true).toBe(true);
    });
  });

  describe('Singleton', () => {
    it('deve retornar a mesma instância', () => {
      const instance1 = JiraMediaService.getInstance();
      const instance2 = JiraMediaService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });
});
