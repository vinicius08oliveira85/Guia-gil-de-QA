import React from 'react';
import { Project } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { Card } from '../common/Card';

interface STLCDashboardProps {
    project: Project;
}

interface STLCPhase {
    phase: string;
    icon: string;
    activities: string[];
    testTypes: string[];
    strategies: string[];
}

const stlcPhases: STLCPhase[] = [
    {
        phase: 'Análise de Requisitos',
        icon: '🔎',
        activities: [
            'Revisão de Requisitos (RTM)',
            'Identificação de critérios de aceitação',
            'Análise da Testabilidade dos requisitos'
        ],
        testTypes: [
            'Revisão Estática (Inspeção, Walkthrough)'
        ],
        strategies: [
            'Prevenção de Defeitos (Shift Left)',
            'Estratégia Baseada em Risco'
        ]
    },
    {
        phase: 'Planejamento de Testes',
        icon: '📋',
        activities: [
            'Definição do Escopo e Objetivos do Teste',
            'Seleção da Estratégia de Teste',
            'Definição do Ambiente de Testes e Ferramentas',
            'Estimativa de esforço e prazos'
        ],
        testTypes: [
            'Não há execução de testes, mas o planejamento define quais testes serão executados posteriormente'
        ],
        strategies: [
            'Estratégia Baseada em Risco (Priorizar áreas de maior risco)',
            'Estratégia Baseada em Requisitos (Garantir cobertura total)',
            'Estratégia Preditiva (Teste de Componentes, Sistema)'
        ]
    },
    {
        phase: 'Desenvolvimento de Casos de Teste',
        icon: '✍️',
        activities: [
            'Criação de Casos de Teste (Test Cases) e Scripts de Automação',
            'Geração de Dados de Teste',
            'Revisão dos Casos de Teste'
        ],
        testTypes: [
            'Testes de Usabilidade (Desenho baseado na experiência do usuário)',
            'Revisão Estática dos Casos de Teste'
        ],
        strategies: [
            'Estratégia de Caixa Preta (Técnicas como Particionamento de Equivalência e Análise de Valor Limite)'
        ]
    },
    {
        phase: 'Configuração do Ambiente',
        icon: '⚙️',
        activities: [
            'Configuração do hardware e software',
            'Instalação da Build (versão) do software',
            'Smoke Test no Ambiente'
        ],
        testTypes: [
            'Smoke Test (Teste de fumaça, para garantir que o ambiente e a build estão funcionais)'
        ],
        strategies: [
            'Estratégia de Prontidão (Garantir que os recursos estejam disponíveis e corretos antes da execução)'
        ]
    },
    {
        phase: 'Execução de Testes',
        icon: '🚀',
        activities: [
            'Execução dos Casos de Teste',
            'Comparação dos Resultados com o Esperado',
            'Registro e Relatório de Defeitos',
            'Reteste de defeitos corrigidos',
            'Testes de Regressão'
        ],
        testTypes: [
            'Funcional: Unidade, Integração, Sistema, Regressão',
            'Não Funcional: Performance, Segurança, Usabilidade, Carga, Stress',
            'Aceitação (UAT)'
        ],
        strategies: [
            'Estratégia de Regressão (Garantir que novas mudanças não quebrem funcionalidades existentes)',
            'Estratégia Exploratória (Aprendizagem contínua durante a execução)'
        ]
    },
    {
        phase: 'Encerramento do Ciclo de Teste',
        icon: '✅',
        activities: [
            'Coleta de Métricas (cobertura, densidade de defeitos)',
            'Elaboração do Relatório Final de Teste',
            'Arquivamento de artefatos',
            'Lições Aprendidas'
        ],
        testTypes: [
            'Análise de Cobertura de Teste (Métricas)'
        ],
        strategies: [
            'Estratégia de Avaliação (Analisar a eficácia e eficiência do ciclo de teste para melhorias futuras)'
        ]
    }
];

