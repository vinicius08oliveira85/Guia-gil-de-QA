# Relatório de Verificação - Banco de Dados Supabase

## Resumo Executivo

Este documento apresenta os resultados da verificação de como os dados de testes (Casos de Teste, Estratégias de Teste e Cenários BDD) estão sendo salvos no Supabase.

## ✅ Conclusões Principais

### 1. Estrutura de Dados

**Confirmado:** Os dados estão sendo salvos corretamente no Supabase seguindo a estrutura hierárquica:

```
projects.data.tasks[].testCases[]
projects.data.tasks[].testStrategy[]
projects.data.tasks[].bddScenarios[]
```

### 2. Relação com Tarefas

**Confirmado:** Cada tarefa mantém seus próprios dados de teste. Não há compartilhamento ou mistura de dados entre tarefas.

- ✅ Casos de teste são específicos de cada tarefa
- ✅ Estratégias são específicas de cada tarefa
- ✅ Cenários BDD são específicos de cada tarefa

### 3. Salvamento via Modal

**Confirmado:** O modal de testes (`TestCaseEditorModal`) salva corretamente os dados:

1. Modal chama `onSave` com dados atualizados
2. `handleSaveTestCase` em `TasksView.tsx` atualiza `project.tasks[taskId].testCases[]`
3. `onUpdateProject` dispara `updateProject` no `dbService`
4. `updateProject` salva projeto completo no Supabase (campo `data` JSONB)

**Arquivos envolvidos:**

- `components/tasks/TestCaseEditorModal.tsx` - Modal de edição
- `components/tasks/TasksView.tsx` - `handleSaveTestCase` (linha 458)
- `services/dbService.ts` - `updateProject` (linha 172)
- `services/supabaseService.ts` - `saveProjectToSupabase` (linha 390)

### 4. Preservação após Sincronização Jira

**Confirmado:** Os dados são preservados corretamente após sincronização com Jira:

**Implementação em `services/jiraService.ts` (linhas 1545-1578):**

```typescript
updatedTasks[existingIndex] = {
  ...oldTask, // Preservar todos os dados locais primeiro
  // Atualizar apenas campos importados do Jira
  title: task.title,
  description: task.description,
  status: task.status,
  // ... outros campos do Jira

  // ✅ Preservar dados locais que não vêm do Jira
  testCases: finalTestCases, // ✅ Preservar status dos testes (mesclados com salvos do Supabase)
  bddScenarios: oldTask.bddScenarios || [], // ✅ Preservar cenários BDD
  testStrategy: oldTask.testStrategy, // ✅ Preservar estratégia de teste
  // ...
};
```

**Mecanismo de Preservação:**

1. ✅ Casos de teste são mesclados com dados salvos do Supabase (`finalTestCases`)
2. ✅ Cenários BDD são preservados do `oldTask.bddScenarios`
3. ✅ Estratégias são preservadas do `oldTask.testStrategy`
4. ✅ Status dos testes são preservados (mesclagem inteligente)

## Estrutura de Dados no Supabase

### Tabela `projects`

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

### Estrutura do Campo `data` (JSONB)

```typescript
{
  id: string;
  name: string;
  description: string;
  tasks: [
    {
      id: string;
      title: string;
      type: 'Tarefa' | 'Bug' | 'Epic' | 'História';

      // ✅ CASOS DE TESTE - Relacionados à tarefa
      testCases: TestCase[];

      // ✅ ESTRATÉGIAS DE TESTE - Relacionadas à tarefa
      testStrategy?: TestStrategy[];

      // ✅ CENÁRIOS BDD - Relacionados à tarefa
      bddScenarios?: BddScenario[];
    }
  ]
}
```

## Fluxos Verificados

### Fluxo 1: Criação de Caso de Teste

```
1. Usuário abre modal de teste
2. Preenche dados do caso de teste
3. Clica em "Salvar"
4. TestCaseEditorModal.handleSubmit() → onSave()
5. TasksView.handleSaveTestCase() atualiza project.tasks[taskId].testCases[]
6. onUpdateProject() → updateProject()
7. dbService.updateProject() → saveProjectToSupabase()
8. supabaseService.saveProjectToSupabase() salva projeto completo no Supabase
9. ✅ Dados persistidos no campo data JSONB
```

