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
 * Carrega TODOS os projetos do Supabase (unificado)
 * Não filtra por user_id - todos os projetos são compartilhados entre dispositivos
 * Unifica plataformas: desktop e celular veem os mesmos projetos
 * Nunca lança erro - retorna array vazio se falhar
 */
export const loadProjectsFromSupabase = async (): Promise<Project[]> => {
    if (!supabase) {
        return [];
    }
    
    try {
        // Buscar TODOS os projetos anônimos (sem filtro por user_id)
        // Isso unifica todos os projetos entre dispositivos
        // Jira é apenas para importação - não há autenticação separada
        const { data, error } = await supabase
            .from('projects')
            .select('data')
            .or('user_id.eq.anonymous-shared,user_id.like.anon-%')
            .order('updated_at', { ascending: false });
        
        if (error) {
            console.warn('⚠️ Erro ao carregar projetos do Supabase:', error.message);
            return [];
        }
        
        if (!data || data.length === 0) {
            console.log('📭 Nenhum projeto encontrado no Supabase');
            return [];
        }
        
        const projects = data.map(row => row.data as Project);
        console.log(`✅ ${projects.length} projetos carregados do Supabase (unificado - todos compartilhados)`);
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

