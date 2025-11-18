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

No Vercel, adicione as seguintes variáveis de ambiente:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

### 3. Criar Tabelas no Supabase

**Recomendado (versão mais simples):**
- Execute o script **`docs/SUPABASE_SIMPLE.sql`** - versão simplificada sem blocos DO

**Alternativas:**
- **`docs/SUPABASE_MIGRATION_SAFE.sql`** - versão segura com verificações (execute o script COMPLETO)
- **`docs/SUPABASE_SQL.sql`** - para criar do zero

**IMPORTANTE:** Execute o script COMPLETO de uma vez, não apenas partes dele!

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

## Implementação no Código

### Instalar Dependências

```bash
npm install @supabase/supabase-js
```

### Criar Serviço Supabase

Crie o arquivo `services/supabaseService.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import { Project } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase não configurado. Usando IndexedDB local.');
}

export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const getUserId = async (): Promise<string> => {
  if (!supabase) return 'anonymous';
  
  const { data: { user } } = await supabase.auth.getUser();
  if (user) return user.id;
  
  // Se não autenticado, criar sessão anônima
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session.user.id;
  
  // Criar usuário anônimo temporário
  return `anon-${Date.now()}`;
};

export const saveProjectToSupabase = async (project: Project): Promise<void> => {
  if (!supabase) throw new Error('Supabase não configurado');
  
  const userId = await getUserId();
  
  const { error } = await supabase
    .from('projects')
    .upsert({
      id: project.id,
      user_id: userId,
      name: project.name,
      description: project.description,
      data: project,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'id'
    });
  
  if (error) throw error;
};

export const loadProjectsFromSupabase = async (): Promise<Project[]> => {
  if (!supabase) throw new Error('Supabase não configurado');
  
  const userId = await getUserId();
  
  const { data, error } = await supabase
    .from('projects')
    .select('data')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });
  
  if (error) throw error;
  
  return data.map(row => row.data as Project);
};

export const deleteProjectFromSupabase = async (projectId: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase não configurado');
  
  const userId = await getUserId();
  
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', userId);
  
  if (error) throw error;
};
```

### Modificar dbService.ts

Atualize `services/dbService.ts` para usar Supabase quando disponível:

```typescript
import { supabase, saveProjectToSupabase, loadProjectsFromSupabase, deleteProjectFromSupabase } from './supabaseService';

// ... código existente ...

export const saveProject = async (project: Project): Promise<void> => {
  // Tentar Supabase primeiro
  if (supabase) {
    try {
      await saveProjectToSupabase(project);
      console.log('✅ Projeto salvo no Supabase');
      return;
    } catch (error) {
      console.warn('⚠️ Erro ao salvar no Supabase, usando IndexedDB:', error);
    }
  }
  
  // Fallback para IndexedDB
  // ... código IndexedDB existente ...
};

export const loadProjects = async (): Promise<Project[]> => {
  // Tentar Supabase primeiro
  if (supabase) {
    try {
      const projects = await loadProjectsFromSupabase();
      console.log(`✅ ${projects.length} projetos carregados do Supabase`);
      return projects;
    } catch (error) {
      console.warn('⚠️ Erro ao carregar do Supabase, usando IndexedDB:', error);
    }
  }
  
  // Fallback para IndexedDB
  // ... código IndexedDB existente ...
};
```

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

