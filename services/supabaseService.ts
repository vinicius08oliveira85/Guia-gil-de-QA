import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Project, TestCase, JiraTask } from '../types';
import { logger } from '../utils/logger';

const supabaseProxyUrl = (import.meta.env.VITE_SUPABASE_PROXY_URL || '').trim();

const supabaseUrl =
    import.meta.env.VITE_SUPABASE_URL ||
    import.meta.env.VITE_PUBLIC_SUPABASE_URL ||
    import.meta.env.SUPABASE_URL;

const supabaseAnonKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY ||
    import.meta.env.SUPABASE_ANON_KEY;

/**
 * Verifica se está em ambiente de produção (Vercel)
 */
const isProduction = (): boolean => {
    if (typeof window === 'undefined') return false;
    const hostname = window.location.hostname;
    return hostname.includes('vercel.app') || hostname.includes('vercel.com');
};

/**
 * Verifica se é ambiente de desenvolvimento local
 */
let supabase: SupabaseClient | null = null;

// Sistema de controle de salvamentos para evitar loops e salvamentos simultâneos
const savingProjects = new Map<string, Promise<void>>(); // Rastreia salvamentos em progresso
const lastSaveTime = new Map<string, number>(); // Rastreia último tempo de salvamento para debounce
const pendingSaves = new Map<string, Project>(); // Fila de salvamentos pendentes (última versão de cada projeto)
const saveDebounceMs = 300; // Debounce de 300ms entre salvamentos do mesmo projeto (reduzido para ser mais responsivo)
const maxRetries = 3; // Máximo de 3 tentativas
const retryDelays = [1000, 2000, 4000]; // Backoff exponencial: 1s, 2s, 4s
const requestTimeoutMs = 8000; // Timeout de 8 segundos (evita timeout em redes lentas; fallback usa cache local)

// Inicializar cliente Supabase direto se variáveis estiverem disponíveis
// Usado para salvamento direto (evita limite de 4MB do Vercel)
// Leitura continua usando proxy para manter segurança
if (supabaseUrl && supabaseAnonKey) {
    logger.info('Inicializando SDK Supabase direto para salvamento', 'supabaseService');
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    void supabase.auth.signInAnonymously().then(result => {
        if (result.error) {
            logger.warn('Erro ao autenticar anonimamente no Supabase', 'supabaseService', result.error);
            return;
        }
        logger.info('Supabase configurado via SDK (salvamento direto habilitado)', 'supabaseService');
    }).catch(error => {
        logger.warn('Erro ao configurar autenticação Supabase', 'supabaseService', error);
    });
} else if (!supabaseProxyUrl) {
    if (isProduction()) {
        logger.warn('Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para salvamento direto, ou VITE_SUPABASE_PROXY_URL para usar proxy. Usando apenas armazenamento local (IndexedDB).', 'supabaseService');
    } else {
        logger.warn('Supabase não configurado. Usando apenas armazenamento local (IndexedDB).', 'supabaseService');
    }
}

/**
 * Obtém o ID do usuário atual
 * SEMPRE retorna o ID compartilhado fixo para unificar todos os projetos
 * Remove necessidade de autenticação - todos os projetos são compartilhados
 * Nunca lança erro - sempre retorna um ID válido
 */
export const getUserId = async (): Promise<string> => {
    // SEMPRE usar ID compartilhado fixo para unificar todos os projetos
    // Não importa se Supabase está configurado ou não - sempre compartilhado
    // Isso garante que todos os dispositivos vejam os mesmos projetos
    return getSharedAnonymousId();
};

/**
 * Obtém um ID anônimo compartilhado entre todos os dispositivos
 * Todos os usuários anônimos usam o mesmo ID para sincronização
 * Isso permite que projetos salvos em um dispositivo apareçam em outros
 * 
 * IMPORTANTE: Deve começar com 'anon-' para compatibilidade com políticas RLS
 */
const getSharedAnonymousId = (): string => {
    // ID fixo compartilhado para todos os usuários anônimos
    // Deve começar com 'anon-' para corresponder ao padrão das políticas RLS: user_id LIKE 'anon-%'
    // Isso permite que projetos salvos no desktop apareçam no celular
    return 'anon-shared';
};

