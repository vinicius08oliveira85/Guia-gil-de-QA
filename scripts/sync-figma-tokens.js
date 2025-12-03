/**
 * Script de sincronização de tokens do Figma
 * 
 * Uso:
 *   node scripts/sync-figma-tokens.js <file-key>
 * 
 * Ou configure FIGMA_FILE_KEY no .env
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Importa figmaService dinamicamente
let figmaService;

/**
 * Converte tokens do Figma para formato JSON de design tokens
 */
function convertFigmaTokensToDesignTokens(figmaTokens) {
  const designTokens = {
    $schema: 'https://schemas.figma.com/tokens/v1',
    color: {},
    spacing: {},
    borderRadius: {},
    typography: {},
    shadow: {},
    transition: {},
  };

  // Processa variáveis do Figma
  figmaTokens.variables?.forEach((variable) => {
    const path = variable.name.split('/');
    const category = path[0]?.toLowerCase();
    const name = path.slice(1).join('/').replace(/\s+/g, '');

    if (category === 'color') {
      if (!designTokens.color[name]) {
        designTokens.color[name] = {};
      }
      
      const value = Object.values(variable.valuesByMode)[0];
      if (typeof value === 'object' && value !== null) {
        const r = Math.round((value.r || 0) * 255);
        const g = Math.round((value.g || 0) * 255);
        const b = Math.round((value.b || 0) * 255);
        const a = value.a !== undefined ? value.a : 1;
        
        designTokens.color[name] = {
          value: a < 1 
            ? `rgba(${r}, ${g}, ${b}, ${a})`
            : `rgb(${r}, ${g}, ${b})`,
          type: 'color',
        };
      }
    } else if (category === 'spacing') {
      const value = Object.values(variable.valuesByMode)[0];
      designTokens.spacing[name] = {
        value: String(value),
        type: 'spacing',
      };
    } else if (category === 'radius') {
      const value = Object.values(variable.valuesByMode)[0];
      designTokens.borderRadius[name] = {
        value: String(value),
        type: 'borderRadius',
      };
    }
  });

  return designTokens;
}

/**
 * Merge tokens do Figma com tokens existentes
 */
function mergeTokens(existingTokens, figmaTokens) {
  const merged = { ...existingTokens };
  
  // Merge colors
  if (figmaTokens.color) {
    merged.color = { ...merged.color, ...figmaTokens.color };
  }
  
  // Merge spacing
  if (figmaTokens.spacing) {
    merged.spacing = { ...merged.spacing, ...figmaTokens.spacing };
  }
  
  // Merge borderRadius
  if (figmaTokens.borderRadius) {
    merged.borderRadius = { ...merged.borderRadius, ...figmaTokens.borderRadius };
  }

  return merged;
}

/**
 * Função principal
 */
async function syncFigmaTokens() {
  try {
    // Importa figmaService dinamicamente
    const { figmaService: service } = await import('../services/figmaService.js');
    figmaService = service;
    
    const fileKey = process.argv[2] || process.env.FIGMA_FILE_KEY;

    if (!fileKey) {
      console.error('❌ Erro: File key do Figma não fornecido');
      console.log('Uso: node scripts/sync-figma-tokens.js <file-key>');
      console.log('Ou configure FIGMA_FILE_KEY no .env');
      process.exit(1);
    }

    if (!figmaService.isConfigured()) {
      console.error('❌ Erro: Figma API token não configurado');
      console.log('Configure VITE_FIGMA_API_TOKEN no .env');
      process.exit(1);
    }

    console.log('🔄 Sincronizando tokens do Figma...');
    console.log(`📁 File Key: ${fileKey}`);

    // Busca tokens do Figma
    const tokens = await figmaService.getTokens(fileKey);
    console.log(`✅ Encontrados ${tokens.variables.length} variáveis e ${tokens.styles.length} estilos`);

    // Converte para formato de design tokens
    const figmaDesignTokens = convertFigmaTokensToDesignTokens(tokens);

    // Carrega tokens existentes
    const tokensPath = join(__dirname, '../tokens/design-tokens.json');
    let existingTokens = {};
    
    try {
      const tokensContent = readFileSync(tokensPath, 'utf-8');
      existingTokens = JSON.parse(tokensContent);
    } catch (error) {
      console.log('⚠️  Arquivo de tokens não encontrado, criando novo...');
    }

    // Merge tokens
    const mergedTokens = mergeTokens(existingTokens, figmaDesignTokens);

    // Salva tokens atualizados
    writeFileSync(
      tokensPath,
      JSON.stringify(mergedTokens, null, 2) + '\n',
      'utf-8'
    );

    console.log('✅ Tokens sincronizados com sucesso!');
    console.log('📝 Execute "npm run tokens:build" para gerar CSS e Tailwind config');

  } catch (error) {
    console.error('❌ Erro ao sincronizar tokens:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    process.exit(1);
  }
}

// Executa sincronização
syncFigmaTokens();

