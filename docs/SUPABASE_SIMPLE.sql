-- Script SIMPLIFICADO para criar/atualizar tabela projects
-- Execute este script COMPLETO no SQL Editor do Supabase
-- Versão sem RAISE NOTICE para evitar erros

-- 1. Adicionar colunas que faltam
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE projects ADD COLUMN IF NOT EXISTS data JSONB;

-- 2. Migrar dados existentes para coluna data (se necessário)
UPDATE projects 
SET data = jsonb_build_object(
    'id', id,
    'name', name,
    'description', COALESCE(description, ''),
    'documents', '[]'::jsonb,
    'tasks', '[]'::jsonb,
    'phases', '[]'::jsonb,
    'tags', '[]'::jsonb
)
WHERE data IS NULL;

-- 3. Tornar coluna data obrigatória (após migração)
ALTER TABLE projects ALTER COLUMN data SET NOT NULL;

-- 4. Criar índices
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);

-- 5. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Criar trigger (remove e recria se já existir)
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Habilitar RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas (remove e recria se já existirem)
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid()::text = user_id OR user_id LIKE 'anon-%');

DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'anon-%');

DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid()::text = user_id OR user_id LIKE 'anon-%')
  WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'anon-%');

DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid()::text = user_id OR user_id LIKE 'anon-%');

-- 9. Verificar estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

