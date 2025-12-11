import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Project } from '../types';
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
const isLocalDevelopment = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
};

let supabase: SupabaseClient | null = null;
let supabaseAuthPromise: Promise<void> | null = null;
let isAuthReady = false;

// Sistema de controle de salvamentos para evitar loops e salvamentos simultâneos
const savingProjects = new Map<string, Promise<void>>(); // Rastreia salvamentos em progresso
const lastSaveTime = new Map<string, number>(); // Rastreia último tempo de salvamento para debounce
const saveDebounceMs = 500; // Debounce de 500ms entre salvamentos do mesmo projeto
const maxRetries = 3; // Máximo de 3 tentativas
const retryDelays = [1000, 2000, 4000]; // Backoff exponencial: 1s, 2s, 4s
const requestTimeoutMs = 5000; // Timeout de 5 segundos para requisições

// Inicializar cliente Supabase direto se variáveis estiverem disponíveis
// Usado para salvamento direto (evita limite de 4MB do Vercel)
// Leitura continua usando proxy para manter segurança
if (supabaseUrl && supabaseAnonKey) {
    logger.info('Inicializando SDK Supabase direto para salvamento', 'supabaseService');
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    supabaseAuthPromise = supabase.auth.signInAnonymously().then(result => {
        if (result.error) {
            logger.warn('Erro ao autenticar anonimamente no Supabase', 'supabaseService', result.error);
            isAuthReady = false;
            return;
        }
        isAuthReady = true;
        logger.info('Supabase configurado via SDK (salvamento direto habilitado)', 'supabaseService');
    }).catch(error => {
        logger.warn('Erro ao configurar autenticação Supabase', 'supabaseService', error);
        isAuthReady = false;
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
        const decoder = new TextDecoder();
        
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
        
        // Combinar chunks e converter para base64
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            combined.set(chunk, offset);
            offset += chunk.length;
        }
        
        // Converter para base64
        const base64 = btoa(String.fromCharCode(...combined));
        return base64;
    } catch (error) {
        logger.warn('Erro ao comprimir dados, enviando sem compressão', 'supabaseService', error);
        // Fallback: retornar dados sem compressão
        return JSON.stringify(data);
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
 * Otimiza o projeto removendo campos muito grandes se necessário
 * Remove specificationDocument se o payload ainda estiver muito grande após compressão
 */
const optimizeProjectForUpload = (project: Project): Project => {
    const optimized = { ...project };
    
    // Se specificationDocument for muito grande (>500KB), remover
    if (optimized.specificationDocument) {
        const docSize = new Blob([optimized.specificationDocument]).size;
        if (docSize > 500 * 1024) { // 500KB
            logger.warn(`Removendo specificationDocument muito grande (${(docSize / 1024).toFixed(2)}KB) para reduzir tamanho do payload`, 'supabaseService');
            optimized.specificationDocument = undefined;
        }
    }
    
    return optimized;
};

const saveThroughProxy = async (project: Project, retryCount: number = 0): Promise<void> => {
    const userId = await getUserId();
    
    // Otimizar projeto antes de enviar (remover campos muito grandes)
    const optimizedProject = optimizeProjectForUpload(project);
    const payload = { project: optimizedProject, userId };
    
    // Verificar tamanho do payload antes de enviar
    const payloadString = JSON.stringify(payload);
    const payloadSize = new Blob([payloadString]).size;
    const payloadSizeMB = payloadSize / (1024 * 1024);
    
    // Se o payload for maior que 1MB, tentar comprimir
    let body: unknown;
    let headers: Record<string, string> = {
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
    
    // Verificar se já há um salvamento em progresso para este projeto
    const existingSave = savingProjects.get(projectId);
    if (existingSave) {
        // Aguardar o salvamento existente completar
        try {
            await existingSave;
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
    }
    
    // Criar promise de salvamento e adicionar ao Map
    const savePromise = (async () => {
        try {
            lastSaveTime.set(projectId, Date.now());
            
            // Priorizar SDK direto (evita limite de 4MB do Vercel)
            if (supabase) {
                try {
                    await saveThroughSdk(project);
                    return;
                } catch (error) {
                    // Se for erro de rede, não tentar proxy (vai falhar também)
                    if (isNetworkError(error)) {
                        logger.warn('Erro de rede ao salvar via SDK Supabase. Salvando apenas localmente.', 'supabaseService', error);
                        throw error; // Não tentar proxy se for erro de rede
                    }
                    
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    logger.debug('Erro ao salvar via SDK Supabase, tentando proxy como fallback', 'supabaseService', error);
                    // Continuar para tentar proxy como fallback apenas se não for erro de rede
                }
            }

            // Fallback: usar proxy se SDK direto não estiver disponível ou falhou (e não for erro de rede)
            if (supabaseProxyUrl) {
                try {
                    await saveThroughProxy(project);
                    return;
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    
                    // Se for erro de rede, não tentar mais - salvar apenas localmente
                    if (isNetworkError(error)) {
                        logger.warn('Erro de rede ao salvar via proxy Supabase. Salvando apenas localmente.', 'supabaseService', error);
                        throw error;
                    }
                    
                    // Tratamento específico para erro 413 (Payload Too Large)
                    if (isPayloadTooLargeError(error)) {
                        logger.debug('Erro 413: Payload muito grande para salvar via proxy. Tentando SDK direto...', 'supabaseService', error);
                        // Se SDK não foi tentado ainda, tentar agora
                        if (supabase) {
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
                        } else {
                            throw new Error(
                                `O projeto "${project.name}" é muito grande para ser salvo via proxy (limite 4MB). ` +
                                `Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para salvamento direto. ` +
                                `O projeto foi salvo apenas localmente.`
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
export const loadProjectsFromSupabase = async (): Promise<Project[]> => {
    if (supabaseProxyUrl) {
        try {
            const userId = await getUserId();
            const response = await callSupabaseProxy<{ projects?: Project[] }>('GET', {
                query: { userId }
            }, requestTimeoutMs); // Timeout de 5 segundos
            const projects = response.projects ?? [];
            if (projects.length === 0) {
                logger.info('Nenhum projeto encontrado no Supabase (proxy)', 'supabaseService');
            } else {
                logger.info(`${projects.length} projetos carregados do Supabase via proxy`, 'supabaseService');
            }
            return projects;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (isCorsError(error)) {
                logger.error('Erro CORS ao carregar do Supabase. Configure VITE_SUPABASE_PROXY_URL', 'supabaseService', error);
            } else if (errorMessage.includes('Timeout')) {
                logger.warn('Timeout ao carregar projetos do Supabase (proxy). Usando cache local', 'supabaseService', error);
            } else {
                logger.warn('Erro ao carregar projetos via proxy Supabase', 'supabaseService', error);
            }
            return [];
        }
    }

    // SDK direto apenas em desenvolvimento local
    if (!supabase || isProduction()) {
        if (isProduction()) {
            logger.warn('Supabase não disponível em produção sem proxy. Configure VITE_SUPABASE_PROXY_URL.', 'supabaseService');
        }
        return [];
    }
    
    try {
        // Timeout para SDK também (10 segundos)
        // Buscar projetos com user_id que corresponde ao padrão anon-% (compatível com RLS)
        const userId = await getUserId();
        const queryPromise = supabase
            .from('projects')
            .select('data')
            .or(`user_id.eq.${userId},user_id.like.anon-%`)
            .order('updated_at', { ascending: false });
        
        const timeoutPromise = createTimeoutPromise<{ data: null; error: { message: string } }>(requestTimeoutMs, 'Timeout: requisição ao Supabase excedeu 5s');
        
        const result = await Promise.race([
            queryPromise,
            timeoutPromise
        ]);
        
        const { data, error } = result;
        
        if (error) {
            const errorMessage = error.message || String(error);
            if (isCorsError(error)) {
                logger.error('Erro CORS ao carregar via SDK. Use proxy em produção', 'supabaseService', error);
            } else {
                logger.warn('Erro ao carregar projetos do Supabase', 'supabaseService', error);
            }
            return [];
        }
        
        if (!data || data.length === 0) {
            logger.info('Nenhum projeto encontrado no Supabase', 'supabaseService');
            return [];
        }
        
        const projects = data.map(row => row.data as Project);
        logger.info(`${projects.length} projetos carregados do Supabase via SDK`, 'supabaseService');
        return projects;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (isCorsError(error)) {
            logger.error('Erro CORS ao carregar do Supabase. Use proxy', 'supabaseService', error);
        } else {
            logger.warn('Erro ao carregar do Supabase (usando cache local)', 'supabaseService', error);
        }
        return [];
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
            const errorMessage = error instanceof Error ? error.message : String(error);
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
            const errorMessage = error.message || String(error);
            if (isCorsError(error)) {
                logger.error('Erro CORS ao deletar via SDK. Use proxy em produção', 'supabaseService', error);
            } else {
                logger.warn('Erro ao deletar projeto do Supabase (deletado apenas localmente)', 'supabaseService', error);
            }
            return;
        }
        
        logger.info(`Projeto ${projectId} deletado do Supabase via SDK`, 'supabaseService');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
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
export const isSupabaseAvailable = (): boolean => {
    // Supabase está disponível se tiver proxy OU SDK direto configurado
    return Boolean(supabaseProxyUrl) || supabase !== null;
};

