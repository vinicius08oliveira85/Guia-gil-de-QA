import { PhaseName } from '../types';

/**
 * Ícones representativos para cada fase SDLC
 */
export const phaseIcons: Record<PhaseName, string> = {
  Request: '📋',
  Analysis: '🔍',
  Design: '🎨',
  'Analysis and Code': '💻',
  Build: '🔨',
  Test: '🧪',
  Release: '🚀',
  Deploy: '📦',
  Operate: '⚙️',
  Monitor: '📊',
};

/**
 * Descrições curtas e didáticas de cada fase para tooltips
 */
export const phaseDescriptions: Record<PhaseName, string> = {
  Request:
    'Solicitação da demanda pelo time de atendimento ou produto. Início do ciclo de vida do projeto.',
  Analysis:
    'Análise do time de produto e levantamento dos requisitos. Definição do que será desenvolvido.',
  Design:
    'Design pelo time de UX/UI com base nas necessidades levantadas. Criação da interface e experiência do usuário.',
  'Analysis and Code':
    'Análise técnica e codificação pelo time de desenvolvimento. Implementação das funcionalidades.',
  Build: 'Código fonte compilado e construído em um pacote executável. Preparação para testes.',
  Test: 'Etapa onde o software é testado para garantir seu correto funcionamento. Validação da qualidade.',
  Release:
    'Preparo para o software ser instalado em ambiente produtivo. Finalização e documentação.',
  Deploy:
    'O software é implantado em ambiente produtivo para os usuários finais. Disponibilização ao público.',
  Operate:
    'Software em execução, monitorado pela equipe de operações. Manutenção e suporte contínuo.',
  Monitor:
    'Coleta de métricas e logs para avaliar o desempenho e a saúde da aplicação. Análise de performance.',
};

/**
 * Cores para cada fase (para indicadores visuais)
 */
export const phaseColors: Record<PhaseName, { bg: string; text: string; border: string }> = {
  Request: {
    bg: 'bg-blue-500/20 dark:bg-blue-500/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-500/50 dark:border-blue-500/50',
  },
  Analysis: {
    bg: 'bg-purple-500/20 dark:bg-purple-500/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-500/50 dark:border-purple-500/50',
  },
  Design: {
    bg: 'bg-pink-500/20 dark:bg-pink-500/20',
    text: 'text-pink-700 dark:text-pink-300',
    border: 'border-pink-500/50 dark:border-pink-500/50',
  },
  'Analysis and Code': {
    bg: 'bg-indigo-500/20 dark:bg-indigo-500/20',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-500/50 dark:border-indigo-500/50',
  },
  Build: {
    bg: 'bg-orange-500/20 dark:bg-orange-500/20',
    text: 'text-orange-700 dark:text-orange-300',
    border: 'border-orange-500/50 dark:border-orange-500/50',
  },
  Test: {
    bg: 'bg-green-500/20 dark:bg-green-500/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-500/50 dark:border-green-500/50',
  },
  Release: {
    bg: 'bg-teal-500/20 dark:bg-teal-500/20',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-500/50 dark:border-teal-500/50',
  },
  Deploy: {
    bg: 'bg-cyan-500/20 dark:bg-cyan-500/20',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-500/50 dark:border-cyan-500/50',
  },
  Operate: {
    bg: 'bg-emerald-500/20 dark:bg-emerald-500/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500/50 dark:border-emerald-500/50',
  },
  Monitor: {
    bg: 'bg-slate-500/20 dark:bg-slate-500/20',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-500/50 dark:border-slate-500/50',
  },
};

/**
 * Nomes traduzidos/amigáveis para cada fase
 */
export const phaseDisplayNames: Record<PhaseName, string> = {
  Request: 'Solicitação',
  Analysis: 'Análise',
  Design: 'Design',
  'Analysis and Code': 'Análise e Código',
  Build: 'Build',
  Test: 'Teste',
  Release: 'Release',
  Deploy: 'Deploy',
  Operate: 'Operação',
  Monitor: 'Monitoramento',
};
