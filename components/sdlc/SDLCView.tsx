import React, { useState } from 'react';
import { Project } from '../../types';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface SDLCPhase {
  id: string;
  name: string;
  description: string;
  activities: string[];
  deliverables: string[];
  qaActivities: string[];
  devopsActivities: string[];
  duration: string;
  dependencies: string[];
}

const sdlcPhases: SDLCPhase[] = [
  {
    id: 'planning',
    name: 'Planejamento',
    description: 'Definição de escopo, requisitos e planejamento do projeto.',
    activities: [
      'Reuniões de kickoff',
      'Definição de requisitos',
      'Estimativas de esforço',
      'Planejamento de sprints',
      'Definição de critérios de aceitação',
    ],
    deliverables: [
      'Documento de requisitos',
      'Plano de projeto',
      'Backlog priorizado',
      'Definição de Done',
    ],
    qaActivities: [
      'Revisão de requisitos',
      'Identificação de riscos',
      'Planejamento de testes',
      'Definição de estratégia de teste',
      'Criação de casos de teste iniciais',
    ],
    devopsActivities: [
      'Setup de repositório',
      'Configuração de CI/CD básico',
      'Definição de ambientes',
      'Setup de monitoramento',
    ],
    duration: '1-2 semanas',
    dependencies: [],
  },
  {
    id: 'design',
    name: 'Design',
    description: 'Arquitetura, design de interface e especificações técnicas.',
    activities: [
      'Design de arquitetura',
      'Design de UI/UX',
      'Especificações técnicas',
      'Protótipos',
      'Revisões de design',
    ],
    deliverables: [
      'Documentação de arquitetura',
      'Mockups e protótipos',
      'Especificações técnicas',
      'Design system',
    ],
    qaActivities: [
      'Revisão de design',
      'Validação de usabilidade',
      'Testes de protótipos',
      'Definição de critérios de teste',
      'Preparação de dados de teste',
    ],
    devopsActivities: [
      'Setup de infraestrutura',
      'Configuração de ambientes',
      'Pipeline de deploy',
      'Configuração de containers',
    ],
    duration: '2-3 semanas',
    dependencies: ['planning'],
  },
  {
    id: 'development',
    name: 'Desenvolvimento',
    description: 'Implementação das funcionalidades e desenvolvimento do código.',
    activities: [
      'Desenvolvimento de features',
      'Code reviews',
      'Refatoração',
      'Integração contínua',
      'Testes unitários',
    ],
    deliverables: [
      'Código fonte',
      'Features implementadas',
      'Testes automatizados',
      'Documentação técnica',
    ],
    qaActivities: [
      'Testes de unidade (Shift Left)',
      'Testes de integração',
      'Testes de API',
      'Revisão de código',
      'Testes exploratórios',
      'Validação de features',
    ],
    devopsActivities: [
      'Builds automatizados',
      'Deploy contínuo',
      'Monitoramento de aplicação',
      'Gestão de configuração',
      'Backup e recovery',
    ],
    duration: '4-8 semanas',
    dependencies: ['design'],
  },
  {
    id: 'testing',
    name: 'Testes',
    description: 'Execução de testes completos e validação de qualidade.',
    activities: [
      'Testes funcionais',
      'Testes de regressão',
      'Testes de performance',
      'Testes de segurança',
      'Testes de acessibilidade',
    ],
    deliverables: [
      'Relatórios de teste',
      'Bugs reportados',
      'Métricas de qualidade',
      'Evidências de teste',
    ],
    qaActivities: [
      'Execução de casos de teste',
      'Testes end-to-end',
      'Testes de regressão',
      'Testes de performance',
      'Testes de segurança',
      'Validação de bugs corrigidos',
    ],
    devopsActivities: [
      'Testes em ambientes',
      'Deploy automatizado',
      'Smoke tests',
      'Health checks',
      'Rollback automático',
    ],
    duration: '2-4 semanas',
    dependencies: ['development'],
  },
  {
    id: 'deployment',
    name: 'Deploy',
    description: 'Preparação e deploy para produção.',
    activities: [
      'Preparação de release',
      'Deploy em produção',
      'Smoke tests pós-deploy',
      'Monitoramento',
      'Validação de produção',
    ],
    deliverables: [
      'Release notes',
      'Documentação de deploy',
      'Rollback plan',
      'Métricas pós-deploy',
    ],
    qaActivities: [
      'Validação em produção',
      'Smoke tests',
      'Testes de sanidade',
      'Monitoramento de bugs',
      'Validação de métricas',
    ],
    devopsActivities: [
      'Deploy automatizado',
      'Blue-green deployment',
      'Canary releases',
      'Monitoramento 24/7',
      'Alertas e notificações',
    ],
    duration: '1 semana',
    dependencies: ['testing'],
  },
  {
    id: 'maintenance',
    name: 'Manutenção',
    description: 'Suporte, correções e melhorias contínuas.',
    activities: [
      'Suporte ao usuário',
      'Correção de bugs',
      'Melhorias incrementais',
      'Otimizações',
      'Atualizações de segurança',
    ],
    deliverables: ['Hotfixes', 'Patches', 'Melhorias', 'Relatórios de suporte'],
    qaActivities: [
      'Testes de hotfix',
      'Validação de correções',
      'Testes de regressão',
      'Monitoramento contínuo',
      'Análise de feedback',
    ],
    devopsActivities: [
      'Deploy de hotfixes',
      'Monitoramento contínuo',
      'Otimização de performance',
      'Gestão de capacidade',
      'Disaster recovery',
    ],
    duration: 'Contínuo',
    dependencies: ['deployment'],
  },
];

