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

const ROTEIRO_BLOCK_CLASS =
  'text-xs text-base-content bg-base-200/50 p-3 rounded-lg border border-base-300/50';

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
            <dt className="font-semibold text-primary/90 shrink-0">{row.key}</dt>
            <dd className="text-base-content/90 leading-relaxed [overflow-wrap:anywhere]">
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

  /** Uma única linha na lista (truncável); texto completo em title / roteiro expandido. */
  const listTitle = useMemo(() => getTestCaseListTitle(testCase), [testCase]);

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
        'rounded-[1.4rem] border border-base-300 bg-base-200 py-2 px-3 transition-colors duration-200 hover:bg-base-300',
        selected && 'ring-1 ring-primary/40 ring-offset-2 ring-offset-base-200'
      )}
    >
      <div className="flex min-w-0 items-center gap-2 md:gap-2">
        {onBatchSelect && onToggleSelect && (
          <label className="label shrink-0 cursor-pointer gap-1 py-0">
            <input
              type="checkbox"
              checked={!!selected}
              onChange={onToggleSelect}
              className="checkbox checkbox-sm"
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
          className="font-heading min-w-0 flex-1 truncate text-sm text-base-content sm:text-base"
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

        <div className="hidden shrink-0 items-center gap-0.5 border-l border-base-300/70 pl-2 md:flex">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="btn btn-ghost btn-xs btn-circle min-h-8 min-w-8"
              aria-label="Editar caso de teste"
            >
              <EditIcon className="h-4 w-4" />
            </button>
          )}
          {onDuplicate && (
            <button
              type="button"
              onClick={onDuplicate}
              className="btn btn-ghost btn-xs btn-circle min-h-8 min-w-8"
              aria-label="Duplicar caso de teste"
              title="Duplicar"
            >
              <Copy className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="btn btn-ghost btn-xs btn-circle min-h-8 min-w-8 text-error"
              aria-label="Excluir caso de teste"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        <div
          className="hidden shrink-0 items-center gap-0.5 border-l border-base-300/70 pl-2 md:flex"
          role="group"
          aria-label="Marcar resultado da execução"
        >
          <button
            type="button"
            onClick={() => onStatusChange('Passed')}
            title="Aprovar"
            aria-label="Marcar como Aprovado"
            className={cn(
              'btn btn-xs min-h-8 min-w-8 rounded-full px-0 font-normal',
              testCase.status === 'Passed' ? 'btn-success' : 'btn-ghost border border-success/40 text-success'
            )}
          >
            ✅
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('Failed')}
            title="Reprovar"
            aria-label="Marcar como Reprovado"
            className={cn(
              'btn btn-xs min-h-8 min-w-8 rounded-full px-0 font-normal',
              testCase.status === 'Failed' ? 'btn-error' : 'btn-ghost border border-error/40 text-error'
            )}
          >
            ❌
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('Blocked')}
            title="Bloquear"
            aria-label="Marcar como Bloqueado"
            className={cn(
              'btn btn-xs min-h-8 min-w-8 rounded-full px-0 font-normal',
              testCase.status === 'Blocked'
                ? 'btn-warning'
                : 'btn-ghost border border-warning/40 text-warning'
            )}
          >
            ⚠️
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
            className="dropdown-content menu z-[60] mt-1 w-56 rounded-[1rem] border border-base-300 bg-base-100 p-2 shadow-lg"
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
            className="text-[10px] font-semibold uppercase tracking-wider text-base-content/60"
          >
            Tipo de execução
          </label>
          <select
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
              'select select-bordered select-xs min-w-0 w-full border-base-300 bg-base-100 text-xs',
              !onExecutionKindChange && 'cursor-not-allowed opacity-70'
            )}
          >
            <option value="manual">Manual (padrão)</option>
            <option value="">Inferir pelo texto</option>
            <option value="automated">Automatizado</option>
            <option value="mixed">Misto</option>
          </select>
        </div>
      </div>

      <div className="mt-2 overflow-hidden rounded-[1rem] border border-base-300 bg-base-100">
        <button
          type="button"
          onClick={() => {
            if (detailsOpenOverride === undefined) {
              setDetailsOpen(o => !o);
            }
          }}
          className="flex w-full items-center justify-between px-3 py-2 text-left transition-colors duration-200 hover:bg-base-200"
          aria-expanded={effectiveDetailsOpen}
        >
          <div className="flex min-w-0 items-center gap-2">
            <ListIcon className="h-4 w-4 shrink-0 text-base-content/70" />
            <span className="font-heading text-xs font-semibold text-base-content">
              Roteiro completo
            </span>
          </div>
          <ChevronDownIcon
            className={`h-4 w-4 shrink-0 text-base-content/70 transition-transform duration-200 ${effectiveDetailsOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {effectiveDetailsOpen && (
          <div className="space-y-3 border-t border-base-300 px-3 pb-3 pt-2">
            <div>
              <h3 className="mb-1 font-body text-[10px] font-bold uppercase tracking-widest text-muted">
                Ação necessária
              </h3>
              <div className={ROTEIRO_BLOCK_CLASS}>
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
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-base-content">
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
                onChange={e => onObservedResultChange?.(e.target.value)}
                disabled={!onObservedResultChange}
                placeholder="Preencha durante a execução com o comportamento observado."
                className="textarea textarea-bordered textarea-sm w-full border-base-300 bg-base-100 text-xs min-h-[72px]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
