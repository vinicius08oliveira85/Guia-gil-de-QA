# 🚀 Configuração para GitHub + Vercel (Sem Node.js Local)

## ✅ Tudo Configurado!

A integração está pronta para funcionar **100% via GitHub Actions e Vercel**, sem precisar de Node.js local.

## 📋 Passo a Passo de Configuração

### 1. Configurar Secrets no GitHub

1. Vá no seu repositório GitHub
2. Clique em **Settings** → **Secrets and variables** → **Actions**
3. Clique em **New repository secret**
4. Adicione os seguintes secrets:

| Nome | Valor |
|------|-------|
| `FIGMA_API_TOKEN` | `seu_token_do_figma_aqui` |
| `FIGMA_FILE_KEY` | `seu_file_key_aqui` |

### 2. Configurar Variáveis no Vercel

1. Vá no seu projeto no Vercel
2. Clique em **Settings** → **Environment Variables**
3. Adicione as seguintes variáveis:

| Nome | Valor | Ambiente |
|------|-------|----------|
| `VITE_FIGMA_API_TOKEN` | `seu_token_do_figma_aqui` | Production, Preview, Development |
| `FIGMA_FILE_KEY` | `seu_file_key_aqui` | Production, Preview, Development |
| `STORYBOOK_FIGMA_URL` | `https://www.figma.com/make/BnNDG2oJPvckiNda3H4MLt/...` | Production, Preview, Development |

### 3. Testar Sincronização via GitHub Actions

1. Vá em **Actions** no GitHub
2. Clique em **Sync Figma Tokens**
3. Clique em **Run workflow**
4. Aguarde a execução
5. Verifique se os tokens foram atualizados em `tokens/design-tokens.json`

## 🔄 Como Funciona

### Sincronização Automática

O workflow do GitHub Actions (`sync-figma-tokens.yml`) executa:

- ✅ **Diariamente às 2h UTC** (automático)
- ✅ **Quando você faz push** em `.env` ou `tokens/design-tokens.json`
- ✅ **Manual** via "Run workflow" no GitHub

### Build no Vercel

O Vercel está configurado para:

1. ✅ Instalar dependências (`npm install`)
2. ✅ Gerar tokens (`npm run tokens:build`)
3. ✅ Fazer build do projeto (`npm run build`)
4. ✅ Deploy automático

## 🎯 Fluxo de Trabalho

### Quando o Designer Atualiza o Figma:

1. Designer atualiza design no Figma
2. Você dispara o workflow no GitHub (ou aguarda execução automática)
3. GitHub Actions sincroniza tokens
4. Tokens são commitados automaticamente
5. Vercel detecta mudança e faz rebuild
6. ✅ Deploy com novos tokens!

### Para Desenvolver:

1. Fazer pull do repositório
2. Tokens já estão atualizados (via GitHub Actions)
3. Desenvolver normalmente
4. Commit e push
5. Vercel faz deploy automaticamente

## 📝 Arquivos Importantes

- ✅ `.github/workflows/sync-figma-tokens.yml` - Workflow de sincronização
- ✅ `api/sync-figma-tokens.ts` - API route do Vercel (opcional)
- ✅ `vercel.json` - Configurado para gerar tokens no build
- ✅ `.env` - Já configurado (não versionado)

## ✅ Checklist Final

- [ ] Adicionar `FIGMA_API_TOKEN` no GitHub Secrets
- [ ] Adicionar `FIGMA_FILE_KEY` no GitHub Secrets
- [ ] Adicionar variáveis no Vercel
- [ ] Testar workflow no GitHub Actions
- [ ] Verificar build no Vercel
- [ ] Pronto! 🎉

## 🚀 Próximo Passo

**Apenas adicionar os secrets no GitHub e variáveis no Vercel!**

Depois disso, tudo funcionará automaticamente via GitHub Actions e Vercel.

