# 🚀 Instruções Rápidas - Criar .env

## Passo 1: Criar o arquivo

1. Na raiz do projeto, crie um arquivo chamado **`.env`** (sem extensão)
2. Copie o conteúdo do arquivo `CRIAR_ENV.txt` que acabei de criar
3. Cole no arquivo `.env`

## Passo 2: Adicionar File Key do Figma

1. Abra seu arquivo no Figma
2. Copie a URL (exemplo: `https://www.figma.com/file/abc123xyz/Design-Name`)
3. O **file key** é a parte entre `/file/` e o próximo `/`
4. Cole no `.env` como: `FIGMA_FILE_KEY=seu_file_key_aqui`

## ✅ Pronto!

Agora você pode executar:

```bash
npm run tokens:sync
```

## 📝 Exemplo Completo

Se sua URL do Figma é:

```
https://www.figma.com/file/abc123xyz456/QA-Agile-Design
```

Seu `.env` deve ter:

```env
VITE_FIGMA_API_TOKEN=YOUR_FIGMA_TOKEN_HERE
FIGMA_FILE_KEY=abc123xyz456
STORYBOOK_FIGMA_URL=https://www.figma.com/file/abc123xyz456/QA-Agile-Design
```
