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

**Dica:** Use templates para projetos comuns como "Aplicação Web" ou "API REST" para ter uma estrutura inicial pronta.`
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
• Acompanhe o Score de Saúde do projeto`
        }
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
• **Prioridade**: Ajude a focar no que é mais importante`
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

**Dica:** Use a IA para gerar casos de teste automaticamente, mas sempre revise e ajuste conforme necessário.`
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
• Serve como base para automação`
        }
    },
    metrics: {
        coverage: {
            title: 'Cobertura de Testes',
            content: `Cobertura mede quanto do seu código está protegido por testes.

**Tipos:**
• **Cobertura de Código**: Percentual de linhas testadas
• **Cobertura de Requisitos**: Percentual de requisitos com testes

**Meta ideal:** 80%+ de cobertura de código

**Importante:** Cobertura alta não garante qualidade. Foque em testes que realmente validam comportamento importante.`
        },
        passRate: {
            title: 'Taxa de Passagem',
            content: `Taxa de passagem mostra quantos testes estão passando.

**Cálculo:** (Testes que Passaram / Total de Testes) × 100

**Interpretação:**
• **95%+**: Excelente, software estável
• **80-95%**: Bom, mas alguns problemas
• **<80%**: Precisa atenção, muitos problemas

**Dica:** Acompanhe a tendência ao longo do tempo. Se está caindo, pode indicar regressões.`
        }
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

**QA em todas as fases:** QA não deve estar apenas na fase de Teste. Participe desde o início para prevenir problemas.`
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

**Resultado:** Menos bugs em produção, maior qualidade.`
        }
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
• Processos: Fluxos e procedimentos`
    }
};

