import React, { useEffect, useMemo, useState } from 'react';
import { TestCase } from '../../types';
import { getTestCaseEnvironment, getTestCaseSuite } from '../../utils/testCaseMigration';
import { ChevronDownIcon, EditIcon, ListIcon, TrashIcon } from '../common/Icons';
import { Copy } from 'lucide-react';

const ACTION_TRUNCATE_LINES = 4;

export const TestCaseItem: React.FC<{
  testCase: TestCase;
  onStatusChange: (status: 'Passed' | 'Failed' | 'Blocked') => void;
  onObservedResultChange?: (value: string) => void;
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
  onEdit,
  onDelete,
  onDuplicate,
  detailsOpenOverride,
  onBatchSelect,
  selected,
  onToggleSelect,
}) => {
  const statusBadgeClassName: Record<TestCase['status'], string> = {
    'Not Run': 'badge badge-ghost badge-xs',
    Passed: 'badge badge-success badge-xs',
    Failed: 'badge badge-error badge-xs',
    Blocked: 'badge badge-warning badge-xs',
  };
  const statusLabel: Record<TestCase['status'], string> = {
    'Not Run': 'Não Executado',
    Passed: 'Aprovado',
    Failed: 'Reprovado',
    Blocked: 'Bloqueado',
  };

  const [detailsOpen, setDetailsOpen] = useState(() => testCase.status === 'Failed');
  const [actionExpanded, setActionExpanded] = useState(false);

  const effectiveDetailsOpen =
    detailsOpenOverride !== undefined ? detailsOpenOverride : detailsOpen;
  const actionText = testCase.action || '—';
  const isActionLong =
    actionText.split(/\n/).length > ACTION_TRUNCATE_LINES || actionText.length > 360;

  const metaChips = useMemo(() => {
    const env = getTestCaseEnvironment(testCase);
    const suite = getTestCaseSuite(testCase);
    const execLabel =
      testCase.executionKind === 'manual'
        ? 'Execução manual'
        : testCase.executionKind === 'automated'
          ? 'Execução automatizada'
          : testCase.executionKind === 'mixed'
            ? 'Execução mista'
            : null;
    return { env, suite, execLabel };
  }, [testCase]);

  useEffect(() => {
    if (testCase.status === 'Failed') {
      setDetailsOpen(true);
    }
  }, [testCase.status]);

  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-3 transition-colors hover:border-primary/30 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {onBatchSelect && onToggleSelect && (
            <label className="label cursor-pointer gap-1.5 py-0 pr-2 border-r border-base-300">
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
            className={`${statusBadgeClassName[testCase.status]} text-[10px] font-bold tracking-wider`}
          >
            {statusLabel[testCase.status]}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="btn btn-ghost btn-sm btn-circle"
              aria-label="Editar caso de teste"
            >
              <EditIcon className="w-4 h-4" />
            </button>
          )}
          {onDuplicate && (
            <button
              type="button"
              onClick={onDuplicate}
              className="btn btn-ghost btn-sm btn-circle"
              aria-label="Duplicar caso de teste"
              title="Duplicar"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="btn btn-ghost btn-sm btn-circle text-error"
              aria-label="Excluir caso de teste"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="min-w-0 space-y-1">
        <p className="text-[10px] font-bold text-base-content/60 uppercase tracking-widest">
          Ação necessária
        </p>
        <p
          className={`text-base font-semibold text-base-content leading-snug break-words whitespace-pre-wrap ${!actionExpanded && isActionLong ? 'line-clamp-4' : ''}`}
          title={actionText}
        >
          {actionText}
        </p>
        {isActionLong && !actionExpanded && (
          <button
            type="button"
            onClick={() => setActionExpanded(true)}
            className="btn btn-ghost btn-xs mt-0.5 text-primary hover:bg-primary/10"
          >
            Ver mais
          </button>
        )}
        {(metaChips.execLabel || metaChips.env || metaChips.suite) && (
          <div
            className="flex flex-wrap gap-1.5 pt-1.5 border-t border-base-200/80 mt-1.5"
            aria-label="Metadados do roteiro"
          >
            {metaChips.execLabel && (
              <span className="inline-flex items-center rounded-md border border-base-300/80 bg-base-200/50 px-2 py-0.5 text-[10px] font-semibold text-base-content/85">
                {metaChips.execLabel}
              </span>
            )}
            {metaChips.env && (
              <span
                className="inline-flex items-center rounded-md border border-base-300/60 bg-base-100 px-2 py-0.5 text-[10px] text-base-content/75 max-w-full truncate"
                title={metaChips.env}
              >
                <span className="text-base-content/50 font-medium mr-1">Ambiente</span>
                {metaChips.env}
              </span>
            )}
            {metaChips.suite && (
              <span
                className="inline-flex items-center rounded-md border border-base-300/60 bg-base-100 px-2 py-0.5 text-[10px] text-base-content/75 max-w-full truncate"
                title={metaChips.suite}
              >
                <span className="text-base-content/50 font-medium mr-1">Suíte</span>
                {metaChips.suite}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="bg-base-100 border border-base-300 rounded-lg overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => {
            if (detailsOpenOverride === undefined) {
              setDetailsOpen(o => !o);
            }
          }}
          className="w-full flex items-center justify-between px-3 py-2 hover:bg-base-200/50 transition-colors text-left"
          aria-expanded={effectiveDetailsOpen}
        >
          <div className="flex items-center gap-2 min-w-0">
            <ListIcon className="w-4 h-4 text-base-content/70 flex-shrink-0" />
            <span className="text-xs font-semibold text-base-content">Roteiro completo</span>
          </div>
          <ChevronDownIcon
            className={`w-4 h-4 text-base-content/70 flex-shrink-0 transition-transform ${effectiveDetailsOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {effectiveDetailsOpen && (
          <div className="px-3 pb-3 pt-0 space-y-3 border-t border-base-200">
            <div>
              <h3 className="text-[10px] font-bold text-base-content/70 uppercase tracking-widest mb-1">
                Parâmetros necessários
              </h3>
              <p className="text-xs text-base-content bg-base-200/50 p-2.5 rounded whitespace-pre-wrap">
                {testCase.parameters || '—'}
              </p>
            </div>
            <div>
              <h3 className="text-[10px] font-bold text-base-content/70 uppercase tracking-widest mb-1">
                Resultado esperado
              </h3>
              <p className="text-xs text-base-content bg-base-200/50 p-2.5 rounded whitespace-pre-wrap">
                {testCase.expectedResult || '—'}
              </p>
            </div>
            <div>
              <label className="text-[10px] font-bold text-base-content/70 uppercase tracking-widest mb-1 block">
                Resultado obtido
              </label>
              <textarea
                value={testCase.observedResult}
                onChange={e => onObservedResultChange?.(e.target.value)}
                disabled={!onObservedResultChange}
                placeholder="Preencha durante a execução com o comportamento observado."
                className="textarea textarea-bordered textarea-sm w-full bg-base-100 border-base-300 text-xs min-h-[72px]"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
        <button
          type="button"
          onClick={() => onStatusChange('Passed')}
          title="Marcar como Aprovado"
          className={`btn btn-xs rounded-lg text-[10px] px-2 py-0.5 min-h-0 ${
            testCase.status === 'Passed' ? 'btn-success' : 'btn-outline btn-success'
          }`}
        >
          {testCase.status === 'Passed' ? '✓ Aprovado' : 'Aprovar'}
        </button>
        <button
          type="button"
          onClick={() => onStatusChange('Failed')}
          title="Marcar como Reprovado"
          className={`btn btn-xs rounded-lg text-[10px] px-2 py-0.5 min-h-0 ${
            testCase.status === 'Failed' ? 'btn-error' : 'btn-outline btn-error'
          }`}
        >
          {testCase.status === 'Failed' ? '✗ Reprovado' : 'Reprovar'}
        </button>
        <button
          type="button"
          onClick={() => onStatusChange('Blocked')}
          title="Marcar como Bloqueado"
          className={`btn btn-xs rounded-lg text-[10px] px-2 py-0.5 min-h-0 ${
            testCase.status === 'Blocked' ? 'btn-warning' : 'btn-outline btn-warning'
          }`}
        >
          {testCase.status === 'Blocked' ? '⊘ Bloqueado' : 'Bloquear'}
        </button>
      </div>
    </div>
  );
};
