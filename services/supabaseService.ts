import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Project } from '../types';

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

// Inicializar cliente Supabase direto se variáveis estiverem disponíveis
// Usado para salvamento direto (evita limite de 4MB do Vercel)
// Leitura continua usando proxy para manter segurança
if (supabaseUrl && supabaseAnonKey) {
    console.log('🔧 Inicializando SDK Supabase direto para salvamento');
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    supabaseAuthPromise = supabase.auth.signInAnonymously().then(result => {
        if (result.error) {
            console.warn('⚠️ Erro ao autenticar anonimamente no Supabase:', result.error.message);
            isAuthReady = false;
            return;
        }
        isAuthReady = true;
        console.log('✅ Supabase configurado via SDK (salvamento direto habilitado)');
    }).catch(error => {
        console.warn('⚠️ Erro ao configurar autenticação Supabase:', error);
        isAuthReady = false;
    });
} else if (!supabaseProxyUrl) {
    if (isProduction()) {
        console.warn('⚠️ Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para salvamento direto, ou VITE_SUPABASE_PROXY_URL para usar proxy. Usando apenas armazenamento local (IndexedDB).');
    } else {
        console.warn('⚠️ Supabase não configurado. Usando apenas armazenamento local (IndexedDB).');
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
        console.warn('⚠️ Erro ao comprimir dados, enviando sem compressão:', error);
        // Fallback: retornar dados sem compressão
        return JSON.stringify(data);
    }
};

/**
 * Chama o proxy do Supabase com timeout e tratamento de erros melhorado
 * Timeout de 10 segundos (limite do Vercel)
 */
const callSupabaseProxy = async <T = any>(
    method: 'GET' | 'POST' | 'DELETE',
    options?: {
        body?: unknown;
        query?: Record<string, string>;
        headers?: Record<string, string>;
    },
    timeoutMs: number = 10000 // 10 segundos (limite do Vercel)
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
            console.warn(`⚠️ Removendo specificationDocument muito grande (${(docSize / 1024).toFixed(2)}KB) para reduzir tamanho do payload`);
            optimized.specificationDocument = undefined;
        }
    }
    
    return optimized;
};

const saveThroughProxy = async (project: Project) => {
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
            console.log(`📦 Payload comprimido: ${payloadSizeMB.toFixed(2)}MB -> ${compressedSizeMB.toFixed(2)}MB`);
        } catch (error) {
            console.warn('⚠️ Erro ao comprimir, enviando sem compressão:', error);
            body = payload;
        }
    } else {
        body = payload;
    }
    
    await callSupabaseProxy('POST', {
        body,
        headers
    });
    console.log(`✅ Projeto "${project.name}" salvo via proxy Supabase`);
};

const saveThroughSdk = async (project: Project) => {
    if (!supabase) {
        throw new Error('Cliente Supabase indisponível');
    }

    const userId = await getUserId();
    const { error } = await supabase
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
    
    if (error) {
        throw new Error(error.message);
    }

    console.log(`✅ Projeto "${project.name}" salvo via SDK Supabase`);
};

