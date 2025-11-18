/**
 * Sistema de Trilha de Aprendizado para QA
 * Estrutura progressiva que ensina conceitos de QA através de prática
 */

export interface LearningModule {
    id: string;
    title: string;
    description: string;
    icon: string;
    level: 'Iniciante' | 'Intermediário' | 'Avançado';
    estimatedTime: string; // Ex: "15 minutos"
    lessons: Lesson[];
    prerequisites?: string[]; // IDs de módulos que devem ser completados antes
}

export interface Lesson {
    id: string;
    title: string;
    description: string;
    type: 'teoria' | 'pratica' | 'revisao';
    content: LessonContent;
    practicalTask?: PracticalTask;
    completed?: boolean;
}

export interface LessonContent {
    sections: ContentSection[];
    keyPoints: string[];
    examples?: Example[];
}

export interface ContentSection {
    title: string;
    content: string;
    codeExample?: string;
    imageUrl?: string;
}

export interface Example {
    title: string;
    description: string;
    scenario: string;
    solution: string;
}

export interface PracticalTask {
    id: string;
    title: string;
    description: string;
    instructions: string[];
    expectedOutcome: string;
    hints?: string[];
    projectTemplate?: string; // ID do template de projeto a usar
    validationCriteria: string[];
}

export const learningPath: LearningModule[] = [
    {
        id: 'modulo-1-fundamentos',
        title: 'Fundamentos de QA',
        description: 'Aprenda os conceitos básicos de Quality Assurance e por que é importante',
        icon: '📚',
        level: 'Iniciante',
        estimatedTime: '20 minutos',
        lessons: [
            {
                id: 'aula-1-1-o-que-e-qa',
                title: 'O que é QA?',
                description: 'Entenda o que significa Quality Assurance e seu papel no desenvolvimento de software',
                type: 'teoria',
                content: {
                    sections: [
                        {
                            title: 'Definição de QA',
                            content: `Quality Assurance (QA) é o processo sistemático de garantir que produtos de software atendam aos requisitos especificados e funcionem corretamente antes de serem entregues aos usuários.

QA não é apenas "testar" - é uma abordagem preventiva que visa identificar e corrigir problemas o mais cedo possível no ciclo de desenvolvimento.`
                        },
                        {
                            title: 'Por que QA é importante?',
                            content: `• Reduz custos: Encontrar bugs cedo é muito mais barato que corrigir em produção
• Melhora a qualidade: Garante que o software funciona como esperado
• Aumenta confiança: Usuários confiam mais em produtos de qualidade
• Acelera desenvolvimento: Evita retrabalho e retornos`
                        },
                        {
                            title: 'Diferença entre QA e QC',
                            content: `QA (Quality Assurance): Processo preventivo que foca em processos e metodologias
QC (Quality Control): Processo reativo que foca em encontrar defeitos através de testes

Em resumo: QA previne problemas, QC encontra problemas.`
                        }
                    ],
                    keyPoints: [
                        'QA é preventivo, não apenas reativo',
                        'QA reduz custos ao encontrar problemas cedo',
                        'QA e QC são complementares, não opostos'
                    ]
                }
            },
            {
                id: 'aula-1-2-ciclo-de-vida',
                title: 'Ciclo de Vida do Software',
                description: 'Entenda as fases do desenvolvimento e onde QA se encaixa',
                type: 'teoria',
                content: {
                    sections: [
                        {
                            title: 'Fases do SDLC (Software Development Life Cycle)',
                            content: `1. **Request (Solicitação)**: Cliente solicita uma funcionalidade
2. **Analysis (Análise)**: Equipe analisa requisitos e viabilidade
3. **Design (Design)**: Arquitetura e design são criados
4. **Development (Desenvolvimento)**: Código é escrito
5. **Test (Teste)**: QA testa o software
6. **Release (Lançamento)**: Software é preparado para produção
7. **Deploy (Implantação)**: Software vai para produção
8. **Operate (Operação)**: Software está em uso
9. **Monitor (Monitoramento)**: Performance e erros são monitorados`
                        },
                        {
                            title: 'Onde QA se encaixa?',
                            content: `QA deve estar presente em TODAS as fases, não apenas na fase de Teste!

**Shift Left Testing**: Movendo atividades de teste para mais cedo no ciclo
- Análise de requisitos: Validar se requisitos são testáveis
- Design: Revisar designs para identificar potenciais problemas
- Desenvolvimento: Testes unitários e de integração
- Teste: Testes funcionais, de regressão, etc.
- Produção: Monitoramento e feedback`
                        }
                    ],
                    keyPoints: [
                        'QA deve estar presente em todas as fases',
                        'Shift Left Testing reduz custos e melhora qualidade',
                        'Quanto mais cedo encontrar problemas, melhor'
                    ],
                    examples: [
                        {
                            title: 'Exemplo: Bug encontrado em diferentes fases',
                            description: 'Custo de corrigir um bug aumenta exponencialmente',
                            scenario: 'Um bug de validação de formulário',
                            solution: `• Fase de Design: Corrigir custa 1 unidade de tempo
• Fase de Desenvolvimento: Corrigir custa 5 unidades
• Fase de Teste: Corrigir custa 10 unidades
• Em Produção: Corrigir custa 50+ unidades`
                        }
                    ]
                }
            },
            {
                id: 'aula-1-3-pratica-criar-projeto',
                title: 'Prática: Criar seu Primeiro Projeto',
                description: 'Crie um projeto de teste para praticar os conceitos aprendidos',
                type: 'pratica',
                content: {
                    sections: [
                        {
                            title: 'Objetivo',
                            content: 'Criar um projeto de QA seguindo as melhores práticas que você acabou de aprender.'
                        }
                    ],
                    keyPoints: [
                        'Prática é essencial para aprender QA',
                        'Projetos reais ajudam a consolidar conhecimento'
                    ]
                },
                practicalTask: {
                    id: 'tarefa-1-criar-projeto',
                    title: 'Criar Projeto de Prática',
                    description: 'Crie um projeto chamado "Meu Primeiro Projeto QA" para praticar',
                    instructions: [
                        '1. Clique no botão "+ Novo Projeto"',
                        '2. Escolha o template "Aplicação Web"',
                        '3. Nomeie o projeto como "Meu Primeiro Projeto QA"',
                        '4. Adicione uma descrição explicando que é um projeto de aprendizado',
                        '5. Clique em "Criar Projeto"'
                    ],
                    expectedOutcome: 'Um novo projeto será criado e você poderá ver o dashboard do projeto',
                    hints: [
                        'O botão "+ Novo Projeto" está no canto superior direito',
                        'Templates ajudam a começar rapidamente',
                        'Você pode editar o projeto depois se precisar'
                    ],
                    projectTemplate: 'web-app',
                    validationCriteria: [
                        'Projeto foi criado com sucesso',
                        'Projeto aparece na lista de projetos',
                        'Dashboard do projeto está visível'
                    ]
                }
            }
        ]
    },
    {
        id: 'modulo-2-tipos-de-teste',
        title: 'Tipos de Teste',
        description: 'Aprenda sobre diferentes tipos de teste e quando usar cada um',
        icon: '🧪',
        level: 'Iniciante',
        estimatedTime: '30 minutos',
        prerequisites: ['modulo-1-fundamentos'],
        lessons: [
            {
                id: 'aula-2-1-piramide-de-testes',
                title: 'A Pirâmide de Testes',
                description: 'Entenda a estrutura ideal de testes em um projeto',
                type: 'teoria',
                content: {
                    sections: [
                        {
                            title: 'O que é a Pirâmide de Testes?',
                            content: `A Pirâmide de Testes é um modelo que mostra a distribuição ideal de testes em um projeto:

**Base (70%) - Testes Unitários**
- Testam componentes individuais isoladamente
- Rápidos e baratos de executar
- Exemplo: Testar uma função que calcula desconto

**Meio (20%) - Testes de Integração**
- Testam como componentes trabalham juntos
- Mais lentos que unitários
- Exemplo: Testar integração entre API e banco de dados

**Topo (10%) - Testes E2E (End-to-End)**
- Testam o fluxo completo do usuário
- Mais lentos e caros
- Exemplo: Testar todo o processo de compra em um e-commerce`
                        },
                        {
                            title: 'Por que essa distribuição?',
                            content: `• Testes unitários são rápidos e baratos - podemos ter muitos
• Testes E2E são lentos e caros - devemos ter poucos
• A maioria dos bugs é encontrada em testes unitários
• Testes E2E validam que tudo funciona junto`
                        }
                    ],
                    keyPoints: [
                        'Mais testes unitários, menos testes E2E',
                        'Testes unitários são mais rápidos e baratos',
                        'Cada nível da pirâmide tem seu propósito'
                    ]
                }
            },
            {
                id: 'aula-2-2-tipos-funcionais',
                title: 'Testes Funcionais',
                description: 'Aprenda sobre testes que validam funcionalidades',
                type: 'teoria',
                content: {
                    sections: [
                        {
                            title: 'O que são Testes Funcionais?',
                            content: `Testes funcionais verificam se o software faz o que deveria fazer, conforme os requisitos.

**Tipos principais:**
• **Teste de Caixa Preta**: Testa sem conhecer o código interno
• **Teste de Caixa Branca**: Testa conhecendo o código interno
• **Teste de Caixa Cinza**: Combinação de ambos`
                        },
                        {
                            title: 'Exemplos de Testes Funcionais',
                            content: `• Login: Verificar se usuário consegue fazer login com credenciais corretas
• Cadastro: Verificar se formulário valida dados corretamente
• Busca: Verificar se busca retorna resultados relevantes
• Compra: Verificar se processo de compra funciona do início ao fim`
                        }
                    ],
                    keyPoints: [
                        'Testes funcionais validam o que o software faz',
                        'Podem ser caixa preta, branca ou cinza',
                        'Focam em requisitos e especificações'
                    ]
                }
            },
            {
                id: 'aula-2-3-pratica-criar-casos-teste',
                title: 'Prática: Criar Casos de Teste',
                description: 'Crie casos de teste para uma funcionalidade real',
                type: 'pratica',
                content: {
                    sections: [
                        {
                            title: 'Objetivo',
                            content: 'Criar casos de teste funcionais para uma tarefa do seu projeto'
                        }
                    ],
                    keyPoints: [
                        'Casos de teste devem ser claros e objetivos',
                        'Devem cobrir cenários positivos e negativos'
                    ]
                },
                practicalTask: {
                    id: 'tarefa-2-criar-casos-teste',
                    title: 'Criar Casos de Teste',
                    description: 'Crie pelo menos 3 casos de teste para uma tarefa do seu projeto',
                    instructions: [
                        '1. Abra o projeto que você criou anteriormente',
                        '2. Vá para a aba "Tarefas"',
                        '3. Crie uma nova tarefa ou selecione uma existente',
                        '4. Clique em "Gerar Casos de Teste com IA" (ou crie manualmente)',
                        '5. Revise os casos de teste gerados',
                        '6. Adicione pelo menos um caso de teste manualmente',
                        '7. Execute um caso de teste e marque como "Passou" ou "Falhou"'
                    ],
                    expectedOutcome: 'Você terá casos de teste criados e pelo menos um executado',
                    hints: [
                        'Casos de teste devem ter: Descrição, Passos, Resultado Esperado',
                        'Teste cenários positivos (o que deveria funcionar) e negativos (o que não deveria funcionar)',
                        'Use a IA para gerar casos, mas sempre revise e ajuste'
                    ],
                    validationCriteria: [
                        'Pelo menos 3 casos de teste foram criados',
                        'Casos de teste têm descrição clara',
                        'Pelo menos um caso foi executado'
                    ]
                }
            }
        ]
    },
    {
        id: 'modulo-3-bdd',
        title: 'BDD - Behavior Driven Development',
        description: 'Aprenda a escrever testes usando linguagem de negócio',
        icon: '📝',
        level: 'Intermediário',
        estimatedTime: '25 minutos',
        prerequisites: ['modulo-2-tipos-de-teste'],
        lessons: [
            {
                id: 'aula-3-1-o-que-e-bdd',
                title: 'O que é BDD?',
                description: 'Entenda Behavior Driven Development e sua importância',
                type: 'teoria',
                content: {
                    sections: [
                        {
                            title: 'Definição de BDD',
                            content: `BDD (Behavior Driven Development) é uma metodologia que usa linguagem natural para descrever comportamentos do software.

**Objetivo**: Criar uma ponte entre negócio e tecnologia usando uma linguagem comum.`
                        },
                        {
                            title: 'Sintaxe Gherkin',
                            content: `BDD usa a sintaxe Gherkin para escrever cenários:

\`\`\`gherkin
Dado que estou na página de login
Quando preencho o email "usuario@exemplo.com"
E preencho a senha "senha123"
E clico em "Entrar"
Então devo ser redirecionado para o dashboard
\`\`\`

**Palavras-chave:**
- **Dado**: Pré-condições (estado inicial)
- **Quando**: Ações do usuário
- **E**: Continuação da ação anterior
- **Então**: Resultado esperado`
                        }
                    ],
                    keyPoints: [
                        'BDD usa linguagem de negócio, não técnica',
                        'Gherkin é a sintaxe padrão para BDD',
                        'BDD facilita comunicação entre equipes'
                    ]
                }
            },
            {
                id: 'aula-3-2-pratica-criar-bdd',
                title: 'Prática: Criar Cenários BDD',
                description: 'Crie cenários BDD para uma funcionalidade',
                type: 'pratica',
                content: {
                    sections: [
                        {
                            title: 'Objetivo',
                            content: 'Criar cenários BDD usando a sintaxe Gherkin'
                        }
                    ],
                    keyPoints: [
                        'Cenários BDD devem ser escritos do ponto de vista do usuário',
                        'Use linguagem simples e clara'
                    ]
                },
                practicalTask: {
                    id: 'tarefa-3-criar-bdd',
                    title: 'Criar Cenários BDD',
                    description: 'Crie pelo menos 2 cenários BDD para uma tarefa',
                    instructions: [
                        '1. Selecione uma tarefa no seu projeto',
                        '2. Vá para a seção "Cenários BDD"',
                        '3. Clique em "Gerar Cenários BDD com IA"',
                        '4. Revise os cenários gerados',
                        '5. Crie manualmente pelo menos um cenário adicional',
                        '6. Certifique-se de usar a sintaxe Gherkin corretamente'
                    ],
                    expectedOutcome: 'Você terá cenários BDD criados seguindo a sintaxe Gherkin',
                    hints: [
                        'Cenários devem começar com "Dado", "Quando", "Então"',
                        'Use "E" para continuar ações',
                        'Escreva do ponto de vista do usuário final'
                    ],
                    validationCriteria: [
                        'Pelo menos 2 cenários BDD foram criados',
                        'Cenários seguem a sintaxe Gherkin',
                        'Cenários descrevem comportamento do usuário'
                    ]
                }
            }
        ]
    },
    {
        id: 'modulo-4-metricas',
        title: 'Métricas e Análise',
        description: 'Aprenda a medir qualidade e acompanhar progresso',
        icon: '📊',
        level: 'Intermediário',
        estimatedTime: '20 minutos',
        prerequisites: ['modulo-2-tipos-de-teste'],
        lessons: [
            {
                id: 'aula-4-1-metricas-importantes',
                title: 'Métricas Importantes em QA',
                description: 'Conheça as métricas essenciais para medir qualidade',
                type: 'teoria',
                content: {
                    sections: [
                        {
                            title: 'Métricas de Cobertura',
                            content: `**Cobertura de Testes**: Percentual de código testado
• Meta ideal: 80%+ de cobertura
• Mostra quanto do código está protegido por testes

**Cobertura de Requisitos**: Percentual de requisitos com testes
• Meta ideal: 100%
• Garante que todos os requisitos foram validados`
                        },
                        {
                            title: 'Métricas de Qualidade',
                            content: `**Taxa de Passagem**: Percentual de testes que passam
• Meta ideal: 95%+
• Indica estabilidade do software

**Densidade de Defeitos**: Número de bugs por funcionalidade
• Quanto menor, melhor
• Ajuda a identificar áreas problemáticas

**Tempo de Resolução**: Tempo médio para corrigir bugs
• Quanto menor, melhor
• Indica eficiência da equipe`
                        }
                    ],
                    keyPoints: [
                        'Métricas ajudam a tomar decisões baseadas em dados',
                        'Cobertura de testes é importante, mas qualidade também',
                        'Métricas devem ser acompanhadas regularmente'
                    ]
                }
            },
            {
                id: 'aula-4-2-pratica-analisar-metricas',
                title: 'Prática: Analisar Métricas',
                description: 'Use o dashboard para analisar métricas do seu projeto',
                type: 'pratica',
                content: {
                    sections: [
                        {
                            title: 'Objetivo',
                            content: 'Entender como ler e interpretar métricas no dashboard'
                        }
                    ],
                    keyPoints: [
                        'Dashboard mostra métricas em tempo real',
                        'Gráficos ajudam a visualizar tendências'
                    ]
                },
                practicalTask: {
                    id: 'tarefa-4-analisar-metricas',
                    title: 'Analisar Métricas do Projeto',
                    description: 'Explore o dashboard e identifique métricas importantes',
                    instructions: [
                        '1. Abra o dashboard do seu projeto',
                        '2. Observe as métricas principais (total de tarefas, casos de teste, etc.)',
                        '3. Verifique a taxa de passagem dos testes',
                        '4. Analise os gráficos de progresso',
                        '5. Identifique áreas que precisam de atenção',
                        '6. Anote pelo menos 3 insights sobre seu projeto'
                    ],
                    expectedOutcome: 'Você entenderá como ler métricas e identificar problemas',
                    hints: [
                        'Métricas vermelhas ou amarelas indicam problemas',
                        'Compare métricas atuais com metas estabelecidas',
                        'Use gráficos para identificar tendências'
                    ],
                    validationCriteria: [
                        'Dashboard foi visualizado',
                        'Pelo menos 3 métricas foram identificadas',
                        'Insights foram anotados'
                    ]
                }
            }
        ]
    }
];

/**
 * Obtém o módulo atual baseado no progresso do usuário
 */
export const getCurrentModule = (completedModules: string[]): LearningModule | null => {
    for (const module of learningPath) {
        // Verifica se o módulo já foi completado
        if (completedModules.includes(module.id)) {
            continue;
        }
        
        // Verifica se os pré-requisitos foram atendidos
        if (module.prerequisites) {
            const prerequisitesMet = module.prerequisites.every(prereq => 
                completedModules.includes(prereq)
            );
            if (!prerequisitesMet) {
                continue;
            }
        }
        
        return module;
    }
    return null;
};

/**
 * Obtém o progresso geral do usuário
 */
export const getLearningProgress = (completedModules: string[], completedLessons: string[]) => {
    const totalModules = learningPath.length;
    const totalLessons = learningPath.reduce((sum, module) => sum + module.lessons.length, 0);
    
    const completedModulesCount = completedModules.length;
    const completedLessonsCount = completedLessons.length;
    
    return {
        modulesProgress: (completedModulesCount / totalModules) * 100,
        lessonsProgress: (completedLessonsCount / totalLessons) * 100,
        totalModules,
        totalLessons,
        completedModules: completedModulesCount,
        completedLessons: completedLessonsCount
    };
};