### Fluxo 2: Edição de Caso de Teste

```
1. Usuário abre modal com caso de teste existente
2. Edita dados do caso de teste
3. Clica em "Salvar"
4. Mesmo fluxo da criação
5. ✅ Dados atualizados no Supabase
```

### Fluxo 3: Sincronização com Jira

```
1. Usuário inicia sincronização com Jira
2. jiraService.syncJiraProject() busca tarefas do Jira
3. Para cada tarefa:
   a. Carrega dados salvos do Supabase (loadTestStatusesByJiraKeys)
   b. Mescla com dados existentes (mergeTestCases)
   c. Preserva dados locais:
      - testCases: finalTestCases (mesclado)
      - bddScenarios: oldTask.bddScenarios
      - testStrategy: oldTask.testStrategy
4. Salva projeto atualizado
5. ✅ Dados de teste preservados mesmo após atualização do Jira
```

## Testes Implementados

### 1. Script de Verificação (`scripts/verify-supabase-structure.ts`)

- Verifica estrutura completa dos dados
- Valida presença de testCases, testStrategy e bddScenarios
- Verifica relações entre tarefas
- Gera relatório de verificação

### 2. Testes de Estrutura (`tests/integration/supabase-structure.test.ts`)

- Testa salvamento de casos de teste
- Testa salvamento de estratégias
- Testa salvamento de cenários BDD
- Verifica relação com tarefas
- Verifica que dados não são compartilhados entre tarefas

### 3. Testes de Fluxo de Salvamento (`tests/integration/test-save-flow.test.ts`)

- Testa criação de caso de teste via modal
- Testa edição de caso de teste via modal
- Testa persistência após múltiplas atualizações
- Testa recarregamento do Supabase

### 4. Testes de Preservação Jira (`tests/integration/jira-sync-preservation.test.ts`)

- Testa preservação de casos de teste após sync
- Testa preservação de estratégias após sync
- Testa preservação de cenários BDD após sync
- Testa preservação completa de todos os dados

## Pontos de Atenção

### 1. Tamanho do Payload

O projeto inteiro é salvo como um único JSON. Projetos muito grandes (>4MB) podem ter problemas com o proxy do Vercel. O sistema já implementa:

- Compressão automática para payloads >1MB
- Fallback para SDK direto quando proxy falha
- Limite de 4MB no proxy

### 2. Atomicidade

Toda atualização salva o projeto completo. Não há atualizações parciais. Isso garante consistência, mas pode ser mais lento para projetos grandes.

### 3. Performance

Para projetos com muitas tarefas e casos de teste, o carregamento pode ser mais lento. O sistema implementa:

- Carregamento em duas fases (IndexedDB primeiro, Supabase depois)
- Debounce de salvamento (300ms)
- Cooldown após erros de rede

## Recomendações

1. ✅ **Estrutura atual está correta** - Não é necessário alterar a estrutura de dados
2. ✅ **Preservação Jira está funcionando** - Implementação correta em `jiraService.ts`
3. ✅ **Modal salva corretamente** - Fluxo de salvamento está funcionando
4. 📝 **Monitorar tamanho dos projetos** - Considerar otimizações se projetos ficarem muito grandes
5. 📝 **Considerar índices JSONB** - Para queries complexas no futuro, considerar índices GIN no Supabase

## Conclusão

**Todos os pontos verificados estão funcionando corretamente:**

- ✅ Casos de teste são salvos relacionados à tarefa
- ✅ Estratégias são salvas relacionadas à tarefa
- ✅ Cenários BDD são salvos relacionados à tarefa
- ✅ Modal de testes salva corretamente
- ✅ Dados são preservados após sincronização com Jira
- ✅ Cada tarefa mantém seus próprios dados (sem mistura)

A implementação atual está correta e seguindo as melhores práticas para armazenamento de dados hierárquicos no Supabase.
