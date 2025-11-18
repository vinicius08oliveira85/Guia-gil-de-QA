import React from 'react';
import { Card } from '../common/Card';
import { CheckIcon } from '../common/Icons';

const roadmapData = [
    {
        version: 'V1',
        title: 'MVP – Funcionalidades Básicas',
        theme: 'Estabelecer a base para gestão e análise de QA.',
        features: [
            'Criação e gerenciamento de múltiplos projetos.',
            'Upload de documentos de requisitos (.txt, .md).',
            'Criação manual de tarefas (Epics, Histórias, Bugs).',
            'Geração de casos de teste e estratégias com IA a partir de tarefas.',
            'Dashboard de QA com métricas básicas (calculadas a partir dos dados do app).',
            'Ciclo de vida do projeto com fases dinâmicas.',
        ]
    },
    {
        version: 'V2',
        title: 'Automações Avançadas e Integrações',
        theme: 'Conectar o guia ao ecossistema de desenvolvimento.',
        features: [
            'Integração bidirecional com Jira/Trello (importar/exportar tarefas e bugs).',
            'Integração com repositórios Git (vincular commits a tarefas).',
            'Leitura de resultados de frameworks de teste (ex: JUnit XML) para atualizar status.',
            'Geração de scripts de automação (esqueletos em Playwright/Cypress) a partir de casos de teste.',
            'Webhooks para notificar Slack/Teams sobre status de testes e bugs críticos.',
        ]
    },
    {
        version: 'V3',
        title: 'Inteligência Artificial Analítica',
        theme: 'Transformar dados em insights preditivos e acionáveis.',
        features: [
            'IA para agrupar bugs duplicados ou semelhantes (clustering).',
            'Sugestão de prioridade de bug baseada em impacto histórico e áreas críticas do código.',
            'Detecção de testes "flaky" (instáveis) com base no histórico de execuções.',
            'Análise de "causa raiz" (root cause) para falhas comuns em testes.',
            'Previsão de áreas de risco para regressão com base nas mudanças do código (Test Impact Analysis).',
        ]
    },
    {
        version: 'V4',
        title: 'Execução Autônoma de Testes',
        theme: 'Permitir que a IA orquestre a execução de testes de forma inteligente.',
        features: [
            'Agente de execução de testes que pode rodar scripts de automação em ambientes de contêiner.',
            'Seleção inteligente de suítes de regressão (rodar apenas testes relevantes para a mudança).',
            'Execução de testes exploratórios guiada por IA para descobrir novos cenários.',
            'Geração e execução de testes de API com base em especificações (Swagger/OpenAPI).',
            'Auto-healing para scripts de automação (IA tenta corrigir seletores quebrados).',
        ]
    },
    {
        version: 'V5',
        title: 'Pipeline CI/CD Inteligente',
        theme: 'Tornar o guia o cérebro do processo de deploy e release.',
        features: [
            'Orquestração completa de pipelines de CI/CD (trigger de builds, testes, deploys).',
            '"Quality Gates" automáticos: a IA decide se um build pode ser promovido para o próximo ambiente.',
            'Rollback automático de deploys em caso de falhas críticas detectadas em produção.',
            'Dashboard de saúde do release em tempo real.',
            'Otimização de performance do pipeline com base em análises históricas.',
        ]
    }
];

export const RoadmapView: React.FC = () => {
    return (
        <Card>
            <h3 className="text-2xl font-bold text-white mb-2">Trilha de Evolução do Aplicativo</h3>
            <p className="text-gray-400 mb-8">Uma visão estratégica do futuro, desde as funcionalidades essenciais até um pipeline de CI/CD totalmente autônomo e inteligente.</p>
            
            <div className="relative border-l-2 border-gray-700 ml-4">
                {roadmapData.map((item, index) => (
                    <div key={item.version} className="mb-10 ml-8">
                        <span className="absolute flex items-center justify-center w-8 h-8 bg-teal-600 rounded-full -left-4 ring-8 ring-gray-800 text-white font-bold">
                            {index + 1}
                        </span>
                        <h4 className="text-xl font-bold text-teal-400">{item.version} – {item.title}</h4>
                        <p className="text-sm font-normal text-gray-500 mb-3">{item.theme}</p>
                        <ul className="space-y-2">
                            {item.features.map(feature => (
                                <li key={feature} className="flex items-start text-base text-gray-300">
                                    <CheckIcon className="w-4 h-4 mr-2 mt-1 text-teal-400 flex-shrink-0" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </Card>
    );
};