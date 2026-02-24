# 🔐 Configurar Arquivo .env

## ⚠️ IMPORTANTE: Crie o arquivo `.env` manualmente na raiz do projeto

O arquivo `.env` não é versionado por segurança. Você precisa criá-lo manualmente.

## 📝 Conteúdo do Arquivo .env

Copie e cole o seguinte conteúdo em um arquivo chamado `.env` na raiz do projeto:

```env
# Figma API Integration
# Token obtido em: https://www.figma.com/settings
VITE_FIGMA_API_TOKEN=YOUR_FIGMA_TOKEN_HERE

# Figma File Key
# Obtenha da URL do seu arquivo Figma: https://www.figma.com/file/{FILE_KEY}/...
# Exemplo: se a URL é https://www.figma.com/file/abc123xyz/Design-Name
# então FILE_KEY=abc123xyz
FIGMA_FILE_KEY=

# Storybook Figma URL (opcional)
# URL completa do design no Figma para visualização no Storybook
STORYBOOK_FIGMA_URL=

# Chromatic Project Token (opcional - para visual testing)
# Obtenha em: https://www.chromatic.com
CHROMATIC_PROJECT_TOKEN=
```

## ✅ Seu Token Já Está Configurado!

O token do Figma deve ser configurado acima:

- ⚠️ `VITE_FIGMA_API_TOKEN=YOUR_FIGMA_TOKEN_HERE` (substitua pelo seu token)

## 📋 Próximos Passos

1. **Criar o arquivo `.env`** na raiz do projeto com o conteúdo acima

2. **Obter o File Key do Figma:**
   - Abra seu arquivo no Figma
   - Copie a URL (exemplo: `https://www.figma.com/file/abc123xyz/Design-Name`)
   - O file key é a parte entre `/file/` e o próximo `/`
   - Cole no `.env` como: `FIGMA_FILE_KEY=abc123xyz`

3. **Testar a conexão:**
   ```bash
   npm run tokens:sync
   ```

## 🔒 Segurança

- ⚠️ **NUNCA** commite o arquivo `.env` no Git
- ✅ O arquivo já está no `.gitignore`
- ✅ Compartilhe apenas o `.env.example` (sem tokens reais)

## 🎯 Exemplo Completo

Se seu arquivo Figma tem a URL:

```
https://www.figma.com/file/abc123xyz456/QA-Agile-Design-System
```

Seu `.env` ficaria assim:

```env
VITE_FIGMA_API_TOKEN=YOUR_FIGMA_TOKEN_HERE
FIGMA_FILE_KEY=abc123xyz456
STORYBOOK_FIGMA_URL=https://www.figma.com/file/abc123xyz456/QA-Agile-Design-System
```
