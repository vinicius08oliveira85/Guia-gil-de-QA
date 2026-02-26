# Estrutura de Dados no Supabase

## Visão Geral

O Supabase armazena todos os dados do projeto em uma única tabela `projects` com um campo JSONB chamado `data`. Esta estrutura permite armazenar o projeto completo de forma hierárquica, incluindo todas as tarefas e seus dados de teste.

## Salvar e Sincronizar

- **Salvar:** Envia o projeto atual (do estado da aplicação) para o Supabase. O payload em `data` contém o objeto `Project` completo: dados importados do Jira e todas as alterações feitas no app (tarefas, casos de teste, estratégias, cenários BDD, documentos, histórico de métricas, análises de IA, etc.). Após sucesso, o cache local (IndexedDB) é atualizado com o mesmo projeto.
- **Sincronizar:** Traz os projetos do Supabase e usa o Supabase como **fonte da verdade**: para cada projeto que existe no remoto, a versão do Supabase substitui a local (sem merge). Projetos que existem apenas no dispositivo são mantidos. A lista final é persistida no IndexedDB, de modo que em qualquer dispositivo, após Salvar em um e Sincronizar em outro, o usuário vê exatamente o que foi salvo.

## Estrutura da Tabela `projects`

```sql
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data JSONB NOT NULL  -- Projeto completo em JSON
);
```

## Estrutura Hierárquica do Campo `data`

O campo `data` contém um objeto JSON completo do tipo `Project`:

```typescript
{
  id: string;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
  documents: ProjectDocument[];
  tasks: JiraTask[];  // ← Dados de teste estão aqui
  phases: Phase[];
  // ... outros campos
}
```

## Estrutura de Tarefas (`tasks`)

Cada tarefa (`JiraTask`) contém os dados de teste relacionados:

```typescript
{
  id: string;                    // ID da tarefa (ex: "GDPI-4")
  title: string;
  description: string;
  type: 'Epic' | 'História' | 'Tarefa' | 'Bug';
  status: 'To Do' | 'In Progress' | 'Done' | 'Blocked';
  
  // ✅ CASOS DE TESTE - Relacionados à tarefa
  testCases: TestCase[];         // Array de casos de teste
  
  // ✅ ESTRATÉGIAS DE TESTE - Relacionadas à tarefa
  testStrategy?: TestStrategy[]; // Array de estratégias de teste
  
  // ✅ CENÁRIOS BDD - Relacionados à tarefa
  bddScenarios?: BddScenario[]; // Array de cenários BDD
  
  // Outros campos...
}
```

## Estrutura de Casos de Teste (`testCases`)

Cada caso de teste está relacionado a uma tarefa específica:

```typescript
interface TestCase {
  id: string;                    // ID único do caso de teste
  title?: string;                // Título opcional
  description: string;           // Descrição do caso de teste
  steps: string[];                // Passos de execução
  expectedResult: string;        // Resultado esperado
  status: 'Not Run' | 'Passed' | 'Failed' | 'Blocked';
  strategies?: string[];          // Estratégias aplicadas
  executedStrategy?: string | string[];
  isAutomated?: boolean;
  observedResult?: string;
  toolsUsed?: string[];           // Ferramentas utilizadas
  preconditions?: string;
  testSuite?: string;
  testEnvironment?: string;
  priority?: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
}
```

**Localização no JSON:**
```json
{
  "data": {
    "tasks": [
      {
        "id": "GDPI-4",
        "testCases": [
          {
            "id": "tc-123",
            "description": "Verificar login",
            "status": "Passed",
            ...
          }
        ]
      }
    ]
  }
}
```

## Estrutura de Estratégias de Teste (`testStrategy`)

Cada estratégia está relacionada a uma tarefa específica:

```typescript
interface TestStrategy {
  testType: string;               // Tipo de teste (ex: "Funcional", "Integração")
  description: string;            // Descrição da estratégia
  howToExecute: string[];         // Como executar
  tools: string;                   // Ferramentas necessárias
}
```

**Localização no JSON:**
```json
{
  "data": {
    "tasks": [
      {
        "id": "GDPI-4",
        "testStrategy": [
          {
            "testType": "Testes Funcionais",
            "description": "Validar funcionalidades principais",
            "howToExecute": ["Passo 1", "Passo 2"],
            "tools": "Postman, Selenium"
          }
        ]
      }
    ]
  }
}
```

## Estrutura de Cenários BDD (`bddScenarios`)

Cada cenário BDD está relacionado a uma tarefa específica:

```typescript
interface BddScenario {
  id: string;                    // ID único do cenário
  title: string;                 // Título do cenário
  gherkin: string;                // Código Gherkin completo
}
```

