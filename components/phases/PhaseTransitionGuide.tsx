import React, { useState, useMemo } from 'react';
import { Project, PhaseName } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { PHASE_NAMES } from '../../utils/constants';

interface PhaseTransitionRule {
  from: PhaseName;
  to: PhaseName;
  conditions: string[];
  validations: string[];
  blockers: string[];
  recommendations: string[];
}

const phaseTransitionRules: PhaseTransitionRule[] = [
  {
    from: 'Não Iniciado',
    to: 'Planejamento',
    conditions: [
      'Projeto criado',
      'Nome e descrição definidos'
    ],
    validations: [
      'Verificar se há documentos de requisitos',
      'Validar se há stakeholders definidos'
    ],
    blockers: [
      'Projeto sem nome ou descrição',
      'Falta de informações básicas do projeto'
    ],
    recommendations: [
      'Definir objetivos claros do projeto',
      'Identificar stakeholders principais',
      'Criar estrutura inicial de documentos'
    ]
  },
  {
    from: 'Planejamento',
    to: 'Análise',
    conditions: [
      'Requisitos documentados',
      'Backlog inicial criado',
      'Critérios de aceitação definidos'
    ],
    validations: [
      'Verificar completude dos requisitos',
      'Validar se há casos de teste iniciais',
      'Confirmar definição de Done'
    ],
    blockers: [
      'Requisitos incompletos ou ambíguos',
      'Falta de backlog priorizado',
      'Critérios de aceitação não definidos'
    ],
    recommendations: [
      'Revisar requisitos com stakeholders',
      'Priorizar backlog',
      'Definir critérios de aceitação claros',
      'Criar casos de teste iniciais'
    ]
  },
  {
    from: 'Análise',
    to: 'Design',
    conditions: [
      'Análise de requisitos concluída',
      'Arquitetura definida',
      'Design inicial aprovado'
    ],
    validations: [
      'Verificar se arquitetura está documentada',
      'Validar protótipos ou mockups',
      'Confirmar revisão de design'
    ],
    blockers: [
      'Arquitetura não definida',
      'Design não aprovado',
      'Falta de protótipos'
    ],
    recommendations: [
      'Documentar arquitetura',
      'Criar protótipos de alta fidelidade',
      'Revisar design com equipe',
      'Validar usabilidade'
    ]
  },
  {
    from: 'Design',
    to: 'Desenvolvimento',
    conditions: [
      'Design aprovado',
      'Ambiente de desenvolvimento configurado',
      'Tarefas de desenvolvimento criadas'
    ],
    validations: [
      'Verificar se há tarefas no backlog',
      'Validar ambiente de desenvolvimento',
      'Confirmar testes unitários configurados'
    ],
    blockers: [
      'Design não finalizado',
      'Ambiente não configurado',
      'Falta de tarefas priorizadas'
    ],
    recommendations: [
      'Finalizar design antes de iniciar desenvolvimento',
      'Configurar CI/CD',
      'Preparar ambiente de testes',
      'Criar tarefas detalhadas'
    ]
  },
  {
    from: 'Desenvolvimento',
    to: 'Testes',
    conditions: [
      'Features desenvolvidas',
      'Testes unitários implementados',
      'Code review realizado'
    ],
    validations: [
      'Verificar cobertura de testes unitários',
      'Validar se há casos de teste criados',
      'Confirmar que bugs críticos foram corrigidos'
    ],
    blockers: [
      'Features incompletas',
      'Cobertura de testes baixa',
      'Bugs críticos pendentes'
    ],
    recommendations: [
      'Garantir cobertura mínima de testes',
      'Realizar code review completo',
      'Corrigir bugs críticos antes de avançar',
      'Preparar ambiente de testes'
    ]
  },
  {
    from: 'Testes',
    to: 'Homologação',
    conditions: [
      'Testes funcionais executados',
      'Bugs críticos corrigidos',
      'Métricas de qualidade atendidas'
    ],
    validations: [
      'Verificar taxa de passagem de testes',
      'Validar se bugs críticos foram corrigidos',
      'Confirmar critérios de qualidade'
    ],
    blockers: [
      'Taxa de passagem abaixo do mínimo',
      'Bugs críticos abertos',
      'Métricas de qualidade não atendidas'
    ],
    recommendations: [
      'Corrigir bugs críticos',
      'Melhorar cobertura de testes',
      'Executar testes de regressão',
      'Validar critérios de aceitação'
    ]
  },
  {
    from: 'Homologação',
    to: 'Produção',
    conditions: [
      'Aprovação de stakeholders',
      'Testes de aceitação concluídos',
      'Documentação atualizada',
      'Plano de rollback preparado'
    ],
    validations: [
      'Verificar aprovação formal',
      'Validar testes em ambiente de staging',
      'Confirmar documentação completa',
      'Verificar plano de rollback'
    ],
    blockers: [
      'Falta de aprovação',
      'Testes de aceitação não concluídos',
      'Documentação incompleta',
      'Plano de rollback não preparado'
    ],
    recommendations: [
      'Obter aprovação formal',
      'Executar testes finais em staging',
      'Atualizar documentação',
      'Preparar plano de rollback',
      'Comunicar stakeholders'
    ]
  },
  {
    from: 'Produção',
    to: 'Manutenção',
    conditions: [
      'Deploy realizado com sucesso',
      'Smoke tests em produção passaram',
      'Monitoramento configurado'
    ],
    validations: [
      'Verificar saúde do sistema em produção',
      'Validar métricas de monitoramento',
      'Confirmar que não há bugs críticos'
    ],
    blockers: [
      'Deploy com falhas',
      'Smoke tests falhando',
      'Monitoramento não configurado'
    ],
    recommendations: [
      'Monitorar sistema continuamente',
      'Coletar feedback dos usuários',
      'Planejar melhorias incrementais',
      'Manter documentação atualizada'
    ]
  }
];

