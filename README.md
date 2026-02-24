# QA Agile Guide

Aplicativo completo para gestão de projetos de QA seguindo metodologias ágeis e práticas de DevOps.

## Funcionalidades

- 📊 **Dashboard de Projetos**: Visualize e gerencie múltiplos projetos de QA
- 📝 **Gestão de Documentos**: Analise documentos de requisitos com IA
- ✅ **Casos de Teste**: Gere e gerencie casos de teste automaticamente com IA
- 🎯 **Estratégias de Teste**: Receba recomendações de estratégias de teste personalizadas
- 📈 **Métricas e Análises**: Acompanhe métricas de qualidade e progresso
- 🔄 **Ciclo de Vida DevOps**: Gerencie fases do ciclo de vida (Request, Analysis, Design, Build, Test, Release, Deploy, Operate, Monitor)
- 🧪 **Pirâmide de Testes**: Análise automática da distribuição de testes
- ⬅️ **Shift Left**: Recomendações para introduzir testes mais cedo no ciclo

## Tecnologias

- React 19
- TypeScript
- Vite
- **IA Flexível**: Suporte para OpenAI (GPT-4) ou Google Gemini AI
- IndexedDB (armazenamento local)
- Tailwind CSS

## Identidade Visual

- O arquivo vetorial oficial `public/qa-testing-logo.svg` representa o QA Agile Guide com um painel de observabilidade, circuitos de validação e selo de aprovação focado em QA de software.
- Use diretamente no front-end com `<img src="/qa-testing-logo.svg" alt="Logo QA Agile Guide" />` ou importe via componentes React; o `Header` já referencia esse ativo atualizado.
- O SVG é responsivo e permite ajustes mantendo o gradiente principal `#111834 → #2C3FAF` e os realces neon `#50E3C2` e `#58C8FF` que simbolizam automação e métricas.

## Pré-requisitos

- Node.js (versão 18 ou superior)
- Chave de API de IA (OpenAI ou Google Gemini)

## Instalação e Execução Local

1. Clone o repositório:

   ```bash
   git clone https://github.com/vinicius08oliveira85/Guia-gil-de-QA.git
   cd Guia-gil-de-QA
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Configure a variável de ambiente para IA:

   **Opção 1: OpenAI (Recomendado)**

   Crie um arquivo `.env.local` na raiz do projeto e adicione:

   ```
   VITE_OPENAI_API_KEY=sua_chave_openai_aqui
   ```

   **Opção 2: Google Gemini**

   ```
   VITE_GEMINI_API_KEY=sua_chave_gemini_aqui
   ```

Nota: Apenas uma chave do Gemini é suportada; não há fallback. Remova variáveis antigas de fallback, se existirem.

**Nota**: Se ambas as chaves estiverem configuradas, o aplicativo usará OpenAI por padrão.

Ou configure diretamente no sistema:

```bash
# Para OpenAI
export VITE_OPENAI_API_KEY=sua_chave_openai_aqui

# Para Gemini
export VITE_GEMINI_API_KEY=sua_chave_gemini_aqui
```

4. Execute o aplicativo:

   ```bash
   npm run dev
   ```

5. Acesse o aplicativo em: `http://localhost:3000`

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a build de produção
- `npm run preview` - Preview da build de produção
- `npm test` - Executa testes
- `npm run test:watch` - Executa testes em modo watch
- `npm run test:coverage` - Executa testes com relatório de cobertura
- `npm run lint` - Verifica problemas de lint
- `npm run lint:fix` - Corrige problemas de lint automaticamente
- `npm run format` - Formata código com Prettier
- `npm run type-check` - Verifica tipos TypeScript

## Estrutura do Projeto

```
├── api/                # Serverless functions (Vercel)
├── components/         # Componentes React
│   ├── analysis/      # Componentes de análise
│   ├── common/        # Componentes comuns
│   ├── dashboard/     # Componentes de dashboard
│   ├── glossary/      # Glossário de termos
│   ├── roadmap/       # Roadmap
│   ├── tasks/         # Gestão de tarefas
│   └── timeline/      # Timeline
├── hooks/             # React hooks customizados
├── services/          # Serviços (DB, Gemini API)
├── store/            # Estado global (Zustand)
├── tests/            # Testes automatizados
├── utils/            # Utilitários
├── types.ts         # Definições TypeScript
└── App.tsx          # Componente principal
```

## Testes

O projeto inclui testes automatizados usando Vitest e Testing Library.

```bash
# Executar todos os testes
npm test

# Executar em modo watch
npm run test:watch

# Ver cobertura de testes
npm run test:coverage
```

