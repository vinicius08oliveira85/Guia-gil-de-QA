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

// Cliente direto só é usado em desenvolvimento local como fallback
// Em produção, SEMPRE usar proxy para evitar CORS
if (!supabaseProxyUrl && supabaseUrl && supabaseAnonKey && isLocalDevelopment()) {
    console.log('🔧 Modo desenvolvimento: inicializando SDK Supabase direto (fallback)');
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    supabaseAuthPromise = supabase.auth.signInAnonymously().then(result => {
        if (result.error) {
            console.warn('⚠️ Erro ao autenticar anonimamente no Supabase (modo fallback):', result.error.message);
            isAuthReady = false;
            return;
        }
        isAuthReady = true;
        console.log('✅ Supabase configurado via SDK (modo fallback - apenas desenvolvimento)');
    }).catch(error => {
        console.warn('⚠️ Erro ao configurar autenticação Supabase (modo fallback):', error);
        isAuthReady = false;
    });
} else if (!supabaseProxyUrl) {
    if (isProduction()) {
        console.warn('⚠️ Supabase não configurado em produção. Configure VITE_SUPABASE_PROXY_URL no Vercel. Usando apenas armazenamento local (IndexedDB).');
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
 */
const getSharedAnonymousId = (): string => {
    // ID fixo compartilhado para todos os usuários anônimos
    // Isso permite que projetos salvos no desktop apareçam no celular
    return 'anonymous-shared';
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
 * Chama o proxy do Supabase com timeout e tratamento de erros melhorado
 * Timeout de 10 segundos (limite do Vercel)
 */
const callSupabaseProxy = async <T = any>(
    method: 'GET' | 'POST' | 'DELETE',
    options?: {
        body?: unknown;
        query?: Record<string, string>;
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

    const fetchPromise = fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json'
        },
        body: options?.body ? JSON.stringify(options.body) : undefined
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

const saveThroughProxy = async (project: Project) => {
    const userId = await getUserId();
    await callSupabaseProxy('POST', {
        body: { project, userId }
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
    if (supabaseProxyUrl) {
        try {
            await saveThroughProxy(project);
            return;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (isCorsError(error)) {
                console.error('❌ Erro CORS ao salvar no Supabase. Configure VITE_SUPABASE_PROXY_URL:', errorMessage);
            } else {
                console.warn('⚠️ Erro ao salvar via proxy Supabase:', errorMessage);
            }
            // Não tentar fallback para SDK em produção ou se for erro CORS
            if (isProduction() || isCorsError(error)) {
                return;
            }
        }
    }

    // SDK direto apenas em desenvolvimento local
    if (supabase && isLocalDevelopment()) {
        try {
            await saveThroughSdk(project);
            return;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            if (isCorsError(error)) {
                console.error('❌ Erro CORS ao salvar via SDK. Use proxy em produção:', errorMessage);
            } else {
                console.warn('⚠️ Erro ao salvar via SDK Supabase:', errorMessage);
            }
        }
    }

    if (!supabaseProxyUrl && isProduction()) {
        console.warn('⚠️ Supabase não configurado em produção. Configure VITE_SUPABASE_PROXY_URL. Projeto salvo apenas localmente.');
    } else if (!supabaseProxyUrl) {
        console.warn('⚠️ Supabase não configurado. Projeto salvo apenas localmente.');
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
        const queryPromise = supabase
            .from('projects')
            .select('data')
            .or('user_id.eq.anonymous-shared,user_id.like.anon-%')
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
        console.log(`✅ ${projects.length} projetos carregados do Supabase (fallback SDK - apenas desenvolvimento)`);
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
        
        console.log(`✅ Projeto ${projectId} deletado do Supabase (fallback SDK - apenas desenvolvimento)`);
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
 * Em produção, apenas proxy é considerado disponível (SDK direto causa CORS)
 */
export const isSupabaseAvailable = (): boolean => {
    if (isProduction()) {
        // Em produção, apenas proxy é válido (SDK direto causa CORS)
        return Boolean(supabaseProxyUrl);
    }
    // Em desenvolvimento, aceita proxy ou SDK direto
    return Boolean(supabaseProxyUrl) || supabase !== null;
};

