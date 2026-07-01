import React, { useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';
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

/**
 * Upload de prints para enriquecer a análise do dossiê (máx. 5 imagens, 2MB cada).
 */
export const BusinessRuleScreenshotUpload: React.FC<BusinessRuleScreenshotUploadProps> = ({
  screenshots,
  onChange,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || disabled) return;
    const next = [...screenshots];
    for (const file of Array.from(files)) {
      if (next.length >= MAX_SCREENSHOTS) break;
      if (!file.type.startsWith('image/')) continue;
      if (file.size > MAX_BYTES) continue;
      const dataUrl = await readAsDataUrl(file);
      next.push({
        id: crypto.randomUUID(),
        name: file.name,
        dataUrl,
        uploadedAt: new Date().toISOString(),
      });
    }
    onChange(next);
  };

  const remove = (id: string) => {
    onChange(screenshots.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-2">
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
        Até {MAX_SCREENSHOTS} imagens, 2MB cada. A IA usa os prints como evidência visual.
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => {
          void handleFiles(e.target.files);
          e.target.value = '';
        }}
        aria-label="Selecionar imagens para o dossiê"
      />
      {screenshots.length > 0 && (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="list">
          {screenshots.map(shot => (
            <li key={shot.id} className="relative overflow-hidden rounded-lg border border-base-300/40">
              <img
                src={shot.dataUrl}
                alt={shot.name}
                className="h-24 w-full object-cover"
              />
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

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Falha ao ler imagem'));
    reader.readAsDataURL(file);
  });
}

BusinessRuleScreenshotUpload.displayName = 'BusinessRuleScreenshotUpload';
