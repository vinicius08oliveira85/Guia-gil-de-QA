export interface ParsedTaskDescription {
  contextParagraphs: string[];
  acceptanceCriteria: string[];
}

function decodeBasicEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

/** Converte HTML/plain do Jira em parágrafos de contexto e critérios de aceite. */
export function parseTaskDescriptionForReport(raw: string): ParsedTaskDescription {
  const text = decodeBasicEntities(
    raw
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<li[^>]*>/gi, '- ')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/\r\n/g, '\n')
    .trim();

  if (!text) {
    return { contextParagraphs: [], acceptanceCriteria: [] };
  }

  const sectionPattern =
    /(?:^|\n)\s*(crit[ée]rios de aceite|acceptance criteria|defini[çc][ãa]o de pronto|definition of done)\s*:?\s*\n/i;

  let contextPart = text;
  let criteriaPart = '';

  const sectionMatch = text.match(sectionPattern);
  if (sectionMatch?.index != null) {
    contextPart = text.slice(0, sectionMatch.index).trim();
    criteriaPart = text.slice(sectionMatch.index + sectionMatch[0].length).trim();
  }

  const acceptanceCriteria: string[] = [];

  const extractCheckboxItems = (source: string) => {
    for (const line of source.split('\n')) {
      const trimmed = line.trim();
      const checkboxMatch = trimmed.match(/^(?:[-*•]\s*)?\[\s*[xX ]?\s*\]\s*(.+)$/);
      if (checkboxMatch) {
        acceptanceCriteria.push(checkboxMatch[1].trim());
        continue;
      }
      if (criteriaPart && /^[-*•]\s+(.+)$/.test(trimmed)) {
        acceptanceCriteria.push(trimmed.replace(/^[-*•]\s+/, '').trim());
      }
    }
  };

  if (criteriaPart) {
    extractCheckboxItems(criteriaPart);
  }

  const contextLines: string[] = [];
  for (const line of contextPart.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const checkboxMatch = trimmed.match(/^(?:[-*•]\s*)?\[\s*[xX ]?\s*\]\s*(.+)$/);
    if (checkboxMatch) {
      acceptanceCriteria.push(checkboxMatch[1].trim());
      continue;
    }

    if (/^[-*•]\s+/.test(trimmed) && acceptanceCriteria.length > 0) {
      acceptanceCriteria.push(trimmed.replace(/^[-*•]\s+/, '').trim());
      continue;
    }

    contextLines.push(trimmed);
  }

  const contextParagraphs = contextLines
    .join('\n')
    .split(/\n{2,}/)
    .map(paragraph => paragraph.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  if (contextParagraphs.length === 0 && contextPart && acceptanceCriteria.length === 0) {
    contextParagraphs.push(contextPart.replace(/\s+/g, ' ').trim());
  }

  return { contextParagraphs, acceptanceCriteria };
}

/** Quebra descrição de passo em linhas legíveis (preserva parágrafos). */
export function splitStepDescriptionLines(description: string): string[] {
  return description
    .trim()
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean);
}
