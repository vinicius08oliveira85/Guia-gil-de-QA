import React from 'react';
import { BugSeverity, GeneralIAAnalysis } from '../../types';
import { ContextualHelp } from '../common/ContextualHelp';
import { cn } from '../../utils/cn';
import { outlineActionBtn, projectViewCard } from '../common/viewUi';

interface QualityMetricsCardProps {
  versionLabel: string;
  passRate: number;
  openVsClosedBugs: { open: number; closed: number };
  bugsBySeverity: Record<BugSeverity, number>;
  qualityByModule: { module: string; quality: number }[];
  generalAnalysis?: GeneralIAAnalysis;
  analysisOutdated: boolean;
  onOpenDetailedAnalysis: () => void;
}

const severityOrder: BugSeverity[] = ['Crítico', 'Alto', 'Médio', 'Baixo'];
type RiskLevel = 'Baixo' | 'Médio' | 'Alto' | 'Crítico';

const riskBadgeStyle: Record<RiskLevel, string> = {
  Baixo: 'badge-success',
  Médio: 'badge-warning',
  Alto: 'badge-error',
  Crítico: 'badge-error badge-outline',
};

const getRiskBadgeClassName = (risk: RiskLevel) => `badge badge-sm ${riskBadgeStyle[risk]}`;

export const QualityMetricsCard: React.FC<QualityMetricsCardProps> = ({
  versionLabel,
  passRate,
  openVsClosedBugs,
  bugsBySeverity,
  qualityByModule,
  generalAnalysis,
  analysisOutdated,
  onOpenDetailedAnalysis,
}) => {
  const totalBugs = severityOrder.reduce(
    (acc, severity) => acc + (bugsBySeverity[severity] || 0),
    0
  );
  const riskLevel = generalAnalysis?.riskCalculation?.overallRisk;

  return (
    <section className={cn('min-w-0 space-y-5', projectViewCard)}>
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-base-content/60">
            Bloco 5
          </p>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-semibold text-base-content">Métricas de Qualidade</h3>
            <ContextualHelp
              title="Métricas de Qualidade"
              content="As métricas de qualidade incluem taxa de aprovação de testes, bugs abertos por severidade e análise de risco. Use a análise IA para obter recomendações personalizadas baseadas no estado atual do projeto."
              variant="tooltip"
            />
          </div>
          <p className="mt-1 break-words text-sm text-base-content/70">
            Indicadores de estabilidade para {versionLabel}.
          </p>
        </div>
        <button type="button" className={outlineActionBtn} onClick={onOpenDetailedAnalysis}>
          Ver análise IA
        </button>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="min-w-0 rounded-2xl border border-base-300 bg-base-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/60">
            Pass rate
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-700">{passRate}%</p>
          <p className="mt-1 break-words text-xs text-base-content/70">
            Casos aprovados / executados
          </p>
        </div>
        <div
          className={`min-w-0 rounded-2xl border p-4 ${analysisOutdated ? 'border-amber-200 bg-amber-50' : 'border-base-300 bg-base-200'}`}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/60">
            Bugs Abertos
          </p>
          <p className="mt-2 text-2xl font-semibold text-amber-700">{openVsClosedBugs.open}</p>
          <p className="mt-1 break-words text-xs text-base-content/70">
            {openVsClosedBugs.open} abertos • {openVsClosedBugs.closed} fechados
          </p>
        </div>
        <div className="min-w-0 rounded-2xl border border-base-300 bg-base-200 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-base-content/60">
            Risco geral
          </p>
          {riskLevel ? (
            <span className={`${getRiskBadgeClassName(riskLevel as RiskLevel)} mt-2`}>
              Risco {riskLevel}
            </span>
          ) : (
            <p className="mt-2 text-2xl font-semibold text-base-content/50">—</p>
          )}
          <p className="mt-1 break-words text-xs text-base-content/70">
            {analysisOutdated
              ? 'Execute a IA para atualizar o status.'
              : 'Dados alinhados com a última análise IA.'}
          </p>
        </div>
      </div>

      <div className="min-w-0 rounded-2xl border border-base-300 bg-base-200 p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-base-content/60">
          Bugs por severidade
        </p>
        {totalBugs === 0 ? (
          <p className="break-words text-sm text-base-content/70">
            Nenhum bug registrado nesta versão.
          </p>
        ) : (
          <ul className="space-y-2 break-words text-sm leading-relaxed text-base-content">
            {severityOrder.map(severity => {
              const amount = bugsBySeverity[severity] || 0;
              const percentage = totalBugs > 0 ? Math.round((amount / totalBugs) * 100) : 0;
              return (
                <li key={severity} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span>{severity}</span>
                    <span className="text-base-content/70">
                      {amount} • {percentage}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-base-300">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-300 to-red-400"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="min-w-0 rounded-2xl border border-base-300 bg-base-200 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-base-content/60">
          Qualidade por módulo
        </p>
        <div className="space-y-3 break-words text-sm leading-relaxed text-base-content">
          {qualityByModule.slice(0, 4).map(module => (
            <div key={module.module}>
              <div className="flex items-center justify-between">
                <span>{module.module}</span>
                <span className="text-base-content/70">{module.quality}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-base-300">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-green-500"
                  style={{ width: `${module.quality}%` }}
                />
              </div>
            </div>
          ))}
          {qualityByModule.length === 0 && (
            <p className="break-words text-sm text-base-content/70">
              Adicione épicos para visualizar a qualidade por domínio.
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