export const PhaseTransitionGuide: React.FC<{ project: Project; currentPhase: PhaseName }> = ({ project, currentPhase }) => {
  const [selectedRule, setSelectedRule] = useState<PhaseTransitionRule | null>(null);
  const [showAllTransitions, setShowAllTransitions] = useState(false);

  const currentPhaseIndex = PHASE_NAMES.indexOf(currentPhase);
  const nextPhase = currentPhaseIndex < PHASE_NAMES.length - 1 ? PHASE_NAMES[currentPhaseIndex + 1] : null;
  
  const relevantRules = useMemo(() => {
    if (showAllTransitions) return phaseTransitionRules;
    if (nextPhase) {
      return phaseTransitionRules.filter(rule => rule.from === currentPhase && rule.to === nextPhase);
    }
    return [];
  }, [currentPhase, nextPhase, showAllTransitions]);

  const getAllPossibleTransitions = () => {
    return phaseTransitionRules.filter(rule => rule.from === currentPhase);
  };

  const getPhaseColor = (phase: PhaseName): string => {
    const index = PHASE_NAMES.indexOf(phase);
    const colors = [
      'bg-gray-500/20 text-gray-400 border-gray-500/30',
      'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'bg-purple-500/20 text-purple-400 border-purple-500/30',
      'bg-pink-500/20 text-pink-400 border-pink-500/30',
      'bg-orange-500/20 text-orange-400 border-orange-500/30',
      'bg-green-500/20 text-green-400 border-green-500/30',
      'bg-teal-500/20 text-teal-400 border-teal-500/30',
      'bg-red-500/20 text-red-400 border-red-500/30'
    ];
    return colors[index % colors.length];
  };

  const checkCondition = (condition: string): boolean => {
    // Lógica simplificada de validação
    if (condition.includes('documentos')) {
      return (project.documents?.length || 0) > 0;
    }
    if (condition.includes('tarefas')) {
      return (project.tasks?.length || 0) > 0;
    }
    if (condition.includes('casos de teste')) {
      return project.tasks?.some(t => (t.testCases?.length || 0) > 0) || false;
    }
    return true;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-text-primary mb-2">Guia de Lógica de Transição de Fases</h2>
          <p className="text-text-secondary">
            Regras e validações para transição entre fases do ciclo de vida do projeto
          </p>
        </div>
        <button
          onClick={() => setShowAllTransitions(!showAllTransitions)}
          className="btn btn-secondary"
        >
          {showAllTransitions ? 'Mostrar Apenas Próxima' : 'Mostrar Todas'}
        </button>
      </div>

      {/* Fase Atual */}
      <div className="p-4 bg-surface border border-surface-border rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">Fase Atual</h3>
            <Badge variant="info" size="lg">
              {currentPhase}
            </Badge>
          </div>
          {nextPhase && (
            <div className="text-right">
              <h3 className="text-lg font-semibold text-text-primary mb-2">Próxima Fase</h3>
              <Badge variant="warning" size="lg">
                {nextPhase}
              </Badge>
            </div>
          )}
        </div>
      </div>

      {/* Regras de Transição */}
      <div className="space-y-4">
        {relevantRules.length > 0 ? (
          relevantRules.map((rule, index) => {
            const conditionsMet = rule.conditions.filter(checkCondition).length;
            const allConditionsMet = conditionsMet === rule.conditions.length;

            return (
              <div
                key={index}
                onClick={() => setSelectedRule(rule)}
                className="p-5 bg-surface border border-surface-border rounded-lg hover:border-accent cursor-pointer transition-all hover:shadow-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPhaseColor(rule.from)}`}>
                        {rule.from}
                      </span>
                      <span className="text-text-secondary">→</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPhaseColor(rule.to)}`}>
                        {rule.to}
                      </span>
                      <Badge variant={allConditionsMet ? 'success' : 'warning'} size="sm">
                        {conditionsMet}/{rule.conditions.length} condições
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="text-xs font-semibold text-text-secondary mb-2">✅ Condições</h4>
                        <ul className="space-y-1">
                          {rule.conditions.map((condition, idx) => (
                            <li key={idx} className={`flex items-start ${checkCondition(condition) ? 'text-green-400' : 'text-text-secondary'}`}>
                              <span className="mr-2">{checkCondition(condition) ? '✓' : '○'}</span>
                              <span>{condition}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="text-xs font-semibold text-text-secondary mb-2">⚠️ Bloqueadores</h4>
                        <ul className="space-y-1">
                          {rule.blockers.slice(0, 2).map((blocker, idx) => (
                            <li key={idx} className="flex items-start text-text-secondary">
                              <span className="mr-2">•</span>
                              <span>{blocker}</span>
                            </li>
                          ))}
                          {rule.blockers.length > 2 && (
                            <li className="text-accent text-xs">+{rule.blockers.length - 2} mais...</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                  <button className="text-accent hover:text-accent-light text-sm font-semibold ml-4">
                    Ver Detalhes →
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">Projeto Concluído</h3>
            <p className="text-text-secondary">O projeto já está na fase final.</p>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {selectedRule && (
        <Modal
          isOpen={!!selectedRule}
          onClose={() => setSelectedRule(null)}
          title={`Transição: ${selectedRule.from} → ${selectedRule.to}`}
        >
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPhaseColor(selectedRule.from)}`}>
                {selectedRule.from}
              </span>
              <span className="text-text-secondary">→</span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPhaseColor(selectedRule.to)}`}>
                {selectedRule.to}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-text-secondary mb-3">✅ Condições Obrigatórias</h4>
              <ul className="space-y-2">
                {selectedRule.conditions.map((condition, idx) => (
                  <li key={idx} className={`flex items-start p-2 rounded ${checkCondition(condition) ? 'bg-green-500/20' : 'bg-surface-hover'}`}>
                    <span className={`mr-2 ${checkCondition(condition) ? 'text-green-400' : 'text-text-secondary'}`}>
                      {checkCondition(condition) ? '✓' : '○'}
                    </span>
                    <span className={checkCondition(condition) ? 'text-green-400' : 'text-text-primary'}>{condition}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-text-secondary mb-3">🔍 Validações Recomendadas</h4>
              <ul className="space-y-2">
                {selectedRule.validations.map((validation, idx) => (
                  <li key={idx} className="flex items-start text-text-primary">
                    <span className="mr-2 text-blue-400">•</span>
                    <span>{validation}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-text-secondary mb-3">🚫 Bloqueadores</h4>
              <ul className="space-y-2">
                {selectedRule.blockers.map((blocker, idx) => (
                  <li key={idx} className="flex items-start text-text-primary">
                    <span className="mr-2 text-red-400">⚠</span>
                    <span>{blocker}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-text-secondary mb-3">💡 Recomendações</h4>
              <ul className="space-y-2">
                {selectedRule.recommendations.map((recommendation, idx) => (
                  <li key={idx} className="flex items-start text-text-primary">
                    <span className="mr-2 text-accent">💡</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

