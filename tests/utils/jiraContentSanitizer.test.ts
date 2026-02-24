import { describe, it, expect, vi } from 'vitest';
import { JiraContentSanitizer } from '../../utils/jiraContentSanitizer';

// Mock do sanitizeHTML
vi.mock('../../utils/sanitize', () => ({
    sanitizeHTML: (html: string) => html, // Retornar HTML como está para testes
}));

// Mock do jiraMediaService
vi.mock('../../services/jiraMediaService', () => ({
    jiraMediaService: {
        isJiraUrl: vi.fn((url: string) => url.includes('/secure/attachment/')),
    },
}));

describe('JiraContentSanitizer', () => {
    describe('sanitize', () => {
        it('deve retornar conteúdo vazio para HTML vazio', () => {
            const result = JiraContentSanitizer.sanitize('');
            expect(result.html).toBe('');
            expect(result.hasImages).toBe(false);
            expect(result.imageCount).toBe(0);
            expect(result.hasLinks).toBe(false);
            expect(result.linkCount).toBe(0);
        });

        it('deve contar imagens corretamente', () => {
            const html = '<p>Texto</p><img src="image.png" alt="Imagem" /><img src="image2.jpg" />';
            const result = JiraContentSanitizer.sanitize(html);
            expect(result.imageCount).toBe(2);
            expect(result.hasImages).toBe(true);
        });

        it('deve contar links corretamente', () => {
            const html = '<p>Texto <a href="https://example.com">Link</a> e <a href="https://test.com">Outro</a></p>';
            const result = JiraContentSanitizer.sanitize(html);
            expect(result.linkCount).toBe(2);
            expect(result.hasLinks).toBe(true);
        });

        it('deve remover imagens quando allowImages é false', () => {
            const html = '<p>Texto</p><img src="image.png" alt="Imagem" />';
            const result = JiraContentSanitizer.sanitize(html, { allowImages: false });
            expect(result.imageCount).toBe(0);
            expect(result.hasImages).toBe(false);
            expect(result.html).not.toContain('<img');
        });

        it('deve remover links quando allowLinks é false', () => {
            const html = '<p>Texto <a href="https://example.com">Link</a></p>';
            const result = JiraContentSanitizer.sanitize(html, { allowLinks: false });
            expect(result.linkCount).toBe(0);
            expect(result.hasLinks).toBe(false);
            expect(result.html).not.toContain('<a href');
            expect(result.html).toContain('Link'); // Texto do link deve permanecer
        });

        it('deve processar imagens do Jira em formato Markdown', () => {
            const html = 'Texto com !imagem.png! no meio';
            const attachments = [
                { id: '123', filename: 'imagem.png', size: 1024 },
            ];
            const result = JiraContentSanitizer.sanitize(html, {
                processJiraImages: true,
                jiraAttachments: attachments,
                jiraUrl: 'https://jira.example.com',
            });
            
            expect(result.html).toContain('<img');
            expect(result.html).toContain('data-jira-url');
            expect(result.html).toContain('data-attachment-id="123"');
            expect(result.html).toContain('class="jira-image"');
        });

        it('deve processar imagens Markdown com parâmetros', () => {
            const html = 'Texto com !imagem.png|width=200! no meio';
            const attachments = [
                { id: '123', filename: 'imagem.png', size: 1024 },
            ];
            const result = JiraContentSanitizer.sanitize(html, {
                processJiraImages: true,
                jiraAttachments: attachments,
                jiraUrl: 'https://jira.example.com',
            });
            
            expect(result.html).toContain('width="200"');
        });

        it('deve processar tags img existentes e adicionar atributos', () => {
            const html = '<img src="image.png" alt="Teste" />';
            const attachments = [
                { id: '123', filename: 'image.png', size: 1024 },
            ];
            const result = JiraContentSanitizer.sanitize(html, {
                processJiraImages: true,
                jiraAttachments: attachments,
                jiraUrl: 'https://jira.example.com',
            });
            
            expect(result.html).toContain('data-jira-url');
            expect(result.html).toContain('data-attachment-id="123"');
            expect(result.html).toContain('loading="lazy"');
        });

        it('deve processar URLs completas do Jira', () => {
            const html = '<img src="https://jira.example.com/secure/attachment/123/image.png" />';
            const result = JiraContentSanitizer.sanitize(html, {
                processJiraImages: true,
                jiraUrl: 'https://jira.example.com',
            });
            
            expect(result.html).toContain('data-jira-url');
            expect(result.html).toContain('data-attachment-id="123"');
        });

        it('não deve processar imagens data: URLs', () => {
            const html = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" />';
            const result = JiraContentSanitizer.sanitize(html, {
                processJiraImages: true,
                jiraUrl: 'https://jira.example.com',
            });
            
            // Data URL deve permanecer inalterada
            expect(result.html).toContain('data:image/png');
        });

        it('deve escapar caracteres HTML perigosos', () => {
            const html = '<img src="test.png" alt="<script>alert(\'xss\')</script>" />';
            const attachments = [
                { id: '123', filename: 'test.png', size: 1024 },
            ];
            const result = JiraContentSanitizer.sanitize(html, {
                processJiraImages: true,
                jiraAttachments: attachments,
                jiraUrl: 'https://jira.example.com',
            });
            
            // Script não deve aparecer como tag executável
            expect(result.html).not.toContain('<script>');
        });
    });

    describe('extractImageUrls', () => {
        it('deve extrair URLs de imagens simples', () => {
            const html = '<img src="https://example.com/image.png" alt="Teste" />';
            const urls = JiraContentSanitizer.extractImageUrls(html);
            
            expect(urls).toHaveLength(1);
            expect(urls[0].url).toBe('https://example.com/image.png');
            expect(urls[0].alt).toBe('Teste');
        });

        it('deve extrair múltiplas URLs de imagens', () => {
            const html = '<img src="image1.png" /><img src="image2.jpg" alt="Imagem 2" />';
            const urls = JiraContentSanitizer.extractImageUrls(html);
            
            expect(urls).toHaveLength(2);
            expect(urls[0].url).toBe('image1.png');
            expect(urls[1].url).toBe('image2.jpg');
            expect(urls[1].alt).toBe('Imagem 2');
        });

        it('deve extrair attachment ID quando disponível', () => {
            const html = '<img src="image.png" data-attachment-id="123" />';
            const urls = JiraContentSanitizer.extractImageUrls(html);
            
            expect(urls[0].attachmentId).toBe('123');
        });

        it('deve retornar array vazio quando não há imagens', () => {
            const html = '<p>Apenas texto</p>';
            const urls = JiraContentSanitizer.extractImageUrls(html);
            
            expect(urls).toHaveLength(0);
        });

        it('deve lidar com imagens sem src', () => {
            const html = '<img alt="Sem src" />';
            const urls = JiraContentSanitizer.extractImageUrls(html);
            
            expect(urls).toHaveLength(0);
        });
    });
});