/**
 * Cria uma promise que rejeita após o timeout especificado
 */
const createTimeoutPromise = <T>(timeoutMs: number, errorMessage: string): Promise<T> => {
    return new Promise((_, reject) => {
        setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
    });
};

/**
 * Verifica se um erro é relacionado a CORS
 */
const isCorsError = (error: unknown): boolean => {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return message.includes('cors') || 
               message.includes('access-control-allow-origin') ||
               message.includes('blocked by cors policy');
    }
    if (error instanceof TypeError) {
        return error.message.includes('Failed to fetch') || 
               error.message.includes('NetworkError');
    }
    return false;
};

/**
 * Verifica se um erro é relacionado a problemas de rede (timeout, connection reset, DNS)
 */
const isNetworkError = (error: unknown): boolean => {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return message.includes('timeout') ||
               message.includes('timed_out') ||
               message.includes('connection reset') ||
               message.includes('err_connection_reset') ||
               message.includes('err_timed_out') ||
               message.includes('err_name_not_resolved') ||
               message.includes('failed to fetch') ||
               message.includes('networkerror') ||
               message.includes('network request failed');
    }
    if (error instanceof TypeError) {
        return error.message.includes('Failed to fetch') || 
               error.message.includes('NetworkError');
    }
    return false;
};

/**
 * Verifica se um erro é 413 (Content Too Large)
 */
const isPayloadTooLargeError = (error: unknown): boolean => {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return message.includes('413') || 
               message.includes('content too large') ||
               message.includes('payload muito grande');
    }
    return false;
};

/**
 * Verifica se o erro é 403 (Forbidden), ex.: RLS bloqueando acesso direto com anon key
 */
const isForbiddenError = (error: unknown): boolean => {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return message.includes('403') ||
               message.includes('forbidden') ||
               message.includes('row-level security') ||
               message.includes('violates row-level security');
    }
    return false;
};

/**
 * Comprime dados usando CompressionStream (API nativa do browser)
 * Retorna o payload comprimido em base64
 */
const compressData = async (data: unknown): Promise<string> => {
    try {
        // Verificar se CompressionStream está disponível
        if (typeof CompressionStream === 'undefined') {
            throw new Error('CompressionStream não disponível neste navegador');
        }

        const jsonString = JSON.stringify(data);
        const encoder = new TextEncoder();
        
        const stream = new CompressionStream('gzip');
        const writer = stream.writable.getWriter();
        const reader = stream.readable.getReader();
        
        // Escrever dados
        writer.write(encoder.encode(jsonString));
        writer.close();
        
        // Ler dados comprimidos
        const chunks: Uint8Array[] = [];
        let done = false;
        
        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            if (value) {
                chunks.push(value);
            }
        }
        
        // Combinar chunks e converter para base64 (em blocos para evitar stack overflow)
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.length;
        }

        // Construir string binária em chunks; spread de Uint8Array grande estoura a call stack
        const CHUNK_SIZE = 8192;
        let binary = '';
        for (let i = 0; i < combined.length; i += CHUNK_SIZE) {
            const chunk = combined.subarray(i, Math.min(i + CHUNK_SIZE, combined.length));
            binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
        }
        return btoa(binary);
    } catch (error) {
        logger.warn('Erro ao comprimir dados, enviando sem compressão', 'supabaseService', error);
        throw error;
    }
};

/**
 * Chama o proxy do Supabase com timeout e tratamento de erros melhorado
 * Timeout reduzido para 5 segundos para falhar rápido
 */
