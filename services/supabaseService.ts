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

let supabase: SupabaseClient | null = null;
let supabaseAuthPromise: Promise<void> | null = null;
let isAuthReady = false;

// Cliente direto só é usado como fallback (ex.: desenvolvimento local sem proxy)
if (!supabaseProxyUrl && supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    supabaseAuthPromise = supabase.auth.signInAnonymously().then(result => {
        if (result.error) {
            console.warn('⚠️ Erro ao autenticar anonimamente no Supabase (modo fallback):', result.error.message);
            isAuthReady = false;
            return;
        }
        isAuthReady = true;
        console.log('✅ Supabase configurado via SDK (modo fallback)');
    }).catch(error => {
        console.warn('⚠️ Erro ao configurar autenticação Supabase (modo fallback):', error);
        isAuthReady = false;
    });
} else if (!supabaseProxyUrl) {
    console.warn('⚠️ Supabase não configurado. Usando apenas armazenamento local (IndexedDB).');
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
 * Salva um projeto no Supabase
 * Não lança erro - apenas loga aviso se falhar
 * Adiciona timeout de 5 segundos para evitar travamentos
 */
const callSupabaseProxy = async <T = any>(
    method: 'GET' | 'POST' | 'DELETE',
    options?: {
        body?: unknown;
        query?: Record<string, string>;
    },
    timeoutMs: number = 5000
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
        const data = await response.json().catch(() => ({}));
        if (!response.ok || data?.success === false) {
            const message = data?.error || `Erro HTTP ${response.status}`;
            throw new Error(message);
        }
        return data as T;
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
            console.warn('⚠️ Erro ao salvar via proxy Supabase:', error);
        }
    }

    if (supabase) {
        try {
            await saveThroughSdk(project);
            return;
        } catch (error) {
            console.warn('⚠️ Erro ao salvar via SDK Supabase:', error);
        }
    }

    console.warn('⚠️ Supabase não configurado. Projeto salvo apenas localmente.');
};

/**
 * Carrega TODOS os projetos do Supabase (unificado)
 * Não filtra por user_id - todos os projetos são compartilhados entre dispositivos
 * Unifica plataformas: desktop e celular veem os mesmos projetos
 * Nunca lança erro - retorna array vazio se falhar
 * Adiciona timeout de 5 segundos para evitar travamentos
 */
export const loadProjectsFromSupabase = async (): Promise<Project[]> => {
    if (supabaseProxyUrl) {
        try {
            const userId = await getUserId();
            const response = await callSupabaseProxy<{ projects?: Project[] }>('GET', {
                query: { userId }
            }, 5000); // Timeout de 5 segundos
            const projects = response.projects ?? [];
            if (projects.length === 0) {
                console.log('📭 Nenhum projeto encontrado no Supabase (proxy)');
            } else {
                console.log(`✅ ${projects.length} projetos carregados do Supabase via proxy`);
            }
            return projects;
        } catch (error) {
            console.warn('⚠️ Erro ao carregar projetos via proxy Supabase:', error);
            return [];
        }
    }

    if (!supabase) {
        return [];
    }
    
    try {
        // Timeout para SDK também
        const queryPromise = supabase
            .from('projects')
            .select('data')
            .or('user_id.eq.anonymous-shared,user_id.like.anon-%')
            .order('updated_at', { ascending: false });
        
        const timeoutPromise = createTimeoutPromise<{ data: null; error: { message: string } }>(5000, 'Timeout: requisição ao Supabase excedeu 5s');
        
        const result = await Promise.race([
            queryPromise,
            timeoutPromise
        ]);
        
        const { data, error } = result;
        
        if (error) {
            console.warn('⚠️ Erro ao carregar projetos do Supabase:', error.message);
            return [];
        }
        
        if (!data || data.length === 0) {
            console.log('📭 Nenhum projeto encontrado no Supabase');
            return [];
        }
        
        const projects = data.map(row => row.data as Project);
        console.log(`✅ ${projects.length} projetos carregados do Supabase (fallback SDK)`);
        return projects;
    } catch (error) {
        console.warn('⚠️ Erro ao carregar do Supabase (usando cache local):', error);
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
            });
            console.log(`✅ Projeto ${projectId} removido via proxy Supabase`);
            return;
        } catch (error) {
            console.warn('⚠️ Erro ao deletar via proxy Supabase:', error);
        }
    }

    if (!supabase) {
        console.warn('⚠️ Supabase não configurado, projeto deletado apenas localmente');
        return;
    }
    
    try {
        const userId = await getUserId();
        
        const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId)
            .eq('user_id', userId);
        
        if (error) {
            console.warn('⚠️ Erro ao deletar projeto do Supabase (deletado apenas localmente):', error.message);
            return;
        }
        
        console.log(`✅ Projeto ${projectId} deletado do Supabase (fallback SDK)`);
    } catch (error) {
        console.warn('⚠️ Erro ao deletar do Supabase (deletado apenas localmente):', error);
    }
};

/**
 * Verifica se Supabase está configurado e disponível
 */
export const isSupabaseAvailable = (): boolean => {
    return Boolean(supabaseProxyUrl) || supabase !== null;
};

