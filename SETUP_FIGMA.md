# 🚀 Setup Rápido - Integração Figma

## Passo a Passo Completo

### 1. Instalar Dependências

```bash
npm install
```

Isso instalará:
- `style-dictionary` - Para converter tokens
- `@storybook/react-vite` - Para documentação de componentes
- `axios` - Para comunicação com API do Figma
- `chromatic` - Para visual testing

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_FIGMA_API_TOKEN=seu_token_aqui
FIGMA_FILE_KEY=seu_file_key_aqui
STORYBOOK_FIGMA_URL=https://www.figma.com/file/seu_file_key/...
```

**Como obter o token:**
1. Acesse: https://www.figma.com/settings
2. Vá em "Personal Access Tokens"
3. Clique em "Create new token"
4. Copie o token gerado

**Como obter o file key:**
- Está na URL do seu arquivo Figma: `https://www.figma.com/file/{FILE_KEY}/Nome-do-Arquivo`

### 3. Executar Setup Automático

```bash
npm run setup:figma
```

Este comando irá:
- ✅ Criar diretórios necessários
- ✅ Verificar dependências
- ✅ Validar configurações

### 4. Sincronizar Tokens do Figma

```bash
npm run tokens:sync <file-key>
```

Ou se configurou no `.env`:
```bash
npm run tokens:sync
```

### 5. Gerar CSS e Tailwind Config

```bash
npm run tokens:build
```

Isso gerará:
- `tokens/generated/tokens.css`
- `tokens/generated/tailwind-tokens.js`

### 6. Iniciar Storybook

```bash
npm run storybook
```

Acesse: http://localhost:6006

## Verificação Rápida

Execute este comando para verificar se tudo está configurado:

```bash
npm run setup:figma
```

## Troubleshooting

### Erro: "npm não é reconhecido"
- Instale o Node.js: https://nodejs.org/
- Reinicie o terminal após instalação

### Erro: "Figma API token não configurado"
- Verifique se o `.env` existe e tem `VITE_FIGMA_API_TOKEN`

### Erro: "File key não encontrado"
- Verifique se `FIGMA_FILE_KEY` está no `.env` ou passe como argumento

### Tokens não aparecem
- Execute `npm run tokens:build` após sincronizar

## Próximos Passos

Após o setup:
1. ✅ Configure variáveis no Figma seguindo as convenções
2. ✅ Sincronize tokens regularmente
3. ✅ Use Storybook para documentar componentes
4. ✅ Configure Chromatic para visual testing

Veja a [documentação completa](docs/FIGMA_INTEGRATION.md) para mais detalhes.

