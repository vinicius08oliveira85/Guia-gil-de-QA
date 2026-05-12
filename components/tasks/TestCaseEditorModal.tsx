import React, { useEffect, useState } from 'react';
import type { TestCase, TestCaseExecutionKind } from '../../types';
import { Modal } from '../common/Modal';
import { SafeMarkdown } from '../common/SafeMarkdown';

interface TestCaseEditorModalProps {
  testCase: TestCase;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: TestCase) => void;
  onDelete?: () => void;
}

export const TestCaseEditorModal: React.FC<TestCaseEditorModalProps> = ({
  testCase,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [action, setAction] = useState(testCase.action);
  const [parameters, setParameters] = useState(testCase.parameters);
  const [expectedResult, setExpectedResult] = useState(testCase.expectedResult);
  const [observedResult, setObservedResult] = useState(testCase.observedResult || '');
  const [status, setStatus] = useState<TestCase['status']>(testCase.status);
  const [executionKind, setExecutionKind] = useState<TestCaseExecutionKind | ''>(
    testCase.executionKind ?? 'manual'
  );
  const [environment, setEnvironment] = useState(testCase.environment ?? '');
  const [suite, setSuite] = useState(testCase.suite ?? '');
  /** Prévia renderizada com Markdown sanitizado; o persistido continua sendo texto puro. */
  const [previewMarkdown, setPreviewMarkdown] = useState(false);

  useEffect(() => {
    setAction(testCase.action);
    setParameters(testCase.parameters);
    setExpectedResult(testCase.expectedResult);
    setObservedResult(testCase.observedResult || '');
    setStatus(testCase.status);
    setExecutionKind(testCase.executionKind ?? 'manual');
    setEnvironment(testCase.environment ?? '');
    setSuite(testCase.suite ?? '');
  }, [testCase]);

  const handleSubmit = () => {
    onSave({
      ...testCase,
      action: action.trim() || '—',
      parameters: parameters.trim() || '—',
      expectedResult: expectedResult.trim(),
      observedResult: observedResult.trim(),
      status,
      executionKind: executionKind
        ? (executionKind as TestCaseExecutionKind)
        : undefined,
      environment: environment.trim() || undefined,
      suite: suite.trim() || undefined,
    });
    onClose();
  };

  const previewTitle = action.trim().slice(0, 60) || testCase.id;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editar caso de teste: ${previewTitle}`} size="xl">
      <div className="space-y-4">
        <label className="flex cursor-pointer items-start gap-2 rounded-lg border border-base-300 bg-base-200/40 p-3 text-sm text-base-content">
          <input
            type="checkbox"
            className="checkbox checkbox-sm mt-0.5"
            checked={previewMarkdown}
            onChange={e => setPreviewMarkdown(e.target.checked)}
          />
          <span>
            <span className="font-semibold">Pré-visualizar como Markdown</span>
            <span className="block text-xs text-base-content/70 mt-0.5">
              Somente leitura abaixo de cada campo. O valor salvo permanece texto puro (listas numeradas,
              quebras de linha e, se quiser, sintaxe **negrito** / listas Markdown).
            </span>
          </span>
        </label>

        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1">
            Ação necessária
          </label>
          <textarea
            value={action}
            onChange={e => setAction(e.target.value)}
            className="textarea textarea-bordered w-full bg-base-100 border-base-300 text-base-content min-h-[120px] font-mono whitespace-pre-wrap"
            placeholder="Descreva o que deve ser executado (roteiro)."
          />
          {previewMarkdown && (
            <div className="mt-2 rounded-lg border border-base-300 bg-base-200/50 p-3 text-xs">
              <p className="font-semibold text-base-content/70 mb-2">Prévia</p>
              <SafeMarkdown source={action} className="text-sm" />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1">
            Parâmetros necessários
          </label>
          <textarea
            value={parameters}
            onChange={e => setParameters(e.target.value)}
            className="textarea textarea-bordered w-full bg-base-100 border-base-300 text-base-content min-h-[88px] font-mono whitespace-pre-wrap"
            placeholder="Dados de entrada, massa, ambientes, contas…"
          />
          {previewMarkdown && (
            <div className="mt-2 rounded-lg border border-base-300 bg-base-200/50 p-3 text-xs">
              <p className="font-semibold text-base-content/70 mb-2">Prévia</p>
              <SafeMarkdown source={parameters} className="text-sm" />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1">
            Resultado esperado
          </label>
          <textarea
            value={expectedResult}
            onChange={e => setExpectedResult(e.target.value)}
            className="textarea textarea-bordered w-full bg-base-100 border-base-300 text-base-content min-h-[88px] font-mono whitespace-pre-wrap"
          />
          {previewMarkdown && (
            <div className="mt-2 rounded-lg border border-base-300 bg-base-200/50 p-3 text-xs">
              <p className="font-semibold text-base-content/70 mb-2">Prévia</p>
              <SafeMarkdown source={expectedResult} className="text-sm" />
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1">
            Resultado Obtido
          </label>
          <textarea
            value={observedResult}
            onChange={e => setObservedResult(e.target.value)}
            className="textarea textarea-bordered w-full bg-base-100 border-base-300 text-base-content min-h-[88px] font-mono whitespace-pre-wrap"
            placeholder="Preencha após a execução."
          />
          {previewMarkdown && (
            <div className="mt-2 rounded-lg border border-base-300 bg-base-200/50 p-3 text-xs">
              <p className="font-semibold text-base-content/70 mb-2">Prévia</p>
              <SafeMarkdown source={observedResult} className="text-sm" />
            </div>
          )}
        </div>

        <div className="rounded-lg border border-base-300 bg-base-200/30 p-3 space-y-3">
          <p className="text-xs font-semibold text-base-content/80">Opcional — auditoria e filtros</p>
          <div>
            <label className="block text-xs font-semibold text-base-content/70 mb-1">
              Tipo de execução
            </label>
            <select
              value={executionKind}
              onChange={e =>
                setExecutionKind((e.target.value || '') as TestCaseExecutionKind | '')
              }
              className="select select-bordered w-full bg-base-100 border-base-300 text-sm"
            >
              <option value="manual">Manual (padrão)</option>
              <option value="">Inferir pelo texto</option>
              <option value="automated">Automatizado</option>
              <option value="mixed">Misto</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-base-content/70 mb-1">
                Ambiente
              </label>
              <input
                type="text"
                value={environment}
                onChange={e => setEnvironment(e.target.value)}
                className="input input-bordered w-full bg-base-100 border-base-300 text-sm"
                placeholder="Ex.: Homologação"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-base-content/70 mb-1">Suíte</label>
              <input
                type="text"
                value={suite}
                onChange={e => setSuite(e.target.value)}
                className="input input-bordered w-full bg-base-100 border-base-300 text-sm"
                placeholder="Ex.: Smoke API"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1">Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value as TestCase['status'])}
            className="select select-bordered w-full bg-base-100 border-base-300"
          >
            <option value="Not Run">Não Executado</option>
            <option value="Passed">Aprovado</option>
            <option value="Failed">Reprovado</option>
            <option value="Blocked">Bloqueado</option>
          </select>
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          {onDelete && (
            <button type="button" className="btn btn-outline btn-error" onClick={onDelete}>
              Excluir
            </button>
          )}
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={handleSubmit}>
            Salvar
          </button>
        </div>
      </div>
    </Modal>
  );
};
