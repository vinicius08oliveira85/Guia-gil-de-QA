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
 * Prioriza autenticação anônima do Supabase (compartilhada entre dispositivos)
 * Se falhar, usa ID compartilhado fixo para sincronização entre dispositivos
 * Nunca lança erro - sempre retorna um ID válido
 */
export const getUserId = async (): Promise<string> => {
    // Se Supabase não está configurado, usar ID compartilhado
    if (!supabase || !supabaseAuthPromise) {
        return getSharedAnonymousId();
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
                // Se timeout ou erro, usar ID compartilhado
                console.warn('⚠️ Timeout na autenticação anônima, usando ID compartilhado...');
                return getSharedAnonymousId();
            }
        }

        // Tentar obter usuário da sessão do Supabase (compartilhado entre dispositivos)
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!userError && user?.id) {
            console.log('✅ Usando user_id do Supabase (compartilhado):', user.id);
            return user.id;
        }

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (!sessionError && session?.user?.id) {
            console.log('✅ Usando user_id da sessão Supabase (compartilhado):', session.user.id);
            return session.user.id;
        }

        // Se falhou, usar ID compartilhado fixo (todos os dispositivos usam o mesmo)
        console.warn('⚠️ Não foi possível obter user_id do Supabase, usando ID compartilhado');
        return getSharedAnonymousId();
    } catch (error) {
        console.warn('⚠️ Erro ao obter user_id do Supabase, usando ID compartilhado:', error);
        return getSharedAnonymousId();
    }
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
 * Tenta primeiro com o user_id atual, depois busca todos os projetos anônimos como fallback
 * Nunca lança erro - retorna array vazio se falhar
 */
export const loadProjectsFromSupabase = async (): Promise<Project[]> => {
    if (!supabase) {
        return [];
    }
    
    try {
        const userId = await getUserId();
        console.log('🔍 Buscando projetos com user_id:', userId);
        
        // Primeira tentativa: buscar com o user_id específico
        const { data, error } = await supabase
            .from('projects')
            .select('data')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });
        
        if (error) {
            console.warn('⚠️ Erro ao carregar projetos do Supabase:', error.message);
            return [];
        }
        
        if (data && data.length > 0) {
            const projects = data.map(row => row.data as Project);
            console.log(`✅ ${projects.length} projetos carregados do Supabase com user_id: ${userId}`);
            return projects;
        }
        
        // Se não encontrou, tentar buscar TODOS os projetos anônimos como fallback
        // Isso permite encontrar projetos salvos antes da correção do user_id compartilhado
        console.log('📭 Nenhum projeto encontrado com user_id específico, buscando todos os projetos anônimos...');
        const { data: allData, error: allError } = await supabase
            .from('projects')
            .select('data, user_id')
            .or('user_id.eq.anonymous-shared,user_id.like.anon-%')
            .order('updated_at', { ascending: false });
        
        if (allError) {
            console.warn('⚠️ Erro ao buscar projetos anônimos:', allError.message);
            return [];
        }
        
        if (!allData || allData.length === 0) {
            console.log('📭 Nenhum projeto anônimo encontrado no Supabase');
            return [];
        }
        
        const projects = allData.map(row => row.data as Project);
        const uniqueUserIds = [...new Set(allData.map(r => r.user_id))];
        console.log(`✅ ${projects.length} projetos carregados do Supabase (fallback - user_ids: ${uniqueUserIds.join(', ')})`);
        
        // Se encontrou projetos mas com user_id diferente, logar aviso
        if (!uniqueUserIds.includes(userId)) {
            console.warn(`⚠️ Projetos encontrados com user_id diferente (${uniqueUserIds.join(', ')}). Salve novamente os projetos para sincronizar.`);
        }
        
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

