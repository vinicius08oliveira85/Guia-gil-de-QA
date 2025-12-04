import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { gunzip } from 'zlib';
import { promisify } from 'util';

const gunzipAsync = promisify(gunzip);

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  '';

const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  '';

const supabase =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      })
    : null;

const DEFAULT_USER_ID = 'anonymous-shared';

// Limite do Vercel para serverless functions: 4.5MB
// Deixamos uma margem de segurança: 4MB
const MAX_PAYLOAD_SIZE = 4 * 1024 * 1024; // 4MB em bytes

const allowCors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

/**
 * Calcula o tamanho aproximado do payload em bytes
 */
const getPayloadSize = (data: unknown): number => {
  try {
    const jsonString = JSON.stringify(data);
    // Node.js: usar Buffer para calcular tamanho em bytes
    return Buffer.byteLength(jsonString, 'utf8');
  } catch {
    // Fallback: estimativa baseada em string length
    const jsonString = JSON.stringify(data);
    return Buffer.byteLength(jsonString, 'utf8');
  }
};

interface SupabaseProxyResponse {
  success: boolean;
  error?: string;
  projects?: unknown[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  allowCors(res);

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  if (!supabase) {
    res.status(500).json({
      success: false,
      error: 'Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.'
    });
    return;
  }

  const userId =
    (req.method === 'GET'
      ? (req.query.userId as string) || DEFAULT_USER_ID
      : req.body?.userId || DEFAULT_USER_ID) ?? DEFAULT_USER_ID;

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('projects')
        .select('data')
        .or(`user_id.eq.${userId},user_id.like.anon-%`)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      res.status(200).json({
        success: true,
        projects: (data || []).map(row => row.data)
      });
      return;
    }

    if (req.method === 'POST') {
      // Verificar se o payload está comprimido (header customizado)
      const isCompressed = req.headers['x-content-compressed'] === 'gzip';
      let project: unknown;
      let requestUserId: string | undefined;
      
      // Se estiver comprimido, descomprimir
      if (isCompressed) {
        try {
          // Body comprimido vem como string (base64)
          const bodyString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
          const compressedBuffer = Buffer.from(bodyString, 'base64');
          const decompressedBuffer = await gunzipAsync(compressedBuffer);
          const decompressedData = JSON.parse(decompressedBuffer.toString('utf-8'));
          project = decompressedData.project;
          requestUserId = decompressedData.userId;
        } catch (error) {
          console.error('[SupabaseProxy] Erro ao descomprimir payload:', error);
          res.status(400).json({ 
            success: false, 
            error: 'Erro ao descomprimir payload comprimido' 
          });
          return;
        }
      } else {
        // Body normal (JSON)
        project = req.body?.project;
        requestUserId = req.body?.userId;
      }
      
      if (!project) {
        res.status(400).json({ success: false, error: 'Projeto inválido' });
        return;
      }

      // Validar tamanho do payload antes de processar (usar userId do request ou default)
      const finalUserId = requestUserId || userId;
      const payloadSize = getPayloadSize({ project, userId: finalUserId });
      const payloadSizeMB = (payloadSize / (1024 * 1024)).toFixed(2);
      
      console.log(`[SupabaseProxy] Tamanho do payload: ${payloadSizeMB}MB${isCompressed ? ' (descomprimido)' : ''}`);
      
      if (payloadSize > MAX_PAYLOAD_SIZE) {
        const maxSizeMB = (MAX_PAYLOAD_SIZE / (1024 * 1024)).toFixed(2);
        console.error(`[SupabaseProxy] Payload muito grande: ${payloadSizeMB}MB (limite: ${maxSizeMB}MB)`);
        res.status(413).json({
          success: false,
          error: `Payload muito grande (${payloadSizeMB}MB). O limite é ${maxSizeMB}MB. Considere reduzir o tamanho do projeto ou dividir os dados.`
        });
        return;
      }

      const { error } = await supabase
        .from('projects')
        .upsert({
          id: (project as { id: string }).id,
          user_id: finalUserId,
          name: (project as { name: string }).name,
          description: (project as { description?: string }).description,
          data: project,
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw new Error(error.message);
      }

      res.status(200).json({ success: true });
      return;
    }

    if (req.method === 'DELETE') {
      const projectId = req.body?.projectId;
      if (!projectId) {
        res.status(400).json({ success: false, error: 'projectId é obrigatório' });
        return;
      }

      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', userId);

      if (error) {
        throw new Error(error.message);
      }

      res.status(200).json({ success: true });
      return;
    }

    res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    console.error('Supabase proxy error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno ao acessar o Supabase'
    });
  }
}

