# Alternativas de Deploy - QA Agile Guide

## 🚨 Situação Atual

O Vercel está limitando deploys devido ao limite de taxa do plano gratuito (muitos deploys em pouco tempo).

## ✅ Alternativas Disponíveis

### 1. **Aguardar o Limite Expirar** (Mais Simples)
- ⏱️ **Tempo**: ~18 horas
- 💰 **Custo**: Grátis
- ✅ **Vantagem**: Automático, sem configuração adicional
- ⚠️ **Desvantagem**: Precisa aguardar

**Ação**: Nenhuma ação necessária. O deploy será feito automaticamente quando o limite expirar.

---

### 2. **Deploy Manual via Vercel CLI** (Pode Contornar Limites)
- ⏱️ **Tempo**: Imediato
- 💰 **Custo**: Grátis
- ✅ **Vantagem**: Pode funcionar mesmo com limite de taxa
- ⚠️ **Desvantagem**: Requer instalação do CLI

**Passos**:
```bash
# 1. Instalar Vercel CLI globalmente
npm install -g vercel

# 2. Fazer login
vercel login

# 3. Deploy manual
vercel --prod
```

---

### 3. **Netlify** (Alternativa Gratuita)
- ⏱️ **Tempo**: 5-10 minutos para configurar
- 💰 **Custo**: Grátis (100GB bandwidth/mês)
- ✅ **Vantagem**: Sem limites rígidos de deploy, suporta serverless functions
- ⚠️ **Desvantagem**: Precisa configurar do zero

**Passos**:
1. Acesse [https://netlify.com](https://netlify.com)
2. Conecte seu repositório GitHub
3. Configure:
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Install command: `npm install --legacy-peer-deps`
4. Adicione variáveis de ambiente (mesmas do Vercel)
5. Deploy automático!

**Arquivo necessário**: Criar `netlify.toml` (vou criar abaixo)

---

### 4. **Railway** (Alternativa com Créditos Gratuitos)
- ⏱️ **Tempo**: 5-10 minutos
- 💰 **Custo**: $5 créditos grátis/mês (suficiente para projetos pequenos)
- ✅ **Vantagem**: Muito fácil de usar, suporta serverless
- ⚠️ **Desvantagem**: Créditos limitados

**Passos**:
1. Acesse [https://railway.app](https://railway.app)
2. Conecte GitHub
3. Selecione o repositório
4. Railway detecta automaticamente e faz deploy

---

### 5. **Render** (Alternativa Gratuita)
- ⏱️ **Tempo**: 5-10 minutos
- 💰 **Costo**: Grátis (com algumas limitações)
- ✅ **Vantagem**: Suporta static sites e APIs
- ⚠️ **Desvantagem**: Pode ser mais lento que Vercel

**Passos**:
1. Acesse [https://render.com](https://render.com)
2. Conecte GitHub
3. Crie novo "Static Site"
4. Configure build e variáveis de ambiente

---

## 🎯 Recomendação

### Para Uso Imediato:
**Opção 2: Deploy Manual via Vercel CLI** - Mais rápido e mantém tudo no Vercel

### Para Solução Permanente:
**Opção 3: Netlify** - Melhor alternativa gratuita com menos restrições

---

## 📝 Arquivos de Configuração Necessários

### Para Netlify (`netlify.toml`):
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Para Render (`render.yaml`):
```yaml
services:
  - type: web
    name: qa-agile-guide
    env: static
    buildCommand: npm run build
    staticPublishPath: ./dist
    envVars:
      - key: VITE_OPENAI_API_KEY
        sync: false
      - key: VITE_GEMINI_API_KEY
        sync: false
      - key: VITE_SUPABASE_URL
        sync: false
      - key: VITE_SUPABASE_ANON_KEY
        sync: false
```

---

## ⚠️ Importante: Serverless Functions

O projeto usa **serverless functions** (`api/jira-proxy.ts`) que precisam de suporte especial:

- ✅ **Vercel**: Suporta nativamente
- ✅ **Netlify**: Suporta via Netlify Functions (precisa adaptar)
- ⚠️ **Railway**: Suporta, mas precisa configurar
- ⚠️ **Render**: Suporta, mas precisa configurar

---

## 🔄 Migração de Variáveis de Ambiente

Se mudar de plataforma, você precisará configurar as mesmas variáveis:

- `VITE_OPENAI_API_KEY`
- `VITE_GEMINI_API_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 💡 Dica Final

**Para projetos em desenvolvimento ativo**, considere:
1. Usar **Netlify** como alternativa principal
2. Manter **Vercel** como backup
3. Ou fazer upgrade do plano Vercel (se uso profissional)

