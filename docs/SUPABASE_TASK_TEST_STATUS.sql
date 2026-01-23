-- Script para criar tabela de status de teste de tasks
-- Execute este script no SQL Editor do Supabase
-- Esta tabela armazena o status de teste independente do Jira

-- 1. Criar tabela task_test_status
CREATE TABLE IF NOT EXISTS task_test_status (
  task_key TEXT PRIMARY KEY,  -- Chave da task (ex: GDPI-271)
  status TEXT NOT NULL CHECK (status IN ('testar', 'testando', 'pendente', 'teste_concluido')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_task_test_status_updated_at ON task_test_status(updated_at);
CREATE INDEX IF NOT EXISTS idx_task_test_status_status ON task_test_status(status);

-- 3. Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_task_test_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Criar trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_task_test_status_updated_at ON task_test_status;
CREATE TRIGGER update_task_test_status_updated_at
    BEFORE UPDATE ON task_test_status
    FOR EACH ROW
    EXECUTE FUNCTION update_task_test_status_updated_at();

-- 5. Habilitar RLS (Row Level Security)
ALTER TABLE task_test_status ENABLE ROW LEVEL SECURITY;

-- 6. Criar políticas RLS (permitir acesso para todos os usuários anônimos compartilhados)
-- Como o sistema usa ID compartilhado 'anon-shared', permitir acesso para todos
CREATE POLICY "Allow all access for shared anonymous users"
  ON task_test_status
  FOR ALL
  USING (true)
  WITH CHECK (true);

