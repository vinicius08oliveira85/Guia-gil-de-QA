# 💻 Como Instalar e Executar Localmente

## 📥 Passo 1: Instalar Node.js

1. **Baixe Node.js**:
   - Acesse: https://nodejs.org/
   - Baixe a versão **LTS** (Long Term Support)
   - Versão recomendada: **18.x ou superior**

2. **Instale Node.js**:
   - Execute o instalador baixado
   - Siga o assistente de instalação (aceite os padrões)
   - Marque a opção "Add to PATH" se disponível

3. **Verificar instalação**:
   ```bash
   node --version
   npm --version
   ```

## 🚀 Passo 2: Instalar Dependências do Projeto

```bash
cd "C:\Users\vinicius.carvalho\Cur Sor\Cursor\QA\qa-agile-guide"
npm install --legacy-peer-deps
```

**Tempo estimado**: 2-5 minutos (depende da conexão)

## ▶️ Passo 3: Executar o Aplicativo

```bash
npm run dev
```

Você verá algo como:
```
  VITE v6.4.1  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## 🌐 Passo 4: Acessar no Navegador

Abra seu navegador e acesse:
- **http://localhost:5173**

## ✅ O Que Funciona Localmente

- ✅ **Interface completa**: Todas as telas e componentes
- ✅ **Criar projetos**: Criar e gerenciar projetos
- ✅ **Tarefas**: Visualizar e editar tarefas
- ✅ **Dashboard**: Ver métricas e gráficos
- ✅ **Documentos**: Gerenciar documentos do projeto
- ✅ **Glossário**: Ver termos de QA
- ✅ **Roadmap**: Ver trilha de evolução
- ⚠️ **Análises de IA**: Requer chaves de API (opcional)
- ⚠️ **Integração Jira**: Requer deploy (serverless functions)

## 🔑 Configurar Chaves de API (Opcional)

Se quiser testar funcionalidades de IA, crie um arquivo `.env.local` na raiz:

```env
VITE_OPENAI_API_KEY=sua_chave_aqui
VITE_GEMINI_API_KEY=sua_chave_aqui
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_aqui
```

## 🛑 Parar o Servidor

No terminal, pressione: `Ctrl + C`

## 🔄 Atualizações em Tempo Real

O Vite tem **hot reload** - qualquer mudança no código atualiza automaticamente no navegador!

## 💡 Dica

Você pode manter o servidor rodando enquanto desenvolve. Ele só para quando você fechar o terminal ou pressionar `Ctrl + C`.

