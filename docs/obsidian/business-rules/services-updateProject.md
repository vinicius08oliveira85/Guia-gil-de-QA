---
tag: business-rule
status: active
file_origin: services/dbService.ts
---

# Obtém um projeto pelo id no IndexedDB (para verificar existência na importação)

**Descrição:** Obtém um projeto pelo id no IndexedDB (para verificar existência na importação). Não consulta o Supabase. / export const getProjectById = async (projectId: string): Promise<Project | null> => { const db = await openDB(); const raw = await new Promise<Project | undefined>((resolve, reject) => { const transaction = db.transaction(STORE_NAME, 'readonly'); const store = transaction.objectStore(STORE_NAME); const request = store.get(projectId); request.onerror = () => reject(request.error); request.o

**Lógica Aplicada:**

- [ ] Revisar o trecho de código de origem para condições explícitas (if/else, early returns, filtros).
- [ ] Confirmar integração com tipos de domínio e serviços referenciados no arquivo.

**Referências:**

[[Project]]
