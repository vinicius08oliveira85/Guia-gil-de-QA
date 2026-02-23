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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-content-compressed');
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
      // Verificar se é requisição para task_test_status
      const table = req.query.table as string;
      if (table === 'task_test_status') {
        const taskKey = req.query.task_key as string;
        const taskKeys = req.query.task_keys as string;
        
        if (taskKey) {
          // Buscar um único registro
          const { data, error } = await supabase
            .from('task_test_status')
            .select('*')
            .eq('task_key', taskKey)
            .single();

          if (error && error.code !== 'PGRST116') {
            throw new Error(error.message);
          }

          res.status(200).json({
            success: true,
            record: data || null
          });
          return;
        } else if (taskKeys) {
          // Buscar múltiplos registros
          const keysArray = taskKeys.split(',').filter(Boolean);
          const { data, error } = await supabase
            .from('task_test_status')
            .select('*')
            .in('task_key', keysArray);

          if (error) {
            throw new Error(error.message);
          }

          res.status(200).json({
            success: true,
            records: data || []
          });
          return;
        } else {
          res.status(400).json({
            success: false,
            error: 'task_key ou task_keys é obrigatório para task_test_status'
          });
          return;
        }
      }

      // Requisição padrão para projects (com timeout para evitar 504 do Vercel)
      const SUPABASE_QUERY_TIMEOUT_MS = 15000;
      const queryPromise = supabase
        .from('projects')
        .select('data')
        .or(`user_id.eq.${userId},user_id.like.anon-%`)
        .order('updated_at', { ascending: false });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error('Supabase demorou para responder; tente novamente.')),
          SUPABASE_QUERY_TIMEOUT_MS
        )
      );
      let result: { data: Array<{ data: unknown }> | null; error: { message: string } | null };
      try {
        result = await Promise.race([queryPromise, timeoutPromise]);
      } catch (raceError) {
        if (raceError instanceof Error && raceError.message.includes('Supabase demorou')) {
          res.status(503).json({ success: false, error: raceError.message });
          return;
        }
        throw raceError;
      }
      const { data, error } = result;

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
      const { storagePath } = req.body;

      // Novo fluxo: Se storagePath for fornecido, buscar do Storage
      if (storagePath) {
        console.log(`[SupabaseProxy] Recebido pedido para processar arquivo do Storage: ${storagePath}`);
        let projectFromStorage: any;
        try {
          // 1. Baixar o arquivo do Supabase Storage
          const { data: blob, error: downloadError } = await supabase.storage
            .from('qa-agile-guide-uploads')
            .download(storagePath);

          if (downloadError) {
            console.error(`[SupabaseProxy] Erro ao baixar do Storage: ${downloadError.message}`);
            throw new Error(`Erro ao baixar arquivo do Storage: ${downloadError.message}`);
          }

          // 2. Converter o Blob para JSON
          const projectJson = await blob.text();
          projectFromStorage = JSON.parse(projectJson);

          if (!projectFromStorage || !projectFromStorage.id) {
            throw new Error('Arquivo do Storage é inválido ou não contém um projeto.');
          }

          console.log(`[SupabaseProxy] Projeto "${projectFromStorage.name}" extraído do Storage com sucesso.`);

          // 3. Inserir o projeto no banco de dados (mesma lógica do upsert)
          const { error: upsertError } = await supabase
            .from('projects')
            .upsert({
              id: projectFromStorage.id,
              user_id: req.body.userId || userId,
              name: projectFromStorage.name,
              description: projectFromStorage.description,
              data: projectFromStorage,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'id'
            });

          if (upsertError) {
            console.error(`[SupabaseProxy] Erro ao fazer upsert do projeto do Storage: ${upsertError.message}`);
            throw new Error(`Erro ao salvar projeto do Storage no banco de dados: ${upsertError.message}`);
          }

          res.status(200).json({ success: true, message: 'Projeto salvo com sucesso via Storage.' });
        
        } catch (error) {
          console.error('[SupabaseProxy] Erro no fluxo de salvamento via Storage:', error);
          res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : 'Erro interno ao processar arquivo do Storage.'
          });
        } finally {
          // 4. Limpar o arquivo do Storage após o processamento
          console.log(`[SupabaseProxy] Deletando arquivo do Storage: ${storagePath}`);
          const { error: removeError } = await supabase.storage
            .from('qa-agile-guide-uploads')
            .remove([storagePath]);
          
          if (removeError) {
            // Apenas logar o erro, não enviar resposta ao cliente pois a operação principal pode ter funcionado
            console.error(`[SupabaseProxy] Falha ao deletar arquivo do Storage: ${removeError.message}. Limpeza manual pode ser necessária.`);
          } else {
            console.log(`[SupabaseProxy] Arquivo ${storagePath} deletado do Storage com sucesso.`);
          }
        }
        return; // Finaliza o fluxo de storage
      }


      // Verificar se é requisição para task_test_status
      const table = req.body?.table as string;
      if (table === 'task_test_status') {
        const record = req.body?.record;
        
        if (!record || !record.task_key || !record.status) {
          res.status(400).json({
            success: false,
            error: 'record com task_key e status é obrigatório para task_test_status'
          });
          return;
        }

        const { error } = await supabase
          .from('task_test_status')
          .upsert({
            task_key: record.task_key,
            status: record.status,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'task_key'
          });

        if (error) {
          throw new Error(error.message);
        }

        res.status(200).json({ success: true });
        return;
      }

      // Requisição padrão para projects
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
          // Fallback: body pode ser JSON não comprimido (ex.: cliente antigo ou bug)
          try {
            const bodyString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
            const parsed = JSON.parse(bodyString) as { project?: unknown; userId?: string };
            if (parsed?.project) {
              project = parsed.project;
              requestUserId = parsed.userId;
            } else {
              res.status(400).json({ success: false, error: 'Erro ao descomprimir payload comprimido' });
              return;
            }
          } catch {
            res.status(400).json({ success: false, error: 'Erro ao descomprimir payload comprimido' });
            return;
          }
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

