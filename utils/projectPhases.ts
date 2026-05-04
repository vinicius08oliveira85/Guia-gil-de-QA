import type { BugSeverity, JiraTask, PhaseName, Project } from '../types';

type ProjectMetricsForChecklist = {
  totalTasks: number;
  totalTestCases: number;
  automatedTestCases: number;
  executedTestCases: number;
  openVsClosedBugs: { open: number; closed: number };
  bugsBySeverity: Record<BugSeverity, number>;
  project: Project;
};

type TimelineChecklistItem = {
  label: string;
  description?: string;
  check: (metrics: ProjectMetricsForChecklist) => boolean;
};

interface TimelinePhase {
  phase: PhaseName;
  duration: string;
  dependencies: string;
  exitCriteria: string;
  milestone: string;
  checklist: TimelineChecklistItem[];
  qaActivities?: string[];
  deliverables?: string[];
  risks?: string[];
}

export const timelineData: TimelinePhase[] = [
  {
    phase: 'Request',
    duration: 'Contínuo',
    dependencies: 'Ideia de Negócio',
    exitCriteria: 'Pelo menos uma tarefa ou documento existe.',
    milestone: 'Kick-off de QA',
    checklist: [
      {
        label: 'Definir escopo inicial',
        check: m => m.totalTasks > 0 || m.project.documents.length > 0,
        description: 'Ter pelo menos uma tarefa ou documento criado no projeto',
      },
      {
        label: 'Criar Plano de Testes (conceitual)',
        check: m => m.project.documents.length > 0,
        description: 'Documentar estratégia inicial de testes',
      },
      {
        label: 'Identificar stakeholders',
        check: () => true,
        description: 'Mapear pessoas envolvidas no projeto',
      },
    ],
    qaActivities: [
      'Participar do kickoff',
      'Revisar requisitos iniciais',
      'Identificar riscos de qualidade',
      'Definir estratégia de teste',
    ],
    deliverables: ['Plano de Testes conceitual', 'Lista de stakeholders', 'Riscos identificados'],
    risks: ['Requisitos ambíguos', 'Falta de clareza no escopo', 'Stakeholders não identificados'],
  },
  {
    phase: 'Analysis',
    duration: '1-2 Sprints',
    dependencies: 'Requisitos de alto nível',
    exitCriteria: 'Cenários BDD criados para as histórias.',
    milestone: 'Revisão de Requisitos Concluída',
    checklist: [
      {
        label: 'Revisar Histórias de Usuário',
        check: m => m.totalTasks > 0,
        description: 'Validar clareza e completude das histórias',
      },
      {
        label: 'Criar cenários BDD',
        check: m => m.project.tasks.some((t: JiraTask) => (t.bddScenarios?.length ?? 0) > 0),
        description: 'Escrever cenários Given-When-Then para cada história',
      },
      {
        label: 'Identificar ambiguidades',
        check: () => true,
        description: 'Documentar pontos que precisam esclarecimento',
      },
    ],
    qaActivities: [
      'Revisão de requisitos (Shift Left)',
      'Criação de cenários BDD',
      'Identificação de casos de teste',
      'Análise de riscos',
    ],
    deliverables: ['Cenários BDD aprovados', 'Lista de ambiguidades', 'Casos de teste iniciais'],
    risks: ['Requisitos incompletos', 'Falta de cenários BDD', 'Ambiguidades não resolvidas'],
  },
  {
    phase: 'Design',
    duration: '1 Sprint',
    dependencies: 'Cenários BDD aprovados',
    exitCriteria: 'Casos de teste gerados para as histórias.',
    milestone: 'Suíte de Testes Pronta',
    checklist: [
      {
        label: 'Gerar casos de teste',
        check: m => m.totalTestCases > 0,
        description: 'Criar casos de teste baseados nos cenários BDD',
      },
      {
        label: 'Identificar candidatos à automação',
        check: m => m.automatedTestCases > 0,
        description: 'Marcar casos de teste para automação',
      },
      {
        label: 'Planejar dados de teste',
        check: () => true,
        description: 'Preparar dados necessários para execução',
      },
    ],
    qaActivities: [
      'Revisão de design (Shift Left)',
      'Geração de casos de teste',
      'Planejamento de automação',
      'Validação de testabilidade',
    ],
    deliverables: [
      'Casos de teste documentados',
      'Plano de automação',
      'Dados de teste preparados',
    ],
    risks: ['Casos de teste incompletos', 'Design não testável', 'Falta de dados de teste'],
  },
  {
    phase: 'Analysis and Code',
    duration: '2-3 Sprints',
    dependencies: 'Casos de Teste',
    exitCriteria: 'Todas as tarefas (não-bugs) concluídas.',
    milestone: 'Feature Complete',
    checklist: [
      {
        label: 'Desenvolvimento concluído',
        check: m =>
          m.totalTasks > 0 &&
          m.project.tasks
            .filter((t: JiraTask) => t.type !== 'Bug')
            .every((t: JiraTask) => t.status === 'Done'),
        description: 'Todas as tarefas de desenvolvimento finalizadas',
      },
      {
        label: 'Testes unitários implementados',
        check: () => true,
        description: 'Cobertura mínima de testes unitários atingida',
      },
      {
        label: 'Code Review realizado',
        check: () => true,
        description: 'Revisão de código concluída',
      },
    ],
    qaActivities: [
      'Testes unitários (Shift Left)',
      'Code review',
      'Testes de integração',
      'Validação contínua',
    ],
    deliverables: ['Features implementadas', 'Testes unitários', 'Código revisado'],
    risks: ['Cobertura de testes baixa', 'Bugs não detectados', 'Code review insuficiente'],
  },
  {
    phase: 'Test',
    duration: '1-2 Sprints',
    dependencies: 'Build estável em ambiente de QA',
    exitCriteria: 'Todos os casos de teste executados.',
    milestone: 'Ciclo de Testes Funcionais Concluído',
    checklist: [
      {
        label: 'Executar testes funcionais',
        check: m => m.executedTestCases > 0,
        description: 'Executar todos os casos de teste funcionais',
      },
      {
        label: 'Executar testes de regressão',
        check: m => m.executedTestCases === m.totalTestCases,
        description: 'Garantir que todos os testes foram executados',
      },
      {
        label: 'Reportar e triar bugs',
        check: m => m.openVsClosedBugs.open > 0 || m.openVsClosedBugs.closed > 0,
        description: 'Documentar e priorizar bugs encontrados',
      },
    ],
    qaActivities: [
      'Execução de testes funcionais',
      'Testes de regressão',
      'Testes exploratórios',
      'Reporte de bugs',
      'Validação de correções',
    ],
    deliverables: [
      'Relatórios de teste',
      'Bugs reportados',
      'Métricas de qualidade',
      'Evidências de teste',
    ],
    risks: ['Testes não executados', 'Bugs críticos não corrigidos', 'Cobertura insuficiente'],
  },
  {
    phase: 'Release',
    duration: '1 Sprint',
    dependencies: 'Ciclo de Testes concluído',
    exitCriteria: 'Nenhum bug crítico/alto em aberto.',
    milestone: 'Go/No-Go para Produção',
    checklist: [
      {
        label: 'Validar correções de bugs',
        check: m => m.executedTestCases === m.totalTestCases,
        description: 'Confirmar que bugs foram corrigidos',
      },
      {
        label: 'Executar testes de fumaça (smoke tests)',
        check: () => true,
        description: 'Validar funcionalidades críticas',
      },
      {
        label: 'Obter aprovação (Sign-off) do UAT',
        check: m =>
          (m.bugsBySeverity['Crítico'] ?? 0) === 0 && (m.bugsBySeverity['Alto'] ?? 0) === 0,
        description: 'Aprovação formal dos stakeholders',
      },
    ],
    qaActivities: [
      'Testes de sanidade',
      'Validação final',
      'Preparação de release notes',
      'Aprovação de UAT',
    ],
    deliverables: [
      'Release notes',
      'Aprovação formal',
      'Plano de rollback',
      'Documentação atualizada',
    ],
    risks: ['Bugs críticos pendentes', 'Falta de aprovação', 'Documentação incompleta'],
  },
  {
    phase: 'Deploy',
    duration: 'Imediato',
    dependencies: 'Aprovação de Release',
    exitCriteria: 'Deploy realizado com sucesso.',
    milestone: 'Software em Produção',
    checklist: [
      {
        label: 'Deploy em produção',
        check: () => true,
        description: 'Deploy realizado com sucesso',
      },
      {
        label: 'Smoke tests pós-deploy',
        check: () => true,
        description: 'Validar que sistema está funcionando',
      },
      {
        label: 'Monitoramento ativo',
        check: () => true,
        description: 'Acompanhar métricas e logs',
      },
    ],
    qaActivities: ['Validação em produção', 'Smoke tests', 'Monitoramento', 'Coleta de feedback'],
    deliverables: ['Sistema em produção', 'Relatório de deploy', 'Métricas iniciais'],
    risks: ['Falhas no deploy', 'Problemas em produção', 'Monitoramento insuficiente'],
  },
  {
    phase: 'Operate',
    duration: 'Contínuo',
    dependencies: 'Sistema em Produção',
    exitCriteria: 'Sistema operacional e estável.',
    milestone: 'Operação Estável',
    checklist: [
      {
        label: 'Monitoramento contínuo',
        check: () => true,
        description: 'Acompanhar saúde do sistema',
      },
      {
        label: 'Suporte ativo',
        check: () => true,
        description: 'Responder a incidentes',
      },
      {
        label: 'Coleta de feedback',
        check: () => true,
        description: 'Gather user feedback',
      },
    ],
    qaActivities: [
      'Monitoramento de qualidade',
      'Análise de incidentes',
      'Coleta de feedback',
      'Planejamento de melhorias',
    ],
    deliverables: ['Relatórios de operação', 'Feedback coletado', 'Melhorias identificadas'],
    risks: ['Incidentes não tratados', 'Falta de monitoramento', 'Feedback não coletado'],
  },
  {
    phase: 'Monitor',
    duration: 'Contínuo',
    dependencies: 'Sistema Operacional',
    exitCriteria: 'Métricas coletadas e analisadas.',
    milestone: 'Visibilidade Completa',
    checklist: [
      {
        label: 'Coleta de métricas',
        check: () => true,
        description: 'Métricas de performance e qualidade',
      },
      {
        label: 'Análise de tendências',
        check: () => true,
        description: 'Identificar padrões e tendências',
      },
      {
        label: 'Otimizações contínuas',
        check: () => true,
        description: 'Melhorias baseadas em dados',
      },
    ],
    qaActivities: [
      'Análise de métricas',
      'Identificação de melhorias',
      'Otimização contínua',
      'Relatórios de qualidade',
    ],
    deliverables: ['Dashboards de métricas', 'Relatórios de análise', 'Recomendações de melhoria'],
    risks: ['Métricas não coletadas', 'Análise insuficiente', 'Falta de ação'],
  },
];
