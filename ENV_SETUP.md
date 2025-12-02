# Configuração de Variáveis de Ambiente

## Variáveis do Supabase

### Para Desenvolvimento Local

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# URL do Supabase (público - pode ser exposto no frontend)
VITE_PUBLIC_SUPABASE_URL=https://vebpalhcvzbbzmdzglag.supabase.co

# URL do Supabase (alternativa, para compatibilidade)
SUPABASE_URL=https://vebpalhcvzbbzmdzglag.supabase.co

# Chave anônima do Supabase (para uso direto no frontend - apenas em desenvolvimento)
# Em produção, use VITE_SUPABASE_PROXY_URL para evitar CORS
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui

# Chave de serviço do Supabase (para uso no backend/proxy - NUNCA exponha no frontend)
# Esta chave deve ser usada apenas em serverless functions ou backend
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlYnBhbGhjdnpiYnptZHpnbGFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUxMDA2OSwiZXhwIjoyMDc4MDg2MDY5fQ.ZptQY6-bpBEAI8u4zUmJN6zMefef8ZlGMQCeJh3Myxw

# URL do proxy do Supabase (recomendado para produção - Vercel)
# Configure esta variável no Vercel para evitar problemas de CORS
# Exemplo: https://your-app.vercel.app/api/supabase
VITE_SUPABASE_PROXY_URL=
```

### Para Produção (Vercel)

1. Acesse: https://vercel.com/seu-projeto/settings/environment-variables
2. Adicione as seguintes variáveis:
   - `VITE_PUBLIC_SUPABASE_URL`: `https://vebpalhcvzbbzmdzglag.supabase.co`
   - `SUPABASE_URL`: `https://vebpalhcvzbbzmdzglag.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - `VITE_SUPABASE_PROXY_URL`: URL do seu proxy (se configurado)

## Variáveis do Jira

```env
# URL do Jira (ex: https://your-company.atlassian.net)
VITE_JIRA_URL=

# Email do usuário do Jira
VITE_JIRA_EMAIL=

# Token de API do Jira (gerado em: Account Settings > Security > API Tokens)
VITE_JIRA_API_TOKEN=
```

## Importante

- **NUNCA** commite arquivos `.env` ou `.env.local` com valores reais
- `SUPABASE_SERVICE_ROLE_KEY` deve ser usado **APENAS** no backend/proxy
- Em produção, sempre use `VITE_SUPABASE_PROXY_URL` para evitar CORS
- O arquivo `.env.local` está no `.gitignore` e não será commitado

