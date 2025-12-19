/**
 * Script para gerar ícones PWA a partir do logo existente
 * 
 * Este script usa o logo existente e cria os tamanhos necessários para PWA.
 * 
 * NOTA: Este script requer sharp ou outra biblioteca de processamento de imagem.
 * Como alternativa, você pode usar ferramentas online como:
 * - https://realfavicongenerator.net/
 * - https://www.pwabuilder.com/imageGenerator
 * - https://maskable.app/
 * 
 * Ou usar o logo existente diretamente se já estiver no tamanho correto.
 */

const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, '../public/logo@erasebg-transformed.png');
const iconsDir = path.join(__dirname, '../public/icons');

// Criar diretório de ícones se não existir
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('📱 Gerador de Ícones PWA');
console.log('========================');
console.log('');
console.log('Para gerar os ícones, você pode:');
console.log('');
console.log('1. Usar ferramenta online:');
console.log('   - https://realfavicongenerator.net/');
console.log('   - https://www.pwabuilder.com/imageGenerator');
console.log('   - https://maskable.app/');
console.log('');
console.log('2. Usar o logo existente:');
console.log(`   Logo: ${logoPath}`);
console.log('');
console.log('3. Tamanhos necessários:');
console.log('   - icon-192x192.png (192x192px)');
console.log('   - icon-512x512.png (512x512px)');
console.log('   - icon-maskable-192x192.png (192x192px, com padding)');
console.log('   - icon-maskable-512x512.png (512x512px, com padding)');
console.log('');
console.log('Os ícones maskable devem ter padding de ~10% para funcionar bem no Android.');
console.log('');

// Verificar se o logo existe
if (fs.existsSync(logoPath)) {
  console.log('✅ Logo encontrado!');
  console.log('   Você pode copiar este arquivo e redimensionar para os tamanhos necessários.');
} else {
  console.log('⚠️  Logo não encontrado. Verifique o caminho.');
}

