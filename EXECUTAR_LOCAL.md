# 💻 Como Executar o Aplicativo Localmente

## ✅ Pré-requisitos

- Node.js instalado (versão 18 ou superior)
- npm ou yarn instalado

## 🚀 Passo a Passo Rápido

### 1. Verificar Node.js

```bash
node --version
npm --version
```

Se não tiver instalado, baixe em: https://nodejs.org/

### 2. Instalar Dependências

```bash
npm install --legacy-peer-deps
```

**Nota**: O `--legacy-peer-deps` é necessário devido a conflitos de dependências com React 19.

### 3. Configurar Variáveis de Ambiente (Opcional)

Crie um arquivo `.env.local` na raiz do projeto:

```env
VITE_OPENAI_API_KEY=sua_chave_openai_aqui
VITE_GEMINI_API_KEY=sua_chave_gemini_aqui
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon_aqui
```

**Nota**: Se não configurar, algumas funcionalidades de IA não funcionarão, mas você poderá ver a interface.

### 4. Executar o Aplicativo

```bash
npm run dev
```

### 5. Acessar no Navegador

O aplicativo estará disponível em:
- **URL Local**: http://localhost:5173 (porta padrão do Vite)
- Ou a porta que aparecer no terminal

## 📋 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento (hot reload)
- `npm run build` - Cria build de produção
- `npm run preview` - Preview da build de produção

## 🔧 Troubleshooting

### Erro: "npm não é reconhecido"
**Solução**: Instale Node.js de https://nodejs.org/

### Erro: "Cannot find module"
**Solução**: Execute `npm install --legacy-peer-deps` novamente

### Erro: Porta já em uso
**Solução**: O Vite tentará usar outra porta automaticamente, ou feche o processo que está usando a porta 5173

### Erro: "EADDRINUSE"
**Solução**: 
```bash
# Windows PowerShell
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

## ✅ Funcionalidades Disponíveis Localmente

- ✅ Visualizar interface completa
- ✅ Criar e gerenciar projetos
- ✅ Ver tarefas e casos de teste
- ✅ Usar todas as funcionalidades de UI
- ⚠️ Análises de IA: Requer chaves de API configuradas
- ⚠️ Integração Jira: Requer deploy (serverless functions não funcionam localmente)

## 💡 Dica

Para testar a integração com Jira localmente, você precisaria:
1. Configurar um proxy local para as funções serverless
2. Ou aguardar o deploy no Vercel

Mas todas as outras funcionalidades funcionam perfeitamente localmente!

