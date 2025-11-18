import React, { useState, useMemo } from 'react';
import { Project } from '../../types';
import { Badge } from '../common/Badge';
import { ProgressIndicator } from '../common/ProgressIndicator';
import { Modal } from '../common/Modal';

interface ShiftLeftActivity {
  id: string;
  name: string;
  phase: 'planning' | 'design' | 'development' | 'testing' | 'deployment';
  description: string;
  benefits: string[];
  techniques: string[];
  tools: string[];
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
}

const shiftLeftActivities: ShiftLeftActivity[] = [
  {
    id: 'req-review',
    name: 'Revisão de Requisitos',
    phase: 'planning',
    description: 'QA participa ativamente da definição e revisão de requisitos para identificar ambiguidades e riscos desde o início.',
    benefits: [
      'Reduz retrabalho em 40-60%',
      'Identifica problemas antes do desenvolvimento',
      'Melhora qualidade dos requisitos',
      'Reduz custos de correção'
    ],
    techniques: [
      'Revisão de requisitos',
      'Análise de riscos',
      'Definição de critérios de aceitação',
      'User story mapping'
    ],
    tools: ['Jira', 'Confluence', 'Miro', 'Figma'],
    impact: 'high',
    effort: 'low'
  },
  {
    id: 'design-review',
    name: 'Revisão de Design',
    phase: 'design',
    description: 'Validação de design e arquitetura antes da implementação para garantir testabilidade e qualidade.',
    benefits: [
      'Garante testabilidade do design',
      'Identifica problemas de usabilidade',
      'Valida arquitetura',
      'Reduz bugs de design'
    ],
    techniques: [
      'Revisão de arquitetura',
      'Testes de protótipos',
      'Heurísticas de usabilidade',
      'Análise de acessibilidade'
    ],
    tools: ['Figma', 'Sketch', 'Draw.io', 'Lucidchart'],
    impact: 'high',
    effort: 'medium'
  },
  {
    id: 'unit-testing',
    name: 'Testes Unitários',
    phase: 'development',
    description: 'Desenvolvimento de testes unitários junto com o código, seguindo TDD ou BDD.',
    benefits: [
      'Detecta bugs imediatamente',
      'Melhora qualidade do código',
      'Facilita refatoração',
      'Documenta comportamento do código'
    ],
    techniques: [
      'TDD (Test-Driven Development)',
      'BDD (Behavior-Driven Development)',
      'Testes de unidade',
      'Mock e Stubs'
    ],
    tools: ['Jest', 'JUnit', 'Mocha', 'RSpec', 'Cucumber'],
    impact: 'high',
    effort: 'medium'
  },
  {
    id: 'code-review',
    name: 'Revisão de Código',
    phase: 'development',
    description: 'QA participa de code reviews focando em testabilidade, qualidade e possíveis bugs.',
    benefits: [
      'Melhora qualidade do código',
      'Compartilha conhecimento',
      'Identifica bugs cedo',
      'Garante padrões de código'
    ],
    techniques: [
      'Code review',
      'Pair programming',
      'Static analysis',
      'Code quality checks'
    ],
    tools: ['GitHub', 'GitLab', 'Bitbucket', 'SonarQube', 'ESLint'],
    impact: 'high',
    effort: 'low'
  },
  {
    id: 'api-testing',
    name: 'Testes de API',
    phase: 'development',
    description: 'Testes de API desenvolvidos em paralelo com o backend, antes da integração completa.',
    benefits: [
      'Valida contratos de API',
      'Testa lógica de negócio isoladamente',
      'Rápido e confiável',
      'Facilita integração'
    ],
    techniques: [
      'Contract testing',
      'API testing',
      'Mock servers',
      'Schema validation'
    ],
    tools: ['Postman', 'REST Assured', 'Newman', 'Karate', 'Pact'],
    impact: 'high',
    effort: 'medium'
  },
  {
    id: 'integration-testing',
    name: 'Testes de Integração',
    phase: 'development',
    description: 'Testes de integração contínuos durante o desenvolvimento, não apenas no final.',
    benefits: [
      'Detecta problemas de integração cedo',
      'Valida fluxos completos',
      'Reduz bugs de integração',
      'Acelera desenvolvimento'
    ],
    techniques: [
      'Testes de integração',
      'Service virtualization',
      'Test containers',
      'CI/CD integration'
    ],
    tools: ['TestContainers', 'Docker', 'Jenkins', 'GitHub Actions'],
    impact: 'high',
    effort: 'high'
  },
  {
    id: 'exploratory-testing',
    name: 'Testes Exploratórios',
    phase: 'development',
    description: 'Testes exploratórios durante o desenvolvimento para descobrir bugs e cenários não previstos.',
    benefits: [
      'Descobre bugs inesperados',
      'Valida experiência do usuário',
      'Testa cenários reais',
      'Melhora cobertura de teste'
    ],
    techniques: [
      'Session-based testing',
      'Charter-based testing',
      'Bug hunting',
      'Ad-hoc testing'
    ],
    tools: ['TestRail', 'Jira', 'Session notes'],
    impact: 'medium',
    effort: 'medium'
  },
  {
    id: 'performance-testing',
    name: 'Testes de Performance',
    phase: 'development',
    description: 'Testes de performance durante o desenvolvimento para identificar gargalos cedo.',
    benefits: [
      'Identifica problemas de performance',
      'Valida escalabilidade',
      'Otimiza antes do deploy',
      'Reduz problemas em produção'
    ],
    techniques: [
      'Load testing',
      'Stress testing',
      'Volume testing',
      'Spike testing'
    ],
    tools: ['JMeter', 'Gatling', 'K6', 'Artillery', 'Locust'],
    impact: 'high',
    effort: 'high'
  },
  {
    id: 'security-testing',
    name: 'Testes de Segurança',
    phase: 'development',
    description: 'Análise de segurança durante o desenvolvimento, não apenas no final.',
    benefits: [
      'Identifica vulnerabilidades cedo',
      'Reduz riscos de segurança',
      'Cumpre compliance',
      'Protege dados do usuário'
    ],
    techniques: [
      'SAST (Static Analysis)',
      'DAST (Dynamic Analysis)',
      'Dependency scanning',
      'Penetration testing'
    ],
    tools: ['OWASP ZAP', 'SonarQube', 'Snyk', 'Checkmarx', 'Burp Suite'],
    impact: 'high',
    effort: 'medium'
  },
  {
    id: 'accessibility-testing',
    name: 'Testes de Acessibilidade',
    phase: 'development',
    description: 'Validação de acessibilidade durante o desenvolvimento para garantir inclusão.',
    benefits: [
      'Garante acessibilidade',
      'Cumpre padrões WCAG',
      'Melhora experiência',
      'Reduz retrabalho'
    ],
    techniques: [
      'Automated a11y testing',
      'Manual testing',
      'Screen reader testing',
      'Keyboard navigation'
    ],
    tools: ['axe-core', 'WAVE', 'Lighthouse', 'Pa11y', 'NVDA'],
    impact: 'medium',
    effort: 'low'
  }
];

