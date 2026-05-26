import React, { useEffect, useMemo, useState } from 'react';
import type { TestCase, TestCaseExecutionKind } from '../../types';
import {
  getTestCaseEnvironment,
  getTestCaseSuite,
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
import { Badge } from '../common/Badge';
import { Copy, MoreVertical } from 'lucide-react';
import { cn } from '../../utils/cn';
import { appMenuPanelClass, appSelectClass } from '../common/viewUi';
import { taskTextareaClass } from './taskActionLayout';
import { AppSelect } from '../common/AppSelect';
import {
  leveTaskModalCollapsibleHeaderClass,
  leveTaskModalCollapsibleShellClass,
  leveTaskModalMutedClass,
  leveTaskModalMutedXsClass,
  leveTaskModalSectionClass,
  leveTaskModalStrongClass,
} from '../common/projectCardUi';
const ROTEIRO_BLOCK_CLASS = cn(leveTaskModalSectionClass, 'p-3 text-xs text-[var(--leve-header-text)]');

const STATUS_EMOJI: Record<TestCase['status'], string> = {
  'Not Run': '○',
  Passed: '✅',
  Failed: '❌',
  Blocked: '⚠️',
};

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
            <dt className="shrink-0 font-semibold text-[var(--leve-header-accent)]">{row.key}</dt>
            <dd className="leading-relaxed text-[var(--leve-header-text)] [overflow-wrap:anywhere]">
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
      ? 'list-decimal list-outside ml-5 space-y-2 pl-1 marker:font-semibold marker:text-[var(--leve-header-accent)]'
      : 'list-disc list-outside ml-4 space-y-2 pl-1 marker:text-[var(--leve-header-accent)]';

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
  detailsOpenOverride?: boolean;
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
  detailsOpenOverride,
  onBatchSelect,
  selected,
  onToggleSelect,
}) => {
  const statusLabel: Record<TestCase['status'], string> = {
    'Not Run': 'Não Executado',
    Passed: 'Aprovado',
    Failed: 'Reprovado',
    Blocked: 'Bloqueado',
  };

  const [detailsOpen, setDetailsOpen] = useState(() => testCase.status === 'Failed');

  const effectiveDetailsOpen =
    detailsOpenOverride !== undefined ? detailsOpenOverride : detailsOpen;

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

  const executionBadge = useMemo(() => {
    const k = testCase.executionKind;
    if (k === 'automated') return { label: 'Automatizado', variant: 'info' as const };
    if (k === 'mixed') return { label: 'Misto', variant: 'warning' as const };
    if (k === 'manual') return { label: 'Manual', variant: 'neutral' as const };
    const inferredAuto = testCaseLooksAutomated(testCase);
    if (inferredAuto) return { label: 'Automatizado (inferido)', variant: 'info' as const };
    return { label: 'Manual (inferido)', variant: 'neutral' as const };
  }, [testCase]);

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
        leveTaskModalSectionClass,
        'py-2 px-3 transition-colors duration-200 hover:border-[color-mix(in_srgb,var(--leve-header-accent)_30%,transparent)]',
        selected &&
          'ring-2 ring-[color-mix(in_srgb,var(--leve-header-accent)_35%,transparent)] ring-offset-2 ring-offset-[var(--leve-header-bg)]'
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

        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center text-lg leading-none"
          title={statusLabel[testCase.status]}
          aria-hidden
        >
          <span className="sr-only">{statusLabel[testCase.status]}</span>
          {STATUS_EMOJI[testCase.status]}
        </span>

        <p
          className="min-w-0 flex-1 line-clamp-2 break-words font-sans text-sm font-semibold leading-snug text-[var(--leve-header-text)] sm:text-base"
          title={listRowTitleAttr || undefined}
        >
          <span className="sr-only">Título do roteiro: </span>
          {listTitle}
        </p>

        {metaLine ? (
          <p
            className="font-body text-muted hidden max-w-[min(12rem,28vw)] shrink-0 truncate text-xs md:block"
            title={metaLine}
          >
            {metaLine}
          </p>
        ) : null}

        {/* Grupo de ações: Editar, Duplicar, Excluir — integrados numa toolbar única */}
        <div
          className="hidden shrink-0 items-center rounded-full border border-[var(--leve-header-border)] bg-[color-mix(in_srgb,var(--leve-header-text)_4%,var(--leve-header-bg))] p-0.5 md:flex"
          role="toolbar"
          aria-label="Ações do caso de teste"
        >
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--leve-header-accent)] transition-all duration-150 hover:bg-[color-mix(in_srgb,var(--leve-header-accent)_12%,transparent)]"
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
              className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--leve-header-text-muted)] transition-all duration-150 hover:bg-[color-mix(in_srgb,var(--leve-header-text)_8%,var(--leve-header-bg))] hover:text-[var(--leve-header-text)]"
              aria-label="Duplicar caso de teste"
              title="Duplicar"
            >
              <Copy className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <>
              <div className="mx-0.5 h-4 w-px bg-[var(--leve-header-border)]" aria-hidden />
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex h-7 w-7 items-center justify-center rounded-md text-error/70 transition-all duration-150 hover:bg-error/10 hover:text-error hover:scale-105"
                aria-label="Excluir caso de teste"
                title="Excluir"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </>
          )}
        </div>

        {/* Grupo de status: Aprovar, Reprovar, Bloquear — integrados numa toolbar única */}
        <div
          className="hidden shrink-0 items-center rounded-full border border-[var(--leve-header-border)] bg-[color-mix(in_srgb,var(--leve-header-text)_4%,var(--leve-header-bg))] p-0.5 md:flex"
          role="group"
          aria-label="Marcar resultado da execução"
        >
          <button
            type="button"
            onClick={() => onStatusChange('Passed')}
            title="Aprovar"
            aria-label="Marcar como Aprovado"
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded-md transition-all duration-150',
              testCase.status === 'Passed'
                ? 'bg-success/20 text-success ring-1 ring-success/30 scale-105'
                : 'text-success/60 hover:bg-success/10 hover:text-success hover:scale-105'
            )}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('Failed')}
            title="Reprovar"
            aria-label="Marcar como Reprovado"
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded-md transition-all duration-150',
              testCase.status === 'Failed'
                ? 'bg-error/20 text-error ring-1 ring-error/30 scale-105'
                : 'text-error/60 hover:bg-error/10 hover:text-error hover:scale-105'
            )}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('Blocked')}
            title="Bloquear"
            aria-label="Marcar como Bloqueado"
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded-md transition-all duration-150',
              testCase.status === 'Blocked'
                ? 'bg-warning/20 text-warning ring-1 ring-warning/30 scale-105'
                : 'text-warning/60 hover:bg-warning/10 hover:text-warning hover:scale-105'
            )}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </button>
        </div>

        <div className="dropdown dropdown-end shrink-0 md:hidden">
          <div
            tabIndex={0}
            role="button"
            className="btn btn-ghost btn-xs btn-circle min-h-8 min-w-8"
            aria-label="Mais ações do caso de teste"
          >
            <MoreVertical className="h-4 w-4" aria-hidden />
          </div>
          <ul
            tabIndex={0}
            className={cn('dropdown-content menu z-[60] mt-1 w-56 p-2 shadow-lg', appMenuPanelClass)}
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
                ✅ Aprovar
              </button>
            </li>
            <li>
              <button
                type="button"
                className={cn('font-body', testCase.status === 'Failed' && 'active')}
                onClick={() => onStatusChange('Failed')}
              >
                ❌ Reprovar
              </button>
            </li>
            <li>
              <button
                type="button"
                className={cn('font-body', testCase.status === 'Blocked' && 'active')}
                onClick={() => onStatusChange('Blocked')}
              >
                ⚠️ Bloquear
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-2 px-0.5">
        <Badge variant={executionBadge.variant} size="sm" appearance="pill" className="shrink-0">
          <span className="normal-case tracking-normal">{executionBadge.label}</span>
        </Badge>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:max-w-[16rem] sm:flex-initial">
          <label
            htmlFor={`tc-exec-kind-${testCase.id}`}
            className="task-card-field-label"
          >
            Tipo de execução
          </label>
          <AppSelect
            id={`tc-exec-kind-${testCase.id}`}
            value={testCase.executionKind ?? ''}
            onChange={e => {
              if (!onExecutionKindChange) return;
              const raw = e.target.value;
              if (raw === '') onExecutionKindChange(undefined);
              else onExecutionKindChange(raw as TestCaseExecutionKind);
            }}
            disabled={!onExecutionKindChange}
            title={
              onExecutionKindChange
                ? 'Manual, automatizado, misto ou inferir pelo texto do roteiro (mesma regra do editor).'
                : 'Edição do tipo de execução indisponível neste contexto.'
            }
            aria-label="Tipo de execução do caso de teste"
            className={cn(
              appSelectClass,
              'select-bordered select-xs min-w-0 w-full text-xs',
              !onExecutionKindChange && 'cursor-not-allowed opacity-70'
            )}
          >
            <option value="manual">Manual (padrão)</option>
            <option value="">Inferir pelo texto</option>
            <option value="automated">Automatizado</option>
            <option value="mixed">Misto</option>
          </AppSelect>
        </div>
      </div>

      <div className={cn(leveTaskModalCollapsibleShellClass, 'mt-2 overflow-hidden')}>
        <button
          type="button"
          onClick={() => {
            if (detailsOpenOverride === undefined) {
              setDetailsOpen(o => !o);
            }
          }}
          className={cn(leveTaskModalCollapsibleHeaderClass, 'px-3 py-2')}
          aria-expanded={effectiveDetailsOpen}
        >
          <div className="flex min-w-0 items-center gap-2">
            <ListIcon className="h-4 w-4 shrink-0 task-card-muted" />
            <span className="font-sans text-xs font-semibold text-[var(--leve-header-text)]">
              Roteiro completo
            </span>
          </div>
          <ChevronDownIcon
            className={`h-4 w-4 shrink-0 task-card-muted transition-transform duration-200 ${effectiveDetailsOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {effectiveDetailsOpen && (
          <div className="space-y-3 border-t border-[var(--leve-header-border)] px-3 pb-3 pt-2">
            <div>
              <h3 className="mb-1 font-body text-[10px] font-bold uppercase tracking-widest text-muted">
                Ação necessária
              </h3>
              <div className={ROTEIRO_BLOCK_CLASS}>
                {hasStructuredSteps ? (
                  <ol className="list-decimal list-outside ml-5 space-y-2 pl-1 text-sm font-medium leading-snug marker:font-bold marker:text-[var(--leve-header-accent)]">
                    {actionSteps.map((step, i) => (
                      <li
                        key={`action-step-${i}`}
                        className="break-words pl-0.5 text-[var(--leve-header-text)] [overflow-wrap:anywhere]"
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
              <h3 className="mb-1 font-body text-[10px] font-bold uppercase tracking-widest text-muted">
                Parâmetros necessários
              </h3>
              <div className={ROTEIRO_BLOCK_CLASS}>
                <RoteiroStructuredBody view={parametersView} />
              </div>
            </div>
            <div>
              <h3 className="mb-1 font-body text-[10px] font-bold uppercase tracking-widest text-muted">
                Resultado esperado
              </h3>
              <div className={ROTEIRO_BLOCK_CLASS}>
                <RoteiroStructuredBody view={expectedView} />
              </div>
            </div>
            <div>
              <label className="mb-1 block font-body text-[10px] font-bold uppercase tracking-widest text-muted">
                Resultado obtido
              </label>
              <textarea
                value={testCase.observedResult}
                onChange={v => onObservedResultChange?.(v)}
                disabled={!onObservedResultChange}
                placeholder="Preencha durante a execução com o comportamento observado."
                className={cn(taskTextareaClass, 'textarea-sm text-xs min-h-[72px]')}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
