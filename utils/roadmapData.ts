export interface RoadmapMilestone {
  id: string;
  title: string;
  date?: string;
  completed: boolean;
  description?: string;
}

export interface RoadmapRisk {
  id: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  mitigation?: string;
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned' | 'future';
  category: 'feature' | 'improvement' | 'bug-fix' | 'performance' | 'security' | 'ux';
  priority: 'high' | 'medium' | 'low';
  estimatedRelease?: string;
  dependencies?: string[];
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  tags?: string[];
  // Novos campos opcionais
  progress?: number; // 0-100
  assignedTo?: string;
  startDate?: string;
  completedDate?: string;
  notes?: string;
  relatedIssues?: string[];
  acceptanceCriteria?: string[];
  milestones?: RoadmapMilestone[];
  risks?: RoadmapRisk[];
}

export const roadmapItems: RoadmapItem[] = [
  // COMPLETADAS
  {
    id: '1',
    title: 'Sistema de Templates de Projetos',
    description: 'Implementação de templates pré-configurados para criação rápida de projetos estruturados.',
    status: 'completed',
    category: 'feature',
    priority: 'high',
    estimatedRelease: 'v1.0',
    impact: 'high',
    effort: 'medium',
    tags: ['automação', 'produtividade']
  },
  {
    id: '2',
    title: 'Sistema de Tags e Filtros Avançados',
    description: 'Implementação de tags customizáveis e sistema de filtros múltiplos para organização de tarefas.',
    status: 'completed',
    category: 'feature',
    priority: 'high',
    estimatedRelease: 'v1.1',
    impact: 'high',
    effort: 'medium',
    tags: ['organização', 'filtros']
  },
  {
    id: '3',
    title: 'Dashboard Interativo com Métricas',
    description: 'Dashboard completo com métricas em tempo real, gráficos e indicadores de progresso.',
    status: 'completed',
    category: 'feature',
    priority: 'high',
    estimatedRelease: 'v1.2',
    impact: 'high',
    effort: 'high',
    tags: ['métricas', 'dashboard', 'visualização']
  },
  {
    id: '4',
    title: 'Sistema de Comentários e Colaboração',
    description: 'Implementação de comentários em tarefas, anexos e sistema de notificações.',
    status: 'completed',
    category: 'feature',
    priority: 'high',
    estimatedRelease: 'v1.3',
    impact: 'high',
    effort: 'medium',
    tags: ['colaboração', 'comunicação']
  },
  {
    id: '5',
    title: 'Modo Escuro/Claro',
    description: 'Sistema de temas com suporte a modo escuro, claro e automático com persistência.',
    status: 'completed',
    category: 'ux',
    priority: 'medium',
    estimatedRelease: 'v1.4',
    impact: 'medium',
    effort: 'low',
    tags: ['ux', 'acessibilidade']
  },
  {
    id: '6',
    title: 'Busca Global e Atalhos de Teclado',
    description: 'Sistema de busca global com atalhos de teclado e ajuda interativa.',
    status: 'completed',
    category: 'feature',
    priority: 'high',
    estimatedRelease: 'v1.5',
    impact: 'high',
    effort: 'medium',
    tags: ['produtividade', 'busca']
  },
  {
    id: '7',
    title: 'Visualização de Dependências e Burndown',
    description: 'Gráficos de dependências, burndown charts e comparação de projetos.',
    status: 'completed',
    category: 'feature',
    priority: 'high',
    estimatedRelease: 'v1.6',
    impact: 'high',
    effort: 'high',
    tags: ['visualização', 'análise']
  },
  {
    id: '8',
    title: 'Glossário Expandido de QA',
    description: 'Glossário completo com mais de 150 termos organizados por categoria.',
    status: 'completed',
    category: 'feature',
    priority: 'medium',
    estimatedRelease: 'v1.7',
    impact: 'medium',
    effort: 'low',
    tags: ['documentação', 'educação']
  },

  // EM PROGRESSO
  {
    id: '9',
    title: 'Integração com Jira',
    description: 'Sincronização bidirecional de tarefas e casos de teste com Jira.',
    status: 'in-progress',
    category: 'feature',
    priority: 'high',
    estimatedRelease: 'v2.0',
    impact: 'high',
    effort: 'high',
    tags: ['integração', 'jira'],
    dependencies: ['10'],
    progress: 45,
    startDate: '2024-01-15',
    assignedTo: 'Equipe de Integração',
    milestones: [
      { id: 'm9-1', title: 'Autenticação OAuth', completed: true, date: '2024-02-01' },
      { id: 'm9-2', title: 'Sincronização de Tarefas', completed: true, date: '2024-02-15' },
      { id: 'm9-3', title: 'Sincronização de Testes', completed: false },
      { id: 'm9-4', title: 'Testes E2E', completed: false }
    ],
    acceptanceCriteria: [
      'Autenticação OAuth funcional',
      'Sincronização bidirecional de tarefas',
      'Sincronização de casos de teste',
      'Tratamento de conflitos',
      'Documentação completa'
    ],
    risks: [
      { id: 'r9-1', description: 'Limitações da API do Jira', severity: 'medium', mitigation: 'Implementar retry e cache' },
      { id: 'r9-2', description: 'Complexidade de sincronização bidirecional', severity: 'high', mitigation: 'Usar timestamps e versionamento' }
    ],
    notes: 'Prioridade alta devido à demanda dos usuários. Depende da API REST completa.'
  },
  {
    id: '10',
    title: 'API REST Completa',
    description: 'Desenvolvimento de API REST para integrações externas e automação.',
    status: 'in-progress',
    category: 'feature',
    priority: 'high',
    estimatedRelease: 'v2.0',
    impact: 'high',
    effort: 'high',
    tags: ['api', 'integração'],
    progress: 60,
    startDate: '2024-01-01',
    assignedTo: 'Equipe Backend',
    milestones: [
      { id: 'm10-1', title: 'Estrutura Base da API', completed: true, date: '2024-01-15' },
      { id: 'm10-2', title: 'Autenticação e Autorização', completed: true, date: '2024-01-30' },
      { id: 'm10-3', title: 'Endpoints de Projetos', completed: true, date: '2024-02-10' },
      { id: 'm10-4', title: 'Endpoints de Tarefas', completed: false },
      { id: 'm10-5', title: 'Documentação Swagger', completed: false }
    ],
    acceptanceCriteria: [
      'API RESTful completa',
      'Autenticação JWT',
      'Documentação Swagger/OpenAPI',
      'Rate limiting',
      'Versionamento de API'
    ],
    risks: [
      { id: 'r10-1', description: 'Performance com muitos projetos', severity: 'medium', mitigation: 'Implementar paginação e cache' }
    ]
  },
  {
    id: '11',
    title: 'Testes Automatizados E2E',
    description: 'Implementação de testes end-to-end com Playwright para garantir qualidade.',
    status: 'in-progress',
    category: 'improvement',
    priority: 'high',
    estimatedRelease: 'v1.8',
    impact: 'high',
    effort: 'medium',
    tags: ['testes', 'qualidade'],
    progress: 75,
    startDate: '2024-01-20',
    assignedTo: 'Equipe QA',
    milestones: [
      { id: 'm11-1', title: 'Setup Playwright', completed: true, date: '2024-01-25' },
      { id: 'm11-2', title: 'Testes de Fluxo Principal', completed: true, date: '2024-02-05' },
      { id: 'm11-3', title: 'CI/CD Integration', completed: false }
    ],
    acceptanceCriteria: [
      'Cobertura de fluxos principais',
      'Integração com CI/CD',
      'Relatórios de cobertura',
      'Testes em múltiplos browsers'
    ]
  },

  // PLANEJADAS
  {
    id: '12',
    title: 'Colaboração em Tempo Real',
    description: 'Sincronização em tempo real com WebSockets para múltiplos usuários.',
    status: 'planned',
    category: 'feature',
    priority: 'high',
    estimatedRelease: 'v2.1',
    impact: 'high',
    effort: 'high',
    tags: ['colaboração', 'tempo-real'],
    dependencies: ['10'],
    startDate: '2024-03-01',
    milestones: [
      { id: 'm12-1', title: 'Setup WebSocket Server', completed: false },
      { id: 'm12-2', title: 'Sincronização de Tarefas', completed: false },
      { id: 'm12-3', title: 'Presença de Usuários', completed: false },
      { id: 'm12-4', title: 'Resolução de Conflitos', completed: false }
    ],
    acceptanceCriteria: [
      'Sincronização em tempo real funcional',
      'Indicadores de presença',
      'Resolução automática de conflitos',
      'Performance adequada com 50+ usuários simultâneos'
    ],
    risks: [
      { id: 'r12-1', description: 'Complexidade de sincronização', severity: 'high', mitigation: 'Usar CRDT ou operational transforms' },
      { id: 'r12-2', description: 'Escalabilidade do WebSocket', severity: 'medium', mitigation: 'Implementar clustering' }
    ],
    notes: 'Depende criticamente da API REST. Será uma funcionalidade diferencial.'
  },
  {
    id: '13',
    title: 'Relatórios Agendados',
    description: 'Sistema de relatórios automáticos agendados por email ou exportação.',
    status: 'planned',
    category: 'feature',
    priority: 'medium',
    estimatedRelease: 'v2.2',
    impact: 'medium',
    effort: 'medium',
    tags: ['relatórios', 'automação']
  },
  {
    id: '14',
    title: 'Integração com GitHub',
    description: 'Sincronização de issues e pull requests com projetos de QA.',
    status: 'planned',
    category: 'feature',
    priority: 'medium',
    estimatedRelease: 'v2.3',
    impact: 'medium',
    effort: 'medium',
    tags: ['integração', 'github'],
    dependencies: ['10']
  },
  {
    id: '15',
    title: 'PWA (Progressive Web App)',
    description: 'Transformar aplicativo em PWA com suporte offline e instalação.',
    status: 'planned',
    category: 'improvement',
    priority: 'medium',
    estimatedRelease: 'v2.4',
    impact: 'medium',
    effort: 'high',
    tags: ['pwa', 'offline']
  },
  {
    id: '16',
    title: 'Virtualização de Listas',
    description: 'Otimização de performance com virtualização para listas grandes.',
    status: 'planned',
    category: 'performance',
    priority: 'medium',
    estimatedRelease: 'v2.5',
    impact: 'medium',
    effort: 'medium',
    tags: ['performance', 'otimização']
  },
  {
    id: '17',
    title: 'Sistema de Permissões e Roles',
    description: 'Controle de acesso baseado em roles (Admin, QA Lead, QA, Viewer).',
    status: 'planned',
    category: 'feature',
    priority: 'high',
    estimatedRelease: 'v2.6',
    impact: 'high',
    effort: 'high',
    tags: ['segurança', 'permissões']
  },
  {
    id: '18',
    title: 'Histórico de Versões de Documentos',
    description: 'Versionamento completo de documentos com diff e rollback.',
    status: 'planned',
    category: 'feature',
    priority: 'medium',
    estimatedRelease: 'v2.7',
    impact: 'medium',
    effort: 'medium',
    tags: ['documentação', 'versionamento']
  },
  {
    id: '19',
    title: 'Dashboard Personalizável',
    description: 'Widgets arrastáveis e layouts customizáveis para dashboards.',
    status: 'planned',
    category: 'ux',
    priority: 'low',
    estimatedRelease: 'v2.8',
    impact: 'low',
    effort: 'high',
    tags: ['ux', 'customização']
  },
  {
    id: '20',
    title: 'Integração com Slack/Teams',
    description: 'Notificações e comandos via Slack e Microsoft Teams.',
    status: 'planned',
    category: 'feature',
    priority: 'low',
    estimatedRelease: 'v2.9',
    impact: 'medium',
    effort: 'medium',
    tags: ['integração', 'notificações'],
    dependencies: ['10']
  },
  {
    id: '21',
    title: 'Análise Preditiva de Bugs',
    description: 'IA para prever possíveis bugs baseado em padrões históricos.',
    status: 'planned',
    category: 'feature',
    priority: 'low',
    estimatedRelease: 'v3.0',
    impact: 'high',
    effort: 'high',
    tags: ['ia', 'análise', 'predição']
  },
  {
    id: '22',
    title: 'Suporte Multi-Idioma (i18n)',
    description: 'Internacionalização completa com suporte a PT-BR, EN, ES.',
    status: 'planned',
    category: 'improvement',
    priority: 'low',
    estimatedRelease: 'v3.1',
    impact: 'medium',
    effort: 'medium',
    tags: ['i18n', 'internacionalização']
  },
  {
    id: '23',
    title: 'Testes de Acessibilidade Automatizados',
    description: 'Integração com ferramentas de acessibilidade (axe-core) para testes automáticos.',
    status: 'planned',
    category: 'improvement',
    priority: 'medium',
    estimatedRelease: 'v3.2',
    impact: 'high',
    effort: 'medium',
    tags: ['acessibilidade', 'a11y', 'testes']
  },
  {
    id: '24',
    title: 'Mobile App (React Native)',
    description: 'Aplicativo mobile nativo para iOS e Android.',
    status: 'planned',
    category: 'feature',
    priority: 'low',
    estimatedRelease: 'v3.5',
    impact: 'high',
    effort: 'high',
    tags: ['mobile', 'app']
  },

  // FUTURAS
  {
    id: '25',
    title: 'Machine Learning para Otimização de Testes',
    description: 'IA para sugerir casos de teste e otimizar cobertura automaticamente.',
    status: 'future',
    category: 'feature',
    priority: 'low',
    estimatedRelease: 'v4.0',
    impact: 'high',
    effort: 'high',
    tags: ['ia', 'ml', 'otimização']
  },
  {
    id: '26',
    title: 'Blockchain para Auditoria',
    description: 'Uso de blockchain para garantir imutabilidade de logs de auditoria.',
    status: 'future',
    category: 'security',
    priority: 'low',
    estimatedRelease: 'v4.5',
    impact: 'low',
    effort: 'high',
    tags: ['blockchain', 'segurança', 'auditoria']
  },
  {
    id: '27',
    title: 'Realidade Aumentada para Testes',
    description: 'Visualização de dependências e fluxos em realidade aumentada.',
    status: 'future',
    category: 'feature',
    priority: 'low',
    estimatedRelease: 'v5.0',
    impact: 'low',
    effort: 'very-high',
    tags: ['ar', 'visualização', 'inovação']
  }
];