const callSupabaseProxy = async <T = any>(
    method: 'GET' | 'POST' | 'DELETE',
    options?: {
        body?: unknown;
        query?: Record<string, string>;
        headers?: Record<string, string>;
    },
    timeoutMs: number = requestTimeoutMs // 5 segundos (timeout mais curto)
): Promise<T> => {
    if (!supabaseProxyUrl) {
        throw new Error('Supabase proxy não configurado');
    }

    let url = supabaseProxyUrl;
    if (options?.query) {
        const params = new URLSearchParams(options.query).toString();
        if (params) {
            url += (url.includes('?') ? '&' : '?') + params;
        }
    }

    const defaultHeaders: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    const headers = { ...defaultHeaders, ...options?.headers };

    // Se o body for string (comprimido), enviar como está, senão stringify
    const body = options?.body 
        ? (typeof options.body === 'string' ? options.body : JSON.stringify(options.body))
        : undefined;

    const fetchPromise = fetch(url, {
        method,
        headers,
        body
    }).then(async (response) => {
        // Verificar se é erro de CORS
        if (response.status === 0 || response.type === 'opaque') {
            throw new Error('CORS: Requisição bloqueada. Configure o proxy corretamente.');
        }

        const data = await response.json().catch(() => ({}));
        if (!response.ok || data?.success === false) {
            const message = data?.error || `Erro HTTP ${response.status}`;
            throw new Error(message);
        }
        return data as T;
    }).catch((error) => {
        // Melhorar mensagem de erro para CORS
        if (isCorsError(error)) {
            throw new Error('CORS: Não é possível acessar Supabase diretamente. Configure VITE_SUPABASE_PROXY_URL.');
        }
        throw error;
    });

    // Race entre fetch e timeout
    return Promise.race([
        fetchPromise,
        createTimeoutPromise<T>(timeoutMs, `Timeout: requisição ao Supabase excedeu ${timeoutMs}ms`)
    ]);
};

/**
 * Otimiza o projeto para upload preservando todos os dados
 * Usa compressão mais agressiva em vez de remover dados
 * NÃO remove specificationDocument - preserva todos os dados
 */
const optimizeProjectForUpload = (project: Project): Project => {
    // Não remover dados - apenas retornar projeto como está
    // A compressão será aplicada no payload se necessário
    return { ...project };
};

const saveThroughProxy = async (project: Project, retryCount: number = 0): Promise<void> => {
    const userId = await getUserId();
    
    // Preservar todos os dados - não remover campos grandes
    const optimizedProject = optimizeProjectForUpload(project);
    const payload = { project: optimizedProject, userId };
    
    // Verificar tamanho do payload antes de enviar
    const payloadString = JSON.stringify(payload);
    const payloadSize = new Blob([payloadString]).size;
    const payloadSizeMB = payloadSize / (1024 * 1024);
    
    // Se o payload for maior que 1MB, tentar comprimir
    let body: unknown;
    const headers: Record<string, string> = {
        'Content-Type': 'application/json'
    };
    
    if (payloadSizeMB > 1 && typeof CompressionStream !== 'undefined') {
        try {
            const compressed = await compressData(payload);
            const compressedSize = new Blob([compressed]).size;
            const compressedSizeMB = compressedSize / (1024 * 1024);
            body = compressed;
            headers['x-content-compressed'] = 'gzip';
            headers['Content-Type'] = 'text/plain'; // Base64 string
            logger.debug(`Payload comprimido: ${payloadSizeMB.toFixed(2)}MB -> ${compressedSizeMB.toFixed(2)}MB`, 'supabaseService');
        } catch (error) {
            logger.debug('Erro ao comprimir, enviando sem compressão', 'supabaseService', error);
            body = payload;
        }
    } else {
        body = payload;
    }
    
    try {
        await callSupabaseProxy('POST', {
            body,
            headers
        }, requestTimeoutMs);
        // Log reduzido - apenas debug para evitar spam
        if (retryCount === 0) {
            logger.debug(`Projeto "${project.name}" salvo via proxy Supabase`, 'supabaseService');
        }
    } catch (error) {
        // Se for erro de rede e ainda temos tentativas, fazer retry com backoff
        if (isNetworkError(error) && retryCount < maxRetries) {
            const delay = retryDelays[retryCount] || 4000;
            // Log apenas na primeira tentativa para evitar spam
            if (retryCount === 0) {
                logger.debug(`Erro de rede ao salvar via proxy. Tentando novamente em ${delay}ms...`, 'supabaseService');
            }
            await new Promise(resolve => setTimeout(resolve, delay));
            return saveThroughProxy(project, retryCount + 1);
        }
        throw error;
    }
};

