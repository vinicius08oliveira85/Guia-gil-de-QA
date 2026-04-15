---
tag: business-rule
status: active
file_origin: services/backupService.ts
---

# Estimativa de tamanho serializado (evita JSON

**Descrição:** Estimativa de tamanho serializado (evita JSON.stringify do projeto inteiro em grafos enormes). / const calculateProjectSize = (project: Project): number => { try { let n = 512; const addStr = (s: string | undefined, cap = 50_000) => { const len = Math.min(s?.length ?? 0, cap); n += len * 2; }; addStr(project.id, 200); addStr(project.name, 2000); addStr(project.description, 100_000); for (const doc of project.documents || []) { n += 64; addStr(doc.name, 2000); addStr(doc.content, 500_000); addStr

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

[[BackupInfo]]
