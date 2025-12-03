#!/usr/bin/env node

/**
 * Script de setup completo da integração Figma
 * Executa todos os passos necessários para configurar o sistema
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🚀 Configurando integração Figma...\n');

// 1. Criar diretórios necessários
const directories = [
  'tokens/generated',
  '.storybook',
  'stories',
  '.figma',
  '.github/workflows',
];

console.log('📁 Criando diretórios...');
directories.forEach((dir) => {
  const fullPath = join(rootDir, dir);
  if (!existsSync(fullPath)) {
    mkdirSync(fullPath, { recursive: true });
    console.log(`   ✅ ${dir}`);
  } else {
    console.log(`   ⏭️  ${dir} (já existe)`);
  }
});

// 2. Verificar se .env existe
const envPath = join(rootDir, '.env');
if (!existsSync(envPath)) {
  console.log('\n⚠️  Arquivo .env não encontrado!');
  console.log('   Crie um arquivo .env com:');
  console.log('   VITE_FIGMA_API_TOKEN=seu_token');
  console.log('   FIGMA_FILE_KEY=seu_file_key\n');
} else {
  console.log('\n✅ Arquivo .env encontrado');
}

// 3. Verificar dependências no package.json
const packagePath = join(rootDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));

const requiredDeps = [
  'style-dictionary',
  '@storybook/react-vite',
  'axios',
  'chromatic',
];

const missingDeps = requiredDeps.filter(
  (dep) => !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
);

if (missingDeps.length > 0) {
  console.log('\n⚠️  Dependências faltando:');
  missingDeps.forEach((dep) => console.log(`   - ${dep}`));
  console.log('\n   Execute: npm install\n');
} else {
  console.log('\n✅ Todas as dependências estão no package.json');
}

// 4. Verificar se tokens existem
const tokensPath = join(rootDir, 'tokens/design-tokens.json');
if (!existsSync(tokensPath)) {
  console.log('\n⚠️  Arquivo de tokens não encontrado!');
  console.log('   O arquivo tokens/design-tokens.json será criado na primeira sincronização.\n');
} else {
  console.log('\n✅ Arquivo de tokens encontrado');
}

// 5. Resumo
console.log('\n📋 Próximos passos:');
console.log('   1. Configure o .env com suas credenciais do Figma');
console.log('   2. Execute: npm install');
console.log('   3. Execute: npm run tokens:sync <file-key>');
console.log('   4. Execute: npm run tokens:build');
console.log('   5. Execute: npm run storybook\n');

console.log('✨ Setup concluído!\n');

