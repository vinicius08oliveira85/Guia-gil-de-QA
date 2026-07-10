import React, { useMemo } from 'react';
import { parseCursorPromptBlocks } from '../../utils/cursorPromptDisplay';
import { cn } from '../../utils/cn';

export interface StructuredCursorPromptProps {
  prompt: string;
  className?: string;
}

/** Renderiza prompt do Cursor com parágrafos, passos e listas (melhor leitura). */
export const StructuredCursorPrompt: React.FC<StructuredCursorPromptProps> = ({
  prompt,
  className,
}) => {
  const blocks = useMemo(() => parseCursorPromptBlocks(prompt), [prompt]);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'max-h-[min(28rem,55vh)] space-y-3 overflow-y-auto rounded-md bg-base-100/90 p-3 text-sm leading-relaxed text-base-content/90',
        className
      )}
    >
      {blocks.map((block, index) => {
        switch (block.kind) {
          case 'heading':
            return (
              <p
                key={`h-${index}`}
                className="border-b border-primary/15 pb-1 text-xs font-bold uppercase tracking-wide text-primary"
              >
                {block.text}
              </p>
            );
          case 'numbered':
            return (
              <div
                key={`n-${index}`}
                className="flex gap-3 rounded-lg border border-base-300/60 bg-base-200/40 p-3"
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary"
                  aria-hidden
                >
                  {block.order}
                </span>
                <p className="min-w-0 flex-1 whitespace-pre-wrap break-words">{block.text}</p>
              </div>
            );
          case 'bullet':
            return (
              <div key={`b-${index}`} className="flex gap-2 pl-1">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" aria-hidden />
                <p className="min-w-0 flex-1 whitespace-pre-wrap break-words">{block.text}</p>
              </div>
            );
          default:
            return (
              <p key={`p-${index}`} className="whitespace-pre-wrap break-words">
                {block.text}
              </p>
            );
        }
      })}
    </div>
  );
};

StructuredCursorPrompt.displayName = 'StructuredCursorPrompt';
