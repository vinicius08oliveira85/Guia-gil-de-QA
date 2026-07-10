export type CursorPromptBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'numbered'; order: string; text: string }
  | { kind: 'bullet'; text: string };

const SECTION_HEADING =
  /^(Requisitos|Instruções|Restrições|Objetivo|Contexto|Passos|Notas?|Importante|Critérios)(?:\s+[\w\s]{0,24})?:?\s*$/i;

/**
 * Insere quebras de linha em prompts gerados como bloco único para facilitar leitura.
 * O texto original (para copiar) permanece intacto — use só na exibição.
 */
export function formatCursorPromptForDisplay(raw: string): string {
  const trimmed = raw.trim().replace(/\r\n/g, '\n');
  if (!trimmed) return '';

  const lineCount = trimmed.split('\n').filter(line => line.trim()).length;
  if (lineCount >= 3) {
    return trimmed.replace(/\n{3,}/g, '\n\n');
  }

  let text = trimmed;

  // Passos numerados embutidos no parágrafo (1. 2. 3.)
  text = text.replace(/([.!?;])\s+(?=\d+\.\s)/g, '$1\n\n');
  text = text.replace(/(?:^|\s)(\d+\.\s)/g, '\n\n$1');

  // Rótulos de seção
  text = text.replace(
    /\s+((?:Requisitos|Instruções|Restrições|Objetivo|Contexto|Passos|Notas?|Importante|Critérios)(?:\s+[\w\s]{0,24})?:)\s+/gi,
    '\n\n$1\n'
  );

  // Bullets explícitos ou frases "Não ..."
  text = text.replace(/\s+-\s+/g, '\n- ');
  text = text.replace(/\.\s+(Não\s+[a-záàâãéêíóôõúç])/gi, '.\n- $1');

  // Passo N:
  text = text.replace(/\s+(Passo\s+\d+\s*[:.)-]\s*)/gi, '\n\n$1');

  // Quebra frases muito longas (fallback)
  if (!text.includes('\n') && text.length > 320) {
    text = text.replace(/([.!?])\s+(?=[A-ZÁÉÍÓÚÀÃÕÇ0-9"«(])/g, '$1\n\n');
  }

  return text.replace(/^\n+/, '').replace(/\n{3,}/g, '\n\n').trim();
}

/** Converte texto formatado em blocos para renderização estruturada. */
export function parseCursorPromptBlocks(raw: string): CursorPromptBlock[] {
  const formatted = formatCursorPromptForDisplay(raw);
  const blocks: CursorPromptBlock[] = [];

  for (const line of formatted.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const numbered = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numbered) {
      blocks.push({ kind: 'numbered', order: numbered[1], text: numbered[2] });
      continue;
    }

    const bullet = trimmed.match(/^[-•]\s+(.+)$/);
    if (bullet) {
      blocks.push({ kind: 'bullet', text: bullet[1] });
      continue;
    }

    if (SECTION_HEADING.test(trimmed)) {
      blocks.push({ kind: 'heading', text: trimmed.replace(/:$/, '') });
      continue;
    }

    blocks.push({ kind: 'paragraph', text: trimmed });
  }

  return blocks;
}
