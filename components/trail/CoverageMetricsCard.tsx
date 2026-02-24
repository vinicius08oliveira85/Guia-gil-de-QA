import React from 'react';
import { ContextualHelp } from '../common/ContextualHelp';

interface CoverageMetricsCardProps {
  versionLabel: string;
  testCoverage: number;
  automationRatio: number;
  tasksWithTestCases: number;
  totalTasks: number;
  totalTestCases: number;
  automatedTestCases: number;
}

export const CoverageMetricsCard: React.FC<CoverageMetricsCardProps> = ({
  versionLabel,
  testCoverage,
  automationRatio,
  tasksWithTestCases,
  totalTasks,
  totalTestCases,
  automatedTestCases,
}) => {
  const documentedPercentage =
    totalTasks > 0 ? Math.round((tasksWithTestCases / totalTasks) * 100) : 0;
  const automationInfo = totalTestCases > 0 ? `${automatedTestCases}/${totalTestCases}` : '0/0';

  return (
    <section className="min-w-0 space-y-5 rounded-[var(--rounded-box)] border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
      <header>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-base-content/60">
              Bloco 4
            </p>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-base-content">Métricas de Cobertura</h3>
              <ContextualHelp
                title="Métricas de Cobertura"
                content="A cobertura de testes indica quantas tarefas têm casos de teste documentados. Uma cobertura acima de 70% é recomendada para projetos em produção. A automação reduz o tempo de execução de testes de regressão."
                variant="tooltip"
              />
            </div>
            <p className="mt-1 break-words text-sm text-base-content/70">
              Visão de documentação e automação para {versionLabel}.
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm text-base-content/70">
            <span>Stories com testes</span>
            <span>{documentedPercentage}%</span>
          </div>
          <div className="mt-2 h-3 rounded-full bg-base-300">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-400 to-accent"
              style={{ width: `${documentedPercentage}%` }}
            />
          </div>
          <p className="mt-1 break-words text-xs text-base-content/70">
            {tasksWithTestCases}/{totalTasks || 0} histórias documentadas
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm text-base-content/70">
            <span>Automação disponível</span>
            <span>{automationRatio}%</span>
          </div>
          <div className="mt-2 h-3 rounded-full bg-base-300">
            <div
              className="h-full rounded-full bg-gradient-to-r from-purple-400 to-fuchsia-500"
              style={{ width: `${automationRatio}%` }}
            />
          </div>
          <p className="mt-1 break-words text-xs text-base-content/70">
            {automationInfo} casos automatizados
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm text-base-content/70">
            <span>Cobertura planejada</span>
            <span>{testCoverage}%</span>
          </div>
          <div className="mt-2 h-3 rounded-full bg-base-300">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500"
              style={{ width: `${testCoverage}%` }}
            />
          </div>
          <p className="mt-1 break-words text-xs text-base-content/70">
            Representa tarefas com casos de teste vinculados.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-base-300 bg-base-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-base-content/60">
            Quando investigar
          </p>
          <ul className="mt-2 space-y-1 break-words text-sm leading-relaxed text-base-content">
            <li>• Cobertura &lt; 70% indica riscos funcionais.</li>
            <li>• Automação &lt; 30% aumenta tempo de regressão.</li>
          </ul>
        </div>
        <div className="min-w-0 rounded-2xl border border-base-300 bg-base-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-base-content/60">
            Próximas ações
          </p>
          <ul className="mt-2 space-y-1 break-words text-sm leading-relaxed text-base-content">
            <li>• Priorizar histórias sem casos documentados.</li>
            <li>• Mapear candidatos à automação no backlog.</li>
          </ul>
        </div>
      </div>
    </section>
  );
};
