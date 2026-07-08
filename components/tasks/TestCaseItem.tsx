import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TestCase } from '../../types';
import {
  getTestCaseEnvironment,
  getTestCaseSuite,
  getExecutionKindBadgeDisplay,
  getNextExecutionKind,
  testCaseLooksAutomated,
} from '../../utils/testCaseMigration';
import {
  getTestCaseListTitle,
  parseTestCaseActionSteps,
  stripLeadingStepIndex,
  structureTestCaseExpected,
  structureTestCaseParameters,
  type RoteiroFieldView,
} from '../../utils/testCaseActionDisplay';
import { ChevronDownIcon, EditIcon, ListIcon, TrashIcon } from '../common/Icons';
import { Copy, MoreVertical } from 'lucide-react';
import { cn } from '../../utils/cn';
import { appMenuPanelClass } from '../common/viewUi';
import {
  leveTaskModalMutedClass,
  leveTaskModalMutedXsClass,
  leveTaskModalStrongClass,
} from '../common/projectCardUi';
import {
  taskDetailsModalActionToolbarClass,
  taskDetailsModalRoteiroBlockClass,
  taskDetailsModalRoteiroHeaderClass,
  taskDetailsModalRoteiroInnerClass,
  taskDetailsModalRoteiroShellClass,
  taskDetailsModalTestCaseCardClass,
  taskDetailsModalTextareaClass,
  taskDetailsModalToolbarIconClass,
} from './taskDetailsNeuUi';
import {
  TestCaseStatusControls,
  TestCaseStatusGlyph,
  TestCaseStatusIndicator,
} from './TestCaseStatusControls';
import { TestCaseExecutionKindBadgeButton } from './TestCaseExecutionKindBadgeButton';
import { TEST_CASE_STATUS_BORDER } from './testCaseStatusVisuals';

/** Evita re-render global do projeto a cada tecla no resultado obtido. */
const OBSERVED_RESULT_PERSIST_MS = 500;

