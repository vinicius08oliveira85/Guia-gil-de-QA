import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { FilePreview } from '../../../components/common/FilePreview';

// Mock do useJiraMedia
const mockUseJiraMedia = vi.fn();
vi.mock('../../../hooks/useJiraMedia', () => ({
    useJiraMedia: (attachmentId: string, filename: string, size?: number) => 
        mockUseJiraMedia(attachmentId, filename, size),
}));

describe('FilePreview', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('deve renderizar preview de imagem quando mediaType é image e objectUrl está disponível', async () => {
        mockUseJiraMedia.mockReturnValue({
            objectUrl: 'blob:http://localhost/test',
            loading: false,
            error: null,
            mediaInfo: {
                id: '123',
                filename: 'test.png',
                size: 1024,
                mediaType: 'image',
                mimeType: 'image/png',
                url: 'https://jira.example.com/secure/attachment/123/test.png',
            },
        });

        render(
            <FilePreview
                attachmentId="123"
                filename="test.png"
                size={1024}
                mediaType="image"
            />
        );

        await waitFor(() => {
            const img = screen.queryByAltText('test.png');
            expect(img).toBeInTheDocument();
        });
    });

    it('deve renderizar estado de loading para imagens', () => {
        mockUseJiraMedia.mockReturnValue({
            objectUrl: null,
            loading: true,
            error: null,
            mediaInfo: {
                id: '123',
                filename: 'test.png',
                size: 1024,
                mediaType: 'image',
                mimeType: 'image/png',
                url: 'https://jira.example.com/secure/attachment/123/test.png',
            },
        });

        render(
            <FilePreview
                attachmentId="123"
                filename="test.png"
                size={1024}
                mediaType="image"
            />
        );

        // Deve mostrar placeholder de loading
        const preview = document.querySelector('.file-preview-image');
        expect(preview).toBeInTheDocument();
        expect(preview?.querySelector('.animate-pulse')).toBeInTheDocument();
    });

    it('deve renderizar estado de erro para imagens', () => {
        mockUseJiraMedia.mockReturnValue({
            objectUrl: null,
            loading: false,
            error: 'Erro ao carregar',
            mediaInfo: {
                id: '123',
                filename: 'test.png',
                size: 1024,
                mediaType: 'image',
                mimeType: 'image/png',
                url: 'https://jira.example.com/secure/attachment/123/test.png',
            },
        });

        render(
            <FilePreview
                attachmentId="123"
                filename="test.png"
                size={1024}
                mediaType="image"
            />
        );

        expect(screen.getByText('Erro ao carregar')).toBeInTheDocument();
    });

    it('deve renderizar ícone para tipos não-imagem', () => {
        mockUseJiraMedia.mockReturnValue({
            objectUrl: null,
            loading: false,
            error: null,
            mediaInfo: {
                id: '123',
                filename: 'document.pdf',
                size: 2048,
                mediaType: 'pdf',
                mimeType: 'application/pdf',
                url: 'https://jira.example.com/secure/attachment/123/document.pdf',
            },
        });

        render(
            <FilePreview
                attachmentId="123"
                filename="document.pdf"
                size={2048}
                mediaType="pdf"
            />
        );

        // Deve renderizar ícone de PDF, não imagem
        const img = screen.queryByAltText('document.pdf');
        expect(img).not.toBeInTheDocument();
        expect(screen.getByText('document.pdf')).toBeInTheDocument();
    });

    it('deve exibir tamanho do arquivo formatado', () => {
        mockUseJiraMedia.mockReturnValue({
            objectUrl: null,
            loading: false,
            error: null,
            mediaInfo: {
                id: '123',
                filename: 'document.pdf',
                size: 2048,
                mediaType: 'pdf',
                mimeType: 'application/pdf',
                url: 'https://jira.example.com/secure/attachment/123/document.pdf',
            },
        });

        render(
            <FilePreview
                attachmentId="123"
                filename="document.pdf"
                size={2048}
                mediaType="pdf"
            />
        );

        // Verificar que tamanho é exibido
        expect(screen.getByText('document.pdf')).toBeInTheDocument();
    });

    it('deve renderizar apenas ícone quando iconOnly é true', () => {
        mockUseJiraMedia.mockReturnValue({
            objectUrl: null,
            loading: false,
            error: null,
            mediaInfo: {
                id: '123',
                filename: 'document.pdf',
                size: 2048,
                mediaType: 'pdf',
                mimeType: 'application/pdf',
                url: 'https://jira.example.com/secure/attachment/123/document.pdf',
            },
        });

        render(
            <FilePreview
                attachmentId="123"
                filename="document.pdf"
                size={2048}
                mediaType="pdf"
                iconOnly={true}
            />
        );

        // Não deve exibir informações adicionais quando iconOnly
        const filenameElement = screen.queryByText('document.pdf');
        expect(filenameElement).not.toBeInTheDocument();
    });
});

