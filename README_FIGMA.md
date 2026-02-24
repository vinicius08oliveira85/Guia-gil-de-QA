# 🎨 Integração Figma - Guia Rápido

## Configuração Rápida (5 minutos)

### 1. Obter Token do Figma

1. Acesse: https://www.figma.com/settings
2. Vá em "Personal Access Tokens"
3. Crie um novo token e copie

### 2. Configurar Variáveis de Ambiente

Crie `.env` na raiz:

```env
VITE_FIGMA_API_TOKEN=seu_token_aqui
FIGMA_FILE_KEY=file_key_do_seu_arquivo
```

### 3. Sincronizar Tokens

```bash
npm run tokens:sync
npm run tokens:build
```

### 4. Visualizar Componentes

```bash
npm run storybook
```

## Comandos Disponíveis

| Comando                   | Descrição                      |
| ------------------------- | ------------------------------ |
| `npm run tokens:sync`     | Sincroniza tokens do Figma     |
| `npm run tokens:build`    | Gera CSS e Tailwind config     |
| `npm run storybook`       | Inicia Storybook               |
| `npm run build-storybook` | Build do Storybook para deploy |

## Documentação Completa

Veja [docs/FIGMA_INTEGRATION.md](docs/FIGMA_INTEGRATION.md) para documentação detalhada.
