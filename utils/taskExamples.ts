import { JiraTaskType, TeamRole, TaskPriority, BugSeverity } from '../types';

export interface TaskExample {
    id: string;
    title: string;
    description: string;
    type: JiraTaskType;
    priority: TaskPriority;
    owner: TeamRole;
    assignee: TeamRole;
    severity?: BugSeverity;
    tags?: string[];
}

export const taskExamples: Record<JiraTaskType, TaskExample[]> = {
    'Epic': [
        {
            id: 'EPIC-001',
            title: 'Sistema de Autenticação',
            description: `Implementar sistema completo de autenticação de usuários.

**Contexto:**
Usuários precisam acessar o sistema de forma segura e gerenciar suas contas.

**Requisitos:**
- Login com email e senha
- Recuperação de senha
- Gerenciamento de perfil
- Logout seguro

**Critérios de aceite:**
- Usuário consegue fazer login
- Usuário consegue recuperar senha
- Usuário consegue atualizar perfil
- Sessão expira após inatividade`,
            type: 'Epic',
            priority: 'Alta',
            owner: 'Product',
            assignee: 'Product',
            tags: ['autenticação', 'segurança', 'usuário']
        }
    ],
    'História': [
        {
            id: 'STORY-001',
            title: 'Usuário pode fazer login com email e senha',
            description: `Implementar funcionalidade de login com email e senha.

**Contexto:**
Usuários precisam acessar o sistema de forma segura.

**Requisitos:**
- Campo de email (validar formato)
- Campo de senha (mínimo 8 caracteres)
- Botão de login
- Mensagem de erro se credenciais inválidas
- Redirecionamento após login bem-sucedido

**Critérios de aceite:**
- Login funciona com email válido e senha correta
- Erro exibido para email inválido
- Erro exibido para senha incorreta
- Senha oculta durante digitação
- Redirecionamento para dashboard após login`,
            type: 'História',
            priority: 'Alta',
            owner: 'Product',
            assignee: 'Dev',
            tags: ['login', 'autenticação', 'segurança']
        }
    ],
    'Tarefa': [
        {
            id: 'TASK-001',
            title: 'Configurar ambiente de testes',
            description: `Configurar ambiente de testes para execução automatizada.

**Contexto:**
Precisamos de um ambiente isolado para executar testes automatizados.

**Requisitos:**
- Instalar dependências de teste
- Configurar banco de dados de teste
- Configurar variáveis de ambiente
- Documentar processo de setup

**Critérios de aceite:**
- Ambiente pode ser configurado seguindo a documentação
- Todos os testes passam no ambiente configurado`,
            type: 'Tarefa',
            priority: 'Média',
            owner: 'Dev',
            assignee: 'Dev',
            tags: ['configuração', 'testes', 'ambiente']
        }
    ],
    'Bug': [
        {
            id: 'BUG-001',
            title: 'Botão de salvar não funciona no formulário de cadastro',
            description: `O botão "Salvar" no formulário de cadastro não está salvando os dados.

**Contexto:**
Usuários estão reportando que ao preencher o formulário de cadastro e clicar em "Salvar", nada acontece.

**Passos para reproduzir:**
1. Acessar página de cadastro
2. Preencher todos os campos obrigatórios
3. Clicar em "Salvar"
4. Observar que nada acontece

**Resultado esperado:**
Dados devem ser salvos e usuário deve ser redirecionado.

**Resultado observado:**
Nada acontece ao clicar no botão.

**Severidade:**
Alto - Bloqueia funcionalidade principal`,
            type: 'Bug',
            priority: 'Urgente',
            owner: 'QA',
            assignee: 'Dev',
            severity: 'Alto',
            tags: ['bug', 'formulário', 'crítico']
        }
    ]
};

export const getTaskExample = (type: JiraTaskType, index: number = 0): TaskExample | null => {
    const examples = taskExamples[type];
    if (!examples || examples.length === 0) return null;
    return examples[index % examples.length];
};

