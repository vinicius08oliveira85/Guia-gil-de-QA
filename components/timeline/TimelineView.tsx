import React, { useState } from 'react';
import { Project, PhaseName } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { Badge } from '../common/Badge';
import { ProgressIndicator } from '../common/ProgressIndicator';
import { Modal } from '../common/Modal';
import { Tooltip } from '../common/Tooltip';
import { timelineData } from '../../utils/projectPhases';
import {
  compactMetricTile,
  filterPillClass,
  pageSubtitleClass,
  pageTitleClass,
  projectViewCard,
  projectViewPanel,
  projectViewShell,
} from '../common/viewUi';
import { cn } from '../../utils/cn';
import {
  timelineBorderClass,
  timelineDividerClass,
  timelineHoverClass,
  timelineInsetClass,
  timelineTrackClass,
} from './timelineNeuUi';

interface TimelinePhase {
  phase: PhaseName;
  duration: string;
  dependencies: string;
  exitCriteria: string;
  milestone: string;
  checklist: Array<{ label: string; check: (metrics: any) => boolean; description?: string }>;
  qaActivities?: string[];
  deliverables?: string[];
  risks?: string[];
}

const Checkbox: React.FC<{ checked: boolean; description?: string }> = ({
  checked,
  description,
}) => (
  <Tooltip content={description || ''}>
    <div
      className={cn(
        'flex h-5 w-5 flex-shrink-0 cursor-help items-center justify-center rounded border-2 transition-all',
        checked ? 'border-success bg-success' : timelineBorderClass
      )}
    >
      {checked && (
        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 14 11">
          <path
            d="M1 5.25L5.028 9L13 1"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  </Tooltip>
);

export const TimelineView: React.FC<{ project: Project; currentPhaseName: PhaseName | 'N/A' }> = ({
  project,
  currentPhaseName,
}) => {
  const metrics = useProjectMetrics(project);
  const metricsWithProject = { ...metrics, project };
  const [selectedPhase, setSelectedPhase] = useState<TimelinePhase | null>(null);
  const [expandedPhases, setExpandedPhases] = useState<Set<PhaseName>>(new Set());
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('timeline');

  const togglePhase = (phase: PhaseName) => {
    setExpandedPhases(prev => {
      const newSet = new Set(prev);
      if (newSet.has(phase)) {
        newSet.delete(phase);
      } else {
        newSet.add(phase);
      }
      return newSet;
    });
  };

  const getPhaseProgress = (phase: TimelinePhase): number => {
    const checked = phase.checklist.filter(item => item.check(metricsWithProject)).length;
    return phase.checklist.length > 0 ? (checked / phase.checklist.length) * 100 : 0;
  };

  const getPhaseStatus = (phase: PhaseName): 'completed' | 'current' | 'upcoming' => {
    const phaseStatus = metrics.newPhases.find(p => p.name === phase)?.status;
    if (phaseStatus === 'Concluído') return 'completed';
    if (phaseStatus === 'Em Andamento') return 'current';
    return 'upcoming';
  };

  const completedPhases = metrics.newPhases.filter(p => p.status === 'Concluído').length;
  const totalPhases = timelineData.length;
  const overallProgress = (completedPhases / totalPhases) * 100;

  return (
    <div className={cn(projectViewShell, 'pb-2')}>
      <section className={projectViewPanel}>
        <header
          className={cn(
            'flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-start sm:justify-between',
            timelineDividerClass
          )}
        >
          <div className="min-w-0">
            <h2 className={pageTitleClass}>Timeline Completa do Projeto</h2>
            <p className={cn(pageSubtitleClass, 'mt-2')}>
              Cronograma detalhado do fluxo de trabalho de QA com dependências, marcos e
              entregáveis.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={filterPillClass(viewMode === 'timeline')}
            >
              Timeline
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={filterPillClass(viewMode === 'table')}
            >
              Tabela
            </button>
          </div>
        </header>

        {/* Progresso Geral */}
        <div className={cn(compactMetricTile, 'mb-6 mt-4')}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-base-content/70 font-semibold">Progresso Geral do Projeto</span>
            <span className="text-base-content font-bold">{Math.round(overallProgress)}%</span>
          </div>
          <ProgressIndicator value={completedPhases} max={totalPhases} color="green" size="lg" />
          <div className="flex items-center justify-between mt-2 text-sm text-base-content/70">
            <span>
              {completedPhases} de {totalPhases} fases concluídas
            </span>
            <span>Fase atual: {currentPhaseName}</span>
          </div>
        </div>

        {viewMode === 'timeline' ? (
          /* Visualização Timeline */
          <div className="relative">
            <div className={cn('absolute bottom-0 left-8 top-0 w-1', timelineTrackClass)}></div>

            <div className="space-y-8">
              {timelineData.map((phase, index) => {
                const status = getPhaseStatus(phase.phase);
                const progress = getPhaseProgress(phase);
                const isExpanded = expandedPhases.has(phase.phase);
                const isCurrent = phase.phase === currentPhaseName;

                const statusColors = {
                  completed: 'bg-green-500',
                  current: 'bg-blue-500 animate-pulse',
                  upcoming: 'bg-gray-500',
                };

                return (
                  <div key={phase.phase} className="relative flex items-start gap-6">
                    {/* Indicador de fase */}
                    <div
                      className={`relative z-10 w-16 h-16 rounded-full ${statusColors[status]} flex items-center justify-center text-white font-bold text-sm shadow-lg`}
                    >
                      {index + 1}
                    </div>

                    {/* Conteúdo da fase */}
                    <div className="flex-1 pb-8">
                      <div
                        className={cn(
                          projectViewCard,
                          'transition-all hover:shadow-md',
                          isCurrent &&
                            'border-[color-mix(in_srgb,var(--brand-cta)_45%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--brand-cta)_18%,transparent)]'
                        )}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-xl font-bold text-base-content">{phase.phase}</h4>
                              <Badge
                                variant={
                                  status === 'completed'
                                    ? 'success'
                                    : status === 'current'
                                      ? 'info'
                                      : 'default'
                                }
                              >
                                {status === 'completed'
                                  ? '✅ Concluída'
                                  : status === 'current'
                                    ? '🔄 Atual'
                                    : '⏳ Próxima'}
                              </Badge>
                              <span className="text-sm text-base-content/70">
                                ⏱️ {phase.duration}
                              </span>
                            </div>
                            <p className="text-base-content/70 mb-3">{phase.milestone}</p>

                            {/* Progresso da fase */}
                            <div className="mb-4">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-base-content/70">
                                  Progresso da fase
                                </span>
                                <span className="text-xs font-semibold text-base-content">
                                  {Math.round(progress)}%
                                </span>
                              </div>
                              <ProgressIndicator
                                value={
                                  phase.checklist.filter(item => item.check(metricsWithProject))
                                    .length
                                }
                                max={phase.checklist.length}
                                color="blue"
                                size="sm"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => togglePhase(phase.phase)}
                            className="text-accent hover:text-accent-light text-sm font-semibold ml-4"
                          >
                            {isExpanded ? 'Ocultar' : 'Expandir'} ↓
                          </button>
                        </div>

                        {/* Informações básicas */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h5 className="text-xs font-semibold text-base-content/70 mb-1">
                              Dependências
                            </h5>
                            <p className="text-sm text-base-content">{phase.dependencies}</p>
                          </div>
                          <div>
                            <h5 className="text-xs font-semibold text-base-content/70 mb-1">
                              Critério de Saída
                            </h5>
                            <p className="text-sm text-base-content">{phase.exitCriteria}</p>
                          </div>
                        </div>

                        {/* Checklist */}
                        <div className="mb-4">
                          <h5 className="text-sm font-semibold text-base-content/70 mb-2">
                            ✅ Checklist
                          </h5>
                          <div className="space-y-2">
                            {phase.checklist.map((item, idx) => {
                              const checked = item.check(metricsWithProject);
                              return (
                                <div
                                  key={idx}
                                  className={cn(
                                    'flex items-start gap-2 rounded p-2',
                                    checked ? 'bg-success/10' : timelineInsetClass
                                  )}
                                >
                                  <Checkbox checked={checked} description={item.description} />
                                  <span
                                    className={`text-sm flex-1 ${checked ? 'text-success line-through' : 'text-base-content'}`}
                                  >
                                    {item.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Informações expandidas */}
                        {isExpanded && (
                          <div className={cn('mt-4 space-y-4 border-t pt-4', timelineDividerClass)}>
                            {phase.qaActivities && (
                              <div>
                                <h5 className="text-sm font-semibold text-base-content/70 mb-2">
                                  🧪 Atividades de QA
                                </h5>
                                <ul className="space-y-1">
                                  {phase.qaActivities.map((activity, idx) => (
                                    <li
                                      key={idx}
                                      className="flex items-start text-sm text-base-content"
                                    >
                                      <span className="mr-2 text-blue-400">•</span>
                                      <span>{activity}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {phase.deliverables && (
                              <div>
                                <h5 className="text-sm font-semibold text-base-content/70 mb-2">
                                  📦 Entregas
                                </h5>
                                <ul className="space-y-1">
                                  {phase.deliverables.map((deliverable, idx) => (
                                    <li
                                      key={idx}
                                      className="flex items-start text-sm text-base-content"
                                    >
                                      <span className="mr-2 text-green-400">✓</span>
                                      <span>{deliverable}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {phase.risks && (
                              <div>
                                <h5 className="text-sm font-semibold text-base-content/70 mb-2">
                                  ⚠️ Riscos
                                </h5>
                                <ul className="space-y-1">
                                  {phase.risks.map((risk, idx) => (
                                    <li
                                      key={idx}
                                      className="flex items-start text-sm text-base-content"
                                    >
                                      <span className="mr-2 text-orange-400">⚠</span>
                                      <span>{risk}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        <button
                          onClick={() => setSelectedPhase(phase)}
                          className="mt-4 text-accent hover:text-accent-light text-sm font-semibold"
                        >
                          Ver Detalhes Completos →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Visualização Tabela */
          <div className="overflow-x-auto scrollbar-hide">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead className={cn('border-b-2 text-base-content/70', timelineDividerClass)}>
                <tr>
                  <th className="p-3 w-1/12">Fase</th>
                  <th className="p-3 w-1/12">Status</th>
                  <th className="p-3 w-1/12">Duração</th>
                  <th className="p-3 w-2/12">Dependências</th>
                  <th className="p-3 w-2/12">Critérios de Transição</th>
                  <th className="p-3 w-2/12">Marco</th>
                  <th className="p-3 w-3/12">Checklist</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-300">
                {timelineData.map(phase => {
                  const isCurrent = phase.phase === currentPhaseName;
                  const isDone = getPhaseStatus(phase.phase) === 'completed';

                  return (
                    <tr
                      key={phase.phase}
                      className={cn(
                        'cursor-pointer transition-colors',
                        isCurrent && 'bg-primary/10',
                        isDone && 'opacity-60',
                        timelineHoverClass
                      )}
                      onClick={() => setSelectedPhase(phase)}
                    >
                      <td
                        className={`p-3 font-semibold align-top ${isDone ? 'text-base-content/70' : 'text-primary'}`}
                      >
                        {phase.phase}
                      </td>
                      <td className="p-3 align-top">
                        <Badge
                          variant={isDone ? 'success' : isCurrent ? 'info' : 'default'}
                          size="sm"
                        >
                          {isDone ? '✅' : isCurrent ? '🔄' : '⏳'}
                        </Badge>
                      </td>
                      <td
                        className={`p-3 align-top ${isDone ? 'text-base-content/70' : 'text-base-content'}`}
                      >
                        {phase.duration}
                      </td>
                      <td
                        className={`p-3 align-top ${isDone ? 'text-base-content/70' : 'text-base-content'}`}
                      >
                        {phase.dependencies}
                      </td>
                      <td
                        className={`p-3 align-top ${isDone ? 'text-base-content/70' : 'text-base-content'}`}
                      >
                        {phase.exitCriteria}
                      </td>
                      <td
                        className={`p-3 align-top ${isDone ? 'text-base-content/70' : 'text-base-content'}`}
                      >
                        {phase.milestone}
                      </td>
                      <td className="p-3 align-top">
                        <div className="space-y-2">
                          {phase.checklist.map((item, idx) => {
                            const checked = item.check(metricsWithProject);
                            return (
                              <div key={idx} className="flex items-center gap-2">
                                <Checkbox checked={checked} description={item.description} />
                                <span
                                  className={`text-xs ${checked ? 'text-success line-through' : 'text-base-content'}`}
                                >
                                  {item.label}
                                </span>
                              </div>
                            );
                          })}
                          <div className="mt-2">
                            <ProgressIndicator
                              value={
                                phase.checklist.filter(item => item.check(metricsWithProject))
                                  .length
                              }
                              max={phase.checklist.length}
                              color="blue"
                              size="sm"
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modal de Detalhes */}
      {selectedPhase && (
        <Modal
          isOpen={!!selectedPhase}
          onClose={() => setSelectedPhase(null)}
          title={`Fase: ${selectedPhase.phase}`}
        >
          <div className="space-y-6">
            <div>
              <Badge
                variant={
                  getPhaseStatus(selectedPhase.phase) === 'completed'
                    ? 'success'
                    : getPhaseStatus(selectedPhase.phase) === 'current'
                      ? 'info'
                      : 'default'
                }
              >
                {getPhaseStatus(selectedPhase.phase) === 'completed'
                  ? '✅ Concluída'
                  : getPhaseStatus(selectedPhase.phase) === 'current'
                    ? '🔄 Atual'
                    : '⏳ Próxima'}
              </Badge>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-base-content/70 mb-2">Marco</h4>
              <p className="text-base-content">{selectedPhase.milestone}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-base-content/70 mb-2">Duração</h4>
              <p className="text-base-content">⏱️ {selectedPhase.duration}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-base-content/70 mb-2">Dependências</h4>
              <p className="text-base-content">{selectedPhase.dependencies}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-base-content/70 mb-2">Critério de Saída</h4>
              <p className="text-base-content">{selectedPhase.exitCriteria}</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-base-content/70 mb-3">✅ Checklist</h4>
              <div className="space-y-2">
                {selectedPhase.checklist.map((item, idx) => {
                  const checked = item.check(metricsWithProject);
                  return (
                    <div
                      key={idx}
                      className={cn(
                        'rounded-lg p-3',
                        checked
                          ? 'border border-success/30 bg-success/10'
                          : cn('border', timelineInsetClass, timelineBorderClass)
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <Checkbox checked={checked} description={item.description} />
                        <div className="flex-1">
                          <span
                            className={`text-sm font-medium ${checked ? 'text-success line-through' : 'text-base-content'}`}
                          >
                            {item.label}
                          </span>
                          {item.description && (
                            <p className="text-xs text-base-content/70 mt-1">{item.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3">
                <ProgressIndicator
                  value={
                    selectedPhase.checklist.filter(item => item.check(metricsWithProject)).length
                  }
                  max={selectedPhase.checklist.length}
                  label={`${selectedPhase.checklist.filter(item => item.check(metricsWithProject)).length} de ${selectedPhase.checklist.length} concluídos`}
                  color="green"
                />
              </div>
            </div>

            {selectedPhase.qaActivities && (
              <div>
                <h4 className="text-sm font-semibold text-base-content/70 mb-3">
                  🧪 Atividades de QA
                </h4>
                <ul className="space-y-2">
                  {selectedPhase.qaActivities.map((activity, idx) => (
                    <li key={idx} className="flex items-start text-base-content">
                      <span className="mr-2 text-blue-400">•</span>
                      <span>{activity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedPhase.deliverables && (
              <div>
                <h4 className="text-sm font-semibold text-base-content/70 mb-3">📦 Entregas</h4>
                <ul className="space-y-2">
                  {selectedPhase.deliverables.map((deliverable, idx) => (
                    <li key={idx} className="flex items-start text-base-content">
                      <span className="mr-2 text-green-400">✓</span>
                      <span>{deliverable}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedPhase.risks && (
              <div>
                <h4 className="text-sm font-semibold text-base-content/70 mb-3">⚠️ Riscos</h4>
                <ul className="space-y-2">
                  {selectedPhase.risks.map((risk, idx) => (
                    <li key={idx} className="flex items-start text-base-content">
                      <span className="mr-2 text-orange-400">⚠</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
