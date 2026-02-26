# 🔐 Configurar Arquivo .env

## ⚠️ IMPORTANTE: Crie o arquivo `.env` manualmente na raiz do projeto

O arquivo `.env` não é versionado por segurança. Você precisa criá-lo manualmente.

## 📝 Conteúdo do Arquivo .env

Copie e cole o seguinte conteúdo em um arquivo chamado `.env` na raiz do projeto:

```env
# Figma API Integration
# Token obtido em: https://www.figma.com/settings
VITE_FIGMA_API_TOKEN=YOUR_FIGMA_TOKEN_HERE

# Figma File Key
# Obtenha da URL do seu arquivo Figma: https://www.figma.com/file/{FILE_KEY}/...
# Exemplo: se a URL é https://www.figma.com/file/abc123xyz/Design-Name
# então FILE_KEY=abc123xyz
FIGMA_FILE_KEY=

# Storybook Figma URL (opcional)
# URL completa do design no Figma para visualização no Storybook
STORYBOOK_FIGMA_URL=

# Chromatic Project Token (opcional - para visual testing)
# Obtenha em: https://www.chromatic.com
CHROMATIC_PROJECT_TOKEN=

# Supabase (persistência na nuvem)
# No frontend (Vite) APENAS variáveis com prefixo VITE_ são expostas no navegador.
# Sem o prefixo VITE_, SUPABASE_URL e SUPABASE_ANON_KEY ficam undefined no cliente.
# Para uso apenas do proxy (recomendado em produção no Vercel):
VITE_SUPABASE_PROXY_URL=/api/supabaseProxy

# Variáveis do servidor (Vercel: Settings → Environment Variables)
# Usadas apenas pela API route api/supabaseProxy – não expor no frontend.
# SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui
# Exemplo para projeto veijknxfwjbzvgetzdzf:
# SUPABASE_URL=https://veijknxfwjbzvgetzdzf.supabase.co

# Para SDK direto no cliente (ex.: desenvolvimento local sem proxy):
# VITE_SUPABASE_URL=https://xxxxx.supabase.co
# VITE_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

## Desenvolvimento local (localhost)

**Um comando só (recomendado):** na raiz do projeto execute `npm run dev:local`. Quando o servidor subir, abra **http://localhost:3000**. O app e o proxy Supabase rodam juntos. No `.env` use `VITE_SUPABASE_PROXY_URL=/api/supabaseProxy` e preencha `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (veja exemplo em `.env.example`).  
**Primeira vez:** se aparecer erro de credenciais, rode `npx vercel login` no terminal, faça login no navegador e depois execute `npm run dev:local` de novo.

- **Opção 1 – `npm run dev` (porta 5173)**  
  O app abre em `http://localhost:5173`. O Vite encaminha `/api/*` para `http://localhost:3000`.  
  Para o Supabase funcionar no localhost:
  1. Em um terminal: `npx vercel dev` (sobe o backend na porta 3000).
  2. Em outro: `npm run dev` (sobe o frontend na porta 5173).
  3. No `.env`: `VITE_SUPABASE_PROXY_URL=/api/supabaseProxy` (caminho relativo; o proxy do Vite envia para a porta 3000).
  4. No mesmo `.env` (para o `vercel dev` usar): `SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co` e `SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key`.

- **Opção 2 – Só `vercel dev` (porta 3000)**  
  Rode `npx vercel dev` e abra `http://localhost:3000`. O app e o proxy Supabase rodam juntos.  
  No `.env`: `VITE_SUPABASE_PROXY_URL=http://localhost:3000/api/supabaseProxy` (ou `/api/supabaseProxy` se o frontend for servido na mesma origem).

- **Opção 3 – Sem proxy (apenas IndexedDB ou SDK direto)**  
  Use só `npm run dev` e `http://localhost:5173`. Para falar com o Supabase sem proxy, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` (acesso direto; em produção pode haver CORS).

## ✅ Seu Token Já Está Configurado!

O token do Figma deve ser configurado acima:
- ⚠️ `VITE_FIGMA_API_TOKEN=YOUR_FIGMA_TOKEN_HERE` (substitua pelo seu token)

## 📋 Próximos Passos

1. **Criar o arquivo `.env`** na raiz do projeto com o conteúdo acima

2. **Obter o File Key do Figma:**
   - Abra seu arquivo no Figma
   - Copie a URL (exemplo: `https://www.figma.com/file/abc123xyz/Design-Name`)
   - O file key é a parte entre `/file/` e o próximo `/`
   - Cole no `.env` como: `FIGMA_FILE_KEY=abc123xyz`

3. **Testar a conexão:**
   ```bash
   npm run tokens:sync
   ```

## 🌐 Supabase + Vercel (deploy em produção)

Para o app persistir na nuvem no Vercel, configure no **Vercel** (Settings → Environment Variables) para Production e Preview:

