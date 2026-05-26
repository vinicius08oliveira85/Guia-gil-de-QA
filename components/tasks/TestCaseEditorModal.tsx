import React, { useEffect, useState } from 'react';
import type { TestCase, TestCaseExecutionKind } from '../../types';
import { Modal } from '../common/Modal';
import { SafeMarkdown } from '../common/SafeMarkdown';
import { cn } from '../../utils/cn';
import { appSelectClass, outlineActionBtn, primaryActionBtn, searchInputClass } from '../common/viewUi';
import { AppSelect } from '../common/AppSelect';
import {
  taskCardFieldLabelClass,
  taskCardMutedClass,
  taskFormInsetPanelClass,
  taskFormPreviewBoxClass,
  taskPanelBorderClass,
  taskTextareaClass,
  taskTextStrongClass,
} from './taskActionLayout';

interface TestCaseEditorModalProps {
  testCase: TestCase;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: TestCase) => void;
  onDelete?: () => void;
}

const labelClass = cn(taskCardFieldLabelClass, 'block mb-1 normal-case tracking-normal');

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
      executionKind: executionKind ? (executionKind as TestCaseExecutionKind) : undefined,
      environment: environment.trim() || undefined,
      suite: suite.trim() || undefined,
    });
    onClose();
  };

  const previewTitle = action.trim().slice(0, 60) || testCase.id;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Editar caso de teste: ${previewTitle}`} size="2xl">
      <div className="space-y-4 app-element-typography">
        <label
          className={cn(
            taskPanelBorderClass,
            'flex cursor-pointer items-start gap-3 bg-[color-mix(in_srgb,var(--leve-neu-dark)_8%,var(--leve-neu-bg))] p-3 text-sm transition-colors hover:bg-[color-mix(in_srgb,var(--leve-neu-dark)_12%,var(--leve-neu-bg))]',
            taskTextStrongClass
          )}
        >
          <input
            type="checkbox"
            className="checkbox checkbox-sm checkbox-highlight mt-0.5"
            checked={previewMarkdown}
            onChange={e => setPreviewMarkdown(e.target.checked)}
          />
          <span>
            <span className="font-semibold">Pré-visualizar como Markdown</span>
            <span className={cn('mt-0.5 block text-xs', taskCardMutedClass)}>
              Somente leitura abaixo de cada campo. O valor salvo permanece texto puro (listas
              numeradas, quebras de linha e, se quiser, sintaxe **negrito** / listas Markdown).
            </span>
          </span>
        </label>

        <div>
          <label className={labelClass}>Ação necessária</label>
          <textarea
            value={action}
            onChange={v => setAction(v)}
            className={cn(taskTextareaClass, 'min-h-[120px]')}
            placeholder="Descreva o que deve ser executado (roteiro)."
          />
          {previewMarkdown && (
            <div className={taskFormPreviewBoxClass}>
              <p className={cn('mb-2 font-semibold', taskCardMutedClass)}>Prévia</p>
              <SafeMarkdown source={action} className="text-sm" />
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>Parâmetros necessários</label>
          <textarea
            value={parameters}
            onChange={v => setParameters(v)}
            className={cn(taskTextareaClass, 'min-h-[88px]')}
            placeholder="Dados de entrada, massa, ambientes, contas…"
          />
          {previewMarkdown && (
            <div className={taskFormPreviewBoxClass}>
              <p className={cn('mb-2 font-semibold', taskCardMutedClass)}>Prévia</p>
              <SafeMarkdown source={parameters} className="text-sm" />
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>Resultado esperado</label>
          <textarea
            value={expectedResult}
            onChange={v => setExpectedResult(v)}
            className={cn(taskTextareaClass, 'min-h-[88px]')}
          />
          {previewMarkdown && (
            <div className={taskFormPreviewBoxClass}>
              <p className={cn('mb-2 font-semibold', taskCardMutedClass)}>Prévia</p>
              <SafeMarkdown source={expectedResult} className="text-sm" />
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>Resultado Obtido</label>
          <textarea
            value={observedResult}
            onChange={v => setObservedResult(v)}
            className={cn(taskTextareaClass, 'min-h-[88px]')}
            placeholder="Preencha após a execução."
          />
          {previewMarkdown && (
            <div className={taskFormPreviewBoxClass}>
              <p className={cn('mb-2 font-semibold', taskCardMutedClass)}>Prévia</p>
              <SafeMarkdown source={observedResult} className="text-sm" />
            </div>
          )}
        </div>

        <div className={taskFormInsetPanelClass}>
          <p className={cn('text-xs font-semibold', taskTextStrongClass)}>
            Opcional — auditoria e filtros
          </p>
          <div>
            <label className={labelClass}>Tipo de execução</label>
            <AppSelect
              value={executionKind}
              onChange={e =>
                setExecutionKind((e.target.value || '') as TestCaseExecutionKind | '')
              }
              className={cn(appSelectClass, 'select-bordered w-full')}
            >
              <option value="manual">Manual (padrão)</option>
              <option value="">Inferir pelo texto</option>
              <option value="automated">Automatizado</option>
              <option value="mixed">Misto</option>
            </AppSelect>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Ambiente</label>
              <input
                type="text"
                value={environment}
                onChange={v => setEnvironment(v)}
                className={cn(searchInputClass, 'h-9 pl-3')}
                placeholder="Ex.: Homologação"
              />
            </div>
            <div>
              <label className={labelClass}>Suíte</label>
              <input
                type="text"
                value={suite}
                onChange={v => setSuite(v)}
                className={cn(searchInputClass, 'h-9 pl-3')}
                placeholder="Ex.: Smoke API"
              />
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>Status</label>
          <AppSelect
            value={status}
            onChange={v => setStatus(v as TestCase['status'])}
            className={cn(appSelectClass, 'select-bordered w-full')}
          >
            <option value="Not Run">Não Executado</option>
            <option value="Passed">Aprovado</option>
            <option value="Failed">Reprovado</option>
            <option value="Blocked">Bloqueado</option>
          </AppSelect>
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          {onDelete && (
            <button
              type="button"
              className={cn(outlineActionBtn, 'btn btn-outline btn-error min-h-10')}
              onClick={onDelete}
            >
              Excluir
            </button>
          )}
          <button type="button" className={cn(outlineActionBtn, 'min-h-10')} onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className={cn(primaryActionBtn, 'min-h-10')} onClick={handleSubmit}>
            Salvar
          </button>
        </div>
      </div>
    </Modal>
  );
};
