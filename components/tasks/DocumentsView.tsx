import React, { useState, useMemo } from 'react';
import { Project, Document } from '../types';
import { Button } from './common/Button';
import { 
    Plus, Search, FileText, Eye, Zap, List, FileCode, Upload, 
    ClipboardList, FlaskConical, Layers, File, Pencil, Copy, Trash 
} from 'lucide-react';

export const DocumentsView: React.FC<{ 
    project: Project, 
    onUpdateProject: (project: Project) => void 
}> = ({ project, onUpdateProject }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('Todas');

    // Categorias de documentos para os cards de estatísticas
    const stats = useMemo(() => {
        const docs = project.documents || [];
        return {
            total: docs.length,
            requisitos: docs.filter(d => d.type === 'Requisitos' || d.name.toLowerCase().includes('requisitos')).length,
            testes: docs.filter(d => d.type === 'Testes' || d.name.toLowerCase().includes('testes')).length,
            arquitetura: docs.filter(d => d.type === 'Arquitetura' || d.name.toLowerCase().includes('arquitetura')).length,
            outros: docs.filter(d => !['Requisitos', 'Testes', 'Arquitetura'].includes(d.type || '') && 
                                     !d.name.toLowerCase().includes('requisitos') && 
                                     !d.name.toLowerCase().includes('testes') && 
                                     !d.name.toLowerCase().includes('arquitetura')).length
        };
    }, [project.documents]);

    const filteredDocuments = useMemo(() => {
        let docs = project.documents || [];
        
        // Filtro de busca
        if (searchQuery) {
            docs = docs.filter(doc => doc.name.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        // Filtro de categoria
        if (activeFilter !== 'Todas') {
            if (activeFilter === 'Requisitos') {
                docs = docs.filter(d => d.type === 'Requisitos' || d.name.toLowerCase().includes('requisitos'));
            } else if (activeFilter === 'Testes') {
                docs = docs.filter(d => d.type === 'Testes' || d.name.toLowerCase().includes('testes'));
            } else if (activeFilter === 'Arquitetura') {
                docs = docs.filter(d => d.type === 'Arquitetura' || d.name.toLowerCase().includes('arquitetura'));
            } else if (activeFilter === 'Outros') {
                docs = docs.filter(d => !['Requisitos', 'Testes', 'Arquitetura'].includes(d.type || '') && 
                                        !d.name.toLowerCase().includes('requisitos') && 
                                        !d.name.toLowerCase().includes('testes') && 
                                        !d.name.toLowerCase().includes('arquitetura'));
            }
        }

        return docs;
    }, [project.documents, searchQuery, activeFilter]);

    const formatFileSize = (bytes?: number) => {
        if (!bytes) return 'Tamanho desconhecido';
        return (bytes / 1024).toFixed(1) + ' KB';
    };

    return (
        <section className="w-full max-w-full bg-base-100 text-base-content rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:ring-offset-0 border border-base-200 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-base-300/30 hover:border-primary/20 p-5 border-base-300">
            {/* Cabeçalho da Seção */}
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-shrink-0">
                        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Documentos do Projeto</h3>
                        <p className="text-base-content/70 text-sm max-w-2xl">
                            Gerencie e analise documentos do projeto. {project.documents?.length || 0} documento(s).
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button variant="outline" size="sm" className="rounded-full flex items-center gap-1.5">
                            <List className="w-4 h-4" />
                            <span>Lista</span>
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-full whitespace-nowrap flex items-center gap-1.5">
                            <FileCode className="w-4 h-4" />
                            <span>Esquema API</span>
                        </Button>
                        <div className="w-px h-5 bg-base-300 flex-shrink-0"></div>
                        <Button variant="outline" size="sm" className="rounded-full flex items-center gap-1.5">
                            <Upload className="w-4 h-4" />
                            <span>Importar</span>
                        </Button>
                        <label className="btn btn-primary btn-sm rounded-full cursor-pointer flex items-center gap-1.5 font-semibold shadow-sm transition-all active:scale-95">
                            <Plus className="w-4 h-4" />
                            <span>Carregar</span>
                            <input 
                                accept=".txt,.md,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.json,.csv,.xml,.jpg,.jpeg,.png,.gif,.webp,.svg" 
                                className="hidden" 
                                type="file" 
                            />
                        </label>
                    </div>
                </div>
            </div>

            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="p-5 bg-base-100 border border-base-300 rounded-xl text-center hover:border-primary/40 transition-all duration-300 hover:shadow-lg relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="text-3xl font-bold text-primary mb-1">{stats.requisitos}</div>
                        <div className="text-xs font-medium text-base-content/70 uppercase tracking-wider flex items-center justify-center gap-1">
                            <ClipboardList className="w-3 h-3" /> Requisitos
                        </div>
                    </div>
                </div>
                <div className="p-5 bg-base-100 border border-base-300 rounded-xl text-center hover:border-primary/40 transition-all duration-300 hover:shadow-lg relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="text-3xl font-bold text-primary mb-1">{stats.testes}</div>
                        <div className="text-xs font-medium text-base-content/70 uppercase tracking-wider flex items-center justify-center gap-1">
                            <FlaskConical className="w-3 h-3" /> Testes
                        </div>
                    </div>
                </div>
                <div className="p-5 bg-base-100 border border-base-300 rounded-xl text-center hover:border-primary/40 transition-all duration-300 hover:shadow-lg relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="text-3xl font-bold text-primary mb-1">{stats.arquitetura}</div>
                        <div className="text-xs font-medium text-base-content/70 uppercase tracking-wider flex items-center justify-center gap-1">
                            <Layers className="w-3 h-3" /> Arquitetura
                        </div>
                    </div>
                </div>
                <div className="p-5 bg-base-100 border border-base-300 rounded-xl text-center hover:border-primary/40 transition-all duration-300 hover:shadow-lg relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    <div className="relative z-10">
                        <div className="text-3xl font-bold text-primary mb-1">{stats.outros}</div>
                        <div className="text-xs font-medium text-base-content/70 uppercase tracking-wider flex items-center justify-center gap-1">
                            <File className="w-3 h-3" /> Outros
                        </div>
                    </div>
                </div>
            </div>

            {/* Barra de Busca e Filtros */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50 w-4 h-4" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="🔍 Buscar documentos..."
                        className="input input-bordered w-full pl-9 bg-base-100 border-base-300 text-base-content placeholder:text-base-content/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary rounded-xl"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    {['Todas', 'Requisitos', 'Testes', 'Arquitetura', 'Outros'].map(filter => (
                        <button
                            key={filter}
                            type="button"
                            onClick={() => setActiveFilter(filter)}
                            className={`btn btn-sm rounded-full transition-colors ${
                                activeFilter === filter ? 'btn-primary' : 'btn-outline'
                            }`}
                        >
                            {filter} ({
                                filter === 'Todas' ? stats.total :
                                filter === 'Requisitos' ? stats.requisitos :
                                filter === 'Testes' ? stats.testes :
                                filter === 'Arquitetura' ? stats.arquitetura :
                                stats.outros
                            })
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid de Documentos */}
            {filteredDocuments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredDocuments.map(doc => (
                        <div key={doc.id} className="p-5 bg-base-100 border border-base-300 rounded-xl hover:border-primary/40 transition-all duration-300 hover:shadow-lg relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                            <div className="relative z-10">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-base-content font-semibold truncate mb-2" title={doc.name}>{doc.name}</h4>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="badge whitespace-nowrap truncate badge-info badge-sm">
                                                {doc.type || 'Documento'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-xs text-base-content/70 mb-3 space-y-1">
                                    <div>📏 {formatFileSize(doc.size)}</div>
                                    {/* Placeholder para linhas, se disponível no futuro */}
                                    {/* <div>📄 223 linhas</div> */}
                                </div>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    <button type="button" className="btn btn-outline btn-xs rounded-full" aria-label="Visualizar">
                                        <Eye className="w-3 h-3" /> Ver
                                    </button>
                                    <button type="button" className="btn btn-outline btn-xs rounded-full" aria-label="Preview">
                                        <FileText className="w-3 h-3" /> Preview
                                    </button>
                                    <button type="button" className="btn btn-outline btn-xs rounded-full bg-info/10 border-info/30 hover:bg-info/20" aria-label="Analisar com IA">
                                        <Zap className="w-3 h-3" /> Analisar
                                    </button>
                                    <button type="button" className="btn btn-outline btn-xs rounded-full" aria-label="Editar">
                                        <Pencil className="w-3 h-3" /> Editar
                                    </button>
                                    <button className="btn btn-outline btn-xs rounded-full" title="Copiar">
                                        <Copy className="w-3 h-3" />
                                    </button>
                                    <button type="button" className="btn btn-outline btn-xs rounded-full hover:bg-error/10 hover:border-error/30 text-error" aria-label="Excluir">
                                        <Trash className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 border-2 border-dashed border-base-300 rounded-xl">
                    <FileText className="mx-auto h-12 w-12 text-base-content/30" />
                    <h3 className="mt-4 text-lg font-medium text-base-content">Nenhum documento encontrado</h3>
                    <p className="mt-1 text-sm text-base-content/70">Comece carregando o primeiro documento do seu projeto.</p>
                    <div className="mt-6">
                        <label className="btn btn-primary btn-sm rounded-full cursor-pointer flex items-center gap-1.5 font-semibold shadow-sm transition-all active:scale-95 inline-flex">
                            <Plus className="w-4 h-4" />
                            <span>Carregar Documento</span>
                            <input 
                                accept=".txt,.md,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.json,.csv,.xml,.jpg,.jpeg,.png,.gif,.webp,.svg" 
                                className="hidden" 
                                type="file" 
                            />
                        </label>
                    </div>
                </div>
            )}
        </section>
    );
};