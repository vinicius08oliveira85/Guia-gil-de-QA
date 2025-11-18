# 🚀 Guia Rápido de Deploy Alternativo

## ⚡ Solução Mais Rápida: Deploy Manual via Vercel CLI

### Passo a Passo:

1. **Instalar Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Fazer login**:
   ```bash
   vercel login
   ```

3. **Deploy manual** (pode contornar limite de taxa):
   ```bash
   vercel --prod
   ```

**Tempo estimado**: 2-3 minutos

---

## 🌐 Alternativa: Netlify (Recomendado para uso contínuo)

### Por que Netlify?
- ✅ Sem limites rígidos de deploy
- ✅ 100GB bandwidth grátis/mês
- ✅ Suporta serverless functions
- ✅ Deploy automático do GitHub

### Configuração Rápida:

1. **Acesse**: https://netlify.com
2. **Conecte GitHub**: Clique em "New site from Git" → GitHub → Selecione o repositório
3. **Configure**:
   - Build command: `npm install --legacy-peer-deps && npm run build`
   - Publish directory: `dist`
4. **Adicione variáveis de ambiente** (Settings → Environment Variables):
   - `VITE_OPENAI_API_KEY`
   - `VITE_GEMINI_API_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. **Deploy**: Clique em "Deploy site"

**Arquivos já criados**: `netlify.toml` e `netlify/functions/jira-proxy.js`

**Nota**: Para usar Netlify Functions, você precisará atualizar o endpoint em `services/jiraService.ts` de `/api/jira-proxy` para `/.netlify/functions/jira-proxy` (ou criar um redirect no `netlify.toml`).

---

## 📋 Comparação Rápida

| Plataforma | Tempo Setup | Limite Deploy | Serverless | Grátis |
|------------|-------------|---------------|------------|--------|
| **Vercel CLI** | 2 min | Pode contornar | ✅ | ✅ |
| **Netlify** | 5 min | Sem limite | ✅ | ✅ |
| **Railway** | 5 min | Créditos | ✅ | $5/mês |
| **Render** | 5 min | Sem limite | ✅ | ✅ |

---

## 🎯 Recomendação Imediata

**Use Vercel CLI** para deploy imediato:
```bash
npm install -g vercel
vercel login
vercel --prod
```

Isso deve funcionar mesmo com o limite de taxa ativo!

