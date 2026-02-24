# Integração com Figma Design System

Este documento descreve como usar a integração do projeto com Figma para sincronização automática de design tokens, componentes e visual testing.

## Visão Geral

A integração com Figma permite:

- ✅ Sincronização automática de design tokens do Figma para o código
- ✅ Exportação de componentes visuais
- ✅ Visual testing com Storybook e Chromatic
- ✅ Documentação visual de componentes

## Configuração Inicial

### 1. Obter Token da API do Figma

1. Acesse [Figma Settings](https://www.figma.com/settings)
2. Vá em "Personal Access Tokens"
3. Crie um novo token
4. Copie o token gerado

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_FIGMA_API_TOKEN=seu_token_aqui
FIGMA_FILE_KEY=file_key_do_seu_arquivo
STORYBOOK_FIGMA_URL=https://www.figma.com/file/SEU_FILE_KEY/...
```

### 3. Configurar File Key do Figma

Edite `.figma/config.json` e adicione o file key do seu arquivo Figma:

```json
{
  "fileKey": "seu_file_key_aqui",
  "syncInterval": 3600000,
  "autoSync": false
}
```

O file key pode ser obtido da URL do Figma:

```
https://www.figma.com/file/{FILE_KEY}/Nome-do-Arquivo
```

## Uso

### Sincronizar Tokens do Figma

Para sincronizar os tokens do Figma com o projeto:

```bash
npm run tokens:sync <file-key>
```

Ou configure `FIGMA_FILE_KEY` no `.env` e execute:

```bash
npm run tokens:sync
```

### Gerar CSS e Tailwind Config

Após sincronizar os tokens, gere os arquivos CSS e Tailwind:

```bash
npm run tokens:build
```

Isso irá:

- Gerar `tokens/generated/tokens.css` com variáveis CSS
- Gerar `tokens/generated/tailwind-tokens.js` para Tailwind

### Executar Storybook

Para visualizar e testar os componentes:

```bash
npm run storybook
```

O Storybook estará disponível em `http://localhost:6006`

## Estrutura de Tokens

Os tokens são organizados em `tokens/design-tokens.json`:

```json
{
  "color": {
    "accent": { ... },
    "semantic": { ... },
    "background": { ... }
  },
  "spacing": { ... },
  "borderRadius": { ... },
  "typography": { ... },
  "shadow": { ... },
  "transition": { ... }
}
```

### Convenções de Nomenclatura no Figma

Para que a sincronização funcione corretamente, use estas convenções no Figma:

- **Cores**: `color/accent/primary`, `color/semantic/success`
- **Espaçamentos**: `spacing/xs`, `spacing/sm`, `spacing/md`
- **Border Radius**: `radius/sm`, `radius/md`, `radius/lg`
- **Tipografia**: `typography/fontFamily/sans`, `typography/fontSize/body`

## Visual Testing com Chromatic

### Configuração

1. Crie uma conta em [Chromatic](https://www.chromatic.com)
2. Adicione o projeto
3. Copie o `CHROMATIC_PROJECT_TOKEN`
4. Adicione como secret no GitHub: `CHROMATIC_PROJECT_TOKEN`

### Executar Testes

Os testes são executados automaticamente via GitHub Actions em:

- Push para `main` ou `develop`
- Pull requests

Para executar localmente:

```bash
npx chromatic --project-token=seu_token
```

## Storybook Addons

### Figma Design Addon

O addon `@storybook/addon-designs` permite visualizar designs do Figma diretamente no Storybook.

Configure em cada story:

```tsx
export default {
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/...',
    },
  },
};
```

## Fluxo de Trabalho Recomendado

1. **Designer no Figma**: Cria/atualiza design usando variáveis do Figma
2. **Sincronização**: Execute `npm run tokens:sync` para importar tokens
3. **Build**: Execute `npm run tokens:build` para gerar CSS/Tailwind
4. **Desenvolvimento**: Use tokens no código React
5. **Visual Testing**: Storybook/Chromatic compara com design do Figma
6. **CI/CD**: Testes automáticos garantem consistência

## Troubleshooting

### Erro: "Figma API token não configurado"

Certifique-se de que `VITE_FIGMA_API_TOKEN` está configurado no `.env`.

### Erro: "File key não encontrado"

Verifique se o `FIGMA_FILE_KEY` está correto e se você tem acesso ao arquivo no Figma.

### Tokens não aparecem no Tailwind

Execute `npm run tokens:build` após sincronizar os tokens.

### Storybook não inicia

Verifique se todas as dependências estão instaladas:

```bash
npm install
```

## Referências

- [Figma API Documentation](https://www.figma.com/developers/api)
- [Style Dictionary](https://amzn.github.io/style-dictionary/)
- [Storybook Documentation](https://storybook.js.org/)
- [Chromatic Documentation](https://www.chromatic.com/docs/)
