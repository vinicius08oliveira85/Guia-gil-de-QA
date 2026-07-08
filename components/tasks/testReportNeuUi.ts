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
  'rounded-box'
);

export const testReportModalChipBtnClass = cn(
  'test-report-neu-chip-btn task-details-neu-chip',
  'inline-flex items-center justify-center gap-1.5 rounded-selector px-3 py-1.5',
  'font-sans text-xs font-semibold text-base-content transition-[box-shadow,color]',
  'hover:text-primary disabled:cursor-not-allowed disabled:opacity-50'
);

export const testReportModalPrimaryBtnClass = cn(
  'test-report-neu-primary-btn',
  taskDetailsModalPrimaryCtaClass,
  'inline-flex gap-1.5 px-3 py-1.5 text-xs sm:min-h-9'
);

export const testReportModalFormatOptionClass = (selected: boolean) =>
  cn(
    'test-report-neu-format-option flex w-full items-start gap-2 rounded-box p-4 text-left',
    'transition-[box-shadow,border-color,background-color] duration-200',
    selected
      ? 'test-report-neu-format-option--active task-modal-section-accent'
      : cn('test-report-neu-format-idle', taskDetailsNeuRaisedClass)
  );

export const testReportModalStatCardClass = cn(
  'test-report-neu-stat-card rounded-box px-4 py-3',
  taskDetailsNeuRaisedClass
);

export const testReportModalPreviewHeaderClass = cn(
  'test-report-neu-preview-header border-b border-base-300/55 px-4 py-3 text-base-content'
);

export const testReportModalPreviewFieldClass = cn(
  'test-report-neu-preview-field leve-neu-inset-content rounded-field',
  taskDetailsNeuInsetDeepClass,
  'px-3 py-2 text-sm text-base-content'
);

const testReportGenerateRecordBtnBase = cn(
  'test-report-generate-record-btn',
  'inline-flex items-center gap-2 rounded-selector',
  'font-sans text-xs font-semibold text-base-content',
  'transition-[box-shadow,color] hover:text-primary',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35'
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
