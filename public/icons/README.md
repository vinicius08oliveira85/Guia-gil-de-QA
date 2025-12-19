# Ícones PWA

Esta pasta deve conter os ícones necessários para o PWA funcionar corretamente.

## Arquivos Necessários

Você precisa criar os seguintes arquivos:

1. **icon-192x192.png** - Ícone padrão (192x192 pixels)
2. **icon-512x512.png** - Ícone grande (512x512 pixels)
3. **icon-maskable-192x192.png** - Ícone maskable (192x192 pixels com padding)
4. **icon-maskable-512x512.png** - Ícone maskable grande (512x512 pixels com padding)

## Como Gerar

### Opção 1: RealFaviconGenerator (Mais Fácil)

1. Acesse: https://realfavicongenerator.net/
2. Faça upload de `../logo@erasebg-transformed.png`
3. Configure:
   - ✅ Android Chrome
   - ✅ Maskable icons
4. Baixe e extraia os ícones aqui

### Opção 2: PWA Builder

1. Acesse: https://www.pwabuilder.com/imageGenerator
2. Faça upload do logo
3. Baixe os ícones gerados

### Opção 3: Maskable.app

1. Acesse: https://maskable.app/
2. Faça upload do logo
3. Ajuste padding para 10%
4. Baixe os ícones maskable

## Nota sobre Ícones Maskable

Ícones maskable são necessários para Android. Eles devem ter:
- Padding de ~10% ao redor do conteúdo
- Conteúdo importante centralizado
- Formato PNG com transparência

## Status Atual

⚠️ **Ícones ainda não foram gerados**

O PWA não funcionará completamente até que os ícones sejam adicionados.

Veja `docs/PWA_SETUP.md` para mais detalhes.

