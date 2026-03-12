import React, { useState } from 'react';
import { ProjectFullAnalysis } from '../../types';
import { Modal } from '../common/Modal';
import { Sparkles } from 'lucide-react';

const SUMMARY_SNIPPET_LENGTH = 120;

interface ProjectAnalysesBoardProps {
  analyses: ProjectFullAnalysis[];
  onGenerateAnalysis?: () => void | Promise<void>;
  isGenerating?: boolean;
}

export const ProjectAnalysesBoard: React.FC<ProjectAnalysesBoardProps> = ({
  analyses,
  onGenerateAnalysis,
  isGenerating = false,
}) => {
  const [selectedAnalysis, setSelectedAnalysis] = useState<ProjectFullAnalysis | null>(null);

  const snippet = (text: string) =>
    text.length <= SUMMARY_SNIPPET_LENGTH ? text : `${text.slice(0, SUMMARY_SNIPPET_LENGTH)}…`;

  return (
    <section className="space-y-4" aria-labelledby="analyses-board-heading">
      <h2 id="analyses-board-heading" className="text-lg font-bold text-base-content">
        Análises IA do projeto
      </h2>

      {analyses.length === 0 ? (
        <div className="bg-base-100 rounded-xl border border-base-300 p-6 text-center">
          <p className="text-base-content/70 text-sm mb-4">
            Nenhuma análise gerada ainda. Gere uma análise completa (documentos, tarefas, testes e indicadores) pelo botão no topo do dashboard.
          </p>
          {onGenerateAnalysis && (
            <button
              type="button"
              onClick={onGenerateAnalysis}
              disabled={isGenerating}
              className="rounded-full px-4 py-2 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-colors flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              {isGenerating ? 'Gerando…' : 'Gerar primeira análise'}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {analyses.map((a, index) => (
            <div
              key={a.generatedAt + index}
              className="bg-base-100 rounded-xl border border-base-300 shadow-sm p-4 flex flex-col hover:border-primary/30 transition-colors"
            >
              <p className="text-xs text-base-content/60 mb-2">
                {new Date(a.generatedAt).toLocaleString('pt-BR')}
              </p>
              <p className="text-sm text-base-content flex-1 line-clamp-3 mb-4">
                {snippet(a.summary)}
              </p>
              <button
                type="button"
                onClick={() => setSelectedAnalysis(a)}
                className="text-sm font-medium text-primary hover:underline text-left"
              >
                Ver análise
              </button>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={selectedAnalysis !== null}
        onClose={() => setSelectedAnalysis(null)}
        title="Análise IA - Projeto completo"
        size="xl"
        maxHeight="85vh"
      >
        {selectedAnalysis && (
          <div className="space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent hover:scrollbar-thumb-primary/50 transition-colors pr-2">
            <p className="text-xs text-base-content/60">
              Gerada em: {new Date(selectedAnalysis.generatedAt).toLocaleString('pt-BR')}
            </p>

            <section>
              <h3 className="text-lg font-semibold text-base-content mb-2">Resumo executivo</h3>
              <p className="text-sm text-base-content leading-relaxed whitespace-pre-wrap">
                {selectedAnalysis.summary}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-base-content mb-2">Documentos</h3>
              <p className="text-sm text-base-content leading-relaxed whitespace-pre-wrap">
                {selectedAnalysis.documentsAnalysis}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-base-content mb-2">Tarefas</h3>
              <p className="text-sm text-base-content leading-relaxed whitespace-pre-wrap">
                {selectedAnalysis.tasksAnalysis}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-base-content mb-2">Testes</h3>
              <p className="text-sm text-base-content leading-relaxed whitespace-pre-wrap">
                {selectedAnalysis.testsAnalysis}
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold text-base-content mb-2">Indicadores e fases</h3>
              <p className="text-sm text-base-content leading-relaxed whitespace-pre-wrap">
                {selectedAnalysis.indicatorsAndPhases}
              </p>
            </section>

            {selectedAnalysis.strengths.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-success mb-2">Pontos fortes</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-base-content">
                  {selectedAnalysis.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </section>
            )}

            {selectedAnalysis.weaknesses.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-warning-dark mb-2">Pontos fracos</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-base-content">
                  {selectedAnalysis.weaknesses.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </section>
            )}

            {selectedAnalysis.risks.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-error mb-2">Riscos</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-base-content">
                  {selectedAnalysis.risks.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </section>
            )}

            {selectedAnalysis.recommendations.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-primary mb-2">Recomendações</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-base-content">
                  {selectedAnalysis.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </Modal>
    </section>
  );
};

ProjectAnalysesBoard.displayName = 'ProjectAnalysesBoard';
