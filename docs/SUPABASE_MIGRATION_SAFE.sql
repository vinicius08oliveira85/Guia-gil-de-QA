-- Script de Migração SEGURO (sem operações destrutivas)
-- Execute este script no SQL Editor do Supabase
-- Este script é seguro e não remove dados existentes

-- Adicionar colunas que faltam (se não existirem)
DO $$ 
BEGIN
    -- Adicionar coluna description se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'description'
    ) THEN
        ALTER TABLE projects ADD COLUMN description TEXT;
        RAISE NOTICE 'Coluna description adicionada';
    ELSE
        RAISE NOTICE 'Coluna description já existe';
    END IF;

    -- Adicionar coluna created_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE projects ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Coluna created_at adicionada';
    ELSE
        RAISE NOTICE 'Coluna created_at já existe';
    END IF;

    -- Adicionar coluna updated_at se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE projects ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        RAISE NOTICE 'Coluna updated_at adicionada';
    ELSE
        RAISE NOTICE 'Coluna updated_at já existe';
    END IF;

    -- Adicionar coluna data (JSONB) se não existir
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'data'
    ) THEN
        ALTER TABLE projects ADD COLUMN data JSONB;
        RAISE NOTICE 'Coluna data adicionada';
        
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
        
        RAISE NOTICE 'Dados migrados para coluna data';
        
        -- Tornar a coluna NOT NULL após migração
        ALTER TABLE projects ALTER COLUMN data SET NOT NULL;
        RAISE NOTICE 'Coluna data definida como NOT NULL';
    ELSE
        RAISE NOTICE 'Coluna data já existe';
    END IF;
END $$;

-- Criar índices se não existirem (não destrutivo)
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);

-- Criar ou substituir função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger (substitui se já existir, mas não remove dados)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_projects_updated_at'
    ) THEN
        DROP TRIGGER update_projects_updated_at ON projects;
    END IF;
    
    CREATE TRIGGER update_projects_updated_at
        BEFORE UPDATE ON projects
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    
    RAISE NOTICE 'Trigger update_projects_updated_at criado/atualizado';
END $$;

-- Habilitar RLS se não estiver habilitado (não destrutivo)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Criar políticas apenas se não existirem (versão segura sem DROP)
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
        RAISE NOTICE 'Política de SELECT criada';
    ELSE
        RAISE NOTICE 'Política de SELECT já existe';
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
        RAISE NOTICE 'Política de INSERT criada';
    ELSE
        RAISE NOTICE 'Política de INSERT já existe';
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
        RAISE NOTICE 'Política de UPDATE criada';
    ELSE
        RAISE NOTICE 'Política de UPDATE já existe';
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
        RAISE NOTICE 'Política de DELETE criada';
    ELSE
        RAISE NOTICE 'Política de DELETE já existe';
    END IF;
END $$;

-- Verificar estrutura final da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- Mostrar mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ Migração concluída com sucesso!';
    RAISE NOTICE 'A tabela projects está pronta para uso.';
END $$;

