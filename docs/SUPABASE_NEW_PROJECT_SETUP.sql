-- Configuração completa para um NOVO projeto Supabase (qa-agile-guide)
-- Execute este script inteiro no SQL Editor: https://supabase.com/dashboard/project/SEU_PROJECT_REF/sql/new
-- Substitua SEU_PROJECT_REF pelo ID do projeto (ex.: veijknxfwjbzvgetzdzf)

-- ========== PARTE 1: Tabela projects ==========

CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

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

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can view their own projects'
    ) THEN
        CREATE POLICY "Users can view their own projects" ON projects FOR SELECT
          USING (auth.uid()::text = user_id OR user_id LIKE 'anon-%');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can insert their own projects'
    ) THEN
        CREATE POLICY "Users can insert their own projects" ON projects FOR INSERT
          WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'anon-%');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can update their own projects'
    ) THEN
        CREATE POLICY "Users can update their own projects" ON projects FOR UPDATE
          USING (auth.uid()::text = user_id OR user_id LIKE 'anon-%')
          WITH CHECK (auth.uid()::text = user_id OR user_id LIKE 'anon-%');
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can delete their own projects'
    ) THEN
        CREATE POLICY "Users can delete their own projects" ON projects FOR DELETE
          USING (auth.uid()::text = user_id OR user_id LIKE 'anon-%');
    END IF;
END $$;

-- ========== PARTE 2: Tabela task_test_status ==========

CREATE TABLE IF NOT EXISTS task_test_status (
  task_key TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('testar', 'testando', 'pendente', 'teste_concluido')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_test_status_updated_at ON task_test_status(updated_at);
CREATE INDEX IF NOT EXISTS idx_task_test_status_status ON task_test_status(status);

CREATE OR REPLACE FUNCTION update_task_test_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_task_test_status_updated_at ON task_test_status;
CREATE TRIGGER update_task_test_status_updated_at
    BEFORE UPDATE ON task_test_status
    FOR EACH ROW
    EXECUTE FUNCTION update_task_test_status_updated_at();

ALTER TABLE task_test_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all access for shared anonymous users" ON task_test_status;
CREATE POLICY "Allow all access for shared anonymous users"
  ON task_test_status FOR ALL
  USING (true)
  WITH CHECK (true);