export const SDLCView: React.FC<{ project: Project }> = ({ project }) => {
  const [selectedPhase, setSelectedPhase] = useState<SDLCPhase | null>(null);
  const [showShiftLeft, setShowShiftLeft] = useState(false);

  const getPhaseStatus = (phaseId: string): 'completed' | 'current' | 'upcoming' => {
    if (!project.phases) return 'upcoming';

    // Mapeamento mais robusto entre fases do SDLC e fases do projeto
    const phaseMapping: Record<string, string[]> = {
      planning: ['request', 'analysis', 'planejamento', 'requisitos'],
      design: ['design', 'prototipagem'],
      development: [
        'development',
        'desenvolvimento',
        'code',
        'build',
        'implementação',
        'analysis and code',
      ],
      testing: ['testing', 'testes', 'qa', 'homologação', 'test'],
      deployment: ['deployment', 'deploy', 'release', 'implantação', 'entrega'],
      maintenance: ['maintenance', 'manutenção', 'operate', 'monitor', 'suporte'],
    };

    const keywords = phaseMapping[phaseId] || [];
    const relevantPhases = project.phases.filter(p =>
      keywords.some(k => p.name.toLowerCase().includes(k))
    );

    if (relevantPhases.length === 0) return 'upcoming';

    if (relevantPhases.some(p => p.status === 'Em Andamento')) return 'current';
    if (relevantPhases.every(p => p.status === 'Concluído')) return 'completed';
    if (relevantPhases.some(p => p.status === 'Concluído')) return 'current';

    return 'upcoming';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
            Ciclo de Vida do Projeto (SDLC & DevOps)
          </h2>
          <p className="text-base-content/70 max-w-2xl">
            Visualize o ciclo de vida completo do projeto integrando práticas de QA e DevOps
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowShiftLeft(!showShiftLeft)}
          className="btn btn-outline btn-sm rounded-full hover:bg-base-200"
        >
          {showShiftLeft ? 'Ocultar' : 'Mostrar'} Shift Left
        </button>
      </div>

      {/* Timeline Visual */}
      <div className="relative">
        <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-1 bg-base-300"></div>

        <div className="space-y-8">
          {sdlcPhases.map((phase, index) => {
            const status = getPhaseStatus(phase.id);
            const statusColors = {
              completed: 'bg-green-500',
              current: 'bg-blue-500 animate-pulse',
              upcoming: 'bg-gray-500',
            };

            return (
              <div key={phase.id} className="relative flex items-start gap-6">
                {/* Indicador de fase */}
                <div
                  className={`relative z-10 w-12 h-12 sm:w-16 sm:h-16 rounded-full ${statusColors[status]} flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg flex-shrink-0`}
                >
                  {index + 1}
                </div>

                {/* Conteúdo da fase */}
                <div className="flex-1 pb-8">
                  <div className="p-6 bg-base-100 border border-base-300 rounded-xl hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-base-content mb-2">{phase.name}</h3>
                        <p className="text-base-content/70 mb-3">{phase.description}</p>
                        <div className="flex items-center gap-3 text-sm">
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
                          <span className="text-base-content/70">⏱️ {phase.duration}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedPhase(phase)}
                        className="btn btn-ghost btn-sm text-primary hover:text-primary/80"
                      >
                        Ver Detalhes →
                      </button>
                    </div>

                    {/* Grid de atividades */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <h4 className="text-sm font-semibold text-base-content/70 mb-2">
                          📋 Atividades
                        </h4>
                        <ul className="space-y-1 text-sm text-base-content/70">
                          {phase.activities.slice(0, 3).map((activity, idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{activity}</span>
                            </li>
                          ))}
                          {phase.activities.length > 3 && (
                            <li className="text-accent text-xs">
                              +{phase.activities.length - 3} mais...
                            </li>
                          )}
                        </ul>
                      </div>

                      {showShiftLeft && (
                        <>
                          <div>
                            <h4 className="text-sm font-semibold text-base-content/70 mb-2">
                              🧪 QA (Shift Left)
                            </h4>
                            <ul className="space-y-1 text-sm text-base-content/70">
                              {phase.qaActivities.slice(0, 3).map((activity, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{activity}</span>
                                </li>
                              ))}
                              {phase.qaActivities.length > 3 && (
                                <li className="text-accent text-xs">
                                  +{phase.qaActivities.length - 3} mais...
                                </li>
                              )}
                            </ul>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-base-content/70 mb-2">
                              🚀 DevOps
                            </h4>
                            <ul className="space-y-1 text-sm text-base-content/70">
                              {phase.devopsActivities.slice(0, 3).map((activity, idx) => (
                                <li key={idx} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{activity}</span>
                                </li>
                              ))}
                              {phase.devopsActivities.length > 3 && (
                                <li className="text-accent text-xs">
                                  +{phase.devopsActivities.length - 3} mais...
                                </li>
                              )}
                            </ul>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal de Detalhes */}
      {selectedPhase && (
        <Modal
          isOpen={!!selectedPhase}
          onClose={() => setSelectedPhase(null)}
          title={selectedPhase.name}
          size="lg"
          maxHeight="90vh"
        >
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-semibold text-base-content/70 mb-1.5 uppercase tracking-wide">
                Descrição
              </h4>
              <p className="text-sm text-base-content leading-relaxed">
                {selectedPhase.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-base-content/70 mb-2 uppercase tracking-wide">
                  📋 Atividades Principais
                </h4>
                <ul className="space-y-1.5">
                  {selectedPhase.activities.map((activity, idx) => (
                    <li key={idx} className="flex items-start text-base-content text-sm">
                      <span className="mr-2 text-primary flex-shrink-0 mt-0.5">•</span>
                      <span className="leading-relaxed">{activity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-base-content/70 mb-2 uppercase tracking-wide">
                  📦 Entregas
                </h4>
                <ul className="space-y-1.5">
                  {selectedPhase.deliverables.map((deliverable, idx) => (
                    <li key={idx} className="flex items-start text-base-content text-sm">
                      <span className="mr-2 text-green-400 flex-shrink-0 mt-0.5">✓</span>
                      <span className="leading-relaxed">{deliverable}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-base-content/70 mb-2 uppercase tracking-wide">
                  🧪 Atividades de QA
                </h4>
                <ul className="space-y-1.5">
                  {selectedPhase.qaActivities.map((activity, idx) => (
                    <li key={idx} className="flex items-start text-base-content text-sm">
                      <span className="mr-2 text-blue-400 flex-shrink-0 mt-0.5">•</span>
                      <span className="leading-relaxed">{activity}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-base-content/70 mb-2 uppercase tracking-wide">
                  🚀 Atividades de DevOps
                </h4>
                <ul className="space-y-1.5">
                  {selectedPhase.devopsActivities.map((activity, idx) => (
                    <li key={idx} className="flex items-start text-base-content text-sm">
                      <span className="mr-2 text-purple-400 flex-shrink-0 mt-0.5">•</span>
                      <span className="leading-relaxed">{activity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {selectedPhase.dependencies.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-base-content/70 mb-2 uppercase tracking-wide">
                  Dependências
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPhase.dependencies.map(depId => {
                    const dep = sdlcPhases.find(p => p.id === depId);
                    return dep ? (
                      <Badge key={depId} variant="info" size="sm">
                        {dep.name}
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
