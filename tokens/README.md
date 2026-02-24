# Design Tokens

Este diretório contém os design tokens do projeto, sincronizados com o Figma.

## Estrutura

- `design-tokens.json` - Tokens principais em formato JSON
- `generated/` - Arquivos gerados automaticamente (não versionar)
  - `tokens.css` - Variáveis CSS geradas
  - `tailwind-tokens.js` - Configuração para Tailwind

## Uso

### Sincronizar do Figma

```bash
npm run tokens:sync <file-key>
```

### Gerar CSS e Tailwind

```bash
npm run tokens:build
```

## Formato dos Tokens

Os tokens seguem o formato W3C Design Tokens:

```json
{
  "color": {
    "accent": {
      "primary": {
        "value": "#0E6DFD",
        "type": "color"
      }
    }
  }
}
```

## Convenções

- Use kebab-case para nomes de tokens
- Organize por categoria (color, spacing, typography, etc.)
- Mantenha valores semânticos quando possível