Veja [tests/README.md](tests/README.md) para mais informações.

## Integração com Figma (MCP Server)

O projeto suporta integração com Figma através do MCP (Model Context Protocol) Server, permitindo gerar código diretamente a partir de designs do Figma.

### Configuração Rápida

1. **Via Deep Link (Recomendado)**: Clique em [Configurar Figma MCP](https://cursor.sh/mcp?server=figma&url=https://mcp.figma.com/mcp)

2. **Configuração Manual**: Siga o guia completo em [docs/MCP_FIGMA_SETUP.md](docs/MCP_FIGMA_SETUP.md)

### Como Usar

1. Copie o link de um frame ou componente no Figma
2. Cole o link em uma prompt para o assistente AI
3. O assistente gerará código React baseado no design

**Exemplo:**

```
Implemente este design do Figma: https://www.figma.com/file/xxxxx/Design?node-id=12345
```

Para mais detalhes, consulte a [documentação completa do Figma MCP](docs/MCP_FIGMA_SETUP.md).

## Documentação Adicional

- [Arquitetura](docs/ARCHITECTURE.md) - Decisões arquiteturais e estrutura
- [Guia de Contribuição](CONTRIBUTING.md) - Como contribuir com o projeto
- [Migração para Store](docs/MIGRATION_TO_STORE.md) - Guia de migração para Zustand
- [Uso do Store](docs/STORE_USAGE.md) - Como usar o store global de projetos
- [Configuração Figma MCP](docs/MCP_FIGMA_SETUP.md) - Integração com Figma via MCP Server

## Armazenamento

O aplicativo utiliza IndexedDB para armazenamento local no navegador. Todos os dados são salvos localmente e não são enviados para servidores externos (exceto chamadas às APIs de IA - OpenAI ou Gemini - para funcionalidades de geração de conteúdo).

### Carregar projetos do Supabase em produção

Para que a tela **Meus Projetos** carregue e exiba os projetos existentes no Supabase (por exemplo em deploy no Vercel), é necessário configurar:

**No build do front-end (variáveis embutidas no cliente):**

- `VITE_SUPABASE_PROXY_URL` – URL do proxy que o app usa para falar com o Supabase. Em deploy na mesma origem use `/api/supabaseProxy` (no Vercel, a API route `api/supabaseProxy.ts` será chamada nesse path).

**No ambiente da API (serverless / proxy, ex.: Vercel):**

- `SUPABASE_URL` ou `VITE_SUPABASE_URL` – URL do projeto no Supabase (ex.: `https://xxxxx.supabase.co`).
- `SUPABASE_SERVICE_ROLE_KEY` ou `SUPABASE_ANON_KEY` (ou `VITE_SUPABASE_ANON_KEY`) – Chave para o proxy autenticar no Supabase. Service role permite acesso total; anon key respeita RLS.

Sem `VITE_SUPABASE_PROXY_URL` no build, o app em produção não usa o Supabase e exibe apenas projetos do cache local (IndexedDB). Sem as variáveis do servidor, o proxy retorna erro e a tela pode mostrar "Sincronização com a nuvem indisponível"; use o botão "Tentar novamente" na tela ou verifique as variáveis no painel do Vercel (ou equivalente).

**Checklist para homolog / preview no Vercel:**

- No projeto Vercel, em **Settings → Environment Variables**, defina para o ambiente **Preview** (ou o que servir a URL de homolog): `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` (ou os fallbacks usados em `api/supabaseProxy.ts`). Faça redeploy após alterar variáveis.
- Se a tela exibir a mensagem **"Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY."**, confira se essas variáveis estão preenchidas para o ambiente do deploy e redeploy.
- Se aparecer **timeout ou 504**: verifique no [Supabase Dashboard](https://supabase.com/dashboard) se o projeto está ativo (não pausado). Projetos free pausam após inatividade; reative e aguarde alguns segundos antes de tentar novamente (use o botão "Tentar novamente" na tela).

## Escolhendo o Provedor de IA

O aplicativo suporta múltiplos provedores de IA e escolhe automaticamente baseado nas variáveis de ambiente configuradas:

1. **OpenAI** (prioridade): Se `VITE_OPENAI_API_KEY` estiver configurada
2. **Google Gemini**: Se apenas `VITE_GEMINI_API_KEY` estiver configurada

Você pode obter chaves de API em:

- **OpenAI**: https://platform.openai.com/api-keys
- **Google Gemini**: https://makersuite.google.com/app/apikey

## Licença

Este projeto é privado e de uso pessoal.

## Autor

Desenvolvido para auxiliar profissionais de QA no gerenciamento de projetos ágeis.