function RoteiroStructuredBody({ view }: { view: RoteiroFieldView }) {
  if (view.kind === 'plain') {
    return (
      <p className="whitespace-pre-wrap leading-relaxed break-words [overflow-wrap:anywhere]">
        {view.text}
      </p>
    );
  }

  if (view.kind === 'parameters') {
    return (
      <dl className="space-y-3">
        {view.rows.map((row, i) => (
          <div
            key={`${i}-${row.key}`}
            className="grid gap-1 sm:grid-cols-[minmax(8rem,auto)_1fr] sm:gap-x-3 sm:items-baseline"
          >
            <dt className="shrink-0 font-semibold text-primary">{row.key}</dt>
            <dd className="leading-relaxed text-base-content [overflow-wrap:anywhere]">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    );
  }

  const ListTag = view.listStyle === 'decimal' ? 'ol' : 'ul';
  const listClass =
    view.listStyle === 'decimal'
      ? 'list-decimal list-outside ml-5 space-y-2 pl-1 marker:font-semibold marker:text-primary'
      : 'list-disc list-outside ml-4 space-y-2 pl-1 marker:text-primary';

  return (
    <ListTag className={listClass}>
      {view.items.map((item, i) => (
        <li
          key={`roteiro-li-${i}`}
          className="leading-relaxed break-words pl-0.5 [overflow-wrap:anywhere]"
        >
          {item}
        </li>
      ))}
    </ListTag>
  );
}

export const TestCaseItem: React.FC<{
  testCase: TestCase;
  onStatusChange: (status: 'Passed' | 'Failed' | 'Blocked') => void;
  onObservedResultChange?: (value: string) => void;
  onExecutionKindChange?: (kind: TestCase['executionKind']) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onBatchSelect?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}> = ({
  testCase,
  onStatusChange,
  onObservedResultChange,
  onExecutionKindChange,
  onEdit,
  onDelete,
  onDuplicate,
  onBatchSelect,
  selected,
  onToggleSelect,
}) => {
  const [detailsOpen, setDetailsOpen] = useState(() => testCase.status === 'Failed');

  const [localObservedResult, setLocalObservedResult] = useState(
    () => testCase.observedResult ?? ''
  );
  const isEditingObservedRef = useRef(false);
  const observedPersistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const persistObservedResult = useCallback(
    (value: string) => {
      if (!onObservedResultChange) return;
      const committed = testCase.observedResult ?? '';
      if (value === committed) return;
      onObservedResultChange(value);
    },
    [onObservedResultChange, testCase.observedResult]
  );

  const schedulePersistObservedResult = useCallback(
    (value: string) => {
      if (!onObservedResultChange) return;
      if (observedPersistTimerRef.current) {
        clearTimeout(observedPersistTimerRef.current);
      }
      observedPersistTimerRef.current = setTimeout(() => {
        persistObservedResult(value);
        observedPersistTimerRef.current = null;
      }, OBSERVED_RESULT_PERSIST_MS);
    },
    [onObservedResultChange, persistObservedResult]
  );

  useEffect(() => {
    setLocalObservedResult(testCase.observedResult ?? '');
  }, [testCase.id]);

  useEffect(() => {
    if (isEditingObservedRef.current) return;
    setLocalObservedResult(testCase.observedResult ?? '');
  }, [testCase.observedResult]);

  useEffect(
    () => () => {
      if (observedPersistTimerRef.current) {
        clearTimeout(observedPersistTimerRef.current);
      }
    },
    []
  );

  const actionSteps = useMemo(() => {
    const parsed = parseTestCaseActionSteps(testCase.action || '');
    return parsed.length === 0 ? ['—'] : parsed;
  }, [testCase.action]);

  const hasStructuredSteps = actionSteps.length > 1;

  /** Até 2 linhas na lista; texto completo em title / roteiro expandido. */
  const listTitle = useMemo(() => getTestCaseListTitle(testCase, { truncate: false }), [testCase]);

  const listRowTitleAttr = useMemo(() => {
    const parts = [listTitle, testCase.action?.trim() ? `Ação necessária:\n${testCase.action}` : ''].filter(
      Boolean
    );
    return parts.join('\n\n');
  }, [listTitle, testCase.action]);

  const parametersView = useMemo(
    () => structureTestCaseParameters(testCase.parameters || ''),
    [testCase.parameters]
  );

  const expectedView = useMemo(
    () => structureTestCaseExpected(testCase.expectedResult || ''),
    [testCase.expectedResult]
  );

  const executionBadge = useMemo(
    () => getExecutionKindBadgeDisplay(testCase),
    [testCase]
  );

  const handleCycleExecutionKind = useCallback(() => {
    if (!onExecutionKindChange) return;
    onExecutionKindChange(getNextExecutionKind(testCase));
  }, [onExecutionKindChange, testCase]);

  const metaChips = useMemo(() => {
    const env = getTestCaseEnvironment(testCase);
    const suite = getTestCaseSuite(testCase);
    const k = testCase.executionKind;
    const execLabel =
      k === 'automated'
        ? 'Execução automatizada'
        : k === 'mixed'
          ? 'Execução mista'
          : k === 'manual'
            ? 'Execução manual'
            : testCaseLooksAutomated(testCase)
              ? 'Execução inferida (automatizada)'
              : 'Execução inferida (manual)';
    return { env, suite, execLabel };
  }, [testCase]);

  const metaLine = useMemo(() => {
    const parts: string[] = [];
    if (metaChips.execLabel) parts.push(metaChips.execLabel);
    if (metaChips.env) parts.push(`Amb. ${metaChips.env}`);
    if (metaChips.suite) parts.push(`Suíte ${metaChips.suite}`);
    return parts.join(' · ');
  }, [metaChips]);

  useEffect(() => {
    if (testCase.status === 'Failed') {
      setDetailsOpen(true);
    }
  }, [testCase.status]);

  return (
    <div
      className={cn(
        taskDetailsModalTestCaseCardClass,
        'border-l-4',
        TEST_CASE_STATUS_BORDER[testCase.status],
        'hover:border-primary/30',
        selected &&
          'ring-2 ring-primary/35 ring-offset-2 ring-offset-base-100'
      )}
    >
      <div className="flex min-w-0 items-start gap-2 md:gap-2">
        {onBatchSelect && onToggleSelect && (
          <label className="label shrink-0 cursor-pointer gap-1 py-0">
            <input
              type="checkbox"
              checked={!!selected}
              onChange={onToggleSelect}
              className="checkbox checkbox-sm checkbox-highlight"
              aria-label="Selecionar caso de teste para ações em lote"
            />
          </label>
        )}

        <TestCaseStatusIndicator status={testCase.status} />

        <div className="flex min-w-0 flex-1 flex-col">
          <p
            className="min-w-0 line-clamp-2 break-words font-sans text-sm font-semibold leading-snug text-base-content sm:text-base"
            title={listRowTitleAttr || undefined}
          >
            <span className="sr-only">Título do roteiro: </span>
            {listTitle}
          </p>

          {metaLine ? (
            <p className="font-body text-muted mt-0.5 truncate text-xs" title={metaLine}>
              {metaLine}
            </p>
          ) : null}
        </div>

        {/* Grupo de ações: Editar, Duplicar, Excluir — integrados numa toolbar única */}
        <div
          className={cn(taskDetailsModalActionToolbarClass, 'hidden md:inline-flex')}
          role="toolbar"
          aria-label="Ações do caso de teste"
        >
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className={cn(taskDetailsModalToolbarIconClass, 'text-primary')}
              aria-label="Editar caso de teste"
              title="Editar"
            >
              <EditIcon className="h-4 w-4" />
            </button>
          )}
          {onDuplicate && (
            <button
              type="button"
              onClick={onDuplicate}
              className={taskDetailsModalToolbarIconClass}
              aria-label="Duplicar caso de teste"
              title="Duplicar"
            >
              <Copy className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <>
              <div className="mx-0.5 h-4 w-px bg-base-300" aria-hidden />
              <button
                type="button"
                onClick={onDelete}
                className={cn(taskDetailsModalToolbarIconClass, 'text-error/80 hover:text-error')}
                aria-label="Excluir caso de teste"
                title="Excluir"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        <TestCaseStatusControls status={testCase.status} onStatusChange={onStatusChange} />

        <div className="dropdown dropdown-end dropdown-top shrink-0 md:hidden">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-xs btn-circle min-h-8 min-w-8 rounded-full"
            aria-label="Mais ações do caso de teste"
          >
            <MoreVertical className="h-4 w-4" aria-hidden />
          </div>
          <ul
            tabIndex={0}
            className={cn('dropdown-content menu z-[60] mb-1 w-56 p-2 shadow-lg', appMenuPanelClass)}
          >
            {onEdit && (
              <li>
                <button type="button" className="font-body" onClick={onEdit}>
                  <EditIcon className="h-4 w-4" /> Editar
                </button>
              </li>
            )}
            {onDuplicate && (
              <li>
                <button type="button" className="font-body" onClick={onDuplicate}>
                  <Copy className="h-4 w-4" /> Duplicar
                </button>
              </li>
            )}
            {onDelete && (
              <li>
                <button type="button" className="font-body text-error" onClick={onDelete}>
                  <TrashIcon className="h-4 w-4" /> Excluir
                </button>
              </li>
            )}
            <li className="menu-title mt-1">
              <span className="font-body text-xs font-normal text-muted">Execução</span>
            </li>
            <li>
              <button
                type="button"
                className={cn('font-body', testCase.status === 'Passed' && 'active')}
                onClick={() => onStatusChange('Passed')}
              >
                <TestCaseStatusGlyph status="Passed" />
                Aprovar
              </button>
            </li>
            <li>
              <button
                type="button"
                className={cn('font-body', testCase.status === 'Failed' && 'active')}
                onClick={() => onStatusChange('Failed')}
              >
                <TestCaseStatusGlyph status="Failed" />
                Reprovar
              </button>
            </li>
            <li>
              <button
                type="button"
                className={cn('font-body', testCase.status === 'Blocked' && 'active')}
                onClick={() => onStatusChange('Blocked')}
              >
                <TestCaseStatusGlyph status="Blocked" />
                Bloquear
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-1.5 flex min-w-0 flex-col gap-1 px-0.5">
        <span className="task-card-field-label">Tipo de execução</span>
        <TestCaseExecutionKindBadgeButton
          label={executionBadge.label}
          variant={executionBadge.variant}
          onClick={handleCycleExecutionKind}
          disabled={!onExecutionKindChange}
        />
      </div>

      <div className={taskDetailsModalRoteiroShellClass}>
        <button
          type="button"
          onClick={() => setDetailsOpen(o => !o)}
          className={taskDetailsModalRoteiroHeaderClass}
          aria-expanded={detailsOpen}
        >
          <div className="flex min-w-0 items-center gap-2">
            <ListIcon className="h-4 w-4 shrink-0 task-card-muted" />
            <span className="font-sans text-xs font-semibold text-base-content">
              Roteiro completo
            </span>
          </div>
          <ChevronDownIcon
            className={`h-4 w-4 shrink-0 task-card-muted transition-transform duration-200 ${detailsOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {detailsOpen && (
          <div className={taskDetailsModalRoteiroInnerClass}>
            <div>
              <h3 className={cn(leveTaskModalMutedXsClass, 'mb-1 block font-bold uppercase tracking-widest')}>
                Ação necessária
              </h3>
              <div className={taskDetailsModalRoteiroBlockClass}>
                {hasStructuredSteps ? (
                  <ol className="list-decimal list-outside ml-5 space-y-2 pl-1 text-sm font-medium leading-snug marker:font-bold marker:text-primary">
                    {actionSteps.map((step, i) => (
                      <li
                        key={`action-step-${i}`}
                        className="break-words pl-0.5 text-base-content [overflow-wrap:anywhere]"
                      >
                        {stripLeadingStepIndex(step)}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className={cn('whitespace-pre-wrap text-sm leading-relaxed', leveTaskModalMutedClass)}>
                    {actionSteps[0]}
                  </p>
                )}
              </div>
            </div>
            <div>
              <h3 className={cn(leveTaskModalMutedXsClass, 'mb-1 block font-bold uppercase tracking-widest')}>
                Parâmetros necessários
              </h3>
              <div className={taskDetailsModalRoteiroBlockClass}>
                <RoteiroStructuredBody view={parametersView} />
              </div>
            </div>
            <div>
              <h3 className={cn(leveTaskModalMutedXsClass, 'mb-1 block font-bold uppercase tracking-widest')}>
                Resultado esperado
              </h3>
              <div className={taskDetailsModalRoteiroBlockClass}>
                <RoteiroStructuredBody view={expectedView} />
              </div>
            </div>
            <div>
              <label
                className={cn(
                  leveTaskModalMutedXsClass,
                  'mb-1 block font-bold uppercase tracking-widest'
                )}
              >
                Resultado obtido
              </label>
              <textarea
                value={localObservedResult}
                onChange={e => {
                  const next = e.target.value;
                  setLocalObservedResult(next);
                  schedulePersistObservedResult(next);
                }}
                onFocus={() => {
                  isEditingObservedRef.current = true;
                }}
                onBlur={e => {
                  isEditingObservedRef.current = false;
                  const next = e.target.value;
                  if (observedPersistTimerRef.current) {
                    clearTimeout(observedPersistTimerRef.current);
                    observedPersistTimerRef.current = null;
                  }
                  persistObservedResult(next);
                }}
                onClick={e => e.stopPropagation()}
                onKeyDown={e => e.stopPropagation()}
                readOnly={!onObservedResultChange}
                aria-readonly={!onObservedResultChange}
                placeholder="Preencha durante a execução com o comportamento observado."
                className={cn(
                  taskDetailsModalTextareaClass,
                  'min-h-[72px]',
                  !onObservedResultChange && 'cursor-not-allowed opacity-60'
                )}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