export const getRoadmapByStatus = (status: RoadmapItem['status']): RoadmapItem[] => {
  return roadmapItems.filter(item => item.status === status);
};

export const getRoadmapByCategory = (category: RoadmapItem['category']): RoadmapItem[] => {
  return roadmapItems.filter(item => item.category === category);
};

export const getRoadmapByPriority = (priority: RoadmapItem['priority']): RoadmapItem[] => {
  return roadmapItems.filter(item => item.priority === priority);
};

export const getRoadmapStats = () => {
  return {
    total: roadmapItems.length,
    completed: roadmapItems.filter(i => i.status === 'completed').length,
    inProgress: roadmapItems.filter(i => i.status === 'in-progress').length,
    planned: roadmapItems.filter(i => i.status === 'planned').length,
    future: roadmapItems.filter(i => i.status === 'future').length,
    byCategory: {
      feature: roadmapItems.filter(i => i.category === 'feature').length,
      improvement: roadmapItems.filter(i => i.category === 'improvement').length,
      'bug-fix': roadmapItems.filter(i => i.category === 'bug-fix').length,
      performance: roadmapItems.filter(i => i.category === 'performance').length,
      security: roadmapItems.filter(i => i.category === 'security').length,
      ux: roadmapItems.filter(i => i.category === 'ux').length
    },
    byPriority: {
      high: roadmapItems.filter(i => i.priority === 'high').length,
      medium: roadmapItems.filter(i => i.priority === 'medium').length,
      low: roadmapItems.filter(i => i.priority === 'low').length
    }
  };
};

