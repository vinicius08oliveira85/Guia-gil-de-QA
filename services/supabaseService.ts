import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Project } from '../types';

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

if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    // Tentar autenticação anônima, mas não bloquear se falhar
    supabaseAuthPromise = supabase.auth.signInAnonymously().then(result => {
        if (result.error) {
            console.warn('⚠️ Erro ao autenticar anonimamente no Supabase (usando modo local):', result.error.message);
            // Não desabilitar Supabase completamente - pode funcionar para leitura
            isAuthReady = false;
            return;
        }
        isAuthReady = true;
        console.log('✅ Supabase configurado e conectado (sessão anônima)');
    }).catch(error => {
        // Não desabilitar Supabase - pode funcionar parcialmente
        console.warn('⚠️ Erro ao configurar autenticação Supabase (usando modo local):', error);
        isAuthReady = false;
    });
} else {
    console.warn('⚠️ Supabase não configurado. Usando IndexedDB local.');
    console.warn('⚠️ Configure VITE_SUPABASE_URL / VITE_PUBLIC_SUPABASE_URL e VITE_SUPABASE_ANON_KEY / VITE_PUBLIC_SUPABASE_ANON_KEY no Vercel para usar Supabase.');
}

/**
 * Obtém o ID do usuário atual
 * Se não autenticado, usa um ID anônimo persistente baseado no navegador
 * Nunca lança erro - sempre retorna um ID válido
 */
export const getUserId = async (): Promise<string> => {
    // Se Supabase não está configurado, usar ID anônimo local
    if (!supabase || !supabaseAuthPromise) {
        return getLocalAnonymousId();
    }
    
    try {
        // Tentar aguardar autenticação anônima (com timeout)
        if (!isAuthReady && supabaseAuthPromise) {
            try {
                await Promise.race([
                    supabaseAuthPromise,
                    new Promise<void>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
                ]);
            } catch (timeoutError) {
                // Se timeout ou erro, continuar e tentar obter sessão mesmo assim
                console.warn('⚠️ Timeout na autenticação anônima, tentando continuar...');
            }
        }

        // Tentar obter usuário da sessão
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!userError && user?.id) {
            return user.id;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (!sessionError && session?.user?.id) {
            return session.user.id;
        }

        // Se falhou, usar ID anônimo local persistente
        return getLocalAnonymousId();
    } catch (error) {
        console.warn('⚠️ Erro ao obter user_id do Supabase, usando ID local:', error);
        return getLocalAnonymousId();
    }
};

/**
 * Obtém ou cria um ID anônimo persistente no localStorage
 * Este ID é compartilhado entre todos os dispositivos do mesmo navegador
 */
const getLocalAnonymousId = (): string => {
    const STORAGE_KEY = 'qa_app_anonymous_id';
    let anonymousId = localStorage.getItem(STORAGE_KEY);
    
    if (!anonymousId) {
        // Criar ID único e persistente
        anonymousId = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(STORAGE_KEY, anonymousId);
    }
    
    return anonymousId;
};

/**
 * Salva um projeto no Supabase
 * Não lança erro - apenas loga aviso se falhar
 */
export const saveProjectToSupabase = async (project: Project): Promise<void> => {
    if (!supabase) {
        console.warn('⚠️ Supabase não configurado, projeto salvo apenas localmente');
        return;
    }
    
    try {
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
            console.warn('⚠️ Erro ao salvar projeto no Supabase (salvo apenas localmente):', error.message);
            return;
        }
        
        console.log(`✅ Projeto "${project.name}" salvo no Supabase`);
    } catch (error) {
        console.warn('⚠️ Erro ao salvar no Supabase (salvo apenas localmente):', error);
    }
};

/**
 * Carrega todos os projetos do Supabase
 * Nunca lança erro - retorna array vazio se falhar
 */
export const loadProjectsFromSupabase = async (): Promise<Project[]> => {
    if (!supabase) {
        return [];
    }
    
    try {
        const userId = await getUserId();
        
        const { data, error } = await supabase
            .from('projects')
            .select('data')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });
        
        if (error) {
            console.warn('⚠️ Erro ao carregar projetos do Supabase (usando cache local):', error.message);
            return [];
        }
        
        if (!data || data.length === 0) {
            console.log('📭 Nenhum projeto encontrado no Supabase');
            return [];
        }
        
        const projects = data.map(row => row.data as Project);
        console.log(`✅ ${projects.length} projetos carregados do Supabase`);
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
        
        console.log(`✅ Projeto ${projectId} deletado do Supabase`);
    } catch (error) {
        console.warn('⚠️ Erro ao deletar do Supabase (deletado apenas localmente):', error);
    }
};

/**
 * Verifica se Supabase está configurado e disponível
 */
export const isSupabaseAvailable = (): boolean => {
    return supabase !== null;
};

export { supabase };

