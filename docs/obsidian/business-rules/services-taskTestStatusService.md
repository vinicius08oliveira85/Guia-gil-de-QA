---
tag: business-rule
status: active
file_origin: services/taskTestStatusService.ts
aggregate: module
---

# Módulo: Task Test Status Service

**Descrição:** Agregado de `services/taskTestStatusService.ts` com 5 exportação(ões) relevante(s) (funções, const arrow e schemas Zod `*Schema`).

**Exportações analisadas:** 5

## `calculateTaskTestStatus`

**Descrição:** Carrega status de teste via proxy / const loadThroughProxy = async (taskKey: string): Promise<TaskTestStatus | null> => { const response = await callSupabaseProxy<{ record: TaskTestStatusRecord | null; }>('GET', { query: { table: 'task_test_status', task_key: taskKey, }, }, requestTimeoutMs); clearSupabaseRemotePause(); return response.record?.status ?? null; }; /** Carrega múltiplos status de teste via proxy / const loadMultipleThroughProxy = async (taskKeys: string[]): Promise<Map<string, Task

**Lógica Aplicada:**

- [ ] Avaliar condição: `task.type === 'Epic' || task.type === 'História'`
- [ ] Avaliar condição: `subtasks.length === 0`
- [ ] Avaliar condição: `allSubtasksCompleted`
- [ ] Avaliar condição: `hasPendingSubtask`
- [ ] Avaliar condição: `hasTestingSubtask`
- [ ] Avaliar condição: `testCases.length === 0`
- [ ] Avaliar condição: `allTestsExecuted`
- [ ] Avaliar condição: `hasFailed`
- [ ] Avaliar condição: `hasFailed`
- [ ] Avaliar condição: `hasPassed`

**Referências (trecho):**

[[JiraTask]] [[TaskTestStatus]]

---

## `loadTaskTestStatus`

**Descrição:** Carrega múltiplos status de teste via SDK direto / const loadMultipleThroughSdk = async (taskKeys: string[]): Promise<Map<string, TaskTestStatus>> => { const result = new Map<string, TaskTestStatus>(); if (!supabase || taskKeys.length === 0) { return result; } try { const queryPromise = supabase .from('task_test_status') .select('task_key, status') .in('task_key', taskKeys); const timeoutPromise = createTimeoutPromise<{ data: null; error: { message: string } }>( requestTimeoutMs, 'Timeout: requi

**Lógica Aplicada:**

- [ ] Avaliar condição: `forceLocalOnly`

**Referências (trecho):**

[[TaskTestStatus]]

---

## `loadMultipleTaskTestStatus`

**Descrição:** Calcula o status de teste baseado nos testCases da task ou nas subtarefas (para Epic/História) Regras para Epic/História: - Se não há subtarefas → 'testar' - Se todas as subtarefas estão 'teste_concluido' → 'teste_concluido' - Se alguma subtarefa está 'pendente' → 'pendente' - Se alguma subtarefa está 'testando' → 'testando' - Caso contrário → 'testar' Regras para Tarefa/Bug: 1. Se não há testCases → 'testar' (laranja) 2. Se todos os testCases foram executados (nenhum 'Not Run') e nenhum está 'F

**Lógica Aplicada:**

- [ ] Avaliar condição: `taskKeys.length === 0`
- [ ] Avaliar condição: `forceLocalOnly`

**Referências (trecho):**

[[TaskTestStatus]]

---

## `saveTaskTestStatus`

**Descrição:** Carrega o status de teste de uma task do Supabase / export const loadTaskTestStatus = async (taskKey: string): Promise<TaskTestStatus | null> => { if (forceLocalOnly) { return null; } if (isSupabaseRemotePaused()) { return null; } const hasProxy = Boolean(supabaseProxyUrl); const hasSdk = Boolean(supabase); // Preferir proxy quando configurado (evita 403 por RLS no browser) if (hasProxy) { try { return await loadThroughProxy(taskKey); } catch (error) { // Em produção, evitar fallback para SDK di

**Lógica Aplicada:**

- [ ] Avaliar condição: `forceLocalOnly`

**Referências (trecho):**

[[TaskTestStatus]]

---

## `isTaskTestStatusAvailable`

**Descrição:** Carrega o status de teste de uma task do Supabase / export const loadTaskTestStatus = async (taskKey: string): Promise<TaskTestStatus | null> => { if (forceLocalOnly) { return null; } if (isSupabaseRemotePaused()) { return null; } const hasProxy = Boolean(supabaseProxyUrl); const hasSdk = Boolean(supabase); // Preferir proxy quando configurado (evita 403 por RLS no browser) if (hasProxy) { try { return await loadThroughProxy(taskKey); } catch (error) { // Em produção, evitar fallback para SDK di

**Lógica Aplicada:**

- [ ] Avaliar condição: `forceLocalOnly`

**Referências (trecho):** _Nenhuma entidade tipada detectada neste export._

---

**Referências (módulo):**

[[JiraTask]] [[TaskTestStatus]]
