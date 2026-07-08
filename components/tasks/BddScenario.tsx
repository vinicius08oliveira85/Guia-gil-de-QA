import React, { useState } from 'react';
import { BddScenario } from '../../types';
import { EditIcon, TrashIcon } from '../common/Icons';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { cn } from '../../utils/cn';
import {
  leveTaskModalFieldLabelClass,
  leveTaskModalGhostBtnClass,
  leveTaskModalInputClass,
  leveTaskModalMutedClass,
  leveTaskModalPrimaryBtnClass,
  leveTaskModalSectionHeaderClass,
  leveTaskModalStrongClass,
  leveTaskModalTextareaClass,
} from '../common/projectCardUi';
import {
  taskDetailsModalActionToolbarClass,
  taskDetailsModalIconBtnClass,
  taskDetailsModalInsetPanelClass,
  taskDetailsModalSectionClass,
} from './taskDetailsNeuUi';

/** Palavras-chave Gherkin em português (ordem: mais longas primeiro para match correto). */
const GHERKIN_KEYWORDS = [
  { pattern: /Funcionalidade:\s*/g, type: 'feature' as const },
  { pattern: /Cenário:\s*/g, type: 'scenario' as const },
  { pattern: /\bEu quero\b/g, type: 'and' as const },
  { pattern: /\bDado\b/g, type: 'given' as const },
  { pattern: /\bQuando\b/g, type: 'when' as const },
  { pattern: /\bEntão\b/g, type: 'then' as const },
  { pattern: /\bComo\b/g, type: 'and' as const },
  { pattern: /\bPara\b/g, type: 'and' as const },
  { pattern: /(?:^|\s)E\s/gm, type: 'and' as const },
];

const KEYWORD_CLASS: Record<string, string> = {
  feature: 'font-semibold text-base-content',
  scenario: 'font-semibold text-base-content',
  given: 'font-semibold text-success',
  when: 'font-semibold text-primary',
  then: 'font-semibold text-success',
  and: 'font-semibold text-base-content/72',
};

/** Quebra o texto em segmentos (keyword tipada ou texto plano) para destacar palavras-chave Gherkin. */
function parseGherkinSegments(
  text: string
): Array<{ type: 'text' | 'keyword'; value: string; keywordType?: string }> {
  if (!text || !text.trim()) return [{ type: 'text', value: text }];
  const segments: Array<{ type: 'text' | 'keyword'; value: string; keywordType?: string }> = [];
  const matches: Array<{ index: number; length: number; type: string; value: string }> = [];

  for (const { pattern, type } of GHERKIN_KEYWORDS) {
    const re = new RegExp(pattern.source, pattern.flags);
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      matches.push({ index: m.index, length: m[0].length, type, value: m[0] });
    }
  }
  matches.sort((a, b) => a.index - b.index);

  let lastEnd = 0;
  for (const { index, length, type, value } of matches) {
    if (index < lastEnd) continue;
    if (index > lastEnd) {
      segments.push({ type: 'text', value: text.slice(lastEnd, index) });
    }
    segments.push({ type: 'keyword', value, keywordType: type });
    lastEnd = index + length;
  }
  if (lastEnd < text.length) {
    segments.push({ type: 'text', value: text.slice(lastEnd) });
  }
  return segments.length > 0 ? segments : [{ type: 'text', value: text }];
}

export const GherkinContent: React.FC<{ text: string }> = ({ text }) => {
  const segments = parseGherkinSegments(text);
  return (
    <>
      {segments.map((seg, i) =>
        seg.type === 'keyword' && seg.keywordType ? (
          <span key={i} className={KEYWORD_CLASS[seg.keywordType] ?? 'font-semibold'}>
            {seg.value}
          </span>
        ) : (
          <React.Fragment key={i}>{seg.value}</React.Fragment>
        )
      )}
    </>
  );
};

export const BddScenarioForm: React.FC<{
  onSave: (scenario: Omit<BddScenario, 'id'>) => void;
  onCancel: () => void;
  existingScenario?: BddScenario;
}> = ({ onSave, onCancel, existingScenario }) => {
  const { handleWarning } = useErrorHandler();
  const [title, setTitle] = useState(existingScenario?.title || '');
  const [gherkin, setGherkin] = useState(existingScenario?.gherkin || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !gherkin.trim()) {
      handleWarning('Título e Cenário Gherkin são obrigatórios.');
      return;
    }
    onSave({ title, gherkin });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        taskDetailsModalSectionClass,
        'my-2 space-y-4 border-l-4 border-l-primary p-5'
      )}
    >
      <div>
        <label className="label">
          <span className={cn('label-text text-sm font-medium', leveTaskModalFieldLabelClass)}>
            Título do Cenário
          </span>
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className={leveTaskModalInputClass}
          placeholder="Ex: Login com credenciais válidas"
        />
      </div>
      <div>
        <label className="label">
          <span className={cn('label-text text-sm font-medium', leveTaskModalFieldLabelClass)}>
            Cenário (Gherkin: Dado, Quando, Então)
          </span>
        </label>
        <textarea
          value={gherkin}
          onChange={e => setGherkin(e.target.value)}
          rows={5}
          required
          className={leveTaskModalTextareaClass}
          placeholder={`Dado que um usuário está na página de login
Quando ele insere credenciais válidas
Então ele deve ser redirecionado para o dashboard`}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className={leveTaskModalGhostBtnClass}>
          Cancelar
        </button>
        <button type="submit" className={leveTaskModalPrimaryBtnClass}>
          Salvar Cenário
        </button>
      </div>
    </form>
  );
};

export const BddScenarioItem: React.FC<{
  scenario: BddScenario;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ scenario, onEdit, onDelete }) => {
  return (
    <div
      className={cn(
        taskDetailsModalSectionClass,
        'flex flex-col overflow-visible border-l-4 border-l-primary'
      )}
    >
      <div
        className={cn(
          leveTaskModalSectionHeaderClass,
          'justify-between border-l-0 px-4 py-3 sm:px-5 sm:py-4'
        )}
      >
        <h3 className={cn('min-w-0 flex-1 pr-2 font-semibold', leveTaskModalStrongClass)}>
          {scenario.title}
        </h3>
        <div className={taskDetailsModalActionToolbarClass}>
          <button
            type="button"
            onClick={onEdit}
            className={cn(taskDetailsModalIconBtnClass, 'h-8 w-8 min-h-8 min-w-8')}
            aria-label="Editar cenário BDD"
          >
            <EditIcon />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className={cn(
              taskDetailsModalIconBtnClass,
              'h-8 w-8 min-h-8 min-w-8 hover:text-[color-mix(in_srgb,oklch(var(--er))_90%,transparent)]'
            )}
            aria-label="Excluir cenário BDD"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
      <div
        className={cn(
          taskDetailsModalInsetPanelClass,
          'mx-3 mb-3 whitespace-pre-wrap font-mono text-sm leading-relaxed sm:mx-4 sm:mb-4',
          leveTaskModalMutedClass
        )}
      >
        <GherkinContent text={scenario.gherkin} />
      </div>
    </div>
  );
};
