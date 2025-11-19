-- Script SQL para criar a tabela de projetos no Supabase
-- Execute este script no SQL Editor do Supabase

-- Criar tabela de projetos
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data JSONB NOT NULL -- Armazena todo o projeto como JSON
);

-- Criar índices para melhor performance
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

-- Criar trigger para atualizar updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver apenas seus próprios projetos
-- Inclui suporte para ID compartilhado 'anonymous-shared' para sincronização entre dispositivos
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
CREATE POLICY "Users can view their own projects"
  ON projects FOR SELECT
  USING (
    auth.uid()::text = user_id 
    OR user_id LIKE 'anon-%' 
    OR user_id = 'anonymous-shared'
  );

-- Política: Usuários podem inserir seus próprios projetos
-- Inclui suporte para ID compartilhado 'anonymous-shared' para sincronização entre dispositivos
DROP POLICY IF EXISTS "Users can insert their own projects" ON projects;
CREATE POLICY "Users can insert their own projects"
  ON projects FOR INSERT
  WITH CHECK (
    auth.uid()::text = user_id 
    OR user_id LIKE 'anon-%' 
    OR user_id = 'anonymous-shared'
  );

-- Política: Usuários podem atualizar seus próprios projetos
-- Inclui suporte para ID compartilhado 'anonymous-shared' para sincronização entre dispositivos
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
CREATE POLICY "Users can update their own projects"
  ON projects FOR UPDATE
  USING (
    auth.uid()::text = user_id 
    OR user_id LIKE 'anon-%' 
    OR user_id = 'anonymous-shared'
  )
  WITH CHECK (
    auth.uid()::text = user_id 
    OR user_id LIKE 'anon-%' 
    OR user_id = 'anonymous-shared'
  );

-- Política: Usuários podem deletar seus próprios projetos
-- Inclui suporte para ID compartilhado 'anonymous-shared' para sincronização entre dispositivos
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
CREATE POLICY "Users can delete their own projects"
  ON projects FOR DELETE
  USING (
    auth.uid()::text = user_id 
    OR user_id LIKE 'anon-%' 
    OR user_id = 'anonymous-shared'
  );

-- Verificar se a tabela foi criada corretamente
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