| Variável | Valor | Uso |
|----------|--------|-----|
| `SUPABASE_URL` | `https://SEU_PROJECT_REF.supabase.co` | URL do projeto no Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | *(chave em Settings → API no Supabase)* | Usada pelo proxy; não expor no frontend |
| `VITE_SUPABASE_PROXY_URL` | `/api/supabaseProxy` | Frontend usa o proxy na mesma origem |

No **Supabase**, execute o script [docs/SUPABASE_NEW_PROJECT_SETUP.sql](docs/SUPABASE_NEW_PROJECT_SETUP.sql) no SQL Editor do projeto para criar as tabelas `projects` e `task_test_status`. Depois faça redeploy no Vercel.

## Ambiente de homologação (banco separado para homolog)

O deploy da branch **homolog** no Vercel roda como **Preview**. Para que homolog use um **banco Supabase separado** (somente teste), sem misturar dados com produção:

1. **Criar um segundo projeto no Supabase** (ex.: nome "qa-guide-homolog" ou "guia-qa-homolog") em [Supabase Dashboard](https://supabase.com/dashboard). Anotar a **Project URL** e a chave **service_role** (Settings → API).

2. **Rodar o mesmo schema no projeto de homolog:** no novo projeto, abrir **SQL Editor** e executar [docs/SUPABASE_NEW_PROJECT_SETUP.sql](docs/SUPABASE_NEW_PROJECT_SETUP.sql) para criar as tabelas `projects` e `task_test_status`.

3. **Configurar variáveis no Vercel por ambiente:**
   - **Production** (branch main): manter `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` apontando para o projeto Supabase de **produção**.
   - **Preview** (branch homolog): definir `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` com a URL e a chave **service_role** do **projeto Supabase de homolog** (criado no passo 1).

Assim, produção e homolog ficam com bancos distintos; não é necessária alteração de código — o proxy usa as variáveis de ambiente do deploy (Production vs Preview).

## Corrigir erro "Invalid API key" (Supabase no Vercel)

Se o app em produção retornar 500 em `/api/supabaseProxy` e no console aparecer `Erro ao carregar projetos via proxy Supabase { data: Error: Invalid API key ... }`, o proxy está usando URL ou chave incorretas. Siga estes passos (apenas configuração, sem alterar código):

1. **Obter os valores no Supabase**
   - Acesse [Supabase Dashboard](https://supabase.com/dashboard/project/veijknxfwjbzvgetzdzf/settings/api).
   - Copie a **Project URL** (ex.: `https://veijknxfwjbzvgetzdzf.supabase.co`, sem barra no final).
   - Em **Project API keys**, use a chave **service_role** (secret), não a `anon`. É um JWT longo (eyJ...). Se aparecer apenas `sb_publishable_*` e `sb_secret_*`, use a chave **secret** como equivalente à service_role.

2. **Ajustar variáveis no Vercel**
   - Vercel → projeto (ex.: guia-gil-de-qa) → **Settings → Environment Variables**.
   - Para Production e/ou Preview:
     - `SUPABASE_URL`: cole a Project URL do passo 1.
     - `SUPABASE_SERVICE_ROLE_KEY`: cole a chave **service_role** (ou secret). Sem espaços no início/fim; não use a anon key.
   - Remova ou sobrescreva variáveis antigas de outro projeto Supabase.

3. **Redeploy**
   - Vercel → **Deployments** → último deploy → ⋮ → **Redeploy**. Variáveis só valem após novo deploy.

4. **Validar**
   - Abra o app em produção (ex.: `https://guia-gil-de-qa.vercel.app`), DevTools → Console e Rede. Não deve haver 500 em `/api/supabaseProxy` nem "Invalid API key". O status deve indicar sincronização com a nuvem em vez de "Salvo localmente (Supabase indisponível)".

## Aviso no console: "message channel closed before a response was received"

Se aparecer no console (como *Uncaught in promise*):

`A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received`

**Não é um bug do QA Agile Guide.** Esse erro vem da API de mensagens de **extensões do Chrome** (`chrome.runtime.onMessage`). Alguma extensão instalada (bloqueador de anúncios, React DevTools, Cursor, etc.) indica que vai responder à mensagem de forma assíncrona e não envia a resposta a tempo.

- **O que fazer:** pode ignorar; o app funciona normalmente. Para confirmar que é extensão: abra o app em uma janela anônima (extensões costumam ficar desativadas) — se o aviso sumir, a causa é uma extensão.
- Nenhuma alteração no código do projeto é necessária.

## 🔒 Segurança

- ⚠️ **NUNCA** commite o arquivo `.env` no Git
- ✅ O arquivo já está no `.gitignore`
- ✅ Compartilhe apenas o `.env.example` (sem tokens reais)

## 🎯 Exemplo Completo

Se seu arquivo Figma tem a URL:
```
https://www.figma.com/file/abc123xyz456/QA-Agile-Design-System
```

Seu `.env` ficaria assim:
```env
VITE_FIGMA_API_TOKEN=YOUR_FIGMA_TOKEN_HERE
FIGMA_FILE_KEY=abc123xyz456
STORYBOOK_FIGMA_URL=https://www.figma.com/file/abc123xyz456/QA-Agile-Design-System
```