export const STLCDashboard: React.FC<STLCDashboardProps> = ({ project }) => {
    const metrics = useProjectMetrics(project);

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="win-toolbar flex flex-col gap-4 rounded-[26px] border border-surface-border/60 bg-gradient-to-br from-white/8 via-white/2 to-transparent px-4 py-4 sm:px-6 sm:py-6">
                <div className="space-y-2">
                    <p className="eyebrow text-text-secondary/80">Dashboard STLC</p>
                    <h2 className="heading-section text-text-primary">
                        Matriz de Correlação das Fases de Teste
                    </h2>
                    <p className="text-lead text-sm sm:text-base">
                        Visão completa do Software Testing Life Cycle (STLC) com atividades, tipos de teste e estratégias por fase.
                    </p>
                </div>
            </div>

            {/* Métricas do Projeto */}
            <Card>
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-text-primary">Métricas do Projeto</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1">
                            <p className="text-sm text-text-secondary">Fase Atual (SDLC)</p>
                            <p className="text-base font-semibold text-accent">{metrics.currentPhase}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-text-secondary">Total de Tarefas</p>
                            <p className="text-base font-semibold text-text-primary">{metrics.totalTasks}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-text-secondary">Casos de Teste</p>
                            <p className="text-base font-semibold text-text-primary">{metrics.totalTestCases}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm text-text-secondary">Taxa de Aprovação</p>
                            <p className="text-base font-semibold text-text-primary">
                                {metrics.testPassRate}%
                            </p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Matriz de Correlação */}
            <Card>
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-text-primary">
                        Matriz de Correlação das Fases de Teste
                    </h3>
                    <div className="overflow-x-auto scrollbar-hide">
                        <table className="w-full min-w-[1000px] text-left text-sm">
                            <thead className="border-b-2 border-surface-border text-text-secondary">
                                <tr>
                                    <th className="p-3 w-1/6">Fase do STLC</th>
                                    <th className="p-3 w-1/3">Atividades de Teste (Tarefas)</th>
                                    <th className="p-3 w-1/4">Tipos de Teste Mais Relevantes</th>
                                    <th className="p-3 w-1/3">Estratégias de Teste Comuns</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-surface-border">
                                {stlcPhases.map((phase) => (
                                        <tr
                                            key={phase.phase}
                                            className="transition-colors hover:bg-surface-hover"
                                        >
                                            <td className="p-3 font-semibold align-top">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg">{phase.icon}</span>
                                                    <span className="text-text-primary">
                                                        {phase.phase}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-3 align-top text-text-primary">
                                                <ul className="list-disc list-inside space-y-1">
                                                    {phase.activities.map((activity, idx) => (
                                                        <li key={idx} className="text-sm">
                                                            {activity}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </td>
                                            <td className="p-3 align-top text-text-primary">
                                                <ul className="list-disc list-inside space-y-1">
                                                    {phase.testTypes.map((testType, idx) => (
                                                        <li key={idx} className="text-sm">
                                                            {testType}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </td>
                                            <td className="p-3 align-top text-text-primary">
                                                <ul className="list-disc list-inside space-y-1">
                                                    {phase.strategies.map((strategy, idx) => (
                                                        <li key={idx} className="text-sm">
                                                            {strategy}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </td>
                                        </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>

            {/* Seção Educacional: Tipos de Teste e Estratégias Chave por Fase */}
            <Card>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-text-primary mb-2">
                            Tipos de Teste e Estratégias Chave por Fase
                        </h3>
                        <p className="text-sm text-text-secondary">
                            A estratégia de teste é o plano de alto nível que orienta a escolha dos tipos de teste e das atividades.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        {/* Fases Iniciais */}
                        <div className="space-y-3 p-4 rounded-xl border border-surface-border bg-surface-hover/50">
                            <h4 className="font-semibold text-text-primary flex items-center gap-2">
                                <span>🔎</span> I. Fases Iniciais (Análise e Planejamento)
                            </h4>
                            <p className="text-sm text-text-secondary mb-2">
                                <strong className="text-text-primary">O foco aqui é a Prevenção.</strong>
                            </p>
                            <ul className="space-y-2 text-sm text-text-primary">
                                <li>
                                    <strong className="text-accent">Estratégia Baseada em Risco:</strong> É a mais crucial no Planejamento. 
                                    O QA avalia a probabilidade de falha e o impacto do erro para priorizar onde o esforço de teste deve ser concentrado 
                                    (ex.: módulos de alto risco).
                                </li>
                                <li>
                                    <strong className="text-accent">Testes Estáticos (Revisões):</strong> A atividade de Revisão Estática de requisitos 
                                    (walkthroughs, inspeções) é a primeira linha de defesa, visando encontrar erros no design antes de escrever uma única linha de código.
                                </li>
                            </ul>
                        </div>

                        {/* Fase de Desenvolvimento */}
                        <div className="space-y-3 p-4 rounded-xl border border-surface-border bg-surface-hover/50">
                            <h4 className="font-semibold text-text-primary flex items-center gap-2">
                                <span>✍️</span> II. Fase de Desenvolvimento de Casos (Design)
                            </h4>
                            <p className="text-sm text-text-secondary mb-2">
                                <strong className="text-text-primary">O foco é a Cobertura.</strong>
                            </p>
                            <ul className="space-y-2 text-sm text-text-primary">
                                <li>
                                    <strong className="text-accent">Estratégias de Caixa Preta:</strong> O designer de testes usa técnicas como o 
                                    Particionamento de Equivalência e a Análise de Valor Limite para otimizar a criação de casos de teste, garantindo 
                                    a máxima cobertura com o mínimo de casos.
                                </li>
                            </ul>
                        </div>

                        {/* Fase de Execução */}
                        <div className="space-y-3 p-4 rounded-xl border border-surface-border bg-surface-hover/50">
                            <h4 className="font-semibold text-text-primary flex items-center gap-2">
                                <span>🚀</span> III. Fase de Execução de Testes
                            </h4>
                            <p className="text-sm text-text-secondary mb-2">
                                <strong className="text-text-primary">O foco é a Detecção e Validação.</strong>
                            </p>
                            <ul className="space-y-2 text-sm text-text-primary">
                                <li>
                                    <strong className="text-accent">Tipos de Teste Dinâmico:</strong> É o momento dos testes em ação, como Teste de Sistema 
                                    (para validar o comportamento de ponta a ponta) e Testes Não Funcionais (para garantir Performance, Usabilidade, Segurança, etc.).
                                </li>
                                <li>
                                    <strong className="text-accent">Estratégia de Regressão:</strong> Essencial. Após a correção de um defeito ou a adição de um novo recurso, 
                                    um conjunto de testes de regressão é executado para garantir que a parte que funcionava ainda esteja funcionando.
                                </li>
                            </ul>
                        </div>

                        {/* Fase de Encerramento */}
                        <div className="space-y-3 p-4 rounded-xl border border-surface-border bg-surface-hover/50">
                            <h4 className="font-semibold text-text-primary flex items-center gap-2">
                                <span>✅</span> IV. Fase de Encerramento
                            </h4>
                            <p className="text-sm text-text-secondary mb-2">
                                <strong className="text-text-primary">O foco é a Melhoria Contínua.</strong>
                            </p>
                            <ul className="space-y-2 text-sm text-text-primary">
                                <li>
                                    <strong className="text-accent">Análise de Cobertura:</strong> A principal atividade de teste aqui é a análise de métricas 
                                    (ex: qual porcentagem dos requisitos foi coberta? Quantos defeitos foram encontrados por módulo?). Isso alimenta as Lições Aprendidas 
                                    e melhora o próximo ciclo de planejamento.
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
};