**Localização no JSON:**
```json
{
  "data": {
    "tasks": [
      {
        "id": "GDPI-4",
        "bddScenarios": [
          {
            "id": "bdd-123",
            "title": "Login com credenciais válidas",
            "gherkin": "Dado que estou na página de login\nQuando preencho email e senha\nEntão sou autenticado com sucesso"
          }
        ]
      }
    ]
  }
}
```

## Caminho Completo no Supabase

Para acessar os dados de teste de uma tarefa específica:

```
projects.data.tasks[taskIndex].testCases[]
projects.data.tasks[taskIndex].testStrategy[]
projects.data.tasks[taskIndex].bddScenarios[]
```

### Exemplo de Query SQL

```sql
-- Buscar todos os casos de teste de um projeto
SELECT 
  id,
  name,
  jsonb_array_elements(data->'tasks') AS task
FROM projects
WHERE id = 'projeto-id';

-- Buscar casos de teste de uma tarefa específica
SELECT 
  jsonb_array_elements(data->'tasks'->'testCases') AS test_case
FROM projects
WHERE data->'tasks' @> '[{"id": "GDPI-4"}]'::jsonb;
```

## Relação com Tarefas

### ✅ Cada Tarefa Mantém Seus Próprios Dados

- **Casos de Teste**: Cada tarefa tem seu próprio array `testCases[]`
- **Estratégias**: Cada tarefa tem seu próprio array `testStrategy[]`
- **Cenários BDD**: Cada tarefa tem seu próprio array `bddScenarios[]`

### ❌ Dados NÃO São Compartilhados Entre Tarefas

Os dados de teste são específicos de cada tarefa. Não há compartilhamento entre tarefas, mesmo que sejam do mesmo tipo ou projeto.

## Fluxo de Salvamento

1. **Modal de Testes** → Salva via `handleSaveTestCase`
2. **Atualiza Projeto** → `onUpdateProject` atualiza `project.tasks[taskId].testCases[]`
3. **Persistência** → `updateProject` salva projeto completo no Supabase
4. **Estrutura** → Todo o projeto (incluindo todas as tarefas e seus dados) é salvo no campo `data` JSONB

## Preservação Após Sincronização Jira

Quando o projeto é sincronizado com o Jira:

1. ✅ **Casos de Teste são preservados**: `testCases: finalTestCases` (merge com dados salvos)
2. ✅ **Cenários BDD são preservados**: `bddScenarios: oldTask.bddScenarios || []`
3. ✅ **Estratégias são preservadas**: `testStrategy: oldTask.testStrategy`

Ver implementação em: `services/jiraService.ts` (linhas 1571-1573)

## Limitações e Considerações

1. **Tamanho do Payload**: O projeto inteiro é salvo como um único JSON. Projetos muito grandes (>4MB) podem ter problemas com o proxy do Vercel.

2. **Atomicidade**: Toda atualização salva o projeto completo. Não há atualizações parciais.

3. **Performance**: Para projetos com muitas tarefas e casos de teste, o carregamento pode ser mais lento.

4. **Índices**: O Supabase não pode criar índices nos campos dentro do JSONB `data` de forma eficiente. Queries complexas podem ser lentas.

## Exemplo Completo

```json
{
  "id": "proj-123",
  "user_id": "anon-shared",
  "name": "Projeto QA",
  "description": "Projeto de testes",
  "data": {
    "id": "proj-123",
    "name": "Projeto QA",
    "tasks": [
      {
        "id": "GDPI-4",
        "title": "Implementar login",
        "type": "Tarefa",
        "testCases": [
          {
            "id": "tc-001",
            "description": "Testar login com credenciais válidas",
            "status": "Passed",
            "steps": ["Acessar página", "Preencher formulário"],
            "expectedResult": "Usuário autenticado"
          }
        ],
        "testStrategy": [
          {
            "testType": "Testes Funcionais",
            "description": "Validar fluxo de autenticação",
            "howToExecute": ["Executar casos de teste"],
            "tools": "Postman"
          }
        ],
        "bddScenarios": [
          {
            "id": "bdd-001",
            "title": "Login bem-sucedido",
            "gherkin": "Dado que estou na página de login\nQuando preencho credenciais válidas\nEntão sou redirecionado para o dashboard"
          }
        ]
      }
    ]
  }
}
```

## Verificação da Estrutura

Use o script `scripts/verify-supabase-structure.ts` para verificar se os dados estão sendo salvos corretamente:

```typescript
import { verifySupabaseStructure, generateVerificationReport } from '../scripts/verify-supabase-structure';

const results = await verifySupabaseStructure();
const report = generateVerificationReport(results);
console.log(report);
```

