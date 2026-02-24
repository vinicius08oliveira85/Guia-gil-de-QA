/**
 * Conteúdo de ajuda contextual para o aplicativo
 * Explicações que aparecem em tooltips e modais de ajuda
 */

export const helpContent = {
  project: {
    create: {
      title: 'Criar Projeto',
      content: `Um projeto é o container principal para organizar suas atividades de QA.

**O que incluir:**
• Nome claro e descritivo
• Descrição dos objetivos
• Template (opcional) para começar rapidamente

**Dica:** Use templates para projetos comuns como "Aplicação Web" ou "API REST" para ter uma estrutura inicial pronta.`,
    },
    dashboard: {
      title: 'Dashboard do Projeto',
      content: `O dashboard mostra uma visão geral do seu projeto.

**Métricas principais:**
• Total de tarefas e status
• Casos de teste executados
• Taxa de passagem
• Progresso por fase

**Como usar:**
• Use os filtros de período para ver progresso ao longo do tempo
• Clique nos gráficos para mais detalhes
• Acompanhe o Score de Saúde do projeto`,
    },
  },
  task: {
    create: {
      title: 'Criar Tarefa',
      content: `Tarefas representam funcionalidades ou bugs que precisam ser testados.

**Tipos de Tarefa:**
• **História**: Nova funcionalidade
• **Bug**: Defeito encontrado
• **Tarefa**: Trabalho técnico
• **Epic**: Grupo de histórias relacionadas

**Campos importantes:**
• **Descrição**: Detalhe o que precisa ser testado
• **Tags**: Use para categorizar (ex: "login", "pagamento")
• **Prioridade**: Ajude a focar no que é mais importante`,
    },
    fields: {
      id: {
        title: 'ID da Tarefa',
        content: `O ID é um identificador único para sua tarefa.

**Formato recomendado:** PROJ-123 ou TASK-001

**Exemplos:**
• PROJ-001 (primeira tarefa do projeto)
• LOGIN-001 (tarefa relacionada a login)
• BUG-042 (bug número 42)

**Dica:** Use um padrão consistente para facilitar a busca e organização.`,
      },
      title: {
        title: 'Título da Tarefa',
        content: `O título deve ser claro e descritivo.

**Bom exemplo:**
• "Implementar login com email e senha"
• "Corrigir erro ao salvar formulário"
• "Adicionar validação de CPF"

**Evite:**
• "Tarefa 1" (muito genérico)
• "Corrigir bug" (não especifica qual bug)
• "Teste" (não explica o que testar)

**Dica:** O título deve permitir que qualquer pessoa entenda rapidamente o que precisa ser feito.`,
      },
      type: {
        title: 'Tipo de Tarefa',
        content: `Escolha o tipo que melhor descreve sua tarefa:

**Epic:** Grupo grande de funcionalidades relacionadas
• Exemplo: "Sistema de Autenticação" (contém várias histórias)

**História:** Nova funcionalidade ou melhoria
• Exemplo: "Usuário pode fazer login com email"
• Geralmente vem de requisitos do produto

**Tarefa:** Trabalho técnico ou de suporte
• Exemplo: "Configurar ambiente de testes"
• Não é uma funcionalidade visível ao usuário

**Bug:** Defeito encontrado no sistema
• Exemplo: "Botão de salvar não funciona"
• Sempre deve ter severidade definida`,
      },
      priority: {
        title: 'Prioridade',
        content: `A prioridade indica a importância da tarefa:

**Urgente:** Deve ser feito imediatamente
• Bloqueia outras tarefas
• Impacta produção ou clientes

**Alta:** Importante, fazer em breve
• Funcionalidade crítica
• Prazo próximo

**Média:** Importante, mas pode esperar
• Funcionalidade normal
• Sem pressa específica

**Baixa:** Pode ser feito quando houver tempo
• Melhorias ou nice-to-have
• Sem impacto imediato

**Dica:** Priorize baseado no impacto no negócio, não apenas na dificuldade técnica.`,
      },
      severity: {
        title: 'Severidade (apenas para Bugs)',
        content: `A severidade indica o impacto do bug:

**Crítico:** Sistema inutilizável
• Aplicativo não inicia
• Perda de dados
• Bloqueia funcionalidade principal

**Alto:** Funcionalidade importante quebrada
• Funcionalidade não funciona
• Workaround disponível, mas difícil

**Médio:** Funcionalidade parcialmente quebrada
• Funcionalidade funciona com limitações
• Workaround fácil disponível

**Baixo:** Problema menor
• Erro visual
• Texto incorreto
• Melhoria de UX

**Dica:** Combine severidade com prioridade. Um bug crítico geralmente é urgente.`,
      },
      parentId: {
        title: 'Vincular ao Epic',
        content: `Epics agrupam várias histórias relacionadas.

**Quando usar:**
• Sua tarefa faz parte de uma funcionalidade maior
• Exemplo: "Login com Google" pertence ao Epic "Sistema de Autenticação"

**Benefícios:**
• Organiza tarefas relacionadas
• Facilita visualização do progresso
• Ajuda no planejamento

**Como escolher:**
• Selecione o Epic que melhor descreve o grupo
• Se não houver Epic, deixe "Nenhum"
• Você pode criar um Epic depois se necessário`,
      },
      owner: {
        title: 'Dono (Owner)',
        content: `O Owner é quem define os requisitos e aceita o trabalho.

**Product:** Gerente de Produto ou Product Owner
• Define o que deve ser feito
• Aceita se está de acordo com requisitos
• Responsável pela visão do produto

**QA:** Analista de QA
• Define estratégia de testes
• Aceita se testes estão adequados
• Responsável pela qualidade

**Dev:** Desenvolvedor
• Define arquitetura técnica
• Aceita se implementação está correta
• Responsável pela solução técnica

**Dica:** O Owner geralmente é quem vai validar se a tarefa está completa.`,
      },
      assignee: {
        title: 'Responsável (Assignee)',
        content: `O Assignee é quem vai executar a tarefa.

**Product:** Product Owner ou Analista de Negócios
• Geralmente para tarefas de requisitos
• Documentação de produto

**QA:** Analista de QA ou Testador
• Criação de casos de teste
• Execução de testes
• Reportar bugs

**Dev:** Desenvolvedor
• Implementação de código
• Correção de bugs
• Configurações técnicas

**Dica:** O Assignee é quem está trabalhando ativamente na tarefa agora.`,
      },
      description: {
        title: 'Descrição da Tarefa',
        content: `A descrição deve explicar detalhadamente o que precisa ser feito.

**O que incluir:**
• Contexto: Por que isso é necessário?
• Requisitos: O que deve ser feito?
• Critérios de aceite: Como saber se está completo?
• Exemplos: Casos de uso específicos

**Exemplo de boa descrição:**
"Implementar funcionalidade de login com email e senha.

**Contexto:** Usuários precisam acessar o sistema de forma segura.

**Requisitos:**
- Campo de email (validar formato)
- Campo de senha (mínimo 8 caracteres)
- Botão de login
- Mensagem de erro se credenciais inválidas

**Critérios de aceite:**
- Login funciona com email válido
- Erro exibido para email inválido
- Senha oculta durante digitação"`,
      },
      tags: {
        title: 'Tags',
        content: `Tags ajudam a categorizar e encontrar tarefas rapidamente.

**Como usar:**
• Use tags para agrupar tarefas relacionadas
• Exemplos: "login", "pagamento", "mobile", "api"
• Você pode usar múltiplas tags

**Benefícios:**
• Busca rápida de tarefas relacionadas
• Filtros por categoria
• Visualização de áreas do sistema

**Dica:** Crie tags consistentes. Use "login" ao invés de "login" e "Login" (duplicados).`,
      },
    },
    testCases: {
      title: 'Casos de Teste',
      content: `Casos de teste são passos específicos para validar uma funcionalidade.

**Estrutura:**
• **Descrição**: O que está sendo testado
• **Passos**: Como executar o teste
• **Resultado Esperado**: O que deveria acontecer

**Status:**
• **Não Executado**: Ainda não foi testado
• **Passou**: Teste executado com sucesso
• **Falhou**: Teste encontrou um problema

**Dica:** Use a IA para gerar casos de teste automaticamente, mas sempre revise e ajuste conforme necessário.`,
    },
    bdd: {
      title: 'Cenários BDD',
      content: `BDD (Behavior Driven Development) usa linguagem de negócio para descrever comportamentos.

**Sintaxe Gherkin:**
• **Dado**: Estado inicial (pré-condições)
• **Quando**: Ação do usuário
• **E**: Continuação da ação
• **Então**: Resultado esperado

**Exemplo:**
\`\`\`
Dado que estou na página de login
Quando preencho o email "usuario@exemplo.com"
E preencho a senha "senha123"
E clico em "Entrar"
Então devo ser redirecionado para o dashboard
\`\`\`

**Benefícios:**
• Facilita comunicação entre equipes
• Documenta comportamento do sistema
• Serve como base para automação`,
    },
  },
  metrics: {
    coverage: {
      title: 'Cobertura de Testes',
      content: `Cobertura mede quanto do seu código está protegido por testes.

**Tipos:**
• **Cobertura de Código**: Percentual de linhas testadas
• **Cobertura de Requisitos**: Percentual de requisitos com testes

**Meta ideal:** 80%+ de cobertura de código

**Importante:** Cobertura alta não garante qualidade. Foque em testes que realmente validam comportamento importante.`,
    },
    passRate: {
      title: 'Taxa de Passagem',
      content: `Taxa de passagem mostra quantos testes estão passando.

**Cálculo:** (Testes que Passaram / Total de Testes) × 100

**Interpretação:**
• **95%+**: Excelente, software estável
• **80-95%**: Bom, mas alguns problemas
• **<80%**: Precisa atenção, muitos problemas

**Dica:** Acompanhe a tendência ao longo do tempo. Se está caindo, pode indicar regressões.`,
    },
  },
  phases: {
    sdlc: {
      title: 'Ciclo de Vida (SDLC)',
      content: `SDLC (Software Development Life Cycle) são as fases do desenvolvimento.

**Fases principais:**
1. **Request**: Cliente solicita funcionalidade
2. **Analysis**: Análise de requisitos
3. **Design**: Arquitetura e design
4. **Development**: Desenvolvimento
5. **Test**: Testes
6. **Release**: Preparação para produção
7. **Deploy**: Implantação
8. **Operate**: Operação
9. **Monitor**: Monitoramento

**QA em todas as fases:** QA não deve estar apenas na fase de Teste. Participe desde o início para prevenir problemas.`,
    },
    shiftLeft: {
      title: 'Shift Left Testing',
      content: `Shift Left é mover atividades de teste para mais cedo no ciclo.

**Benefícios:**
• Encontrar bugs mais cedo (mais barato)
• Melhorar qualidade
• Reduzir retrabalho
• Acelerar entrega

**Como fazer:**
• Revisar requisitos na fase de Analysis
• Validar designs na fase de Design
• Testes unitários durante Development
• Testes de integração antes de Release

**Resultado:** Menos bugs em produção, maior qualidade.`,
    },
  },
  glossary: {
    title: 'Glossário de Termos',
    content: `O glossário contém mais de 150 termos de QA.

**Como usar:**
• Busque por termos específicos
• Filtre por categoria
• Clique em um termo para ver detalhes completos
• Navegue por termos relacionados

**Categorias:**
• Geral: Conceitos básicos
• Testes: Tipos e técnicas
• Metodologias: Agile, Scrum, etc.
• Ferramentas: Ferramentas populares
• Métricas: KPIs e indicadores
• Processos: Fluxos e procedimentos`,
  },
};
