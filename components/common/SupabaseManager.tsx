import React, { useState } from 'react';
import { Project } from '../../types';
import { isSupabaseAvailable, saveProjectToSupabase, deleteProjectFromSupabase } from '../../services/supabaseService';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { Card } from './Card';
import { Badge } from './Badge';

interface SupabaseManagerProps {
    project: Project;
    onProjectUpdated?: () => void;
}

export const SupabaseManager: React.FC<SupabaseManagerProps> = ({ project, onProjectUpdated }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const { handleError, handleSuccess, handleWarning } = useErrorHandler();
    const supabaseAvailable = isSupabaseAvailable();

    const handleSaveToSupabase = async () => {
        if (!supabaseAvailable) {
            handleWarning('Supabase não está configurado. Configure as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Vercel.');
            return;
        }

        setIsSaving(true);
        try {
            await saveProjectToSupabase(project);
            handleSuccess(`Projeto "${project.name}" salvo no Supabase com sucesso!`);
            onProjectUpdated?.();
        } catch (error) {
            handleError(error, 'Salvar no Supabase');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteFromSupabase = async () => {
        if (!supabaseAvailable) {
            handleWarning('Supabase não está configurado.');
            return;
        }

        if (!confirm(`Tem certeza que deseja excluir o projeto "${project.name}" do Supabase?\n\nEsta ação não pode ser desfeita.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            await deleteProjectFromSupabase(project.id);
            handleSuccess(`Projeto "${project.name}" excluído do Supabase com sucesso!`);
            onProjectUpdated?.();
        } catch (error) {
            handleError(error, 'Excluir do Supabase');
        } finally {
            setIsDeleting(false);
        }
    };

    if (!supabaseAvailable) {
        return (
            <Card className="border-yellow-500/30 bg-yellow-500/10">
                <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                            <span>💾 Supabase</span>
                        </h3>
                        <Badge variant="warning">Não Configurado</Badge>
                    </div>
                    <p className="text-sm text-text-secondary mb-4">
                        Configure as variáveis de ambiente <code className="bg-black/30 px-1 rounded">VITE_SUPABASE_URL</code> e <code className="bg-black/30 px-1 rounded">VITE_SUPABASE_ANON_KEY</code> no Vercel para habilitar o armazenamento na nuvem.
                    </p>
                    <p className="text-xs text-text-secondary">
                        📊 Projeto atual: <strong>{project.tasks.length} tarefas</strong> - Armazenado localmente (IndexedDB)
                    </p>
                </div>
            </Card>
        );
    }

    return (
        <Card className="border-green-500/30 bg-green-500/10">
            <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                        <span>💾 Supabase</span>
                    </h3>
                    <Badge variant="success">Configurado</Badge>
                </div>
                
                <div className="mb-4">
                    <p className="text-sm text-text-secondary mb-2">
                        Armazenamento na nuvem ativo. Seus projetos são salvos automaticamente no Supabase.
                    </p>
                    <div className="text-xs text-text-secondary space-y-1">
                        <p>📊 <strong>{project.tasks.length}</strong> tarefas no projeto</p>
                        <p>💾 Dados sincronizados com Supabase</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                    <button
                        onClick={handleSaveToSupabase}
                        disabled={isSaving || isDeleting}
                        className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Salvando...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                    <polyline points="7 3 7 8 15 8"></polyline>
                                </svg>
                                Salvar no Banco de Dados
                            </>
                        )}
                    </button>
                    <button
                        onClick={handleDeleteFromSupabase}
                        disabled={isSaving || isDeleting}
                        className="btn btn-danger flex-1 flex items-center justify-center gap-2"
                    >
                        {isDeleting ? (
                            <>
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Excluindo...
                            </>
                        ) : (
                            <>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                                Excluir do Banco de Dados
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Card>
    );
};

