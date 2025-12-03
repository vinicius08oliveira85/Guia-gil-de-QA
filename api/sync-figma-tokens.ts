/**
 * API Route para sincronizar tokens do Figma
 * Pode ser chamada via Vercel Serverless Function
 * 
 * Uso: POST /api/sync-figma-tokens
 * Headers: Authorization: Bearer {token}
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { figmaService } from '../services/figmaService';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Permitir apenas POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verificar autenticação (opcional - você pode adicionar um token)
  const authToken = req.headers.authorization?.replace('Bearer ', '');
  const expectedToken = process.env.SYNC_API_TOKEN;
  
  if (expectedToken && authToken !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const fileKey = req.body.fileKey || process.env.FIGMA_FILE_KEY;

    if (!fileKey) {
      return res.status(400).json({ 
        error: 'File key is required',
        message: 'Provide fileKey in request body or set FIGMA_FILE_KEY env var'
      });
    }

    if (!figmaService.isConfigured()) {
      return res.status(500).json({ 
        error: 'Figma API token not configured',
        message: 'Set VITE_FIGMA_API_TOKEN environment variable'
      });
    }

    // Sincronizar tokens
    const tokens = await figmaService.getTokens(fileKey);
    
    // Aqui você pode salvar os tokens no banco de dados ou arquivo
    // Por enquanto, apenas retornamos os tokens
    
    return res.status(200).json({
      success: true,
      message: 'Tokens synced successfully',
      data: {
        variables: tokens.variables.length,
        styles: tokens.styles.length,
        tokens: figmaService.convertVariablesToTokens(tokens.variables)
      }
    });

  } catch (error) {
    console.error('Error syncing Figma tokens:', error);
    return res.status(500).json({ 
      error: 'Failed to sync tokens',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

