# ⚡ Setup Rápido - GitHub + Vercel

## 🎯 Para Usuários Sem Node.js Local

Como você não tem Node.js local (bloqueado pela empresa), tudo funciona via **GitHub Actions** e **Vercel**.

## ⚡ Setup em 3 Passos

### 1️⃣ Adicionar Secrets no GitHub

```
Settings → Secrets and variables → Actions → New repository secret
```

Adicione:
- `FIGMA_API_TOKEN` = `seu_token_do_figma_aqui`
- `FIGMA_FILE_KEY` = `seu_file_key_aqui`

### 2️⃣ Adicionar Variáveis no Vercel

```
Settings → Environment Variables
```

Adicione:
- `VITE_FIGMA_API_TOKEN` = `seu_token_do_figma_aqui`
- `FIGMA_FILE_KEY` = `seu_file_key_aqui`

### 3️⃣ Testar

1. Vá em **Actions** → **Sync Figma Tokens** → **Run workflow**
2. Aguarde execução
3. ✅ Pronto!

## 🔄 Sincronização

- **Automática**: Diariamente às 2h UTC
- **Manual**: Actions → Run workflow
- **Build**: Vercel gera tokens automaticamente

## 📚 Documentação Completa

Veja `docs/USO_SEM_NODE_LOCAL.md` para detalhes.

