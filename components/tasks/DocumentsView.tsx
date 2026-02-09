import React, { useState, useMemo } from 'react';
import { Project, Document } from '../types';
import { Button } from './common/Button';
import { Plus, Search, FileText, Eye, Zap } from 'lucide-react';

export const DocumentsView: React.FC<{ 
    project: Project, 
    onUpdateProject: (project: Project) => void 
}> = ({ project, onUpdateProject }) => {
    const [searchQuery, setSearchQuery] = useState('');

    const filteredDocuments = useMemo(() => 
        project.documents?.filter(doc => 
            doc.name.toLowerCase().includes(searchQuery.toLowerCase())
        ) || [],
    [project.documents, searchQuery]);

    return (
        <div className="bg-base-100 rounded-2xl shadow-sm border border-base-300 p-6">
            {/* Cabeçalho da Seção */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div className="flex-shrink-0">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-800">Documentos do Projeto</h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Gerencie, analise e visualize os documentos de requisitos.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="primary"
                        size="sm"
                        className="rounded-full flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Carregar Documento</span>
                    </Button>
                </div>
            </div>

            {/* Barra de Busca */}
            <div className="mb-8">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                    <input
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Buscar documentos pelo nome..."
                        className="input input-bordered w-full pl-11 pr-4 py-3 h-auto min-h-[48px] bg-base-100 border-base-300 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all rounded-xl shadow-sm"
                    />
                </div>
            </div>

            {/* Grid de Documentos */}
            {filteredDocuments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDocuments.map(doc => (
                        <div key={doc.id} className="bg-base-100 border border-base-200 rounded-xl p-4 transition-all duration-300 hover:shadow-md hover:border-primary/30">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-primary/10 rounded-lg flex-shrink-0">
                                    <FileText className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-slate-700 line-clamp-2 text-balance">{doc.name}</h3>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {doc.type} - {doc.size ? (doc.size / 1024).toFixed(2) + ' KB' : 'Tamanho desconhecido'}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-base-200 flex flex-wrap items-center justify-end gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full flex items-center gap-1.5 hover:bg-base-200 active:scale-95 transition-all"
                                >
                                    <Zap className="w-3.5 h-3.5" />
                                    Analisar
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded-full flex items-center gap-1.5 hover:bg-base-200 active:scale-95 transition-all"
                                >
                                    <Eye className="w-3.5 h-3.5" />
                                    Ver
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed border-base-300 rounded-xl">
                    <FileText className="mx-auto h-12 w-12 text-slate-400" />
                    <h3 className="mt-4 text-lg font-medium text-slate-800">Nenhum documento encontrado</h3>
                    <p className="mt-1 text-sm text-slate-500">Comece carregando o primeiro documento do seu projeto.</p>
                    <div className="mt-6">
                        <Button
                            variant="primary"
                            size="sm"
                            className="rounded-full flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Carregar Documento</span>
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};