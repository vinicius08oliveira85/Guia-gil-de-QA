/** Grade da faixa de ações (desktop) — colunas fixas para alinhar entre cards. */
export const TASK_ACTION_STRIP_GRID =
  'grid w-full grid-cols-[4.75rem_9rem_8.25rem] items-center justify-items-stretch gap-2';

export const TASK_ACTION_SLOT_CLASSNAMES = {
  metrics: 'flex justify-end md:min-h-[2rem] md:items-center',
  generateAll: 'flex justify-center md:min-h-[2rem] md:items-center',
  testStatus:
    'max-md:min-w-[6.75rem] max-md:justify-center md:flex md:justify-center md:min-h-[2rem] md:items-center',
} as const;

/** Botões compactos do card — alinhados a metadados / badges de risco (rounded-md, borda suave). */
const taskCardActionChipBase =
  'inline-flex h-7 w-full min-w-0 items-center justify-center gap-1 rounded-md border px-2 text-[10px] font-semibold leading-tight shadow-sm transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 sm:min-h-0';

export const taskCardActionChipCta = `${taskCardActionChipBase} border-[color-mix(in_srgb,var(--brand-cta)_35%,transparent)] bg-[color-mix(in_srgb,var(--brand-cta)_8%,transparent)] text-[var(--brand-cta)] hover:border-[color-mix(in_srgb,var(--brand-cta)_45%,transparent)] hover:bg-[color-mix(in_srgb,var(--brand-cta)_14%,transparent)] focus-visible:ring-[color-mix(in_srgb,var(--brand-cta)_22%,transparent)]`;

export const taskCardActionChipBusy =
  'ring-1 ring-[color-mix(in_srgb,var(--brand-cta)_28%,transparent)]';