export const ShiftLeftAnalysis: React.FC<{ project: Project }> = ({ project }) => {
  const [selectedActivity, setSelectedActivity] = useState<ShiftLeftActivity | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<string | 'all'>('all');

  const filteredActivities = useMemo(() => {
        if (selectedPhase === 'all') return shiftLeftActivities;
        return shiftLeftActivities.filter(a => a.phase === selectedPhase);
    }, [selectedPhase]);

    const phaseStats = useMemo(() => {
        const stats: Record<string, number> = {};
        shiftLeftActivities.forEach(activity => {
            stats[activity.phase] = (stats[activity.phase] || 0) + 1;
        });
        return stats;
    }, []);

    const getPhaseLabel = (phase: string): string => {
        const labels: Record<string, string> = {
            'planning': '📋 Planejamento',
            'design': '🎨 Design',
            'development': '💻 Desenvolvimento',
            'testing': '🧪 Testes',
            'deployment': '🚀 Deploy'
        };
        return labels[phase] || phase;
    };

    const getImpactColor = (impact: string): 'default' | 'success' | 'warning' | 'error' | 'info' => {
        switch (impact) {
            case 'high': return 'error';
            case 'medium': return 'warning';
            case 'low': return 'info';
            default: return 'default';
        }
    };

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-text-primary mb-2">Análise de Shift Left Testing</h2>
                <p className="text-text-secondary mb-4">
                    Shift Left é a prática de mover atividades de teste para mais cedo no ciclo de desenvolvimento, 
                    reduzindo custos e melhorando qualidade.
                </p>

                {/* Estatísticas */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    {Object.entries(phaseStats).map(([phase, count]) => (
                        <div key={phase} className="p-4 bg-surface border border-surface-border rounded-lg text-center">
                            <div className="text-2xl font-bold text-accent">{count}</div>
                            <div className="text-sm text-text-secondary">{getPhaseLabel(phase)}</div>
                        </div>
                    ))}
                </div>

                {/* Filtros */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <button
                        onClick={() => setSelectedPhase('all')}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            selectedPhase === 'all'
                                ? 'bg-accent text-white'
                                : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover'
                        }`}
                    >
                        Todas ({shiftLeftActivities.length})
                    </button>
                    {Object.keys(phaseStats).map(phase => (
                        <button
                            key={phase}
                            onClick={() => setSelectedPhase(phase)}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                selectedPhase === phase
                                    ? 'bg-accent text-white'
                                    : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover'
                            }`}
                        >
                            {getPhaseLabel(phase)} ({phaseStats[phase]})
                        </button>
                    ))}
                </div>
            </div>

            {/* Lista de Atividades */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredActivities.map((activity) => (
                    <div
                        key={activity.id}
                        onClick={() => setSelectedActivity(activity)}
                        className="p-5 bg-surface border border-surface-border rounded-lg hover:border-accent cursor-pointer transition-all hover:shadow-lg"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-text-primary mb-2">{activity.name}</h3>
                                <Badge variant={getImpactColor(activity.impact)} size="sm">
                                    Impacto {activity.impact === 'high' ? 'Alto' : activity.impact === 'medium' ? 'Médio' : 'Baixo'}
                                </Badge>
                                <span className="ml-2 text-xs text-text-secondary">
                                    {getPhaseLabel(activity.phase)}
                                </span>
                            </div>
                        </div>
                        <p className="text-text-secondary text-sm mb-3 line-clamp-2">{activity.description}</p>
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                            <span>⚡ Esforço: {activity.effort === 'high' ? 'Alto' : activity.effort === 'medium' ? 'Médio' : 'Baixo'}</span>
                            <span>•</span>
                            <span>{activity.tools.length} ferramentas</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal de Detalhes */}
            {selectedActivity && (
                <Modal
                    isOpen={!!selectedActivity}
                    onClose={() => setSelectedActivity(null)}
                    title={selectedActivity.name}
                >
                    <div className="space-y-6">
                        <div>
                            <Badge variant={getImpactColor(selectedActivity.impact)} size="md">
                                {getPhaseLabel(selectedActivity.phase)}
                            </Badge>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-text-secondary mb-2">Descrição</h4>
                            <p className="text-text-primary">{selectedActivity.description}</p>
                        </div>

                        <div>
                            <h4 className="text-sm font-semibold text-text-secondary mb-3">✅ Benefícios</h4>
                            <ul className="space-y-2">
                                {selectedActivity.benefits.map((benefit, idx) => (
                                    <li key={idx} className="flex items-start text-text-primary">
                                        <span className="mr-2 text-green-400">✓</span>
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="text-sm font-semibold text-text-secondary mb-3">🔧 Técnicas</h4>
                                <ul className="space-y-2">
                                    {selectedActivity.techniques.map((technique, idx) => (
                                        <li key={idx} className="flex items-start text-text-primary text-sm">
                                            <span className="mr-2 text-blue-400">•</span>
                                            <span>{technique}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-text-secondary mb-3">🛠️ Ferramentas</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedActivity.tools.map((tool, idx) => (
                                        <Badge key={idx} variant="info" size="sm">{tool}</Badge>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-surface-border">
                            <div>
                                <h4 className="text-sm font-semibold text-text-secondary mb-1">Impacto</h4>
                                <Badge variant={getImpactColor(selectedActivity.impact)}>
                                    {selectedActivity.impact === 'high' ? '🔴 Alto' : selectedActivity.impact === 'medium' ? '🟡 Médio' : '🟢 Baixo'}
                                </Badge>
                            </div>
                            <div>
                                <h4 className="text-sm font-semibold text-text-secondary mb-1">Esforço</h4>
                                <Badge variant={selectedActivity.effort === 'high' ? 'error' : selectedActivity.effort === 'medium' ? 'warning' : 'info'}>
                                    {selectedActivity.effort === 'high' ? '🔴 Alto' : selectedActivity.effort === 'medium' ? '🟡 Médio' : '🟢 Baixo'}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

