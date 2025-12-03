/**
 * Configuração de tokens para Tailwind CSS
 * Este arquivo é gerado automaticamente pelo style-dictionary
 * Não edite manualmente - edite tokens/design-tokens.json
 */

// Importa tokens gerados pelo style-dictionary
import tokens from './generated/tailwind-tokens.js';

/**
 * Converte tokens para formato Tailwind
 */
function convertTokensToTailwind(tokens) {
  const tailwindConfig = {
    colors: {},
    spacing: {},
    borderRadius: {},
    fontFamily: {},
    fontSize: {},
    lineHeight: {},
    boxShadow: {},
    transitionDuration: {},
    transitionTimingFunction: {},
  };

  // Processa tokens de cor
  if (tokens.color) {
    Object.entries(tokens.color).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && 'value' in value) {
        tailwindConfig.colors[key] = value.value;
      } else if (typeof value === 'string') {
        tailwindConfig.colors[key] = value;
      }
    });
  }

  // Processa spacing
  if (tokens.spacing) {
    Object.entries(tokens.spacing).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && 'value' in value) {
        tailwindConfig.spacing[key] = value.value;
      } else if (typeof value === 'string') {
        tailwindConfig.spacing[key] = value;
      }
    });
  }

  // Processa borderRadius
  if (tokens.borderRadius) {
    Object.entries(tokens.borderRadius).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && 'value' in value) {
        tailwindConfig.borderRadius[key] = value.value;
      } else if (typeof value === 'string') {
        tailwindConfig.borderRadius[key] = value;
      }
    });
  }

  // Processa typography
  if (tokens.typography) {
    if (tokens.typography.fontFamily) {
      Object.entries(tokens.typography.fontFamily).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && 'value' in value) {
          tailwindConfig.fontFamily[key] = value.value.split(',').map(f => f.trim());
        }
      });
    }

    if (tokens.typography.fontSize) {
      Object.entries(tokens.typography.fontSize).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && 'value' in value) {
          tailwindConfig.fontSize[key] = [value.value, { lineHeight: '1.5' }];
        }
      });
    }

    if (tokens.typography.lineHeight) {
      Object.entries(tokens.typography.lineHeight).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && 'value' in value) {
          tailwindConfig.lineHeight[key] = value.value;
        }
      });
    }
  }

  // Processa shadows
  if (tokens.shadow) {
    Object.entries(tokens.shadow).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && 'value' in value) {
        tailwindConfig.boxShadow[key] = value.value;
      }
    });
  }

  return tailwindConfig;
}

// Tenta importar tokens gerados, se não existir, retorna objeto vazio
let generatedTokens = {};
try {
  generatedTokens = tokens || {};
} catch (error) {
  console.warn('Tokens gerados não encontrados. Execute "npm run tokens:build" primeiro.');
}

export default convertTokensToTailwind(generatedTokens);

