import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MediaViewer } from '../../../components/common/MediaViewer';

// Mock do FilePreview
vi.mock('../../../components/common/FilePreview', () => ({
    FilePreview: ({ filename }: { filename: string }) => (
        <div data-testid="file-preview">{filename}</div>
    ),
    PDFPreview: ({ filename }: { filename: string }) => (
        <div data-testid="pdf-preview">{filename}</div>
    ),
}));

describe('MediaViewer', () => {
    const defaultProps = {
        attachmentId: '123',
        filename: 'test.png',
        size: 1024,
        url: 'https://jira.example.com/secure/attachment/123/test.png',
        mediaType: 'image' as const,
        isOpen: true,
        onClose: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('não deve renderizar quando isOpen é false', () => {
        const { container } = render(<MediaViewer {...defaultProps} isOpen={false} />);
        
        expect(container.firstChild).toBeNull();
    });

    it('deve renderizar modal quando isOpen é true', () => {
        render(<MediaViewer {...defaultProps} />);
        
        // Verificar que modal está presente
        const filename = screen.getByText('test.png');
        expect(filename).toBeInTheDocument();
    });

    it('deve chamar onClose quando botão de fechar é clicado', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        
        render(<MediaViewer {...defaultProps} onClose={onClose} />);
        
        const closeButton = screen.getByLabelText('Fechar');
        await user.click(closeButton);
        
        expect(onClose).toHaveBeenCalled();
    });

    it('deve chamar onClose quando clica no backdrop', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        
        render(<MediaViewer {...defaultProps} onClose={onClose} />);
        
        // Clicar no backdrop (container principal com classe fixed)
        const backdrop = document.querySelector('.fixed');
        if (backdrop) {
            await user.click(backdrop);
            expect(onClose).toHaveBeenCalled();
        }
    });

    it('deve renderizar FilePreview para imagens', () => {
        render(<MediaViewer {...defaultProps} mediaType="image" />);
        
        const preview = screen.getByTestId('file-preview');
        expect(preview).toBeInTheDocument();
    });

    it('deve renderizar PDFPreview para PDFs', () => {
        render(<MediaViewer {...defaultProps} mediaType="pdf" />);
        
        const preview = screen.getByTestId('pdf-preview');
        expect(preview).toBeInTheDocument();
    });

    it('deve exibir botões de ação (download, abrir externo)', () => {
        render(<MediaViewer {...defaultProps} />);
        
        const downloadButton = screen.getByTitle('Download');
        const externalButton = screen.getByTitle('Abrir em nova aba');
        
        expect(downloadButton).toBeInTheDocument();
        expect(externalButton).toBeInTheDocument();
    });

    it('deve abrir URL em nova aba quando clica em download', async () => {
        const user = userEvent.setup();
        const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
        
        render(<MediaViewer {...defaultProps} />);
        
        const downloadButton = screen.getByTitle('Download');
        await user.click(downloadButton);
        
        expect(windowOpenSpy).toHaveBeenCalledWith(
            defaultProps.url,
            '_blank'
        );
        
        windowOpenSpy.mockRestore();
    });

    it('deve exibir nome do arquivo corretamente', () => {
        render(<MediaViewer {...defaultProps} filename="arquivo-com-nome-longo.pdf" />);
        
        const filename = screen.getByText('arquivo-com-nome-longo.pdf');
        expect(filename).toBeInTheDocument();
    });
});

