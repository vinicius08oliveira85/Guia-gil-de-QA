---
tag: business-rule
status: active
file_origin: utils/projectMerge.ts
---

# Faz merge de arrays de tarefas, preservando tarefas mais recentes / const mergeT

**Descrição:** Faz merge de arrays de tarefas, preservando tarefas mais recentes / const mergeTasks = ( localTasks: Project['tasks'], remoteTasks: Project['tasks'] ): Project['tasks'] => { const tasksMap = new Map<string, Project['tasks'][0]>(); // Primeiro adicionar tarefas locais localTasks.forEach(task => { tasksMap.set(task.id, task); }); // Depois adicionar/atualizar com tarefas remotas remoteTasks.forEach(remoteTask => { const localTask = tasksMap.get(remoteTask.id); if (!localTask) { // Tarefa nova no r

**Lógica Aplicada:**

- [ ] Avaliar condição: `!localProject`

**Referências:**

[[Project]]
