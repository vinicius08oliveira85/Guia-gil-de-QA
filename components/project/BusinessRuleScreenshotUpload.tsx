import React, { useCallback, useEffect, useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { BusinessRuleScreenshot } from '../../types';
import { cn } from '../../utils/cn';
import {
  tasksPanelFormFieldLabelClass,
  tasksPanelFormMutedClass,
} from '../tasks/tasksPanelNeuStyles';

const MAX_SCREENSHOTS = 5;
const MAX_BYTES = 2 * 1024 * 1024;

export interface BusinessRuleScreenshotUploadProps {
  screenshots: BusinessRuleScreenshot[];
  onChange: (screenshots: BusinessRuleScreenshot[]) => void;
  disabled?: boolean;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Falha ao ler imagem'));
    reader.readAsDataURL(file);
  });
}

function defaultPastedName(index: number): string {
  const stamp = new Date().toISOString().slice(11, 19).replace(/:/g, '');
  return `print-colado-${stamp}-${index}.png`;
}

/** Adiciona imagens respeitando limite de quantidade e tamanho. */
export async function appendScreenshotsFromFiles(
  files: File[],
  current: BusinessRuleScreenshot[]
): Promise<{ screenshots: BusinessRuleScreenshot[]; added: number; rejected: number }> {
  const next = [...current];
  let added = 0;
  let rejected = 0;

  for (const file of files) {
    if (next.length >= MAX_SCREENSHOTS) {
      rejected += files.length - added - rejected;
      break;
    }
    if (!file.type.startsWith('image/')) {
      rejected++;
      continue;
    }
    if (file.size > MAX_BYTES) {
      rejected++;
      continue;
    }

    const dataUrl = await readAsDataUrl(file);
    next.push({
      id: crypto.randomUUID(),
      name: file.name?.trim() || defaultPastedName(next.length + 1),
      dataUrl,
      uploadedAt: new Date().toISOString(),
    });
    added++;
  }

  return { screenshots: next, added, rejected };
}

function isTextInputTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return !!target.closest('input, textarea, [contenteditable="true"]');
}

function imageFilesFromClipboard(data: DataTransfer | null): File[] {
  if (!data?.items?.length) return [];
  const files: File[] = [];
  for (const item of Array.from(data.items)) {
    if (!item.type.startsWith('image/')) continue;
    const file = item.getAsFile();
    if (file) files.push(file);
  }
  return files;
}

/**
 * Upload de prints para enriquecer a análise do dossiê (máx. 5 imagens, 2MB cada).
 * Suporta seleção de arquivo e colar imagem (Ctrl+V).
 */
export const BusinessRuleScreenshotUpload: React.FC<BusinessRuleScreenshotUploadProps> = ({
  screenshots,
  onChange,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const screenshotsRef = useRef(screenshots);
  screenshotsRef.current = screenshots;

  const addFiles = useCallback(
    async (files: File[], source: 'file' | 'paste') => {
      if (!files.length || disabled) return;

      const { screenshots: next, added, rejected } = await appendScreenshotsFromFiles(
        files,
        screenshotsRef.current
      );

      if (added === 0) {
        if (screenshotsRef.current.length >= MAX_SCREENSHOTS) {
          toast.error(`Limite de ${MAX_SCREENSHOTS} prints atingido.`);
        } else if (rejected > 0) {
          toast.error('Imagem inválida ou maior que 2MB.');
        }
        return;
      }

      onChange(next);
      if (rejected > 0) {
        toast.error(`${added} imagem(ns) adicionada(s). ${rejected} ignorada(s) (limite ou tamanho).`);
      } else if (source === 'paste') {
        toast.success(added === 1 ? 'Print colado com sucesso.' : `${added} prints colados com sucesso.`);
      }
    },
    [disabled, onChange]
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      if (disabled) return;

      const files = imageFilesFromClipboard(event.clipboardData);
      if (files.length === 0) return;
      if (isTextInputTarget(event.target)) return;

      event.preventDefault();
      void addFiles(files, 'paste');
    },
    [addFiles, disabled]
  );

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const remove = (id: string) => {
    onChange(screenshots.filter(s => s.id !== id));
  };

  return (
    <div
      className="space-y-2 rounded-lg outline-none focus-within:ring-2 focus-within:ring-primary/30"
      tabIndex={-1}
      onPaste={event => {
        const files = imageFilesFromClipboard(event.clipboardData);
        if (files.length === 0 || disabled || isTextInputTarget(event.target)) return;
        event.preventDefault();
        void addFiles(files, 'paste');
      }}
      aria-label="Área de prints de tela. Use Ctrl+V para colar imagem."
    >
      <div className="flex items-center justify-between gap-2">
        <p className={tasksPanelFormFieldLabelClass}>Prints de tela (opcional)</p>
        <button
          type="button"
          className="btn btn-ghost btn-xs gap-1"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || screenshots.length >= MAX_SCREENSHOTS}
          aria-label="Adicionar print de tela"
        >
          <ImagePlus className="h-3.5 w-3.5" aria-hidden />
          Adicionar
        </button>
      </div>
      <p className={tasksPanelFormMutedClass}>
        Até {MAX_SCREENSHOTS} imagens, 2MB cada. Cole com Ctrl+V ou use Adicionar. A IA usa os prints
        como evidência visual.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => {
          void addFiles(Array.from(e.target.files ?? []), 'file');
          e.target.value = '';
        }}
        aria-label="Selecionar imagens para o dossiê"
      />
      {screenshots.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="list">
          {screenshots.map(shot => (
            <li key={shot.id} className="relative overflow-hidden rounded-lg border border-base-300/40">
              <img src={shot.dataUrl} alt={shot.name} className="h-24 w-full object-cover" />
              <button
                type="button"
                className={cn(
                  'btn btn-circle btn-ghost btn-xs absolute right-1 top-1 bg-base-100/80'
                )}
                onClick={() => remove(shot.id)}
                aria-label={`Remover print ${shot.name}`}
              >
                <X className="h-3 w-3" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

BusinessRuleScreenshotUpload.displayName = 'BusinessRuleScreenshotUpload';
