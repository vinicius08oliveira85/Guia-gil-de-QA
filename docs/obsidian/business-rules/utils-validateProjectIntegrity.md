---
tag: business-rule
status: active
file_origin: utils/dataIntegrityService.ts
---

# Impressão digital leve do projeto (evita JSON

**Descrição:** Impressão digital leve do projeto (evita JSON.stringify do grafo inteiro → stack/heap em projetos grandes). / const projectIntegrityFingerprint = (project: Project): string => { try { let hash = 5381; const mix = (s: string) => { for (let i = 0; i < s.length; i++) { hash = (hash * 33) ^ s.charCodeAt(i); hash |= 0; } }; mix(project.id || ''); mix(project.name || ''); mix(project.updatedAt || ''); mix(project.createdAt || ''); const tasks = project.tasks || []; hash = (hash * 33 + tasks.length) | 

**Lógica Aplicada:**

- [ ] Avaliar condição: `fingerprint === 'fp:error'`

**Referências:**

[[Project]]