const saveThroughSdk = async (project: Project, retryCount: number = 0): Promise<void> => {
    if (!supabase) {
        throw new Error('Cliente Supabase indisponível');
    }

    const userId = await getUserId();
    
    // Adicionar timeout para requisição SDK
    const savePromise = supabase
        .from('projects')
        .upsert({
            id: project.id,
            user_id: userId,
            name: project.name,
            description: project.description,
            data: project,
            updated_at: new Date().toISOString(),
        }, {
            onConflict: 'id'
        });
    
    const timeoutPromise = createTimeoutPromise<{ error: { message: string } | null }>(
        requestTimeoutMs,
        'Timeout: requisição ao Supabase excedeu 5s'
    );
    
    const result = await Promise.race([savePromise, timeoutPromise]);
    const { error } = result;
    
    if (error) {
        // Se for erro de rede e ainda temos tentativas, fazer retry com backoff
        if (isNetworkError(error) && retryCount < maxRetries) {
            const delay = retryDelays[retryCount] || 4000;
            // Log apenas na primeira tentativa para evitar spam
            if (retryCount === 0) {
                logger.debug(`Erro de rede ao salvar via SDK. Tentando novamente em ${delay}ms...`, 'supabaseService');
            }
            await new Promise(resolve => setTimeout(resolve, delay));
            return saveThroughSdk(project, retryCount + 1);
        }
        throw new Error(error.message);
    }

    // Log apenas se não for retry (evitar spam)
    if (retryCount === 0) {
        logger.debug(`Projeto "${project.name}" salvo via SDK Supabase`, 'supabaseService');
    }
};

