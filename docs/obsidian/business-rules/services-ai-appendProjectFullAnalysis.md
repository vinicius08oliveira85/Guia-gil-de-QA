---
tag: business-rule
status: active
file_origin: services/ai/projectFullAnalysisService.ts
---

# Gera análise IA completa do projeto (documentos, tarefas, testes, indicadores e

**Descrição:** Gera análise IA completa do projeto (documentos, tarefas, testes, indicadores e fases). Resultado deve ser adicionado a project.projectFullAnalyses e persistido via onUpdateProject (Supabase + IndexedDB). / export async function generateProjectFullAnalysis(project: Project): Promise<ProjectFullAnalysis> { const documentContext = await getFormattedContext(project); const fullContext = buildFullContext(project); const prompt = `${documentContext} Você é um especialista sênior em QA, STLC e gestão 

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

[[Project]] [[ProjectFullAnalysis]]
