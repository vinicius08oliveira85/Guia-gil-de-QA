# Configuração do Supabase para Projetos Grandes

## Por que usar Supabase?

Para projetos com **mais de 10.000 issues**, recomenda-se usar Supabase para:
- **Performance**: Armazenamento mais eficiente que IndexedDB
- **Persistência**: Dados não são perdidos ao limpar cache do navegador
- **Sincronização**: Acesso aos dados de múltiplos dispositivos
- **Backup**: Dados seguros na nuvem

## Configuração Inicial

### 1. Criar Projeto no Supabase

1. Acesse [https://supabase.com](https://supabase.com)
2. Crie uma conta (gratuita)
3. Crie um novo projeto
4. Anote as credenciais:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Key**: Chave pública (pode ser exposta no frontend)

### 2. Configurar Variáveis de Ambiente

No Vercel (ou no `.env` local), adicione as seguintes variáveis:

**Importante:** No frontend (Vite), **apenas variáveis com prefixo `VITE_`** são expostas no navegador. Variáveis como `SUPABASE_URL` ou `SUPABASE_ANON_KEY` sem o prefixo ficam indefinidas no cliente.

```
# Backend (apenas no servidor / Vercel Functions)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role-aqui

# Frontend (com prefixo VITE_ para o navegador)
VITE_SUPABASE_PROXY_URL=/api/supabaseProxy
```

Para **uso apenas do proxy** (recomendado em produção): configure `VITE_SUPABASE_PROXY_URL`. O backend usa `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.

Para **SDK direto no cliente** (ex.: desenvolvimento local sem proxy): configure também `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (com prefixo `VITE_`).

> 💡 Em desenvolvimento local com proxy: `VITE_SUPABASE_PROXY_URL=http://localhost:3000/api/supabaseProxy` ao executar `vercel dev`.

### 3. Criar Tabelas no Supabase

**Projeto novo (ainda sem tabelas):**
- Execute o script **`docs/SUPABASE_NEW_PROJECT_SETUP.sql`** no SQL Editor – cria `projects` e `task_test_status` em um único arquivo.

**Projeto que já tem a tabela `projects`:**
- Execute o script **`docs/SUPABASE_FINAL.sql`** – versão segura sem DROP, não mostra avisos.

**Alternativas:**
- **`docs/SUPABASE_SIMPLE.sql`** - versão simplificada (pode mostrar aviso de operação destrutiva)
- **`docs/SUPABASE_MIGRATION_SAFE.sql`** - versão segura com verificações (execute o script COMPLETO)

**IMPORTANTE:** Execute o script COMPLETO de uma vez, não apenas partes dele!

**Nota:** Se você já executou algum script e a tabela tem todas as colunas (id, user_id, name, description, created_at, updated_at, data), você pode pular esta etapa!

Ou use o seguinte SQL básico:

```sql
-- Tabela de projetos
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  data JSONB NOT NULL -- Armazena todo o projeto como JSON
);

-- Índices para melhor performance
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_updated_at ON projects(updated_at);

-- RLS (Row Level Security) - permite que usuários vejam apenas seus projetos
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid()::text = user_id);
```

### Tabela task_test_status (status de teste por tarefa)

O app persiste o status de teste (testar/testando/pendente/teste_concluido) no Supabase. Para evitar **403 (Forbidden)** ao salvar ou carregar status:

1. Crie a tabela e as políticas RLS executando o script **`docs/SUPABASE_TASK_TEST_STATUS.sql`** no SQL Editor do Supabase.
2. Esse script habilita RLS e cria a política "Allow all access for shared anonymous users", permitindo SELECT/INSERT/UPDATE para o cliente anônimo (o app usa `signInAnonymously()`).

Se a tabela já existir mas as políticas RLS não permitirem acesso anônimo, você verá no console: `new row violates row-level security policy for table "task_test_status"`. Nesse caso, execute o script acima ou adicione políticas que permitam `anon` (ou o papel que o app usa) em SELECT, INSERT e UPDATE para a tabela `task_test_status`.

## Implementação no Código

O repositório já está preparado com:

1. **Function `api/supabaseProxy.ts`**  
   - Recebe requisições do frontend e fala com o Supabase usando a `SUPABASE_SERVICE_ROLE_KEY`.  
   - Evita erros de CORS e mantém a chave sensível apenas no backend.

2. **Serviço `services/supabaseService.ts`**  
   - O frontend chama somente o proxy (`fetch('/api/supabaseProxy', ...)`).  
   - Existe fallback automático para o SDK direto caso você esteja desenvolvendo localmente sem proxy.

3. **Integração com `dbService.ts`**  
   - Salvar, carregar e excluir projetos já verificam se o Supabase está disponível e caem para IndexedDB quando necessário.

Portanto, basta configurar as variáveis de ambiente e executar `npm run build`. Se quiser adaptar para outro backend, use os arquivos acima como referência.

## Limites e Considerações

### Limites do Plano Gratuito do Supabase

- **500 MB de armazenamento**
- **2 GB de transferência/mês**
- **500 MB de banco de dados**

### Estimativa de Uso

- **1 projeto com 10.000 issues**: ~50-100 MB
- **1 projeto com 50.000 issues**: ~250-500 MB

### Recomendações

1. **Para projetos pequenos (< 5.000 issues)**: IndexedDB é suficiente
2. **Para projetos médios (5.000 - 20.000 issues)**: Considere Supabase
3. **Para projetos grandes (> 20.000 issues)**: Supabase é recomendado

## Migração de Dados

Para migrar projetos existentes do IndexedDB para Supabase:

```typescript
// Função de migração (executar uma vez)
const migrateToSupabase = async () => {
  const projects = await loadProjectsFromIndexedDB(); // Sua função atual
  for (const project of projects) {
    await saveProjectToSupabase(project);
  }
  console.log(`✅ ${projects.length} projetos migrados para Supabase`);
};
```

## Autenticação (Opcional)

Para projetos compartilhados, você pode habilitar autenticação:

1. No Supabase Dashboard, vá em Authentication
2. Habilite Email/Password ou OAuth providers
3. Use `supabase.auth.signInWithPassword()` ou `supabase.auth.signInWithOAuth()`

## Suporte

Se precisar de ajuda com a configuração do Supabase, consulte:
- [Documentação do Supabase](https://supabase.com/docs)
- [Guia de RLS (Row Level Security)](https://supabase.com/docs/guides/auth/row-level-security)

