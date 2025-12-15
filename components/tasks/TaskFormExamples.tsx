import { JiraTaskType } from '../../types';

export interface TaskExample {
    id: string;
    title: string;
    description: string;
    type: JiraTaskType;
    priority: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
    tags: string[];
}

export const taskExamples: TaskExample[] = [
    {
        id: 'EX-001',
        title: 'Implementar login com email e senha',
        description: `**Contexto:** Usuários precisam acessar o sistema de forma segura.

**Requisitos:**
- Campo de email (validar formato)
- Campo de senha (mínimo 8 caracteres, incluir maiúscula, minúscula e número)
- Botão de login
- Mensagem de erro se credenciais inválidas
- Redirecionamento após login bem-sucedido

**Critérios de aceite:**
- Login funciona com email válido e senha correta
- Erro exibido para email inválido
- Erro exibido para senha incorreta
- Senha oculta durante digitação
- Validação de formato de email em tempo real`,
        type: 'História',
        priority: 'Alta',
        tags: ['login', 'autenticação', 'segurança']
    },
    {
        id: 'EX-002',
        title: 'Corrigir erro ao salvar formulário de cadastro',
        description: `**Contexto:** Usuários estão reportando que o formulário de cadastro não salva os dados.

**Problema:**
- Ao clicar em "Salvar", nada acontece
- Dados preenchidos são perdidos
- Nenhuma mensagem de erro é exibida

**Passos para reproduzir:**
1. Acessar página de cadastro
2. Preencher todos os campos obrigatórios
3. Clicar em "Salvar"
4. Observar que nada acontece

**Resultado esperado:**
- Formulário deve salvar os dados
- Mensagem de sucesso deve ser exibida
- Dados devem ser persistidos no banco de dados`,
        type: 'Bug',
        priority: 'Urgente',
        tags: ['bug', 'formulário', 'cadastro']
    },
    {
        id: 'EX-003',
        title: 'Sistema de Notificações',
        description: `**Contexto:** Usuários precisam ser notificados sobre eventos importantes no sistema.

**Requisitos:**
- Notificações em tempo real
- Diferentes tipos de notificação (sucesso, erro, aviso, info)
- Histórico de notificações
- Opção de marcar como lida
- Opção de excluir notificações

**Critérios de aceite:**
- Notificações aparecem automaticamente quando eventos ocorrem
- Usuário pode ver histórico de notificações
- Notificações podem ser marcadas como lidas
- Notificações podem ser excluídas`,
        type: 'Epic',
        priority: 'Média',
        tags: ['notificações', 'UX', 'sistema']
    },
    {
        id: 'EX-004',
        title: 'Configurar ambiente de testes automatizados',
        description: `**Contexto:** Precisamos configurar um ambiente dedicado para execução de testes automatizados.

**Tarefas:**
- Instalar ferramentas de teste (Jest, Cypress)
- Configurar CI/CD para execução automática
- Criar scripts de setup do ambiente
- Documentar processo de configuração

**Critérios de aceite:**
- Ambiente configurado e funcionando
- Testes executam automaticamente no CI/CD
- Documentação completa disponível`,
        type: 'Tarefa',
        priority: 'Média',
        tags: ['configuração', 'testes', 'CI/CD']
    }
];

export const getTaskExample = (type?: JiraTaskType): TaskExample | null => {
    if (!type) {
        return taskExamples[0]; // Retorna primeiro exemplo por padrão
    }
    const example = taskExamples.find(ex => ex.type === type);
    return example || taskExamples[0];
};

