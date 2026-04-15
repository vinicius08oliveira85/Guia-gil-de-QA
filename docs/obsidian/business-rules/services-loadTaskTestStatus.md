---
tag: business-rule
status: active
file_origin: services/taskTestStatusService.ts
---

# Carrega múltiplos status de teste via SDK direto / const loadMultipleThroughSdk

**Descrição:** Carrega múltiplos status de teste via SDK direto / const loadMultipleThroughSdk = async (taskKeys: string[]): Promise<Map<string, TaskTestStatus>> => { const result = new Map<string, TaskTestStatus>(); if (!supabase || taskKeys.length === 0) { return result; } try { const queryPromise = supabase .from('task_test_status') .select('task_key, status') .in('task_key', taskKeys); const timeoutPromise = createTimeoutPromise<{ data: null; error: { message: string } }>( requestTimeoutMs, 'Timeout: requi

**Lógica Aplicada:**

- [ ] Avaliar condição: `forceLocalOnly`

**Referências:**

[[TaskTestStatus]]
