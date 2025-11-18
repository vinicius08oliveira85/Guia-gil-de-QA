-- Script de Migração para atualizar tabela existente
-- Execute este script se você já criou a tabela "projects" mas ela não tem todas as colunas necessárias

-- Adicionar colunas que faltam (se não existirem)
DO $$ 
BEGIN
    -- Adicionar coluna description se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'description'
    ) THEN
        ALTER TABLE projects ADD COLUMN description TEXT;
    END IF;

    -- Adicionar coluna created_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE projects ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Adicionar coluna updated_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE projects ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Adicionar coluna data (JSONB) se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'data'
    ) THEN
        ALTER TABLE projects ADD COLUMN data JSONB;
        
        -- Migrar dados existentes: criar objeto JSON a partir das colunas existentes
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
        
        -- Tornar a coluna NOT NULL após migração
        ALTER TABLE projects ALTER COLUMN data SET NOT NULL;
    END IF;
END $$;

-- Criar índices se não existirem
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger se não existir
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS se não estiver habilitado
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;

-- Criar novas políticas (suportando usuários anônimos)
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (auth.uid()::text = user_id OR user_id LIKE 'anon-%');

CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'anon-%');

CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (auth.uid()::text = user_id OR user_id LIKE 'anon-%')
  WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'anon-%');

CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (auth.uid()::text = user_id OR user_id LIKE 'anon-%');

-- Verificar estrutura final da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

