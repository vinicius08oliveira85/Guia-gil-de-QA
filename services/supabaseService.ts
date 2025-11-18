import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Project } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase configurado e conectado');
} else {
    console.warn('⚠️ Supabase não configurado. Usando IndexedDB local.');
    console.warn('⚠️ Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Vercel para usar Supabase.');
}

/**
 * Obtém o ID do usuário atual
 * Se não autenticado, usa um ID anônimo baseado no navegador
 */
export const getUserId = async (): Promise<string> => {
    if (!supabase) return 'anonymous';
    
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) return user.id;
        
        // Se não autenticado, criar sessão anônima ou usar localStorage
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) return session.user.id;
        
        // Usar ID anônimo persistente do localStorage
        let anonymousId = localStorage.getItem('supabase_anonymous_id');
        if (!anonymousId) {
            anonymousId = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('supabase_anonymous_id', anonymousId);
        }
        return anonymousId;
    } catch (error) {
        console.warn('Erro ao obter usuário do Supabase:', error);
        // Fallback para ID anônimo
        let anonymousId = localStorage.getItem('supabase_anonymous_id');
        if (!anonymousId) {
            anonymousId = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('supabase_anonymous_id', anonymousId);
        }
        return anonymousId;
    }
};

/**
 * Salva um projeto no Supabase
 */
export const saveProjectToSupabase = async (project: Project): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    
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
        console.error('Erro ao salvar projeto no Supabase:', error);
        throw error;
    }
    
    console.log(`✅ Projeto "${project.name}" salvo no Supabase`);
};

/**
 * Carrega todos os projetos do Supabase
 */
export const loadProjectsFromSupabase = async (): Promise<Project[]> => {
    if (!supabase) throw new Error('Supabase não configurado');
    
    const userId = await getUserId();
    
    const { data, error } = await supabase
        .from('projects')
        .select('data')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });
    
    if (error) {
        console.error('Erro ao carregar projetos do Supabase:', error);
        throw error;
    }
    
    if (!data || data.length === 0) {
        console.log('📭 Nenhum projeto encontrado no Supabase');
        return [];
    }
    
    const projects = data.map(row => row.data as Project);
    console.log(`✅ ${projects.length} projetos carregados do Supabase`);
    return projects;
};

/**
 * Deleta um projeto do Supabase
 */
export const deleteProjectFromSupabase = async (projectId: string): Promise<void> => {
    if (!supabase) throw new Error('Supabase não configurado');
    
    const userId = await getUserId();
    
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', userId);
    
    if (error) {
        console.error('Erro ao deletar projeto do Supabase:', error);
        throw error;
    }
    
    console.log(`✅ Projeto ${projectId} deletado do Supabase`);
};

/**
 * Verifica se Supabase está configurado e disponível
 */
export const isSupabaseAvailable = (): boolean => {
    return supabase !== null;
};

export { supabase };

