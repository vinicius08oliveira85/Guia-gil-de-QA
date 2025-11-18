import React, { useRef, useState } from 'react';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { createAttachment } from '../../utils/attachmentService';
import { formatFileSize } from '../../utils/attachmentService';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    taskId?: string;
    onAttachmentAdded?: (attachmentId: string, url: string) => void;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder = 'Digite a descrição...',
    taskId,
    onAttachmentAdded
}) => {
    const { handleError, handleSuccess } = useErrorHandler();
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Limite de 10MB
        if (file.size > 10 * 1024 * 1024) {
            handleError(new Error('Arquivo muito grande. Tamanho máximo: 10MB'), 'Upload de arquivo');
            return;
        }

        setUploading(true);
        try {
            // Se for imagem, inserir diretamente na descrição
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    const base64 = e.target?.result as string;
                    const imageMarkdown = `\n![${file.name}](${base64})\n`;
                    const newValue = value + imageMarkdown;
                    onChange(newValue);
                    
                    // Posicionar cursor após a imagem
                    if (textareaRef.current) {
                        const cursorPos = newValue.length;
                        textareaRef.current.setSelectionRange(cursorPos, cursorPos);
                        textareaRef.current.focus();
                    }
                    
                    handleSuccess('Imagem adicionada à descrição!');
                };
                reader.readAsDataURL(file);
            } else {
                // Para outros arquivos, criar attachment e inserir link
                if (taskId) {
                    const attachment = await createAttachment(file, taskId);
                    const fileMarkdown = `\n[📎 ${file.name}](${attachment.url})\n`;
                    const newValue = value + fileMarkdown;
                    onChange(newValue);
                    
                    if (onAttachmentAdded) {
                        onAttachmentAdded(attachment.id, attachment.url);
                    }
                    
                    handleSuccess(`Arquivo "${file.name}" adicionado!`);
                } else {
                    // Se não tiver taskId, apenas inserir como texto
                    const fileMarkdown = `\n📎 ${file.name} (${formatFileSize(file.size)})\n`;
                    onChange(value + fileMarkdown);
                    handleSuccess('Referência ao arquivo adicionada!');
                }
            }
        } catch (error) {
            handleError(error instanceof Error ? error : new Error('Erro ao fazer upload'), 'Upload de arquivo');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const insertImage = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-text-secondary">
                    Descrição
                </label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={insertImage}
                        disabled={uploading}
                        className="px-3 py-1.5 text-xs bg-surface border border-surface-border rounded-md text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Inserir imagem ou arquivo"
                    >
                        {uploading ? '⏳ Enviando...' : '📎 Inserir Arquivo'}
                    </button>
                </div>
            </div>
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={6}
                className="w-full px-4 py-2 bg-surface border border-surface-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent resize-y"
            />
            <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.md,.zip,.rar"
                className="hidden"
            />
            <p className="text-xs text-text-secondary">
                💡 Dica: Use o botão acima para inserir imagens ou arquivos na descrição. Imagens aparecerão automaticamente.
            </p>
        </div>
    );
};

