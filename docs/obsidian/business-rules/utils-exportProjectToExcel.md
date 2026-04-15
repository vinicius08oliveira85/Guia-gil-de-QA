---
tag: business-rule
status: active
file_origin: utils/exportService.ts
---

# Exporta o projeto completo para JSON (round-trip com importProjectFromJSON)

**Descrição:** Exporta o projeto completo para JSON (round-trip com importProjectFromJSON). Mantém formato { project: { ... } } para compatibilidade. / export const exportProjectToJSON = (project: Project): string => { const exportData = { project: { ...project }, exportedAt: new Date().toISOString(), }; return JSON.stringify(exportData, null, 2); }; export const exportProjectToCSV = (project: Project): string => { const headers = ['ID', 'Título', 'Tipo', 'Status', 'Casos de Teste', 'Casos Executados', 'Casos 

**Lógica Aplicada:**

- [ ] Avaliar condição: `testCasesData.length > 0`

**Referências:**

[[Project]]
