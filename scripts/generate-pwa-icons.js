/**
 * Script para gerar ícones PWA a partir do logo existente
 * 
 * Requisitos:
 * - npm install -D sharp (opcional, mas recomendado para melhor qualidade)
 * 
 * Uso:
 * - node scripts/generate-pwa-icons.js
 * 
 * Se sharp não estiver instalado, o script fornecerá instruções alternativas.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logoPath = path.join(__dirname, '../public/logo@erasebg-transformed.png');
const iconsDir = path.join(__dirname, '../public/icons');
const outputPaths = {
  'icon-192x192.png': path.join(iconsDir, 'icon-192x192.png'),
  'icon-512x512.png': path.join(iconsDir, 'icon-512x512.png'),
  'icon-maskable-192x192.png': path.join(iconsDir, 'icon-maskable-192x192.png'),
  'icon-maskable-512x512.png': path.join(iconsDir, 'icon-maskable-512x512.png'),
};

// Verificar se sharp está disponível
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch (e) {
  sharp = null;
}

async function generateIcons() {
  console.log('📱 Gerador de Ícones PWA');
  console.log('========================\n');

  // Verificar se o logo existe
  if (!fs.existsSync(logoPath)) {
    console.error('❌ Logo não encontrado:', logoPath);
    console.log('\nPor favor, verifique se o arquivo logo@erasebg-transformed.png existe em public/');
    process.exit(1);
  }

  // Criar diretório de ícones se não existir
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
    console.log('✅ Diretório de ícones criado:', iconsDir);
  }

  if (sharp) {
    console.log('✅ Sharp encontrado! Gerando ícones...\n');
    
    try {
      const logo = sharp(logoPath);
      const metadata = await logo.metadata();
      console.log(`📐 Logo original: ${metadata.width}x${metadata.height}px\n`);

      // Gerar ícone 192x192
      console.log('🔄 Gerando icon-192x192.png...');
      await logo
        .clone()
        .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toFile(outputPaths['icon-192x192.png']);
      console.log('✅ icon-192x192.png criado\n');

      // Gerar ícone 512x512
      console.log('🔄 Gerando icon-512x512.png...');
      await logo
        .clone()
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toFile(outputPaths['icon-512x512.png']);
      console.log('✅ icon-512x512.png criado\n');

      // Gerar ícone maskable 192x192 (com padding)
      console.log('🔄 Gerando icon-maskable-192x192.png (com padding)...');
      const maskable192 = sharp({
        create: {
          width: 192,
          height: 192,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      });
      const logo192 = await logo
        .clone()
        .resize(154, 154, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();
      
      await maskable192
        .composite([{ input: logo192, left: 19, top: 19 }])
        .toFile(outputPaths['icon-maskable-192x192.png']);
      console.log('✅ icon-maskable-192x192.png criado\n');

      // Gerar ícone maskable 512x512 (com padding)
      console.log('🔄 Gerando icon-maskable-512x512.png (com padding)...');
      const maskable512 = sharp({
        create: {
          width: 512,
          height: 512,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        }
      });
      const logo512 = await logo
        .clone()
        .resize(410, 410, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer();
      
      await maskable512
        .composite([{ input: logo512, left: 51, top: 51 }])
        .toFile(outputPaths['icon-maskable-512x512.png']);
      console.log('✅ icon-maskable-512x512.png criado\n');

      console.log('🎉 Todos os ícones foram gerados com sucesso!');
      console.log('\n📁 Localização:', iconsDir);
      console.log('\n✅ O PWA está pronto para uso!');

    } catch (error) {
      console.error('❌ Erro ao gerar ícones:', error.message);
      process.exit(1);
    }
  } else {
    console.log('⚠️  Sharp não está instalado.\n');
    console.log('Opções:\n');
    console.log('1. Instalar Sharp (recomendado):');
    console.log('   npm install -D sharp\n');
    console.log('2. Usar ferramentas online:');
    console.log('   - https://realfavicongenerator.net/');
    console.log('   - https://www.pwabuilder.com/imageGenerator');
    console.log('   - https://maskable.app/\n');
    console.log('3. Copiar logo manualmente (temporário):');
    console.log(`   cp "${logoPath}" "${outputPaths['icon-192x192.png']}"`);
    console.log(`   cp "${logoPath}" "${outputPaths['icon-512x512.png']}"`);
    console.log(`   cp "${logoPath}" "${outputPaths['icon-maskable-192x192.png']}"`);
    console.log(`   cp "${logoPath}" "${outputPaths['icon-maskable-512x512.png']}"`);
    console.log('\n   Nota: Os ícones precisarão ser redimensionados manualmente.');
    process.exit(0);
  }
}

// Executar
generateIcons().catch(console.error);

