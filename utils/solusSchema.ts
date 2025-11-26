export interface ApiFieldDescriptor {
    name: string;
    type: string;
    description: string;
    example?: string;
    required?: boolean;
}

export interface ApiTableSchema {
    table: string;
    label: string;
    description: string;
    totalHint?: string;
    primaryKey?: string;
    relations?: string[];
    defaultFilters?: string[];
    statuses?: string[];
    notes?: string[];
    fields: ApiFieldDescriptor[];
}

export const solusSchema: ApiTableSchema[] = [
    {
        table: 'patients',
        label: 'Pacientes internados',
        description: 'Registra todos os pacientes ativos e históricos de internação.',
        totalHint: '~54.000 registros',
        primaryKey: 'id',
        relations: ['hospitals', 'programs', 'bed_management_history', 'wait_tracking tables'],
        defaultFilters: ['alta_fim=is.null', 'hospital=eq.<NOME>', 'criticidade_tipo=eq.<0-3>'],
        notes: [
            'criticidade_tipo: 0=Padrao, 1=24h, 2=48h, 3=72h',
            'Use paginação com limit/offset para grandes volumes'
        ],
        fields: [
            { name: 'id', type: 'number', description: 'Identificador interno do paciente' },
            { name: 'paciente', type: 'string', description: 'Nome completo do paciente', example: 'JOAO SILVA' },
            { name: 'cpf', type: 'string', description: 'CPF sem máscara', example: '12345678901' },
            { name: 'hospital', type: 'string', description: 'Nome do hospital atual' },
            { name: 'programa', type: 'string', description: 'Programa de saúde vinculado', example: 'Mãe Curitibana' },
            { name: 'leito', type: 'string', description: 'Identificador do leito atual', example: '101A' },
            { name: 'data_internacao', type: 'date', description: 'Data/hora da entrada no hospital' },
            { name: 'alta_inicio', type: 'date|null', description: 'Data prevista de alta' },
            { name: 'alta_fim', type: 'date|null', description: 'Data de alta efetiva (null = internado)' },
            { name: 'criticidade_tipo', type: 'number', description: 'Nível de criticidade (0-3)', example: '2' },
            { name: 'permanencia_dias', type: 'number', description: 'Dias internado (calculado)' },
            { name: 'sexo', type: 'string', description: 'Sexo biológico cadastrado' },
            { name: 'idade', type: 'number', description: 'Idade em anos' },
            { name: 'cid_principal', type: 'string', description: 'Código CID-10 principal' },
            { name: 'observacao', type: 'string', description: 'Observações do caso' },
            { name: 'created_at', type: 'timestamp', description: 'Data de criação do registro' },
            { name: 'updated_at', type: 'timestamp', description: 'Última atualização' }
        ]
    },
    {
        table: 'hospitals',
        label: 'Hospitais',
        description: 'Catálogo dos hospitais integrados ao sistema.',
        totalHint: '6 registros',
        primaryKey: 'id',
        notes: ['Use para filtros de pacientes e filas'],
        fields: [
            { name: 'id', type: 'number', description: 'Identificador do hospital' },
            { name: 'nome', type: 'string', description: 'Nome oficial' },
            { name: 'cnpj', type: 'string', description: 'CNPJ do hospital' },
            { name: 'municipio', type: 'string', description: 'Cidade' },
            { name: 'uf', type: 'string', description: 'Estado (UF)' },
            { name: 'tipo', type: 'string', description: 'Tipo de unidade (CTI, UPA, etc.)' },
            { name: 'created_at', type: 'timestamp', description: 'Data de cadastro' },
            { name: 'updated_at', type: 'timestamp', description: 'Última atualização' }
        ]
    },
    {
        table: 'programs',
        label: 'Programas de saúde',
        description: 'Programas ou iniciativas vinculadas às internações.',
        totalHint: '9 registros',
        primaryKey: 'id',
        fields: [
            { name: 'id', type: 'number', description: 'Identificador do programa' },
            { name: 'nome', type: 'string', description: 'Nome do programa' },
            { name: 'descricao', type: 'string', description: 'Descrição resumida' },
            { name: 'responsavel', type: 'string', description: 'Responsável pelo programa' },
            { name: 'ativo', type: 'boolean', description: 'Flag de disponibilidade' },
            { name: 'created_at', type: 'timestamp', description: 'Data de criação' },
            { name: 'updated_at', type: 'timestamp', description: 'Última atualização' }
        ]
    },
    {
        table: 'cid_codes',
        label: 'CID-10',
        description: 'Referência completa dos códigos CID-10.',
        totalHint: '~14.000 registros',
        primaryKey: 'id',
        defaultFilters: ['codigo=eq.A00', 'descricao=ilike.*pneumonia*'],
        fields: [
            { name: 'id', type: 'number', description: 'Identificador interno' },
            { name: 'codigo', type: 'string', description: 'Código CID-10', example: 'A00' },
            { name: 'descricao', type: 'string', description: 'Descrição do código' },
            { name: 'capitulo', type: 'string', description: 'Capítulo do CID' },
            { name: 'categoria', type: 'string', description: 'Categoria/grupo' },
            { name: 'created_at', type: 'timestamp', description: 'Data de cadastro' },
            { name: 'updated_at', type: 'timestamp', description: 'Última atualização' }
        ]
    },
    {
        table: 'user_profiles',
        label: 'Perfis de usuário',
        description: 'Controle dos usuários autenticados no sistema.',
        primaryKey: 'id',
        fields: [
            { name: 'id', type: 'uuid', description: 'ID do usuário (igual ao auth.users)' },
            { name: 'email', type: 'string', description: 'Email usado no login' },
            { name: 'nome', type: 'string', description: 'Nome completo' },
            { name: 'role', type: 'string', description: 'Papel (admin, gestor, auditor, etc.)' },
            { name: 'hospital', type: 'string', description: 'Hospital associado (opcional)' },
            { name: 'last_login_at', type: 'timestamp', description: 'Último acesso' },
            { name: 'created_at', type: 'timestamp', description: 'Criação do perfil' },
            { name: 'updated_at', type: 'timestamp', description: 'Última atualização' }
        ]
    },
    {
        table: 'bed_management_history',
        label: 'Histórico de leitos',
        description: 'Auditoria completa de movimentação de leitos por paciente.',
        primaryKey: 'id',
        relations: ['patients'],
        defaultFilters: ['patient_id=eq.<id>', 'order=created_at.desc'],
        notes: ['bed_type aceito: CTI, CTI PED, CTI NEO, USI, USI PED, UI, UI PSQ'],
        fields: [
            { name: 'id', type: 'number', description: 'Identificador do registro' },
            { name: 'patient_id', type: 'number', description: 'Paciente relacionado' },
            { name: 'date_recorded', type: 'date', description: 'Data da anotação' },
            { name: 'bed_origin', type: 'string', description: 'Leito original' },
            { name: 'bed_audited', type: 'string', description: 'Leito após auditoria' },
            { name: 'bed_type', type: 'string', description: 'Tipo de leito', example: 'CTI' },
            { name: 'changed_by', type: 'string', description: 'Email do responsável' },
            { name: 'notes', type: 'string', description: 'Motivo/observação' },
            { name: 'created_at', type: 'timestamp', description: 'Data de criação' }
        ]
    },
    {
        table: 'internation_history',
        label: 'Diário de internação',
        description: 'Eventos diários relacionados à internação (transferências, alta, etc.).',
        primaryKey: 'id',
        relations: ['patients'],
        fields: [
            { name: 'id', type: 'number', description: 'Identificador do evento' },
            { name: 'patient_id', type: 'number', description: 'Paciente vinculado' },
            { name: 'event_date', type: 'timestamp', description: 'Data/hora do evento' },
            { name: 'event_type', type: 'string', description: 'Tipo de evento (transferencia, alta, observacao)' },
            { name: 'origem', type: 'string', description: 'Setor/leito de origem' },
            { name: 'destino', type: 'string', description: 'Setor/leito de destino' },
            { name: 'profissional', type: 'string', description: 'Profissional responsável' },
            { name: 'observacao', type: 'string', description: 'Detalhes adicionais' },
            { name: 'created_at', type: 'timestamp', description: 'Momento do registro' }
        ]
    },
    {
        table: 'surgery_wait_tracking',
        label: 'Fila de cirurgias',
        description: 'Controle dos pacientes aguardando procedimentos cirúrgicos.',
        primaryKey: 'id',
        relations: ['patients'],
        statuses: [
            'aguardando_envio_pedido',
            'aguardando_solicitacao_opme',
            'aguardando_recebimento_opme',
            'aguardando_agendamento',
            'aguardando_realizacao',
            'aguardando_finalizacao',
            'concluido'
        ],
        fields: [
            { name: 'id', type: 'number', description: 'Identificador do registro' },
            { name: 'patient_id', type: 'number', description: 'Paciente vinculado' },
            { name: 'espera_cirurgia', type: 'boolean', description: 'Flag indicando se está aguardando', example: 'true' },
            { name: 'data_inicio_espera', type: 'date', description: 'Data de entrada na fila' },
            { name: 'aguarda_opme', type: 'boolean', description: 'Indica se depende de OPME' },
            { name: 'status_atual', type: 'string', description: 'Status atual (vide lista)', example: 'aguardando_agendamento' },
            { name: 'opme_codigo', type: 'string', description: 'Código OPME solicitado' },
            { name: 'opme_status', type: 'string', description: 'Status do pedido OPME' },
            { name: 'ultima_atualizacao', type: 'timestamp', description: 'Atualização mais recente' },
            { name: 'created_at', type: 'timestamp', description: 'Criação do registro' }
        ]
    },
    {
        table: 'exam_wait_tracking',
        label: 'Fila de exames',
        description: 'Pacientes aguardando exames diagnósticos.',
        primaryKey: 'id',
        relations: ['patients'],
        statuses: [
            'aguardando_envio_pedido',
            'aguardando_agendamento',
            'aguardando_realizacao',
            'aguardando_laudo',
            'concluido'
        ],
        fields: [
            { name: 'id', type: 'number', description: 'Identificador' },
            { name: 'patient_id', type: 'number', description: 'Paciente vinculado' },
            { name: 'espera_exame', type: 'boolean', description: 'Flag de espera' },
            { name: 'tipo_exame', type: 'string', description: 'Tipo de exame solicitado' },
            { name: 'data_inicio_espera', type: 'date', description: 'Entrada na fila' },
            { name: 'status_atual', type: 'string', description: 'Status atual (vide lista)' },
            { name: 'prioridade', type: 'string', description: 'Prioridade clínica' },
            { name: 'laudo_previsto', type: 'date', description: 'Previsão de laudo' },
            { name: 'ultima_atualizacao', type: 'timestamp', description: 'Atualização' },
            { name: 'created_at', type: 'timestamp', description: 'Criação' }
        ]
    },
    {
        table: 'opinion_wait_tracking',
        label: 'Fila de pareceres',
        description: 'Controle de solicitações de parecer especializado.',
        primaryKey: 'id',
        relations: ['patients'],
        statuses: [
            'aguardando_solicitacao',
            'solicitado',
            'em_analise',
            'respondido',
            'concluido'
        ],
        fields: [
            { name: 'id', type: 'number', description: 'Identificador' },
            { name: 'patient_id', type: 'number', description: 'Paciente vinculado' },
            { name: 'espera_parecer', type: 'boolean', description: 'Flag de espera' },
            { name: 'especialidade', type: 'string', description: 'Especialidade requisitada' },
            { name: 'data_solicitacao', type: 'date', description: 'Data do pedido' },
            { name: 'status_atual', type: 'string', description: 'Status (vide lista)' },
            { name: 'profissional_designado', type: 'string', description: 'Responsável pelo parecer' },
            { name: 'ultima_atualizacao', type: 'timestamp', description: 'Atualização' },
            { name: 'created_at', type: 'timestamp', description: 'Criação' }
        ]
    },
    {
        table: 'desospitalizacao_wait_tracking',
        label: 'Fila de desospitalização',
        description: 'Processo de saída assistida e serviços pós-alta.',
        primaryKey: 'id',
        relations: ['patients'],
        statuses: [
            'aguardando_aprovacao',
            'em_processo',
            'servicos_aprovados',
            'aguardando_liberacao',
            'concluido'
        ],
        fields: [
            { name: 'id', type: 'number', description: 'Identificador' },
            { name: 'patient_id', type: 'number', description: 'Paciente vinculado' },
            { name: 'espera_desospitalizacao', type: 'boolean', description: 'Flag de espera' },
            { name: 'data_inicio_espera', type: 'date', description: 'Início do processo' },
            { name: 'servicos_solicitados', type: 'string', description: 'Serviços necessários após alta' },
            { name: 'status_atual', type: 'string', description: 'Status atual (vide lista)' },
            { name: 'responsavel_social', type: 'string', description: 'Responsável pelo caso' },
            { name: 'ultima_atualizacao', type: 'timestamp', description: 'Atualização' },
            { name: 'created_at', type: 'timestamp', description: 'Criação' }
        ]
    }
];

export type SolusTableName = (typeof solusSchema)[number]['table'];
