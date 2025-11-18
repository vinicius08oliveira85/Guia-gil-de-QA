-- Script FINAL - Versão mais segura (sem DROP)
-- Execute este script no SQL Editor do Supabase
-- Esta versão não usa DROP, apenas cria o que falta

-- 1. Adicionar colunas que faltam (não destrutivo)
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
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' 
        AND column_name = 'data' 
        AND is_nullable = 'YES'
    ) THEN
        ALTER TABLE projects ALTER COLUMN data SET NOT NULL;
    END IF;
END $$;

-- 4. Criar índices (não destrutivo)
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

-- 6. Criar trigger (sem DROP - apenas cria se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_projects_updated_at'
    ) THEN
        CREATE TRIGGER update_projects_updated_at
            BEFORE UPDATE ON projects
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 7. Habilitar RLS (não destrutivo)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- 8. Criar políticas apenas se não existirem (sem DROP)
DO $$
BEGIN
    -- Política de SELECT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'projects' 
        AND policyname = 'Users can view their own projects'
    ) THEN
        CREATE POLICY "Users can view their own projects"
          ON projects FOR SELECT
          USING (auth.uid()::text = user_id OR user_id LIKE 'anon-%');
    END IF;

    -- Política de INSERT
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'projects' 
        AND policyname = 'Users can insert their own projects'
    ) THEN
        CREATE POLICY "Users can insert their own projects"
          ON projects FOR INSERT
          WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'anon-%');
    END IF;

    -- Política de UPDATE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'projects' 
        AND policyname = 'Users can update their own projects'
    ) THEN
        CREATE POLICY "Users can update their own projects"
          ON projects FOR UPDATE
          USING (auth.uid()::text = user_id OR user_id LIKE 'anon-%')
          WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'anon-%');
    END IF;

    -- Política de DELETE
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'projects' 
        AND policyname = 'Users can delete their own projects'
    ) THEN
        CREATE POLICY "Users can delete their own projects"
          ON projects FOR DELETE
          USING (auth.uid()::text = user_id OR user_id LIKE 'anon-%');
    END IF;
END $$;

-- 9. Verificar estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