export const saveProjectToSupabase = async (project: Project): Promise<void> => {
    const projectId = project.id;
    
    // Sempre atualizar a fila de salvamentos pendentes com a versão mais recente
    pendingSaves.set(projectId, project);
    
    // Verificar se já há um salvamento em progresso para este projeto
    const existingSave = savingProjects.get(projectId);
    if (existingSave) {
        // Aguardar o salvamento existente completar
        try {
            await existingSave;
            // Após salvamento anterior, verificar se há versão mais recente na fila
            const latestProject = pendingSaves.get(projectId);
            if (latestProject && latestProject !== project) {
                // Há uma versão mais recente - salvar novamente
                logger.debug(`Versão mais recente do projeto "${project.name}" encontrada na fila, salvando novamente`, 'supabaseService');
                return saveProjectToSupabase(latestProject);
            }
            return; // Salvamento já foi feito
        } catch {
            // Se o salvamento anterior falhou, continuar para tentar novamente
        }
    }
    
    // Verificar debounce - evitar salvamentos muito frequentes
    const lastSave = lastSaveTime.get(projectId);
    const now = Date.now();
    if (lastSave && (now - lastSave) < saveDebounceMs) {
        // Aguardar até o debounce expirar
        const waitTime = saveDebounceMs - (now - lastSave);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Após debounce, verificar se há versão mais recente na fila
        const latestProject = pendingSaves.get(projectId);
        if (latestProject && latestProject !== project) {
            // Usar a versão mais recente
            return saveProjectToSupabase(latestProject);
        }
    }
    
    // Criar promise de salvamento e adicionar ao Map
    const savePromise = (async () => {
        try {
            lastSaveTime.set(projectId, Date.now());
            let sdkAlreadyFailedWith403 = false;

            // Log detalhado do início do salvamento
            logger.debug(`Iniciando salvamento do projeto "${project.name}" (${projectId})`, 'supabaseService', {
                projectId,
                projectName: project.name,
                tasksCount: project.tasks?.length || 0,
                hasProxy: !!supabaseProxyUrl,
                hasSDK: !!supabase
            });
            
            // Priorizar SDK direto (evita limite de 4MB do Vercel)
            if (supabase) {
                try {
                    await saveThroughSdk(project);
                    logger.info(`Projeto "${project.name}" salvo com sucesso via SDK`, 'supabaseService', {
                        projectId,
                        projectName: project.name
                    });
                    return;
                } catch (error) {
                    // Se for erro de rede, não tentar proxy (vai falhar também)
                    if (isNetworkError(error)) {
                        logger.warn('Erro de rede ao salvar via SDK Supabase. Salvando apenas localmente.', 'supabaseService', error);
                        throw error; // Não tentar proxy se for erro de rede
                    }
                    if (isForbiddenError(error)) {
                        sdkAlreadyFailedWith403 = true;
                        logger.debug('Acesso direto negado (403), salvando via proxy', 'supabaseService');
                    } else {
                        logger.debug('Erro ao salvar via SDK Supabase, tentando proxy como fallback', 'supabaseService', error);
                    }
                    // Continuar para tentar proxy como fallback
                }
            }

            // Fallback: usar proxy se SDK direto não estiver disponível ou falhou (e não for erro de rede)
            if (supabaseProxyUrl) {
                try {
                    logger.debug(`Tentando salvar projeto "${project.name}" via proxy`, 'supabaseService', {
                        projectId,
                        projectName: project.name,
                        proxyUrl: supabaseProxyUrl
                    });
                    await saveThroughProxy(project);
                    logger.info(`Projeto "${project.name}" salvo com sucesso via proxy`, 'supabaseService', {
                        projectId,
                        projectName: project.name
                    });
                    return;
                } catch (error) {
                    // Se for erro de rede, não tentar mais - salvar apenas localmente
                    if (isNetworkError(error)) {
                        logger.warn('Erro de rede ao salvar via proxy Supabase. Salvando apenas localmente.', 'supabaseService', error);
                        throw error;
                    }
                    
                    // Tratamento específico para erro 413 (Payload Too Large)
                    if (isPayloadTooLargeError(error)) {
                        // Não retentar SDK se já falhou com 403 nesta mesma operação
                        if (sdkAlreadyFailedWith403 || !supabase) {
                            throw new Error(
                                `O projeto "${project.name}" é muito grande para o proxy (limite 4MB) e o salvamento direto não está disponível. O projeto foi salvo apenas localmente.`
                            );
                        }
                        logger.debug('Erro 413: Payload muito grande para salvar via proxy. Tentando SDK direto...', 'supabaseService', error);
                        try {
                            await saveThroughSdk(project);
                            return;
                        } catch (sdkError) {
                            logger.warn('Erro ao salvar via SDK após falha do proxy', 'supabaseService', sdkError);
                            throw new Error(
                                `O projeto "${project.name}" é muito grande para ser salvo via proxy (limite 4MB) ` +
                                `e falhou ao salvar direto no Supabase. O projeto foi salvo apenas localmente.`
                            );
                        }
                    }
                    
                    if (isCorsError(error)) {
                        logger.warn('Erro CORS ao salvar via proxy', 'supabaseService', error);
                    } else {
                        logger.warn('Erro ao salvar via proxy Supabase', 'supabaseService', error);
                    }
                    throw error;
                }
            }

            // Se nem SDK nem proxy estão disponíveis
            if (!supabase && !supabaseProxyUrl) {
                if (isProduction()) {
                    logger.debug('Supabase não configurado. Projeto salvo apenas localmente.', 'supabaseService');
                } else {
                    logger.debug('Supabase não configurado. Projeto salvo apenas localmente.', 'supabaseService');
                }
            }
        } finally {
            // Remover do Map após conclusão (sucesso ou erro)
            savingProjects.delete(projectId);
            // Remover da fila de pendentes apenas se for a versão atual
            const latestProject = pendingSaves.get(projectId);
            if (latestProject === project) {
                pendingSaves.delete(projectId);
            }
        }
    })();
    
    // Adicionar ao Map antes de executar
    savingProjects.set(projectId, savePromise);
    
    // Executar e retornar
    return savePromise;
};

/**
 * Carrega TODOS os projetos do Supabase (unificado)
 * Não filtra por user_id - todos os projetos são compartilhados entre dispositivos
 * Unifica plataformas: desktop e celular veem os mesmos projetos
 * Nunca lança erro - retorna array vazio se falhar
 * Timeout de 10 segundos (limite do Vercel)
 */
export type LoadProjectsResult = { projects: Project[]; loadFailed: boolean; errorMessage?: string };

