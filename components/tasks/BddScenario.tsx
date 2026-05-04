import React, { useState } from 'react';
import { BddScenario } from '../../types';
import { EditIcon, TrashIcon } from '../common/Icons';
import { useErrorHandler } from '../../hooks/useErrorHandler';

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
  feature: 'text-primary font-semibold',
  scenario: 'text-primary font-semibold',
  given: 'text-blue-600 dark:text-blue-400 font-semibold',
  when: 'text-brand-orange font-semibold',
  then: 'text-green-600 dark:text-green-400 font-semibold',
  and: 'text-base-content/70 font-semibold',
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
      className="space-y-4 p-5 bg-base-100 rounded-lg my-2 border border-base-300 border-l-4 border-l-primary shadow-sm"
    >
      <div>
        <label className="label">
          <span className="label-text text-sm font-medium text-base-content/70">
            Título do Cenário
          </span>
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className="input input-bordered w-full bg-base-100 border-base-300 text-base-content focus:outline-none focus:border-primary"
          placeholder="Ex: Login com credenciais válidas"
        />
      </div>
      <div>
        <label className="label">
          <span className="label-text text-sm font-medium text-base-content/70">
            Cenário (Gherkin: Dado, Quando, Então)
          </span>
        </label>
        <textarea
          value={gherkin}
          onChange={e => setGherkin(e.target.value)}
          rows={5}
          required
          className="textarea textarea-bordered w-full bg-base-100 border-base-300 text-base-content font-mono text-sm focus:outline-none focus:border-primary"
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
    <div className="bg-base-100 border border-base-300 border-l-4 border-l-primary rounded-lg shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md">
      <div className="px-5 py-4 flex justify-between items-center border-b border-base-200">
        <h3 className="font-semibold text-base-content flex-1 pr-2 min-w-0">{scenario.title}</h3>
        <div className="flex gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={onEdit}
            className="p-2 text-base-content/60 hover:text-primary transition-colors rounded-lg"
            aria-label="Editar cenário BDD"
          >
            <EditIcon />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-2 text-base-content/60 hover:text-error transition-colors rounded-lg"
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
