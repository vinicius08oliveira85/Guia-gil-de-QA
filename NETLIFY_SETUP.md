# 🚀 Guia de Configuração do Netlify - Passo a Passo

## ✅ Arquivos Já Configurados

- ✅ `netlify.toml` - Configuração do build
- ✅ `netlify/functions/jira-proxy.js` - Função serverless para Jira
- ✅ Redirect configurado para `/api/jira-proxy` → `/.netlify/functions/jira-proxy`

## 📋 Passo a Passo Completo

### 1. Criar Conta no Netlify

1. Acesse: **https://netlify.com**
2. Clique em **"Sign up"**
3. Escolha **"Sign up with GitHub"** (recomendado)
4. Autorize o acesso ao GitHub

### 2. Conectar Repositório

1. No dashboard do Netlify, clique em **"Add new site"**
2. Selecione **"Import an existing project"**
3. Escolha **"Deploy with GitHub"**
4. Autorize o Netlify a acessar seus repositórios
5. Selecione o repositório: **`Guia-gil-de-QA`**

### 3. Configurar Build Settings

O Netlify deve detectar automaticamente as configurações do `netlify.toml`, mas verifique:

**Build settings:**
- **Build command**: `npm install --legacy-peer-deps && npm run build`
- **Publish directory**: `dist`
- **Branch to deploy**: `main`

Se não detectar automaticamente, configure manualmente.

### 4. Configurar Variáveis de Ambiente

**IMPORTANTE**: Configure todas as variáveis antes do primeiro deploy!

1. Na página de configuração do site, vá em **"Site settings"**
2. Clique em **"Environment variables"**
3. Adicione as seguintes variáveis:

```
VITE_OPENAI_API_KEY=sua_chave_openai_aqui
VITE_GEMINI_API_KEY=sua_chave_gemini_aqui
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

**Nota**: Use os mesmos valores que estão no Vercel.

### 5. Fazer o Deploy

1. Clique em **"Deploy site"**
2. Aguarde o build completar (2-5 minutos)
3. Quando concluir, você receberá uma URL: `https://seu-site.netlify.app`

### 6. Verificar Deploy

1. Acesse a URL fornecida
2. Teste a integração com Jira
3. Verifique se as funções serverless estão funcionando

## 🔧 Troubleshooting

### Problema: Build falha
**Solução**: Verifique se todas as variáveis de ambiente estão configuradas.

### Problema: Função serverless não funciona
**Solução**: 
1. Verifique se o arquivo `netlify/functions/jira-proxy.js` existe
2. Verifique os logs em "Functions" no dashboard do Netlify
3. Confirme que o redirect está configurado no `netlify.toml`

### Problema: Erro de CORS
**Solução**: O Netlify Functions já resolve CORS automaticamente, mas se persistir, verifique os headers na função.

## 📊 Comparação Vercel vs Netlify

| Recurso | Vercel | Netlify |
|---------|--------|---------|
| Deploy automático | ✅ | ✅ |
| Serverless Functions | ✅ | ✅ |
| Limite de deploy | ⚠️ Limitado | ✅ Sem limite |
| Bandwidth grátis | 100GB | 100GB |
| Build time | Rápido | Rápido |

## 🎯 Próximos Passos Após Deploy

1. ✅ Testar todas as funcionalidades
2. ✅ Verificar integração com Jira
3. ✅ Testar análises de IA
4. ✅ Configurar domínio customizado (opcional)

## 💡 Dica

Você pode manter **ambos** os serviços:
- **Vercel**: Para produção principal
- **Netlify**: Como backup ou para desenvolvimento

Ambos podem estar conectados ao mesmo repositório GitHub!

