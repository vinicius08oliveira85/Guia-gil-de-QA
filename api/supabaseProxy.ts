import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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

const allowCors = (res: VercelResponse) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

/**
 * Formato de resposta da API do Supabase Proxy
 * @property {boolean} success - Indica se a operação foi bem-sucedida
 * @property {string} [error] - Mensagem de erro, se houver
 * @property {unknown[]} [projects] - Lista de projetos retornados (apenas em GET)
 */
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
      const project = req.body?.project;
      if (!project) {
        res.status(400).json({ success: false, error: 'Projeto inválido' });
        return;
      }

      const { error } = await supabase
        .from('projects')
        .upsert({
          id: project.id,
          user_id: userId,
          name: project.name,
          description: project.description,
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