export const loadProjectsFromSupabase = async (): Promise<LoadProjectsResult> => {
    if (supabaseProxyUrl) {
        const attempt = async (): Promise<LoadProjectsResult> => {
            const userId = await getUserId();
            const response = await callSupabaseProxy<{ projects?: Project[] }>('GET', {
                query: { userId }
            }, requestTimeoutMs);
            const projects = response.projects ?? [];
            if (projects.length === 0) {
                logger.info('Nenhum projeto encontrado no Supabase (proxy)', 'supabaseService');
            } else {
                logger.info(`${projects.length} projetos carregados do Supabase via proxy`, 'supabaseService');
            }
            return { projects, loadFailed: false };
        };
        try {
            return await attempt();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            const isSchemaCacheOrPaused =
                errorMessage.includes('schema cache') ||
                errorMessage.includes('paused') ||
                errorMessage.includes('Retrying');
            if (isCorsError(error)) {
                logger.error('Erro CORS ao carregar do Supabase. Configure VITE_SUPABASE_PROXY_URL', 'supabaseService', error);
            } else if (errorMessage.includes('Timeout')) {
                logger.warn('Timeout ao carregar projetos do Supabase (proxy). Usando cache local', 'supabaseService', error);
            } else if (isSchemaCacheOrPaused) {
                logger.warn(
                    'Supabase indisponível (schema cache/pausado). Verifique no dashboard se o projeto está ativo: https://supabase.com/dashboard',
                    'supabaseService',
                    error
                );
            } else {
                logger.warn('Erro ao carregar projetos via proxy Supabase', 'supabaseService', error);
            }
            const isTimeout = errorMessage.includes('Timeout');
            // Retry único após 2s em caso de 500/schema cache ou timeout (Supabase/rede pode estar lento)
            if (isSchemaCacheOrPaused || errorMessage.includes('500') || isTimeout) {
                try {
                    if (isTimeout) {
                        logger.debug('Retry em 2s após timeout ao carregar projetos do Supabase', 'supabaseService');
                    }
                    await new Promise(r => setTimeout(r, 2000));
                    return await attempt();
                } catch (retryError) {
                    const retryMsg = retryError instanceof Error ? retryError.message : String(retryError);
                    if (retryMsg.includes('schema cache') || retryMsg.includes('paused')) {
                        logger.warn(
                            'Supabase ainda indisponível após retry. Verifique se o projeto está ativo em https://supabase.com/dashboard',
                            'supabaseService',
                            retryError
                        );
                    }
                    return { projects: [], loadFailed: true, errorMessage: retryMsg };
                }
            }
            return { projects: [], loadFailed: true, errorMessage };
        }
    }

    // SDK direto apenas em desenvolvimento local
    if (!supabase || isProduction()) {
        if (isProduction()) {
            logger.warn('Supabase não disponível em produção sem proxy. Configure VITE_SUPABASE_PROXY_URL.', 'supabaseService');
        }
        return { projects: [], loadFailed: false };
    }

    try {
        const userId = await getUserId();
        const queryPromise = supabase
            .from('projects')
            .select('data')
            .or(`user_id.eq.${userId},user_id.like.anon-%`)
            .order('updated_at', { ascending: false });
        const timeoutPromise = createTimeoutPromise<{ data: null; error: { message: string } }>(requestTimeoutMs, 'Timeout: requisição ao Supabase excedeu 5s');
        const result = await Promise.race([queryPromise, timeoutPromise]);
        const { data, error } = result;

        if (error) {
            const errMsg = error?.message ?? String(error);
            if (isCorsError(error)) {
                logger.error('Erro CORS ao carregar via SDK. Use proxy em produção', 'supabaseService', error);
            } else {
                logger.warn('Erro ao carregar projetos do Supabase', 'supabaseService', error);
            }
            return { projects: [], loadFailed: true, errorMessage: errMsg };
        }
        if (!data || data.length === 0) {
            logger.info('Nenhum projeto encontrado no Supabase', 'supabaseService');
            return { projects: [], loadFailed: false };
        }
        const projects = data.map(row => row.data as Project);
        logger.info(`${projects.length} projetos carregados do Supabase via SDK`, 'supabaseService');
        return { projects, loadFailed: false };
    } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        if (isCorsError(error)) {
            logger.error('Erro CORS ao carregar do Supabase. Use proxy', 'supabaseService', error);
        } else {
            logger.warn('Erro ao carregar do Supabase (usando cache local)', 'supabaseService', error);
        }
        return { projects: [], loadFailed: true, errorMessage: errMsg };
    }
};

