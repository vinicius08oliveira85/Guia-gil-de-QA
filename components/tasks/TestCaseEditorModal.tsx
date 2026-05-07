import React, { useEffect, useState } from 'react';
import type { TestCase, TestCaseExecutionKind } from '../../types';
import { Modal } from '../common/Modal';

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
    testCase.executionKind ?? ''
  );
  const [environment, setEnvironment] = useState(testCase.environment ?? '');
  const [suite, setSuite] = useState(testCase.suite ?? '');

  useEffect(() => {
    setAction(testCase.action);
    setParameters(testCase.parameters);
    setExpectedResult(testCase.expectedResult);
    setObservedResult(testCase.observedResult || '');
    setStatus(testCase.status);
    setExecutionKind(testCase.executionKind ?? '');
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
        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1">
            Ação necessária
          </label>
          <textarea
            value={action}
            onChange={e => setAction(e.target.value)}
            className="textarea textarea-bordered w-full bg-base-100 border-base-300 text-base-content min-h-[120px]"
            placeholder="Descreva o que deve ser executado (roteiro)."
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1">
            Parâmetros necessários
          </label>
          <textarea
            value={parameters}
            onChange={e => setParameters(e.target.value)}
            className="textarea textarea-bordered w-full bg-base-100 border-base-300 text-base-content min-h-[88px]"
            placeholder="Dados de entrada, massa, ambientes, contas…"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1">
            Resultado esperado
          </label>
          <textarea
            value={expectedResult}
            onChange={e => setExpectedResult(e.target.value)}
            className="textarea textarea-bordered w-full bg-base-100 border-base-300 text-base-content min-h-[88px]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1">
            Resultado obtido
          </label>
          <textarea
            value={observedResult}
            onChange={e => setObservedResult(e.target.value)}
            className="textarea textarea-bordered w-full bg-base-100 border-base-300 text-base-content min-h-[88px]"
            placeholder="Preencha após a execução."
          />
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
              <option value="">Inferir pelo texto (padrão)</option>
              <option value="manual">Manual</option>
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
