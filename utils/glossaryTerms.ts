export interface GlossaryTerm {
  term: string;
  definition: string;
  category:
    | 'Geral'
    | 'Testes'
    | 'Metodologias'
    | 'Ferramentas'
    | 'Métricas'
    | 'Processos'
    | 'Técnicas'
    | 'Padrões';
  relatedTerms?: string[];
}

export const glossaryTerms: GlossaryTerm[] = [
  // GERAL
  {
    term: 'QA (Quality Assurance)',
    definition:
      'Garantia de Qualidade - Processo sistemático de garantir que produtos e serviços atendam aos requisitos de qualidade especificados.',
    category: 'Geral',
    relatedTerms: ['QC', 'Testes', 'Controle de Qualidade'],
  },
  {
    term: 'QC (Quality Control)',
    definition:
      'Controle de Qualidade - Processo de inspeção e teste de produtos para identificar defeitos antes da liberação.',
    category: 'Geral',
    relatedTerms: ['QA', 'Testes', 'Inspeção'],
  },
  {
    term: 'Bug',
    definition: 'Erro ou defeito em software que causa comportamento inesperado ou incorreto.',
    category: 'Geral',
    relatedTerms: ['Defeito', 'Issue', 'Incidente'],
  },
  {
    term: 'Defeito',
    definition: 'Imperfeição ou deficiência em um componente ou sistema que pode causar falha.',
    category: 'Geral',
    relatedTerms: ['Bug', 'Erro', 'Falha'],
  },
  {
    term: 'Issue',
    definition:
      'Problema identificado durante o desenvolvimento ou uso do software que precisa ser resolvido.',
    category: 'Geral',
    relatedTerms: ['Bug', 'Defeito', 'Ticket'],
  },
  {
    term: 'Ticket',
    definition:
      'Registro formal de um problema, solicitação ou tarefa no sistema de gerenciamento.',
    category: 'Geral',
    relatedTerms: ['Issue', 'Bug', 'Tarefa'],
  },

  // TESTES
  {
    term: 'Teste Unitário',
    definition:
      'Teste de unidades individuais de código (funções, métodos) isoladamente para verificar comportamento correto.',
    category: 'Testes',
    relatedTerms: ['Teste de Integração', 'TDD', 'Cobertura de Código'],
  },
  {
    term: 'Teste de Integração',
    definition:
      'Teste que verifica a interação entre diferentes módulos ou componentes do sistema.',
    category: 'Testes',
    relatedTerms: ['Teste Unitário', 'Teste de Sistema', 'API Testing'],
  },
  {
    term: 'Teste de Sistema',
    definition:
      'Teste do sistema completo e integrado para verificar se atende aos requisitos especificados.',
    category: 'Testes',
    relatedTerms: ['Teste de Integração', 'Teste End-to-End', 'Teste de Aceitação'],
  },
  {
    term: 'Teste End-to-End (E2E)',
    definition:
      'Teste que valida o fluxo completo de uma funcionalidade do início ao fim, simulando uso real.',
    category: 'Testes',
    relatedTerms: ['Teste de Sistema', 'Teste de Aceitação', 'Automação'],
  },
  {
    term: 'Teste de Aceitação',
    definition:
      'Teste realizado para determinar se o sistema atende aos critérios de aceitação do usuário.',
    category: 'Testes',
    relatedTerms: ['UAT', 'Teste de Sistema', 'Critérios de Aceitação'],
  },
  {
    term: 'UAT (User Acceptance Testing)',
    definition:
      'Teste de Aceitação do Usuário - Teste realizado pelos usuários finais para validar se o sistema atende às necessidades de negócio.',
    category: 'Testes',
    relatedTerms: ['Teste de Aceitação', 'Beta Testing'],
  },
  {
    term: 'Teste de Regressão',
    definition:
      'Teste que verifica se funcionalidades existentes ainda funcionam após mudanças no código.',
    category: 'Testes',
    relatedTerms: ['Automação', 'Smoke Test', 'Sanity Test'],
  },
  {
    term: 'Teste de Fumaça (Smoke Test)',
    definition:
      'Teste rápido e superficial para verificar se as funcionalidades básicas do sistema estão funcionando.',
    category: 'Testes',
    relatedTerms: ['Sanity Test', 'Teste de Regressão'],
  },
  {
    term: 'Sanity Test',
    definition:
      'Teste rápido para verificar se uma funcionalidade específica funciona após uma mudança.',
    category: 'Testes',
    relatedTerms: ['Smoke Test', 'Teste de Regressão'],
  },
  {
    term: 'Teste de Performance',
    definition:
      'Teste que avalia o desempenho do sistema sob diferentes condições de carga e volume.',
    category: 'Testes',
    relatedTerms: ['Load Testing', 'Stress Testing', 'Volume Testing'],
  },
  {
    term: 'Load Testing',
    definition:
      'Teste de carga - Avalia o comportamento do sistema sob carga esperada de uso normal.',
    category: 'Testes',
    relatedTerms: ['Stress Testing', 'Performance Testing'],
  },
  {
    term: 'Stress Testing',
    definition:
      'Teste de estresse - Avalia o comportamento do sistema sob carga extrema além da capacidade normal.',
    category: 'Testes',
    relatedTerms: ['Load Testing', 'Volume Testing'],
  },
  {
    term: 'Teste de Segurança',
    definition:
      'Teste que identifica vulnerabilidades e garante que o sistema está protegido contra ameaças.',
    category: 'Testes',
    relatedTerms: ['Penetration Testing', 'Vulnerabilidade', 'OWASP'],
  },
  {
    term: 'Penetration Testing',
    definition:
      'Teste de penetração - Simulação de ataques para identificar vulnerabilidades de segurança.',
    category: 'Testes',
    relatedTerms: ['Teste de Segurança', 'Ethical Hacking'],
  },
  {
    term: 'Teste Exploratório',
    definition:
      'Abordagem de teste que combina aprendizado, design e execução de testes simultaneamente.',
    category: 'Testes',
    relatedTerms: ['Teste Ad-Hoc', 'Session-Based Testing'],
  },
  {
    term: 'Teste Ad-Hoc',
    definition: 'Teste não estruturado realizado sem planejamento formal ou documentação prévia.',
    category: 'Testes',
    relatedTerms: ['Teste Exploratório', 'Teste Informal'],
  },
  {
    term: 'Teste de Acessibilidade',
    definition: 'Teste que verifica se o sistema é acessível para usuários com deficiências.',
    category: 'Testes',
    relatedTerms: ['WCAG', 'A11y', 'Inclusão'],
  },
  {
    term: 'A11y',
    definition:
      'Abreviação de "Accessibility" (A + 11 letras + y) - Acessibilidade em interfaces digitais.',
    category: 'Testes',
    relatedTerms: ['WCAG', 'Teste de Acessibilidade'],
  },
  {
    term: 'WCAG',
    definition:
      'Web Content Accessibility Guidelines - Diretrizes internacionais para acessibilidade web.',
    category: 'Padrões',
    relatedTerms: ['A11y', 'Teste de Acessibilidade'],
  },
  {
    term: 'Teste de Compatibilidade',
    definition:
      'Teste que verifica se o software funciona em diferentes ambientes, navegadores ou dispositivos.',
    category: 'Testes',
    relatedTerms: ['Cross-Browser Testing', 'Teste Multi-Plataforma'],
  },
  {
    term: 'Cross-Browser Testing',
    definition: 'Teste que verifica a compatibilidade do software em diferentes navegadores web.',
    category: 'Testes',
    relatedTerms: ['Teste de Compatibilidade'],
  },

  // METODOLOGIAS
  {
    term: 'Ágil',
    definition:
      'Metodologia de desenvolvimento iterativa e incremental que valoriza colaboração e resposta a mudanças.',
    category: 'Metodologias',
    relatedTerms: ['Scrum', 'Kanban', 'Sprint'],
  },
  {
    term: 'Scrum',
    definition:
      'Framework ágil para gerenciamento de projetos com sprints, cerimônias e papéis definidos.',
    category: 'Metodologias',
    relatedTerms: ['Sprint', 'Product Owner', 'Scrum Master'],
  },
  {
    term: 'Sprint',
    definition:
      'Período de tempo fixo (geralmente 1-4 semanas) para desenvolver um incremento de produto.',
    category: 'Metodologias',
    relatedTerms: ['Scrum', 'Backlog', 'Incremento'],
  },
  {
    term: 'Kanban',
    definition: 'Metodologia visual de gerenciamento de trabalho usando quadros e cartões.',
    category: 'Metodologias',
    relatedTerms: ['WIP', 'Fluxo', 'Visualização'],
  },
  {
    term: 'WIP (Work In Progress)',
    definition:
      'Trabalho em Progresso - Limite de itens que podem estar em execução simultaneamente.',
    category: 'Metodologias',
    relatedTerms: ['Kanban', 'Fluxo'],
  },
  {
    term: 'BDD (Behavior-Driven Development)',
    definition:
      'Desenvolvimento Orientado a Comportamento - Abordagem que usa linguagem natural para descrever comportamentos.',
    category: 'Metodologias',
    relatedTerms: ['TDD', 'Gherkin', 'Given-When-Then'],
  },
  {
    term: 'TDD (Test-Driven Development)',
    definition:
      'Desenvolvimento Orientado a Testes - Prática de escrever testes antes do código de produção.',
    category: 'Metodologias',
    relatedTerms: ['BDD', 'Teste Unitário', 'Refatoração'],
  },
  {
    term: 'Gherkin',
    definition:
      'Linguagem de domínio específica usada para escrever cenários de teste em formato legível.',
    category: 'Metodologias',
    relatedTerms: ['BDD', 'Given-When-Then', 'Cucumber'],
  },
  {
    term: 'Given-When-Then',
    definition:
      'Estrutura para escrever cenários de teste: Dado (contexto), Quando (ação), Então (resultado esperado).',
    category: 'Metodologias',
    relatedTerms: ['BDD', 'Gherkin', 'Cenário'],
  },
  {
    term: 'Shift-Left',
    definition: 'Abordagem de mover testes para mais cedo no ciclo de desenvolvimento.',
    category: 'Metodologias',
    relatedTerms: ['Teste Precoce', 'Prevenção de Defeitos'],
  },
  {
    term: 'Shift-Right',
    definition: 'Abordagem de realizar testes em produção ou ambientes similares à produção.',
    category: 'Metodologias',
    relatedTerms: ['Teste em Produção', 'Monitoramento'],
  },
  {
    term: 'DevOps',
    definition:
      'Cultura e conjunto de práticas que unifica desenvolvimento e operações para acelerar entrega.',
    category: 'Metodologias',
    relatedTerms: ['CI/CD', 'Automação', 'Infraestrutura como Código'],
  },
  {
    term: 'CI/CD',
    definition:
      'Continuous Integration / Continuous Deployment - Integração e deploy contínuos automatizados.',
    category: 'Metodologias',
    relatedTerms: ['DevOps', 'Pipeline', 'Automação'],
  },
  {
    term: 'Pipeline',
    definition: 'Fluxo automatizado de processos (build, teste, deploy) que executa em sequência.',
    category: 'Metodologias',
    relatedTerms: ['CI/CD', 'Automação'],
  },

  // FERRAMENTAS
  {
    term: 'Selenium',
    definition:
      'Framework de automação de testes para aplicações web que suporta múltiplos navegadores.',
    category: 'Ferramentas',
    relatedTerms: ['WebDriver', 'Automação Web'],
  },
  {
    term: 'WebDriver',
    definition:
      'Protocolo e API para controlar navegadores programaticamente em testes automatizados.',
    category: 'Ferramentas',
    relatedTerms: ['Selenium', 'Automação'],
  },
  {
    term: 'Cypress',
    definition:
      'Ferramenta moderna de teste end-to-end para aplicações web com execução em tempo real.',
    category: 'Ferramentas',
    relatedTerms: ['E2E Testing', 'Automação'],
  },
  {
    term: 'Playwright',
    definition:
      'Framework de automação de testes que suporta múltiplos navegadores com uma única API.',
    category: 'Ferramentas',
    relatedTerms: ['Automação', 'Cross-Browser'],
  },
  {
    term: 'Jest',
    definition:
      'Framework de testes JavaScript focado em simplicidade e suporte a grandes projetos.',
    category: 'Ferramentas',
    relatedTerms: ['Teste Unitário', 'JavaScript'],
  },
  {
    term: 'JUnit',
    definition: 'Framework de testes unitários para Java amplamente utilizado.',
    category: 'Ferramentas',
    relatedTerms: ['Teste Unitário', 'Java'],
  },
  {
    term: 'Postman',
    definition: 'Ferramenta para desenvolvimento e teste de APIs com interface gráfica.',
    category: 'Ferramentas',
    relatedTerms: ['API Testing', 'REST', 'HTTP'],
  },
  {
    term: 'JMeter',
    definition: 'Ferramenta open-source para testes de performance e carga de aplicações web.',
    category: 'Ferramentas',
    relatedTerms: ['Performance Testing', 'Load Testing'],
  },
  {
    term: 'Jira',
    definition:
      'Ferramenta de gerenciamento de projetos e rastreamento de issues amplamente usada.',
    category: 'Ferramentas',
    relatedTerms: ['Gestão de Projetos', 'Tracking'],
  },
  {
    term: 'TestRail',
    definition: 'Ferramenta de gerenciamento de casos de teste e execução de testes.',
    category: 'Ferramentas',
    relatedTerms: ['Gestão de Testes', 'Casos de Teste'],
  },
  {
    term: 'Zephyr',
    definition: 'Plugin do Jira para gerenciamento de testes e execução de casos de teste.',
    category: 'Ferramentas',
    relatedTerms: ['Jira', 'Gestão de Testes'],
  },
  {
    term: 'Cucumber',
    definition: 'Ferramenta que suporta BDD permitindo escrever testes em linguagem natural.',
    category: 'Ferramentas',
    relatedTerms: ['BDD', 'Gherkin'],
  },
  {
    term: 'Appium',
    definition:
      'Ferramenta de automação de testes para aplicativos móveis nativos, híbridos e web.',
    category: 'Ferramentas',
    relatedTerms: ['Mobile Testing', 'Automação'],
  },
  {
    term: 'SonarQube',
    definition: 'Ferramenta de análise estática de código que detecta bugs e vulnerabilidades.',
    category: 'Ferramentas',
    relatedTerms: ['Análise de Código', 'Qualidade'],
  },

  // MÉTRICAS
  {
    term: 'Cobertura de Código',
    definition:
      'Percentual de código executado durante os testes, indicando quanto do código foi testado.',
    category: 'Métricas',
    relatedTerms: ['Cobertura de Testes', 'Branch Coverage', 'Line Coverage'],
  },
  {
    term: 'Cobertura de Testes',
    definition: 'Medida de quanto do código ou funcionalidades são cobertas por testes.',
    category: 'Métricas',
    relatedTerms: ['Cobertura de Código', 'Métricas de Qualidade'],
  },
  {
    term: 'Branch Coverage',
    definition:
      'Cobertura de ramos - Percentual de ramos condicionais (if/else) executados nos testes.',
    category: 'Métricas',
    relatedTerms: ['Cobertura de Código', 'Line Coverage'],
  },
  {
    term: 'Line Coverage',
    definition:
      'Cobertura de linhas - Percentual de linhas de código executadas durante os testes.',
    category: 'Métricas',
    relatedTerms: ['Cobertura de Código', 'Branch Coverage'],
  },
  {
    term: 'Taxa de Defeitos',
    definition:
      'Número de defeitos encontrados por unidade de medida (por funcionalidade, por hora, etc.).',
    category: 'Métricas',
    relatedTerms: ['Densidade de Defeitos', 'Métricas de Qualidade'],
  },
  {
    term: 'Densidade de Defeitos',
    definition:
      'Número de defeitos por tamanho do software (linhas de código, pontos de função, etc.).',
    category: 'Métricas',
    relatedTerms: ['Taxa de Defeitos', 'Métricas'],
  },
  {
    term: 'Taxa de Passagem',
    definition: 'Percentual de testes que passaram em relação ao total de testes executados.',
    category: 'Métricas',
    relatedTerms: ['Métricas de Teste', 'Qualidade'],
  },
  {
    term: 'MTBF (Mean Time Between Failures)',
    definition: 'Tempo Médio Entre Falhas - Tempo médio que um sistema funciona antes de falhar.',
    category: 'Métricas',
    relatedTerms: ['Confiabilidade', 'Disponibilidade'],
  },
  {
    term: 'MTTR (Mean Time To Repair)',
    definition:
      'Tempo Médio Para Reparo - Tempo médio necessário para reparar um sistema após falha.',
    category: 'Métricas',
    relatedTerms: ['Disponibilidade', 'Confiabilidade'],
  },
  {
    term: 'Eficiência de Teste',
    definition: 'Razão entre defeitos encontrados em testes e defeitos encontrados em produção.',
    category: 'Métricas',
    relatedTerms: ['Efetividade', 'Qualidade'],
  },
  {
    term: 'Escape Rate',
    definition:
      'Taxa de escape - Percentual de defeitos que escaparam dos testes e foram para produção.',
    category: 'Métricas',
    relatedTerms: ['Eficiência de Teste', 'Qualidade'],
  },

  // PROCESSOS
  {
    term: 'Plano de Teste',
    definition:
      'Documento que descreve escopo, abordagem, recursos e cronograma das atividades de teste.',
    category: 'Processos',
    relatedTerms: ['Estratégia de Teste', 'Documentação'],
  },
  {
    term: 'Estratégia de Teste',
    definition:
      'Abordagem geral para testar um sistema, incluindo tipos de teste e níveis de teste.',
    category: 'Processos',
    relatedTerms: ['Plano de Teste', 'Abordagem'],
  },
  {
    term: 'Caso de Teste',
    definition:
      'Conjunto de condições, ações e resultados esperados para verificar uma funcionalidade específica.',
    category: 'Processos',
    relatedTerms: ['Script de Teste', 'Cenário de Teste'],
  },
  {
    term: 'Cenário de Teste',
    definition: 'Descrição de uma situação de uso do sistema que será testada.',
    category: 'Processos',
    relatedTerms: ['Caso de Teste', 'BDD'],
  },
  {
    term: 'Script de Teste',
    definition: 'Sequência de passos detalhados para executar um teste específico.',
    category: 'Processos',
    relatedTerms: ['Caso de Teste', 'Automação'],
  },
  {
    term: 'Test Data',
    definition: 'Dados usados para executar testes, incluindo dados válidos e inválidos.',
    category: 'Processos',
    relatedTerms: ['Preparação de Dados', 'Ambiente de Teste'],
  },
  {
    term: 'Ambiente de Teste',
    definition: 'Configuração de hardware, software e dados usada para executar testes.',
    category: 'Processos',
    relatedTerms: ['Ambiente', 'Configuração'],
  },
  {
    term: 'Staging',
    definition: 'Ambiente que replica produção usado para testes finais antes do deploy.',
    category: 'Processos',
    relatedTerms: ['Ambiente de Teste', 'Pre-Produção'],
  },
  {
    term: 'Pre-Produção',
    definition: 'Ambiente idêntico à produção usado para validação final antes do release.',
    category: 'Processos',
    relatedTerms: ['Staging', 'Produção'],
  },
  {
    term: 'Reproduzibilidade',
    definition: 'Capacidade de reproduzir um defeito ou resultado de teste consistentemente.',
    category: 'Processos',
    relatedTerms: ['Rastreabilidade', 'Documentação'],
  },
  {
    term: 'Rastreabilidade',
    definition: 'Capacidade de rastrear requisitos até casos de teste e resultados de execução.',
    category: 'Processos',
    relatedTerms: ['Matriz de Rastreabilidade', 'Documentação'],
  },
  {
    term: 'Matriz de Rastreabilidade',
    definition: 'Tabela que mapeia requisitos para casos de teste, garantindo cobertura completa.',
    category: 'Processos',
    relatedTerms: ['Rastreabilidade', 'Cobertura'],
  },
  {
    term: 'Critérios de Entrada',
    definition: 'Condições que devem ser atendidas antes de iniciar uma fase de teste.',
    category: 'Processos',
    relatedTerms: ['Critérios de Saída', 'Gate'],
  },
  {
    term: 'Critérios de Saída',
    definition: 'Condições que devem ser atendidas para concluir uma fase de teste.',
    category: 'Processos',
    relatedTerms: ['Critérios de Entrada', 'Gate'],
  },
  {
    term: 'Gate',
    definition:
      'Ponto de decisão no processo onde critérios específicos devem ser atendidos para prosseguir.',
    category: 'Processos',
    relatedTerms: ['Critérios de Entrada', 'Critérios de Saída'],
  },
  {
    term: 'Defect Lifecycle',
    definition: 'Ciclo de vida de um defeito desde a descoberta até o fechamento.',
    category: 'Processos',
    relatedTerms: ['Bug Tracking', 'Workflow'],
  },
  {
    term: 'Severidade',
    definition: 'Impacto de um defeito no sistema ou usuário (Crítica, Alta, Média, Baixa).',
    category: 'Processos',
    relatedTerms: ['Prioridade', 'Impacto'],
  },
  {
    term: 'Prioridade',
    definition: 'Urgência para corrigir um defeito baseada em necessidades de negócio.',
    category: 'Processos',
    relatedTerms: ['Severidade', 'Urgência'],
  },
  {
    term: 'Repro Steps',
    definition: 'Passos para Reproduzir - Sequência de ações que reproduzem um defeito.',
    category: 'Processos',
    relatedTerms: ['Bug Report', 'Reproduzibilidade'],
  },
  {
    term: 'Bug Report',
    definition:
      'Documento que descreve um defeito encontrado, incluindo passos para reproduzir e resultado esperado.',
    category: 'Processos',
    relatedTerms: ['Repro Steps', 'Issue'],
  },
  {
    term: 'Retest',
    definition: 'Reexecução de um teste que falhou anteriormente após correção do defeito.',
    category: 'Processos',
    relatedTerms: ['Verificação', 'Validação'],
  },
  {
    term: 'Regression Testing',
    definition:
      'Teste de regressão - Verificação de que funcionalidades existentes ainda funcionam após mudanças.',
    category: 'Processos',
    relatedTerms: ['Teste de Regressão', 'Automação'],
  },
  {
    term: 'Verificação',
    definition:
      'Processo de verificar se o produto foi construído corretamente (atende especificações).',
    category: 'Processos',
    relatedTerms: ['Validação', 'Conformidade'],
  },
  {
    term: 'Validação',
    definition:
      'Processo de validar se o produto correto foi construído (atende necessidades do usuário).',
    category: 'Processos',
    relatedTerms: ['Verificação', 'Aceitação'],
  },

  // TÉCNICAS
  {
    term: 'Equivalence Partitioning',
    definition:
      'Técnica de teste que divide dados de entrada em classes equivalentes para reduzir casos de teste.',
    category: 'Técnicas',
    relatedTerms: ['Boundary Value Analysis', 'Técnicas de Teste'],
  },
  {
    term: 'Boundary Value Analysis',
    definition:
      'Análise de Valores Limite - Técnica que testa valores nos limites das classes de equivalência.',
    category: 'Técnicas',
    relatedTerms: ['Equivalence Partitioning', 'Técnicas de Teste'],
  },
  {
    term: 'Decision Table',
    definition:
      'Tabela de Decisão - Técnica que organiza combinações de condições e ações em formato tabular.',
    category: 'Técnicas',
    relatedTerms: ['Técnicas de Teste', 'Lógica de Negócio'],
  },
  {
    term: 'State Transition',
    definition: 'Técnica que testa transições entre diferentes estados do sistema.',
    category: 'Técnicas',
    relatedTerms: ['Máquina de Estados', 'Técnicas de Teste'],
  },
  {
    term: 'Use Case Testing',
    definition:
      'Técnica de teste baseada em casos de uso que descrevem interações entre atores e sistema.',
    category: 'Técnicas',
    relatedTerms: ['Cenários', 'Casos de Uso'],
  },
  {
    term: 'Pairwise Testing',
    definition:
      'Técnica que testa todas as combinações de pares de parâmetros para reduzir casos de teste.',
    category: 'Técnicas',
    relatedTerms: ['Combinatorial Testing', 'Otimização'],
  },
  {
    term: 'Error Guessing',
    definition: 'Técnica baseada em experiência para adivinhar onde erros podem ocorrer.',
    category: 'Técnicas',
    relatedTerms: ['Teste Exploratório', 'Experiência'],
  },
  {
    term: 'Monkey Testing',
    definition: 'Técnica de teste aleatório onde o sistema é usado de forma imprevisível.',
    category: 'Técnicas',
    relatedTerms: ['Teste Aleatório', 'Chaos Engineering'],
  },
  {
    term: 'Chaos Engineering',
    definition: 'Prática de injetar falhas intencionalmente em sistemas para testar resiliência.',
    category: 'Técnicas',
    relatedTerms: ['Resiliência', 'Teste de Falhas'],
  },
  {
    term: 'Mutation Testing',
    definition:
      'Técnica que modifica o código (mutantes) para verificar se os testes detectam as mudanças.',
    category: 'Técnicas',
    relatedTerms: ['Qualidade de Teste', 'Cobertura'],
  },
  {
    term: 'Property-Based Testing',
    definition:
      'Técnica que testa propriedades do código com múltiplas entradas geradas automaticamente.',
    category: 'Técnicas',
    relatedTerms: ['Teste Automatizado', 'Geração de Dados'],
  },
  {
    term: 'Mock',
    definition:
      'Objeto simulado que imita comportamento de dependências para isolar unidades de teste.',
    category: 'Técnicas',
    relatedTerms: ['Stub', 'Fake', 'Test Doubles'],
  },
  {
    term: 'Stub',
    definition:
      'Implementação simplificada de uma dependência que retorna respostas pré-definidas.',
    category: 'Técnicas',
    relatedTerms: ['Mock', 'Fake', 'Test Doubles'],
  },
  {
    term: 'Fake',
    definition: 'Implementação funcional simplificada de uma dependência usada em testes.',
    category: 'Técnicas',
    relatedTerms: ['Mock', 'Stub', 'Test Doubles'],
  },
  {
    term: 'Test Doubles',
    definition:
      'Termo genérico para objetos que substituem dependências em testes (Mock, Stub, Fake, etc.).',
    category: 'Técnicas',
    relatedTerms: ['Mock', 'Stub', 'Isolamento'],
  },

  // PADRÕES
  {
    term: 'ISTQB',
    definition:
      'International Software Testing Qualifications Board - Organização que define padrões e certificações de teste.',
    category: 'Padrões',
    relatedTerms: ['Certificação', 'Padrões de Teste'],
  },
  {
    term: 'ISO 25010',
    definition:
      'Padrão ISO que define modelo de qualidade de software com características e subcaracterísticas.',
    category: 'Padrões',
    relatedTerms: ['Qualidade de Software', 'Padrões'],
  },
  {
    term: 'IEEE 829',
    definition: 'Padrão IEEE para documentação de testes de software.',
    category: 'Padrões',
    relatedTerms: ['Documentação', 'Padrões'],
  },
  {
    term: 'OWASP',
    definition:
      'Open Web Application Security Project - Organização que fornece padrões e ferramentas de segurança.',
    category: 'Padrões',
    relatedTerms: ['Segurança', 'Vulnerabilidades'],
  },
  {
    term: 'OWASP Top 10',
    definition: 'Lista das 10 vulnerabilidades web mais críticas publicada pela OWASP.',
    category: 'Padrões',
    relatedTerms: ['OWASP', 'Segurança'],
  },
  {
    term: 'ISO 27001',
    definition: 'Padrão internacional para sistemas de gestão de segurança da informação.',
    category: 'Padrões',
    relatedTerms: ['Segurança', 'ISO'],
  },
  {
    term: 'GDPR',
    definition: 'General Data Protection Regulation - Regulamento europeu de proteção de dados.',
    category: 'Padrões',
    relatedTerms: ['Privacidade', 'Proteção de Dados'],
  },
  {
    term: 'PCI DSS',
    definition:
      'Payment Card Industry Data Security Standard - Padrão de segurança para dados de cartão de crédito.',
    category: 'Padrões',
    relatedTerms: ['Segurança', 'Dados Financeiros'],
  },
];

// Função para buscar termos
export const searchGlossaryTerms = (query: string): GlossaryTerm[] => {
  const lowerQuery = query.toLowerCase();
  return glossaryTerms.filter(
    term =>
      term.term.toLowerCase().includes(lowerQuery) ||
      term.definition.toLowerCase().includes(lowerQuery) ||
      term.category.toLowerCase().includes(lowerQuery)
  );
};

// Função para obter termos por categoria
export const getTermsByCategory = (category: GlossaryTerm['category']): GlossaryTerm[] => {
  return glossaryTerms.filter(term => term.category === category);
};

// Função para obter termos relacionados
export const getRelatedTerms = (termName: string): GlossaryTerm[] => {
  const term = glossaryTerms.find(t => t.term === termName);
  if (!term || !term.relatedTerms) return [];

  return glossaryTerms.filter(t =>
    term.relatedTerms!.some(
      related =>
        t.term.toLowerCase().includes(related.toLowerCase()) ||
        related.toLowerCase().includes(t.term.toLowerCase())
    )
  );
};
