# Passos manuais – Supabase (projeto dfsgxqwqhmgziziaabch)

O restante já está configurado no repositório (URL do projeto, proxy, SQL). Você só precisa fazer **2 coisas**:

---

## 1. Colar a chave `service_role` no `.env`

Se ainda não tiver um arquivo `.env` na raiz do projeto, copie `.env.example` para `.env` e depois preencha a chave abaixo.

1. Abra: **[Supabase → API](https://supabase.com/dashboard/project/dfsgxqwqhmgziziaabch/settings/api)**  
2. Em **Project API keys**, copie a chave **`service_role`** (secret; não use a `anon`).  
3. Na raiz do projeto, abra o arquivo **`.env`** (se não existir, copie de `.env.example` e renomeie).  
4. Na linha `SUPABASE_SERVICE_ROLE_KEY=`, cole a chave depois do `=` (sem espaços).  
   Exemplo: `SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...`

---

## 2. Criar as tabelas no Supabase (só uma vez)

1. Abra o **SQL Editor** do projeto:  
   **[Nova query](https://supabase.com/dashboard/project/dfsgxqwqhmgziziaabch/sql/new)**  
2. Copie **todo** o conteúdo do arquivo **[docs/SUPABASE_NEW_PROJECT_SETUP.sql](SUPABASE_NEW_PROJECT_SETUP.sql)**.  
3. Cole no editor e clique em **Run**.  
4. Confirme que não há erros (cria as tabelas `projects` e `task_test_status`).

---

## Depois disso

- **Local:** na raiz do projeto execute `npm run dev:local` e acesse **http://localhost:3000**.  
- **Vercel:** em **Settings → Environment Variables** do projeto, defina `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` com os mesmos valores (e `VITE_SUPABASE_PROXY_URL=/api/supabaseProxy`), depois faça redeploy.
