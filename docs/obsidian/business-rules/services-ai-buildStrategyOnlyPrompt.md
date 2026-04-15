---
tag: business-rule
status: active
file_origin: services/ai/testGenerationPrompts.ts
---

# Tamanho máximo do trecho de especificação injetado após o bloco da tarefa (evita

**Descrição:** Tamanho máximo do trecho de especificação injetado após o bloco da tarefa (evita documento “engolir” a tarefa). */ export const TASK_GEN_MAX_DOC_CHARS = 3200; export function shouldGenerateTestCasesAndBdd(taskType?: JiraTaskType): boolean { return taskType === 'Tarefa' || taskType === 'Bug' || taskType === undefined; } export async function buildComplementaryDocumentSection(project: Project | null | undefined): Promise<string> { if (!project) return ''; const raw = await getDocumentContext(proje

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

[[JiraTaskType]] [[Project]]
