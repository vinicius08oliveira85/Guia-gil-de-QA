import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Permitir apenas requisições GET
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    // Em produção no Vercel, os arquivos públicos estão em dist/public
    // Em desenvolvimento local, estão em public
    const publicPath = process.env.VERCEL 
      ? path.join(process.cwd(), 'dist', 'public', 'manifest.json')
      : path.join(process.cwd(), 'public', 'manifest.json');
    
    // Tentar ler o arquivo
    const manifestContent = fs.readFileSync(publicPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);
    
    // Configurar headers apropriados
    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.status(200).json(manifest);
    return;
  } catch (error) {
    console.error('Erro ao carregar manifest.json:', error);
    
    // Se o arquivo não existir, retornar um manifest básico
    const fallbackManifest = {
      name: 'QA Agile Guide',
      short_name: 'QA Guide',
      description: 'Ferramenta de gestão de projetos de QA',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#0E6DFD',
      icons: []
    };
    
    res.setHeader('Content-Type', 'application/manifest+json');
    res.setHeader('Cache-Control', 'no-cache');
    res.status(200).json(fallbackManifest);
    return;
  }
}

