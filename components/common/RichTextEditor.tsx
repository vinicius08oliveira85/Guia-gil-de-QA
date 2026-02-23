import React, { useRef, useState } from 'react';
import { Bold, List, ListOrdered, Paperclip } from 'lucide-react';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { createAttachment } from '../../utils/attachmentService';
import { formatFileSize } from '../../utils/attachmentService';

/** Retorna o início da linha que contém pos. */
function getLineStart(value: string, pos: number): number {
    const last = value.lastIndexOf('\n', pos - 1);
    return last === -1 ? 0 : last + 1;
}

/** Retorna o fim da linha que contém pos (exclusive). */
function getLineEnd(value: string, pos: number): number {
    const idx = value.indexOf('\n', pos);
    return idx === -1 ? value.length : idx;
}

function applyBold(value: string, start: number, end: number): { newValue: string; newCursor: number } {
    const before = value.slice(0, start);
    const selected = value.slice(start, end);
    const after = value.slice(end);
    if (selected.length > 0) {
        return { newValue: before + '**' + selected + '**' + after, newCursor: end + 4 };
    }
    return { newValue: before + '****' + after, newCursor: start + 2 };
}

function applyBulletList(value: string, start: number, end: number): { newValue: string; newCursor: number } {
    const lineStart = getLineStart(value, start);
    const lineEnd = getLineEnd(value, end);
    const selectedBlock = value.slice(lineStart, lineEnd);
    const lines = selectedBlock.split('\n');
    const bulletLines = lines.map((l) => '- ' + l).join('\n');
    const prefix = lineStart === 0 ? '' : '\n';
    const replacement = prefix + bulletLines;
    const newValue = value.slice(0, lineStart) + replacement + value.slice(lineEnd);
    const newCursor = lineStart + replacement.length;
    return { newValue, newCursor };
}

function applyNumberedList(value: string, start: number, end: number): { newValue: string; newCursor: number } {
    const lineStart = getLineStart(value, start);
    const lineEnd = getLineEnd(value, end);
    const selectedBlock = value.slice(lineStart, lineEnd);
    const lines = selectedBlock.split('\n');
    const numberedLines = lines.map((l, i) => `${i + 1}. ${l}`).join('\n');
    const prefix = lineStart === 0 ? '' : '\n';
    const replacement = prefix + numberedLines;
    const newValue = value.slice(0, lineStart) + replacement + value.slice(lineEnd);
    const newCursor = lineStart + replacement.length;
    return { newValue, newCursor };
}

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

    const applyFormat = (fn: (v: string, s: number, e: number) => { newValue: string; newCursor: number }) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const result = fn(value, start, end);
        onChange(result.newValue);
        ta.focus();
        requestAnimationFrame(() => {
            textareaRef.current?.setSelectionRange(result.newCursor, result.newCursor);
        });
    };

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
                <div className="flex items-center gap-1 flex-wrap">
                    <button
                        type="button"
                        onClick={() => applyFormat(applyBold)}
                        className="p-1.5 rounded border border-surface-border bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                        title="Negrito"
                        aria-label="Negrito"
                    >
                        <Bold className="w-4 h-4" aria-hidden />
                    </button>
                    <button
                        type="button"
                        onClick={() => applyFormat(applyBulletList)}
                        className="p-1.5 rounded border border-surface-border bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                        title="Lista com marcadores"
                        aria-label="Lista com marcadores"
                    >
                        <List className="w-4 h-4" aria-hidden />
                    </button>
                    <button
                        type="button"
                        onClick={() => applyFormat(applyNumberedList)}
                        className="p-1.5 rounded border border-surface-border bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
                        title="Lista numerada"
                        aria-label="Lista numerada"
                    >
                        <ListOrdered className="w-4 h-4" aria-hidden />
                    </button>
                    <button
                        type="button"
                        onClick={insertImage}
                        disabled={uploading}
                        className="p-1.5 rounded border border-surface-border bg-surface text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Inserir imagem ou arquivo"
                        aria-label="Inserir imagem ou arquivo"
                    >
                        {uploading ? (
                            <span className="text-xs">⏳</span>
                        ) : (
                            <Paperclip className="w-4 h-4" aria-hidden />
                        )}
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
                💡 Use a barra acima para negrito, listas com marcadores ou numeradas; o último botão insere imagens ou arquivos.
            </p>
        </div>
    );
};

