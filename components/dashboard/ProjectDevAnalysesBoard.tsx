import React, { useMemo, useState } from 'react';
import type { ProjectDevFullAnalysis } from '../../types';
import { Modal } from '../common/Modal';
import { Sparkles, Copy } from 'lucide-react';
import { cn } from '../../utils/cn';
import { dashboardPanelClass } from './dashboardNeuUi';
import toast from 'react-hot-toast';

interface ProjectDevAnalysesBoardProps {
  analyses: ProjectDevFullAnalysis[];
  onGenerateAnalysis?: () => void | Promise<void>;
  isGenerating?: boolean;
}

export const ProjectDevAnalysesBoard: React.FC<ProjectDevAnalysesBoardProps> = ({
  analyses,
  onGenerateAnalysis,
  isGenerating = false,
}) => {
  const [selected, setSelected] = useState<ProjectDevFullAnalysis | null>(null);

  const sorted = useMemo(
    () =>
      [...analyses].sort(
        (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
      ),
    [analyses]
  );

  return (
    <section className="space-y-4" aria-labelledby="dev-analyses-heading">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="dev-analyses-heading" className="text-lg font-bold text-base-content">
          Análises IA (Dev)
        </h2>
        {onGenerateAnalysis ? (
          <button
            type="button"
            onClick={() => void onGenerateAnalysis()}
            disabled={isGenerating}
            className="btn btn-primary btn-sm gap-1.5"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {isGenerating ? 'Gerando…' : 'Gerar análise do projeto'}
          </button>
        ) : null}
      </div>

      {sorted.length === 0 ? (
        <div className={cn(dashboardPanelClass, 'text-center text-sm text-base-content/70')}>
          Nenhuma análise Dev ainda. Gere um resumo alinhado à stack, backlog técnico e riscos.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sorted.map((a, index) => (
            <button
              key={`${a.generatedAt}-${index}`}
              type="button"
              onClick={() => setSelected(a)}
              className={cn(
                dashboardPanelClass,
                'text-left transition-shadow hover:shadow-md'
              )}
            >
              <p className="text-xs text-base-content/55">
                {new Date(a.generatedAt).toLocaleString('pt-BR')}
              </p>
              <p className="mt-1 line-clamp-3 text-sm text-base-content/85">{a.summary}</p>
            </button>
          ))}
        </div>
      )}

      <Modal
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        title="Análise Dev do projeto"
        size="2xl"
      >
        {selected ? (
          <div className="space-y-4 text-sm">
            {[
              ['Resumo', selected.summary],
              ['Alinhamento da stack', selected.stackAlignment],
              ['Backlog de implementação', selected.implementationBacklog],
              ['Arquitetura', selected.architectureNotes],
            ].map(([title, body]) => (
              <section key={title}>
                <h3 className="font-semibold text-base-content">{title}</h3>
                <p className="mt-1 whitespace-pre-wrap text-base-content/85">{body}</p>
              </section>
            ))}
            {(
              [
                ['Pontos fortes', selected.strengths],
                ['Pontos fracos', selected.weaknesses],
                ['Riscos', selected.risks],
                ['Recomendações', selected.recommendations],
              ] as Array<[string, string[]]>
            ).map(([title, items]) =>
              items.length ? (
                <section key={title}>
                  <h3 className="font-semibold text-base-content">{title}</h3>
                  <ul className="mt-1 list-disc pl-5">
                    {items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </section>
              ) : null
            )}
            <button
              type="button"
              className="btn btn-ghost btn-sm gap-1"
              onClick={() => {
                void navigator.clipboard.writeText(selected.summary);
                toast.success('Resumo copiado.');
              }}
            >
              <Copy className="h-4 w-4" aria-hidden />
              Copiar resumo
            </button>
          </div>
        ) : null}
      </Modal>
    </section>
  );
};

ProjectDevAnalysesBoard.displayName = 'ProjectDevAnalysesBoard';