/**
 * Deleta um projeto do Supabase
 * Não lança erro - apenas loga aviso se falhar
 */
export const deleteProjectFromSupabase = async (projectId: string): Promise<void> => {
    if (supabaseProxyUrl) {
        try {
            const userId = await getUserId();
            await callSupabaseProxy('DELETE', {
                body: { projectId, userId }
            }, requestTimeoutMs); // Timeout de 5 segundos
            logger.info(`Projeto ${projectId} removido via proxy Supabase`, 'supabaseService');
            return;
        } catch (error) {
            if (isCorsError(error)) {
                logger.error('Erro CORS ao deletar do Supabase. Configure VITE_SUPABASE_PROXY_URL', 'supabaseService', error);
            } else {
                logger.warn('Erro ao deletar via proxy Supabase', 'supabaseService', error);
            }
            // Não tentar fallback para SDK em produção ou se for erro CORS
            if (isProduction() || isCorsError(error)) {
                return;
            }
        }
    }

    // SDK direto apenas em desenvolvimento local
    if (!supabase || isProduction()) {
        if (isProduction()) {
            logger.warn('Supabase não configurado em produção. Configure VITE_SUPABASE_PROXY_URL. Projeto deletado apenas localmente', 'supabaseService');
        } else {
            logger.warn('Supabase não configurado, projeto deletado apenas localmente', 'supabaseService');
        }
        return;
    }
    
    try {
        const userId = await getUserId();
        
        const queryPromise = supabase
            .from('projects')
            .delete()
            .eq('id', projectId)
            .eq('user_id', userId);
        
        const timeoutPromise = createTimeoutPromise<{ error: { message: string } }>(requestTimeoutMs, 'Timeout: requisição ao Supabase excedeu 5s');
        
        const result = await Promise.race([queryPromise, timeoutPromise]);
        const { error } = result as { error?: { message: string } };
        
        if (error) {
            if (isCorsError(error)) {
                logger.error('Erro CORS ao deletar via SDK. Use proxy em produção', 'supabaseService', error);
            } else {
                logger.warn('Erro ao deletar projeto do Supabase (deletado apenas localmente)', 'supabaseService', error);
            }
            return;
        }
        
        logger.info(`Projeto ${projectId} deletado do Supabase via SDK`, 'supabaseService');
    } catch (error) {
        if (isCorsError(error)) {
            logger.error('Erro CORS ao deletar do Supabase. Use proxy', 'supabaseService', error);
        } else {
            logger.warn('Erro ao deletar do Supabase (deletado apenas localmente)', 'supabaseService', error);
        }
    }
};

/**
 * Verifica se Supabase está configurado e disponível
 * Considera tanto proxy quanto SDK direto (SDK direto usado para salvamento, evita limite 4MB)
 */
/**
 * Diagnóstico da configuração do Supabase
 * Retorna informações detalhadas sobre o status da configuração
 */
export const diagnoseSupabaseConfig = (): {
    isAvailable: boolean;
    hasProxy: boolean;
    hasSDK: boolean;
    isProduction: boolean;
    status: 'configured' | 'proxy-only' | 'sdk-only' | 'not-configured';
    details: string;
} => {
    const hasProxy = !!supabaseProxyUrl;
    const hasSDK = !!(supabaseUrl && supabaseAnonKey);
    const prod = isProduction();
    
    let status: 'configured' | 'proxy-only' | 'sdk-only' | 'not-configured';
    let details = '';
    
    if (hasProxy && hasSDK) {
        status = 'configured';
        details = 'Supabase configurado com proxy e SDK. Salvamento direto habilitado.';
    } else if (hasProxy && !hasSDK) {
        status = 'proxy-only';
        details = prod 
            ? 'Apenas proxy configurado. Salvamento direto não disponível em produção sem SDK.'
            : 'Apenas proxy configurado. Salvamento direto não disponível sem SDK.';
    } else if (!hasProxy && hasSDK) {
        status = 'sdk-only';
        details = prod
            ? 'Apenas SDK configurado. Leitura pode falhar em produção sem proxy (CORS).'
            : 'Apenas SDK configurado. Funcionando em desenvolvimento.';
    } else {
        status = 'not-configured';
        details = 'Supabase não configurado. Usando apenas armazenamento local (IndexedDB).';
    }
    
    return {
        isAvailable: hasProxy || hasSDK,
        hasProxy,
        hasSDK,
        isProduction: prod,
        status,
        details
    };
};

