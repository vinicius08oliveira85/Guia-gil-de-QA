export type DevReportPreviewRow =
  | { kind: 'meta'; label: string; value: string }
  | { kind: 'section'; title: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'checklist'; title: string; items: string[] }
  | {
      kind: 'step';
      order: number;
      status: 'done' | 'pending';
      title: string;
      description: string[];
      files?: string;
      validations: Array<{ text: string; checked: boolean }>;
    }
  | { kind: 'bullets'; title?: string; items: string[] }
  | { kind: 'footer'; text: string };

const META_LINE =
  /^(Tarefa|Título|Gerado em|Ferramenta|Stack|Status|Implementação registrada em):\s*(.+)$/i;

const SECTION_LINE =
  /^(REGISTRO DE IMPLEMENTAÇÃO DEV|VISÃO GERAL DO GUIA|PASSOS DE IMPLEMENTAÇÃO(?:\s*\([^)]+\))?|TESTES SUGERIDOS|EVIDÊNCIAS\s*\/\s*LINKS|OBSERVAÇÕES DO DESENVOLVEDOR|CONTEXTO|CRITÉRIOS DE ACEITE)$/i;

const STEP_LINE = /^(\d+)\.\s+\[(CONCLUÍDO ✓|PENDENTE ○)\]\s+(.+)$/;

const VALIDATION_LINE = /^-\s+\[([xX ])\]\s+(.+)$/;

function normalizeLine(raw: string): string {
  return raw.trim();
}

function isDividerLine(line: string): boolean {
  return /^=+$/.test(line) || line === '—' || line.startsWith('Registro gerado pelo Guia Agile');
}

/** Interpreta o texto do registro Dev para renderização estruturada na prévia. */
export function parseDevImplementationReportPreview(reportText: string): DevReportPreviewRow[] {
  const rows: DevReportPreviewRow[] = [];
  let activeStep: Extract<DevReportPreviewRow, { kind: 'step' }> | null = null;
  let activeBulletTitle: string | undefined;
  let pendingChecklistTitle: string | null = null;
  let pendingChecklistItems: string[] = [];
  let inAcceptanceSection = false;

  const flushStep = () => {
    if (activeStep) {
      rows.push(activeStep);
      activeStep = null;
    }
  };

  const flushChecklist = () => {
    if (pendingChecklistTitle && pendingChecklistItems.length > 0) {
      rows.push({
        kind: 'checklist',
        title: pendingChecklistTitle,
        items: pendingChecklistItems,
      });
    }
    pendingChecklistTitle = null;
    pendingChecklistItems = [];
  };

  const flushBullets = (items: string[]) => {
    if (items.length === 0) return;
    rows.push({ kind: 'bullets', title: activeBulletTitle, items: [...items] });
    activeBulletTitle = undefined;
  };

  let bulletBuffer: string[] = [];

  for (const rawLine of reportText.split('\n')) {
    const line = normalizeLine(rawLine);
    if (!line) {
      flushStep();
      flushChecklist();
      flushBullets(bulletBuffer);
      bulletBuffer = [];
      continue;
    }

    if (isDividerLine(line)) continue;

    if (line.startsWith('Concluído em: ') || line.startsWith('Registro gerado em ')) {
      flushStep();
      flushChecklist();
      flushBullets(bulletBuffer);
      bulletBuffer = [];
      rows.push({ kind: 'footer', text: line });
      continue;
    }

    const metaMatch = line.match(META_LINE);
    if (metaMatch) {
      flushStep();
      flushChecklist();
      flushBullets(bulletBuffer);
      bulletBuffer = [];
      rows.push({ kind: 'meta', label: metaMatch[1], value: metaMatch[2].trim() });
      continue;
    }

    if (SECTION_LINE.test(line.replace(/:$/, ''))) {
      flushStep();
      flushChecklist();
      flushBullets(bulletBuffer);
      bulletBuffer = [];
      const title = line.replace(/:$/, '');
      inAcceptanceSection = /^crit[ée]rios de aceite$/i.test(title);
      rows.push({ kind: 'section', title });
      continue;
    }

    if (line === 'Contexto:' || line === 'Critérios de aceite:') {
      flushStep();
      flushBullets(bulletBuffer);
      bulletBuffer = [];
      pendingChecklistTitle = line.replace(/:$/, '');
      if (line.startsWith('Contexto')) {
        pendingChecklistTitle = null;
        rows.push({ kind: 'section', title: 'Contexto' });
      }
      continue;
    }

    const stepMatch = line.match(STEP_LINE);
    if (stepMatch) {
      flushStep();
      flushChecklist();
      flushBullets(bulletBuffer);
      bulletBuffer = [];
      activeStep = {
        kind: 'step',
        order: Number(stepMatch[1]),
        status: stepMatch[2].startsWith('CONCLU') ? 'done' : 'pending',
        title: stepMatch[3].trim(),
        description: [],
        validations: [],
      };
      continue;
    }

    if (activeStep) {
      const validationMatch = line.match(VALIDATION_LINE);
      if (validationMatch) {
        activeStep.validations.push({
          checked: validationMatch[1].toLowerCase() === 'x',
          text: validationMatch[2].trim(),
        });
        continue;
      }

      if (line.startsWith('Arquivos:')) {
        activeStep.files = line.replace(/^Arquivos:\s*/, '').trim();
        continue;
      }

      if (line === 'Descrição:' || line === 'Validações:') {
        continue;
      }

      activeStep.description.push(line);
      continue;
    }

    const checklistItem = line.match(/^-\s+\[\s*[xX ]?\s*\]\s*(.+)$/);
    if (checklistItem && (pendingChecklistTitle || inAcceptanceSection)) {
      pendingChecklistItems.push(checklistItem[1].trim());
      if (!pendingChecklistTitle && inAcceptanceSection) {
        pendingChecklistTitle = 'Critérios de aceite';
      }
      continue;
    }

    const bulletMatch = line.match(/^(?:•|-)\s+(?!\[)(.+)$/);
    if (bulletMatch) {
      flushStep();
      flushChecklist();
      bulletBuffer.push(bulletMatch[1].trim());
      continue;
    }

    flushStep();
    flushChecklist();
    inAcceptanceSection = false;
    flushBullets(bulletBuffer);
    bulletBuffer = [];

    if (line.startsWith('Testes sugeridos — ')) {
      rows.push({ kind: 'meta', label: 'Testes sugeridos', value: line.replace(/^Testes sugeridos —\s*/, '') });
      continue;
    }

    rows.push({ kind: 'paragraph', text: line });
  }

  flushStep();
  flushChecklist();
  flushBullets(bulletBuffer);

  return rows;
}
