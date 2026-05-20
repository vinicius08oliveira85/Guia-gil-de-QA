import React, { useState } from 'react';
import { BddScenario } from '../../types';
import { EditIcon, TrashIcon } from '../common/Icons';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { cn } from '../../utils/cn';
import {
  taskCardFieldLabelClass,
  taskModalSectionClass,
  taskTextStrongClass,
} from './taskActionLayout';

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
  { pattern: /(?:^|\s)E\s/gm, type: 'and' as const }, // " E " ou início de linha + "E "
];

const KEYWORD_CLASS: Record<string, string> = {
  feature: 'font-semibold text-[var(--color-primary-deep)]',
  scenario: 'font-semibold text-[var(--color-primary-deep)]',
  given: 'font-semibold text-[var(--color-primary-deep)]',
  when: 'font-semibold text-[var(--brand-cta)]',
  then: 'font-semibold text-[color-mix(in_srgb,oklch(var(--su))_88%,var(--brand-text-strong))]',
  and: 'font-semibold text-[var(--brand-text-muted)]',
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
        taskModalSectionClass,
        'my-2 space-y-4 border-l-4 border-l-[var(--color-primary)] p-5 shadow-sm'
      )}
    >
      <div>
        <label className="label">
          <span className={cn('label-text text-sm font-medium', taskCardFieldLabelClass)}>
            Título do Cenário
          </span>
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className="input input-bordered w-full border-[var(--brand-surface-border)] bg-[var(--brand-surface-strong)] text-[var(--brand-text-strong)] focus:border-[var(--color-primary)] focus:outline-none"
          placeholder="Ex: Login com credenciais válidas"
        />
      </div>
      <div>
        <label className="label">
          <span className={cn('label-text text-sm font-medium', taskCardFieldLabelClass)}>
            Cenário (Gherkin: Dado, Quando, Então)
          </span>
        </label>
        <textarea
          value={gherkin}
          onChange={e => setGherkin(e.target.value)}
          rows={5}
          required
          className="textarea textarea-bordered w-full border-[var(--brand-surface-border)] bg-[var(--brand-surface-strong)] font-mono text-sm text-[var(--brand-text-strong)] focus:border-[var(--color-primary)] focus:outline-none"
          placeholder={`Dado que um usuário está na página de login
Quando ele insere credenciais válidas
Então ele deve ser redirecionado para o dashboard`}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="btn btn-ghost btn-sm">
          Cancelar
        </button>
        <button type="submit" className="btn btn-primary btn-sm">
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
        taskModalSectionClass,
        'flex flex-col overflow-hidden border-l-4 border-l-[var(--color-primary)] shadow-sm transition-all hover:shadow-md'
      )}
    >
      <div className="flex items-center justify-between border-b border-[var(--brand-surface-border)] px-5 py-4">
        <h3 className={cn('flex-1 min-w-0 pr-2 font-semibold', taskTextStrongClass)}>
          {scenario.title}
        </h3>
        <div className="flex gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-[var(--radius)] p-2 text-[var(--brand-text-muted)] transition-colors hover:text-[var(--color-primary-deep)]"
            aria-label="Editar cenário BDD"
          >
            <EditIcon />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-[var(--radius)] p-2 text-[var(--brand-text-muted)] transition-colors hover:text-[color-mix(in_srgb,oklch(var(--er))_90%,transparent)]"
            aria-label="Excluir cenário BDD"
          >
            <TrashIcon />
          </button>
        </div>
      </div>
      <div className="p-5 bg-base-200/50 font-mono text-sm leading-relaxed whitespace-pre-wrap text-base-content">
        <GherkinContent text={scenario.gherkin} />
      </div>
    </div>
  );
};
