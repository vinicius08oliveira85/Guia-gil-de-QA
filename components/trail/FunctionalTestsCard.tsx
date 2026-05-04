import React, { useMemo } from 'react';
import { JiraTask } from '../../types';

interface FunctionalTestsCardProps {
  versionLabel: string;
  tasks: JiraTask[];
  totalTestCases: number;
  executedTestCases: number;
  passedTestCases: number;
}

const formatPercent = (value: number) => `${Math.round(value)}%`;

export const FunctionalTestsCard: React.FC<FunctionalTestsCardProps> = ({
  versionLabel,
  tasks,
  totalTestCases,
  executedTestCases,
  passedTestCases,
}) => {
  const failedTestCases = Math.max(executedTestCases - passedTestCases, 0);
  const notRunTestCases = Math.max(totalTestCases - executedTestCases, 0);

  const executionRate = totalTestCases > 0 ? (executedTestCases / totalTestCases) * 100 : 0;
  const passRate = executedTestCases > 0 ? (passedTestCases / executedTestCases) * 100 : 0;

  const tasksWithoutTests = useMemo(() => {
    return tasks
      .filter(task => task.type !== 'Bug' && (!task.testCases || task.testCases.length === 0))
      .slice(0, 3);
  }, [tasks]);

  const tasksWithFailures = useMemo(() => {
    return tasks
      .filter(task => (task.testCases || []).some(test => test.status === 'Failed'))
      .slice(0, 3);
  }, [tasks]);

  return (
    <section className="min-w-0 space-y-5 rounded-[var(--rounded-box)] border border-base-300 bg-base-100 p-5 shadow-sm sm:p-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-base-content/60">
          Bloco 3
        </p>
        <h3 className="text-xl font-semibold text-base-content">Testes Funcionais</h3>
        <p className="mt-1 break-words text-sm text-base-content/70">
          Execução e qualidade dos testes funcionais para {versionLabel}.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 min-w-0">
        <div className="rounded-2xl border border-base-300 bg-base-200 p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/60">
            Casos totais
          </p>
          <p className="mt-2 text-2xl font-semibold text-base-content">{totalTestCases}</p>
        </div>
        <div className="rounded-2xl border border-base-300 bg-base-200 p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/60">
            Executados
          </p>
          <p className="mt-2 text-2xl font-semibold text-primary">{executedTestCases}</p>
          <p className="mt-1 break-words text-xs text-base-content/70">
            {formatPercent(executionRate)} executados
          </p>
        </div>
        <div className="rounded-2xl border border-base-300 bg-base-200 p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/60">
            Falhas
          </p>
          <p className="mt-2 text-2xl font-semibold text-amber-700">{failedTestCases}</p>
          <p className="mt-1 break-words text-xs text-base-content/70">
            {failedTestCases > 0
              ? `${Math.round((failedTestCases / Math.max(executedTestCases, 1)) * 100)}% dos executados`
              : 'Tudo passando'}
          </p>
        </div>
        <div className="rounded-2xl border border-base-300 bg-base-200 p-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/60">
            Pendentes
          </p>
          <p className="mt-2 text-2xl font-semibold text-base-content">{notRunTestCases}</p>
          <p className="mt-1 break-words text-xs text-base-content/70">
            {notRunTestCases > 0 ? 'Ainda não executados' : 'Execução completa'}
          </p>
        </div>
      </div>

      <div className="min-w-0 rounded-2xl border border-base-300 bg-base-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-base-content/60">
          Taxa de aprovação
        </p>
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm text-base-content/70">
            <span>Progresso</span>
            <span>{formatPercent(executionRate)}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-base-300">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-emerald-400"
              style={{ width: `${executionRate}%` }}
            />
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-base-content/70">
            <span>Aprovação</span>
            <span>{formatPercent(passRate)}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-base-300">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500"
              style={{ width: `${passRate}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-base-300 bg-base-200 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-base-content/60">
            Cobertura pendente
          </p>
          {tasksWithoutTests.length === 0 ? (
            <p className="break-words text-sm text-base-content/70">
              Todas as histórias possuem casos de teste.
            </p>
          ) : (
            <ul className="space-y-2 break-words text-sm leading-relaxed text-base-content">
              {tasksWithoutTests.map(task => (
                <li key={task.id} className="flex items-start gap-2 break-words">
                  <span>•</span>
                  <span>{task.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="min-w-0 rounded-2xl border border-base-300 bg-base-200 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-base-content/60">
            Falhas em atenção
          </p>
          {tasksWithFailures.length === 0 ? (
            <p className="break-words text-sm text-base-content/70">
              Nenhuma falha registrada nos testes executados.
            </p>
          ) : (
            <ul className="space-y-2 break-words text-sm leading-relaxed text-base-content">
              {tasksWithFailures.map(task => (
                <li key={task.id} className="flex items-start gap-2 break-words">
                  <span>⚠️</span>
                  <span>{task.title}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};
