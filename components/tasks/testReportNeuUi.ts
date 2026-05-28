import { cn } from '../../utils/cn';
import { neuInsetContentClass } from '../common/neuUi';
import {
  taskDetailsModalBodyClass,
  taskDetailsModalGhostBtnClass,
  taskDetailsModalPrimaryCtaClass,
  taskDetailsModalSectionClass,
  taskDetailsModalShellClass,
  taskDetailsNeuInsetDeepClass,
  taskDetailsNeuRaisedClass,
} from './taskDetailsNeuUi';
import { tasksListChipRaisedClass } from './tasksListNeuUi';

export const testReportModalShellClass = cn(
  'test-report-neu-modal',
  taskDetailsModalShellClass
);

export const testReportModalBodyClass = taskDetailsModalBodyClass;

export const testReportModalSectionClass = cn(
  'test-report-neu-section',
  taskDetailsModalSectionClass
);

export const testReportModalInsetPanelClass = cn(
  'test-report-neu-inset',
  neuInsetContentClass,
  taskDetailsNeuInsetDeepClass,
  'rounded-[var(--leve-header-radius)]'
);

export const testReportModalChipBtnClass = cn(
  'test-report-neu-chip-btn task-details-neu-chip',
  'inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5',
  'font-sans text-xs font-semibold text-[#FDF6E3] transition-[box-shadow,color]',
  'hover:text-[#E65100] disabled:cursor-not-allowed disabled:opacity-50'
);

export const testReportModalPrimaryBtnClass = cn(
  'test-report-neu-primary-btn',
  taskDetailsModalPrimaryCtaClass,
  'inline-flex gap-1.5 px-3 py-1.5 text-xs sm:min-h-9'
);

export const testReportModalFormatOptionClass = (selected: boolean) =>
  cn(
    'test-report-neu-format-option flex w-full items-start gap-2 rounded-[var(--leve-header-radius)] p-4 text-left',
    'transition-[box-shadow,border-color,background-color] duration-200',
    selected
      ? 'test-report-neu-format-option--active task-modal-section-accent'
      : cn('test-report-neu-format-idle', taskDetailsNeuRaisedClass)
  );

export const testReportModalStatCardClass = cn(
  'test-report-neu-stat-card rounded-[var(--leve-header-radius)] px-4 py-3',
  taskDetailsNeuRaisedClass
);

export const testReportModalPreviewHeaderClass = cn(
  'test-report-neu-preview-header border-b border-[color-mix(in_srgb,#5C524B_38%,transparent)]',
  'bg-[color-mix(in_srgb,#3A342F_18%,#4B433D)] px-4 py-3 text-[#FDF6E3]'
);

export const testReportModalPreviewFieldClass = cn(
  'test-report-neu-preview-field leve-neu-inset-content rounded-[var(--leve-header-radius)]',
  taskDetailsNeuInsetDeepClass,
  'px-3 py-2 text-sm text-[var(--leve-header-text)]'
);

const testReportGenerateRecordBtnBase = cn(
  'test-report-generate-record-btn',
  'inline-flex items-center gap-2 rounded-full',
  'font-sans text-xs font-semibold text-[#FDF6E3]',
  'transition-[box-shadow,color] hover:text-[#E65100]',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,#E65100_35%,transparent)]'
);

/** Botão «Gerar Registro de Testes» no modal de detalhe da tarefa. */
export const testReportGenerateRecordBtnClass = cn(
  testReportGenerateRecordBtnBase,
  taskDetailsModalGhostBtnClass
);

/** Mesmo botão na listagem expandida (card de tarefa). */
export const testReportGenerateRecordBtnListClass = cn(
  testReportGenerateRecordBtnBase,
  tasksListChipRaisedClass,
  'min-h-9 px-4 py-2'
);
