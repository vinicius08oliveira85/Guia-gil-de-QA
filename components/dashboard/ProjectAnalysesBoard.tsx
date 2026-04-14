import React, { useMemo, useState } from 'react';
import { ProjectFullAnalysis } from '../../types';
import { Modal } from '../common/Modal';
import { Sparkles, Printer, Copy } from 'lucide-react';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const SUMMARY_SNIPPET_LENGTH = 120;

interface ProjectAnalysesBoardProps {
  analyses: ProjectFullAnalysis[];
  onGenerateAnalysis?: () => void | Promise<void>;
  isGenerating?: boolean;
  /** Estratégia Shift Left + Pirâmide (sem análise completa do projeto). */
  onGenerateStrategyWithGemini?: () => void | Promise<void>;
  isGeneratingStrategy?: boolean;
}

/** Retorna classe de borda/ênfase por “sentimento” da análise (riscos vs pontos fortes). */
function getSentimentBorderClass(a: ProjectFullAnalysis): string {
  const risksCount = a.risks?.length ?? 0;
  const strengthsCount = a.strengths?.length ?? 0;
  if (risksCount > strengthsCount && risksCount > 0) return 'border-l-4 border-l-error';
  if (strengthsCount > risksCount && strengthsCount > 0) return 'border-l-4 border-l-success';
  return '';
}

export const ProjectAnalysesBoard: React.FC<ProjectAnalysesBoardProps> = ({
  analyses,
  onGenerateAnalysis,
  isGenerating = false,
  onGenerateStrategyWithGemini,
  isGeneratingStrategy = false,
}) => {
  const [selectedAnalysis, setSelectedAnalysis] = useState<ProjectFullAnalysis | null>(null);

  const sortedAnalyses = useMemo(
    () => [...analyses].sort((x, y) => new Date(y.generatedAt).getTime() - new Date(x.generatedAt).getTime()),
    [analyses]
  );

  const snippet = (text: string) =>
    text.length <= SUMMARY_SNIPPET_LENGTH ? text : `${text.slice(0, SUMMARY_SNIPPET_LENGTH)}…`;

  return (
    <section className="space-y-4" aria-labelledby="analyses-board-heading">
      <h2 id="analyses-board-heading" className="text-lg font-bold text-base-content">
        Análises IA do projeto
      </h2>

      {analyses.length === 0 ? (
        <div className="bg-base-100 rounded-xl border border-base-300 p-6 text-center space-y-4">
          <p className="text-base-content/70 text-sm">
            Nenhuma análise completa do projeto ainda. Você pode gerar a análise ampla (documentos, tarefas, testes e
            indicadores) ou começar só pela estratégia de QA com Gemini (Shift Left + pirâmide de testes).
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2">
            {onGenerateStrategyWithGemini && (
              <button
                type="button"
                onClick={onGenerateStrategyWithGemini}
                disabled={isGeneratingStrategy || isGenerating}
                className="rounded-full px-4 py-2 text-sm font-semibold text-secondary-content bg-secondary hover:bg-secondary/90 border border-secondary/30 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                {isGeneratingStrategy ? 'Gerando estratégia…' : 'Gerar estratégia com Gemini'}
              </button>
            )}
            {onGenerateAnalysis && (
              <button
                type="button"
                onClick={onGenerateAnalysis}
                disabled={isGenerating || isGeneratingStrategy}
                className="rounded-full px-4 py-2 text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" aria-hidden="true" />
                {isGenerating ? 'Gerando…' : 'Gerar análise completa'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedAnalyses.map((a, index) => {
            const isMostRecent = index === 0;
            const risksCount = a.risks?.length ?? 0;
            const recsCount = a.recommendations?.length ?? 0;
            return (
              <div
                key={a.generatedAt + index}
                className={cn(
                  'bg-base-100 rounded-xl border border-base-300 shadow-sm p-4 flex flex-col hover:border-primary/30 transition-colors',
                  getSentimentBorderClass(a)
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <p className="text-xs text-base-content/60">
                    {new Date(a.generatedAt).toLocaleString('pt-BR')}
                  </p>
                  {isMostRecent && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                      Mais recente
                    </span>
                  )}
                </div>
                <p className="text-sm text-base-content flex-1 line-clamp-3 mb-2">
                  {snippet(a.summary)}
                </p>
                <p className="text-xs text-base-content/50 mb-4">
                  {risksCount > 0 || recsCount > 0
                    ? `${risksCount} risco${risksCount !== 1 ? 's' : ''}, ${recsCount} recomendaç${recsCount !== 1 ? 'ões' : 'ão'}`
                    : '—'}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedAnalysis(a)}
                  className="text-sm font-medium text-primary hover:underline text-left"
                >
                  Ver análise
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={selectedAnalysis !== null}
        onClose={() => setSelectedAnalysis(null)}
        title="Análise IA - Projeto completo"
        size="xl"
        maxHeight="85vh"
        footer={
          selectedAnalysis ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(selectedAnalysis.summary).then(
                    () => toast.success('Resumo copiado para a área de transferência.'),
                    () => toast.error('Falha ao copiar.')
                  );
                }}
                className="btn btn-sm btn-ghost gap-1.5"
              >
                <Copy className="w-4 h-4" aria-hidden="true" />
                Copiar resumo
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="btn btn-sm btn-ghost gap-1.5"
              >
                <Printer className="w-4 h-4" aria-hidden="true" />
                Imprimir
              </button>
            </div>
          ) : null
        }
      >
        {selectedAnalysis && (
          <div id="analysis-modal-content" className="space-y-6 overflow-y-auto scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent hover:scrollbar-thumb-primary/50 transition-colors pr-2">
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
