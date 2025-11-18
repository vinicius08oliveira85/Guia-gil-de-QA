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

## Estrutura do Projeto

```
├── components/          # Componentes React
│   ├── analysis/       # Componentes de análise
│   ├── common/         # Componentes comuns
│   ├── dashboard/      # Componentes de dashboard
│   ├── glossary/       # Glossário de termos
│   ├── roadmap/        # Roadmap
│   ├── tasks/          # Gestão de tarefas
│   └── timeline/       # Timeline
├── hooks/              # React hooks customizados
├── services/           # Serviços (DB, Gemini API)
├── types.ts           # Definições TypeScript
└── App.tsx            # Componente principal
```

## Armazenamento

O aplicativo utiliza IndexedDB para armazenamento local no navegador. Todos os dados são salvos localmente e não são enviados para servidores externos (exceto chamadas às APIs de IA - OpenAI ou Gemini - para funcionalidades de geração de conteúdo).

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
