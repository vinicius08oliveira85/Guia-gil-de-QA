# Guia Passo a Passo: Configurar Supabase no Vercel

Este guia mostra como configurar o Supabase no Vercel para habilitar o salvamento de projetos no banco de dados.

## Pré-requisitos

- Conta no Vercel
- Projeto já conectado ao repositório GitHub
- Credenciais do Supabase:
  - URL: `https://vebpalhcvzbbzmdzglag.supabase.co`
  - Service Role Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlYnBhbGhjdnpiYnptZHpnbGFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUxMDA2OSwiZXhwIjoyMDc4MDg2MDY5fQ.ZptQY6-bpBEAI8u4zUmJN6zMefef8ZlGMQCeJh3Myxw`

## Passo 1: Acessar Configurações do Projeto no Vercel

1. Acesse https://vercel.com
2. Faça login na sua conta
3. Selecione seu projeto (ou crie um novo se necessário)
4. Vá em **Settings** > **Environment Variables**

## Passo 2: Adicionar Variáveis de Ambiente

### Variáveis para Backend (Serverless Functions)

Estas variáveis são usadas pela função `api/supabaseProxy.ts`:

1. Clique em **Add New**
2. Adicione as seguintes variáveis:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `SUPABASE_URL` | `https://vebpalhcvzbbzmdzglag.supabase.co` | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlYnBhbGhjdnpiYnptZHpnbGFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjUxMDA2OSwiZXhwIjoyMDc4MDg2MDY5fQ.ZptQY6-bpBEAI8u4zUmJN6zMefef8ZlGMQCeJh3Myxw` | Production, Preview, Development |

> **Importante**: Marque todas como disponíveis para "Production", "Preview" e "Development"

### Variáveis para Frontend

Estas variáveis são usadas pelo código React:

1. Adicione mais duas variáveis:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `VITE_PUBLIC_SUPABASE_URL` | `https://vebpalhcvzbbzmdzglag.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_PROXY_URL` | `/api/supabaseProxy` | Production, Preview, Development |

> **Nota**: `VITE_SUPABASE_PROXY_URL` deve ser um caminho relativo (`/api/supabaseProxy`), não uma URL completa.

## Passo 3: Fazer Deploy

Após adicionar todas as variáveis:

1. Vá para a aba **Deployments**
2. Clique nos três pontos (...) do último deployment
3. Selecione **Redeploy**
4. Ou faça um novo commit e push para trigger automático

## Passo 4: Verificar Configuração

Após o deploy:

1. Acesse sua aplicação no Vercel
2. Abra o console do navegador (F12)
3. Procure por mensagens como:
   - ✅ "Supabase configurado via proxy"
   - ⚠️ "Supabase não configurado" (se algo estiver errado)

4. Na aplicação, vá em **Configurações** > **Supabase**
5. Deve aparecer "Configurado" em verde

## Passo 5: Testar Salvamento

1. Abra um projeto na aplicação
2. Clique no botão **"Salvar no Supabase"**
3. Deve aparecer uma mensagem de sucesso
4. Verifique no Supabase Dashboard se o projeto foi salvo:
   - Acesse: https://supabase.com/dashboard/project/vebpalhcvzbbzmdzglag/editor
   - Vá na tabela `projects`
   - Deve aparecer o projeto salvo

## Troubleshooting

### Erro: "Supabase não está configurado"

- Verifique se todas as variáveis foram adicionadas corretamente
- Certifique-se de que fez redeploy após adicionar as variáveis
- Verifique se `VITE_SUPABASE_PROXY_URL` está como `/api/supabaseProxy` (caminho relativo)

### Erro: "CORS policy"

- Isso significa que o proxy não está funcionando
- Verifique se `VITE_SUPABASE_PROXY_URL` está configurado
- Verifique se a função `api/supabaseProxy.ts` está sendo deployada corretamente

### Erro: "Supabase não configurado" no proxy

- Verifique se `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` estão configuradas
- Essas variáveis devem estar disponíveis para as serverless functions

## Estrutura do Proxy

O proxy (`api/supabaseProxy.ts`) funciona como intermediário:
- Frontend → `/api/supabaseProxy` → Supabase (usando service role key)
- Isso evita CORS e mantém a chave segura no backend

## Próximos Passos

Após configurar:
- Os projetos serão salvos automaticamente no Supabase quando você clicar em "Salvar no Supabase"
- Os dados estarão disponíveis em qualquer dispositivo
- Os dados não serão perdidos ao limpar o cache do navegador