export const saveProjectToSupabase = async (project: Project): Promise<void> => {
    // Priorizar SDK direto (evita limite de 4MB do Vercel)
    if (supabase) {
        try {
            await saveThroughSdk(project);
            return;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.warn('⚠️ Erro ao salvar via SDK Supabase, tentando proxy como fallback:', errorMessage);
            // Continuar para tentar proxy como fallback
        }
    }

    // Fallback: usar proxy se SDK direto não estiver disponível ou falhou
    if (supabaseProxyUrl) {
        try {
            await saveThroughProxy(project);
            return;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            // Tratamento específico para erro 413 (Payload Too Large)
            if (isPayloadTooLargeError(error)) {
                console.error('❌ Erro 413: Payload muito grande para salvar via proxy. Tentando SDK direto...', errorMessage);
                // Se SDK não foi tentado ainda, tentar agora
                if (supabase) {
                    try {
                        await saveThroughSdk(project);
                        console.log('✅ Projeto salvo via SDK direto após falha do proxy (413)');
                        return;
                    } catch (sdkError) {
                        const sdkErrorMessage = sdkError instanceof Error ? sdkError.message : String(sdkError);
                        console.error('❌ Erro ao salvar via SDK após falha do proxy:', sdkErrorMessage);
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
                console.error('❌ Erro CORS ao salvar via proxy:', errorMessage);
            } else {
                console.warn('⚠️ Erro ao salvar via proxy Supabase:', errorMessage);
            }
            throw error;
        }
    }

    // Se nem SDK nem proxy estão disponíveis
    if (!supabase && !supabaseProxyUrl) {
        if (isProduction()) {
            console.warn('⚠️ Supabase não configurado. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para salvamento direto, ou VITE_SUPABASE_PROXY_URL para usar proxy. Projeto salvo apenas localmente.');
        } else {
            console.warn('⚠️ Supabase não configurado. Projeto salvo apenas localmente.');
        }
    }
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
            }, 10000); // Timeout de 10 segundos (limite do Vercel)
            const projects = response.projects ?? [];
            if (projects.length === 0) {
                console.log('📭 Nenhum projeto encontrado no Supabase (proxy)');
            } else {
                console.log(`✅ ${projects.length} projetos carregados do Supabase via proxy`);
            }
            return projects;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (isCorsError(error)) {
                console.error('❌ Erro CORS ao carregar do Supabase. Configure VITE_SUPABASE_PROXY_URL:', errorMessage);
            } else if (errorMessage.includes('Timeout')) {
                console.warn('⏱️ Timeout ao carregar projetos do Supabase (proxy). Usando cache local:', errorMessage);
            } else {
                console.warn('⚠️ Erro ao carregar projetos via proxy Supabase:', errorMessage);
            }
            return [];
        }
    }

    // SDK direto apenas em desenvolvimento local
    if (!supabase || isProduction()) {
        if (isProduction()) {
            console.warn('⚠️ Supabase não disponível em produção sem proxy. Configure VITE_SUPABASE_PROXY_URL.');
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
        
        const timeoutPromise = createTimeoutPromise<{ data: null; error: { message: string } }>(10000, 'Timeout: requisição ao Supabase excedeu 10s');
        
        const result = await Promise.race([
            queryPromise,
            timeoutPromise
        ]);
        
        const { data, error } = result;
        
        if (error) {
            const errorMessage = error.message || String(error);
            if (isCorsError(error)) {
                console.error('❌ Erro CORS ao carregar via SDK. Use proxy em produção:', errorMessage);
            } else {
                console.warn('⚠️ Erro ao carregar projetos do Supabase:', errorMessage);
            }
            return [];
        }
        
        if (!data || data.length === 0) {
            console.log('📭 Nenhum projeto encontrado no Supabase');
            return [];
        }
        
        const projects = data.map(row => row.data as Project);
        console.log(`✅ ${projects.length} projetos carregados do Supabase via SDK`);
        return projects;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (isCorsError(error)) {
            console.error('❌ Erro CORS ao carregar do Supabase. Use proxy:', errorMessage);
        } else {
            console.warn('⚠️ Erro ao carregar do Supabase (usando cache local):', errorMessage);
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
            }, 10000); // Timeout de 10 segundos
            console.log(`✅ Projeto ${projectId} removido via proxy Supabase`);
            return;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (isCorsError(error)) {
                console.error('❌ Erro CORS ao deletar do Supabase. Configure VITE_SUPABASE_PROXY_URL:', errorMessage);
            } else {
                console.warn('⚠️ Erro ao deletar via proxy Supabase:', errorMessage);
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
            console.warn('⚠️ Supabase não configurado em produção. Configure VITE_SUPABASE_PROXY_URL. Projeto deletado apenas localmente');
        } else {
            console.warn('⚠️ Supabase não configurado, projeto deletado apenas localmente');
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
        
        const timeoutPromise = createTimeoutPromise<{ error: { message: string } }>(10000, 'Timeout: requisição ao Supabase excedeu 10s');
        
        const result = await Promise.race([queryPromise, timeoutPromise]);
        const { error } = result as { error?: { message: string } };
        
        if (error) {
            const errorMessage = error.message || String(error);
            if (isCorsError(error)) {
                console.error('❌ Erro CORS ao deletar via SDK. Use proxy em produção:', errorMessage);
            } else {
                console.warn('⚠️ Erro ao deletar projeto do Supabase (deletado apenas localmente):', errorMessage);
            }
            return;
        }
        
        console.log(`✅ Projeto ${projectId} deletado do Supabase via SDK`);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (isCorsError(error)) {
            console.error('❌ Erro CORS ao deletar do Supabase. Use proxy:', errorMessage);
        } else {
            console.warn('⚠️ Erro ao deletar do Supabase (deletado apenas localmente):', errorMessage);
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

