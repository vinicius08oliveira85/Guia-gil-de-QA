import React from 'react';
import type { TestCase } from '../../types';
import { cn } from '../../utils/cn';
import {
  taskDetailsModalActionToolbarClass,
  taskDetailsModalStatusBtnClass,
} from './taskDetailsNeuUi';
import {
  TEST_CASE_STATUS_COLOR,
  TEST_CASE_STATUS_GLYPH_PATH,
  TEST_CASE_STATUS_LABEL,
} from './testCaseStatusVisuals';

/** Ícone de status no mesmo desenho do seletor (check, X, alerta ou círculo). */
export const TestCaseStatusGlyph: React.FC<{
  status: TestCase['status'];
  className?: string;
}> = ({ status, className }) => (
  <svg
    className={cn('h-4 w-4', className)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    {status === 'Not Run' ? (
      <circle cx="12" cy="12" r="8" />
    ) : (
      <path d={TEST_CASE_STATUS_GLYPH_PATH[status]} />
    )}
  </svg>
);

interface TestCaseStatusIndicatorProps {
  status: TestCase['status'];
}

export const TestCaseStatusIndicator: React.FC<TestCaseStatusIndicatorProps> = ({ status }) => (
  <span
    className={cn(
      taskDetailsModalStatusBtnClass(true),
      'h-8 w-8 shrink-0',
      TEST_CASE_STATUS_COLOR[status]
    )}
    title={TEST_CASE_STATUS_LABEL[status]}
  >
    <span className="sr-only">{TEST_CASE_STATUS_LABEL[status]}</span>
    <TestCaseStatusGlyph status={status} />
  </span>
);

interface TestCaseStatusControlsProps {
  status: TestCase['status'];
  onStatusChange: (status: 'Passed' | 'Failed' | 'Blocked') => void;
}

export const TestCaseStatusControls: React.FC<TestCaseStatusControlsProps> = ({
  status,
  onStatusChange,
}) => (
  <div
    className={cn(taskDetailsModalActionToolbarClass, 'hidden md:inline-flex')}
    role="group"
    aria-label="Marcar resultado da execução"
  >
    <button
      type="button"
      onClick={() => onStatusChange('Passed')}
      title="Aprovar"
      aria-label="Marcar como Aprovado"
      className={cn(
        taskDetailsModalStatusBtnClass(status === 'Passed'),
        status === 'Passed' ? 'text-success' : 'text-success/70'
      )}
    >
      <TestCaseStatusGlyph status="Passed" />
    </button>
    <button
      type="button"
      onClick={() => onStatusChange('Failed')}
      title="Reprovar"
      aria-label="Marcar como Reprovado"
      className={cn(
        taskDetailsModalStatusBtnClass(status === 'Failed'),
        status === 'Failed' ? 'text-error' : 'text-error/70'
      )}
    >
      <TestCaseStatusGlyph status="Failed" />
    </button>
    <button
      type="button"
      onClick={() => onStatusChange('Blocked')}
      title="Bloquear"
      aria-label="Marcar como Bloqueado"
      className={cn(
        taskDetailsModalStatusBtnClass(status === 'Blocked'),
        status === 'Blocked' ? 'text-warning' : 'text-warning/70'
      )}
    >
      <TestCaseStatusGlyph status="Blocked" />
    </button>
  </div>
);

TestCaseStatusGlyph.displayName = 'TestCaseStatusGlyph';
TestCaseStatusIndicator.displayName = 'TestCaseStatusIndicator';
TestCaseStatusControls.displayName = 'TestCaseStatusControls';