export const isSupabaseAvailable = (): boolean => {
    // Supabase está disponível se tiver proxy OU SDK direto configurado
    return Boolean(supabaseProxyUrl) || supabase !== null;
};

/**
 * Valida se uma string é uma chave Jira válida (formato: PROJ-123)
 */
const isValidJiraKey = (key: string): boolean => {
    return /^[A-Z]+-\d+$/.test(key);
};

/**
 * Busca os status dos testes salvos no Supabase por chave Jira
 * Retorna um Map onde a chave é a chave Jira e o valor são os testCases salvos
 * 
 * @param jiraKeys Array de chaves Jira para buscar (ex: ['GDPI-4', 'GDPI-3'])
 * @returns Map com chave Jira -> testCases salvos
 */
export const loadTestStatusesByJiraKeys = async (jiraKeys: string[]): Promise<Map<string, TestCase[]>> => {
    const result = new Map<string, TestCase[]>();
    
    // Filtrar apenas chaves Jira válidas
    const validKeys = jiraKeys.filter(key => isValidJiraKey(key));
    
    if (validKeys.length === 0) {
        logger.debug('Nenhuma chave Jira válida fornecida para buscar status de testes', 'supabaseService');
        return result;
    }
    
    try {
        // Buscar todos os projetos do Supabase
        const { projects } = await loadProjectsFromSupabase();

        if (projects.length === 0) {
            logger.debug('Nenhum projeto encontrado no Supabase para buscar status de testes', 'supabaseService');
            return result;
        }
        
        // Criar um Set para busca rápida
        const keysSet = new Set(validKeys);
        
        let totalTestCasesFound = 0;
        let totalTestCasesWithStatus = 0;
        
        // Iterar sobre todos os projetos e tarefas
        for (const project of projects) {
            if (!project.tasks || project.tasks.length === 0) {
                continue;
            }
            
            for (const task of project.tasks) {
                // Verificar se a tarefa tem uma chave Jira válida e está na lista de busca
                if (task.id && isValidJiraKey(task.id) && keysSet.has(task.id)) {
                    // Se já existe uma entrada para esta chave, manter a mais recente (último projeto processado)
                    // ou mesclar se necessário
                    if (!result.has(task.id) || (task.testCases && task.testCases.length > 0)) {
                        // Preservar testCases se existirem
                        const testCases = task.testCases || [];
                        if (testCases.length > 0) {
                            const testCasesWithStatus = testCases.filter(tc => tc.status !== 'Not Run').length;
                            totalTestCasesFound += testCases.length;
                            totalTestCasesWithStatus += testCasesWithStatus;
                            
                            result.set(task.id, testCases);
                            logger.debug(`Status de testes encontrados para ${task.id}: ${testCases.length} casos (${testCasesWithStatus} com status)`, 'supabaseService');
                        }
                    }
                }
            }
        }
        
        logger.info(`Status de testes carregados para ${result.size} chaves Jira de ${validKeys.length} solicitadas`, 'supabaseService', {
            chavesEncontradas: result.size,
            totalTestCases: totalTestCasesFound,
            testCasesComStatus: totalTestCasesWithStatus,
            testCasesSemStatus: totalTestCasesFound - totalTestCasesWithStatus
        });
    } catch (error) {
        logger.warn('Erro ao buscar status de testes do Supabase, continuando sem preservar status', 'supabaseService', error);
        // Retornar Map vazio em caso de erro - não bloquear a importação/sincronização
    }
    
    return result;
};

