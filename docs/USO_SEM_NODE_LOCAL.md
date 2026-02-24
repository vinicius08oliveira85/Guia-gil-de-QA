# 🚀 Usando Integração Figma sem Node.js Local

Como você não pode usar Node.js localmente (bloqueado pela empresa), aqui está como usar a integração via **GitHub Actions** e **Vercel**.

## 📋 Opções Disponíveis

### Opção 1: GitHub Actions (Recomendado) ⭐

O GitHub Actions executa automaticamente a sincronização de tokens.

#### Configuração Inicial

1. **Adicionar Secrets no GitHub:**
   - Vá em: `Settings` → `Secrets and variables` → `Actions`
   - Adicione:
     - `FIGMA_API_TOKEN` = `seu_token_do_figma_aqui`
     - `FIGMA_FILE_KEY` = `seu_file_key_aqui`

2. **Workflow já está configurado:**
   - Arquivo: `.github/workflows/sync-figma-tokens.yml`
   - Executa automaticamente:
     - Diariamente às 2h (UTC)
     - Quando você faz push no `.env` ou `tokens/design-tokens.json`
     - Manualmente via "Run workflow"

#### Como Usar

**Sincronização Manual:**

1. Vá em: `Actions` → `Sync Figma Tokens`
2. Clique em `Run workflow`
3. Aguarde a execução
4. Os tokens serão atualizados automaticamente no repositório

**Sincronização Automática:**

- O workflow executa automaticamente todos os dias
- Ou quando você atualiza o arquivo de tokens

### Opção 2: Vercel Serverless Function

Use a API route do Vercel para sincronizar tokens.

#### Configuração

1. **Adicionar variáveis de ambiente no Vercel:**
   - Vá em: `Settings` → `Environment Variables`
   - Adicione:
     - `VITE_FIGMA_API_TOKEN` = `seu_token_do_figma_aqui`
     - `FIGMA_FILE_KEY` = `seu_file_key_aqui`
     - `SYNC_API_TOKEN` = (opcional, para segurança)

2. **Fazer deploy:**
   - O Vercel detecta automaticamente a API route
   - Arquivo: `api/sync-figma-tokens.ts`

#### Como Usar

**Via cURL:**

```bash
curl -X POST https://seu-projeto.vercel.app/api/sync-figma-tokens \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_SYNC_TOKEN" \
  -d '{"fileKey": "seu_file_key_aqui"}'
```

**Via Interface Web:**

- Crie uma página simples que chama a API
- Ou use o Vercel Dashboard para testar

### Opção 3: Usar Tokens Existentes

Se você já tem tokens no `tokens/design-tokens.json`, eles serão usados automaticamente no build do Vercel.

## 🔄 Fluxo de Trabalho Recomendado

### Para Designers:

1. **Atualizar design no Figma**
2. **Aguardar sincronização automática** (GitHub Actions)
   - Ou **disparar manualmente** via GitHub Actions
3. **Tokens são atualizados automaticamente** no repositório
4. **Vercel faz rebuild** automaticamente com novos tokens

### Para Desenvolvedores:

1. **Fazer pull** do repositório
2. **Tokens já estão atualizados** (via GitHub Actions)
3. **Desenvolver** usando os tokens
4. **Fazer commit e push**
5. **Vercel faz deploy** automaticamente

## 📝 Configuração do Vercel

### Build Command

O Vercel já está configurado para:

```json
{
  "buildCommand": "npm run tokens:build && vite build"
}
```

Isso garante que os tokens sejam gerados antes do build.

### Environment Variables no Vercel

Adicione estas variáveis no Vercel Dashboard:

```
VITE_FIGMA_API_TOKEN=seu_token_do_figma_aqui
FIGMA_FILE_KEY=seu_file_key_aqui
STORYBOOK_FIGMA_URL=https://www.figma.com/make/seu_file_key/...
```

## ✅ Checklist

- [ ] Adicionar secrets no GitHub Actions
- [ ] Configurar variáveis no Vercel
- [ ] Testar sincronização via GitHub Actions
- [ ] Verificar build no Vercel
- [ ] Configurar Storybook no Vercel (opcional)

## 🎯 Próximos Passos

1. **Adicionar secrets no GitHub** (FIGMA_API_TOKEN e FIGMA_FILE_KEY)
2. **Testar workflow** via "Run workflow" no GitHub
3. **Verificar** se os tokens foram atualizados
4. **Fazer deploy** no Vercel (automático via GitHub)

## 📚 Referências

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)
