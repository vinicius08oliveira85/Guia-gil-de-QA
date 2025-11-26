import React, { useState, useMemo } from 'react';
import { Project, ProjectDocument, JiraTask, TestStrategy, TestCase } from '../types';
import { analyzeDocumentContent, generateTaskFromDocument } from '../services/geminiService';
import { Card } from './common/Card';
import { Modal } from './common/Modal';
import { Spinner } from './common/Spinner';
import { TrashIcon } from './common/Icons';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { sanitizeHTML } from '../utils/sanitize';
import { MAX_FILE_SIZE, ALLOWED_FILE_TYPES } from '../utils/constants';
import { Badge } from './common/Badge';
import { EmptyState } from './common/EmptyState';
import { Tooltip } from './common/Tooltip';
import { CopyButton } from './common/CopyButton';
import { createDocumentFromFile, convertDocumentFileToProjectDocument, formatFileSize, getFileIcon, canPreview } from '../utils/documentService';
import { SolusSchemaModal } from './solus/SolusSchemaModal';

interface DocumentWithMetadata extends ProjectDocument {
    uploadedAt?: string;
    category?: 'requisitos' | 'testes' | 'arquitetura' | 'outros';
    tags?: string[];
    size?: number;
}

const DOCUMENT_CATEGORIES = [
    { id: 'requisitos', label: '📋 Requisitos', color: 'blue' },
    { id: 'testes', label: '🧪 Testes', color: 'green' },
    { id: 'arquitetura', label: '🏗️ Arquitetura', color: 'purple' },
    { id: 'outros', label: '📄 Outros', color: 'gray' }
] as const;

export const DocumentsView: React.FC<{ project: Project; onUpdateProject: (project: Project) => void; }> = ({ project, onUpdateProject }) => {
    const [analysisResult, setAnalysisResult] = useState<{ name: string; content: string } | null>(null);
    const [loadingStates, setLoadingStates] = useState<{ [docName: string]: 'analyze' | 'generate' | null }>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
    const [selectedDoc, setSelectedDoc] = useState<DocumentWithMetadata | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [showPreview, setShowPreview] = useState(false);
    const [editingDoc, setEditingDoc] = useState<DocumentWithMetadata | null>(null);
    const [isSolusSchemaOpen, setIsSolusSchemaOpen] = useState(false);
    const { handleError, handleSuccess, handleWarning } = useErrorHandler();
    const normalizedProjectName = useMemo(
        () =>
            project.name
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase(),
        [project.name]
    );
    const shouldShowSolusButton = normalizedProjectName.includes('gestao de pacientes internados');

    // Converter documentos para incluir metadados
    const documentsWithMetadata = useMemo<DocumentWithMetadata[]>(() => {
        return project.documents.map(doc => {
            const size = new Blob([doc.content]).size;
            const category = detectCategory(doc.name, doc.content);
            return {
                ...doc,
                uploadedAt: new Date().toISOString(), // Em produção, salvaria a data real
                category,
                size,
                tags: extractTags(doc.content)
            };
        });
    }, [project.documents]);

    // Filtrar documentos
    const filteredDocuments = useMemo(() => {
        let filtered = documentsWithMetadata;

        // Filtro por categoria
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(doc => doc.category === selectedCategory);
        }

        // Filtro por busca
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(doc => 
                doc.name.toLowerCase().includes(query) ||
                doc.content.toLowerCase().includes(query) ||
                doc.tags?.some(tag => tag.toLowerCase().includes(query))
            );
        }

        return filtered;
    }, [documentsWithMetadata, selectedCategory, searchQuery]);

    // Estatísticas
    const stats = useMemo(() => {
        const totalSize = documentsWithMetadata.reduce((sum, doc) => sum + (doc.size || 0), 0);
        const categoryCounts = documentsWithMetadata.reduce((acc, doc) => {
            acc[doc.category || 'outros'] = (acc[doc.category || 'outros'] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            total: documentsWithMetadata.length,
            totalSize,
            categoryCounts,
            avgSize: documentsWithMetadata.length > 0 ? totalSize / documentsWithMetadata.length : 0
        };
    }, [documentsWithMetadata]);

    function detectCategory(name: string, content: string): DocumentWithMetadata['category'] {
        const lowerName = name.toLowerCase();
        const lowerContent = content.toLowerCase();
        
        if (lowerName.includes('requisito') || lowerName.includes('requirement') || 
            lowerContent.includes('requisito') || lowerContent.includes('requirement')) {
            return 'requisitos';
        }
        if (lowerName.includes('teste') || lowerName.includes('test') || 
            lowerContent.includes('caso de teste') || lowerContent.includes('test case')) {
            return 'testes';
        }
        if (lowerName.includes('arquitetura') || lowerName.includes('architecture') || 
            lowerContent.includes('arquitetura') || lowerContent.includes('architecture')) {
            return 'arquitetura';
        }
        return 'outros';
    }

    function extractTags(content: string): string[] {
        const tags: string[] = [];
        const lines = content.split('\n');
        
        lines.forEach(line => {
            if (line.includes('#') || line.includes('tag:')) {
                const tagMatches = line.match(/#(\w+)/g) || line.match(/tag:\s*(\w+)/gi);
                if (tagMatches) {
                    tagMatches.forEach(match => {
                        const tag = match.replace(/[#tag:\s]/gi, '').trim();
                        if (tag) tags.push(tag);
                    });
                }
            }
        });

        return [...new Set(tags)];
    }

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validar tamanho (aumentado para 50MB)
        const maxSize = 50 * 1024 * 1024; // 50MB
        if (file.size > maxSize) {
            handleWarning(`Arquivo muito grande. Tamanho máximo: ${maxSize / 1024 / 1024}MB`);
            event.target.value = '';
            return;
        }

        try {
            // Criar documento do arquivo
            const docFile = await createDocumentFromFile(file);
            const newDocument = convertDocumentFileToProjectDocument(docFile);
            
                onUpdateProject({
                    ...project,
                    documents: [...project.documents, newDocument]
                });
            handleSuccess(`Documento "${file.name}" carregado com sucesso!`);
        } catch (error) {
            handleError(error instanceof Error ? error : new Error('Erro ao processar arquivo'), 'Upload de documento');
        } finally {
            event.target.value = '';
        }
    };

    const handleAnalyze = async (doc: ProjectDocument) => {
        setLoadingStates(prev => ({ ...prev, [doc.name]: 'analyze' }));
        try {
            const analysis = await analyzeDocumentContent(doc.content);
            const sanitizedAnalysis = sanitizeHTML(analysis);
            
            // Salvar análise no documento
            const updatedDocuments = project.documents.map(d => 
                d.name === doc.name ? { ...d, analysis: sanitizedAnalysis } : d
            );
            onUpdateProject({ ...project, documents: updatedDocuments });
            
            setAnalysisResult({ name: doc.name, content: sanitizedAnalysis });
            handleSuccess('Documento analisado com sucesso!');
        } catch (error) {
            handleError(error, 'Analisar documento');
        } finally {
            setLoadingStates(prev => ({ ...prev, [doc.name]: null }));
        }
    };
    
    const handleGenerateTask = async (doc: ProjectDocument) => {
        setLoadingStates(prev => ({ ...prev, [doc.name]: 'generate' }));
        try {
            const { task, strategy, testCases } = await generateTaskFromDocument(doc.content);
            const newTask: JiraTask = {
                ...task,
                id: `DOC-${doc.name.substring(0, 5)}-${Date.now().toString().slice(-4)}`,
                status: 'To Do',
                testCases: testCases,
                testStrategy: strategy,
                bddScenarios: [],
            };
            onUpdateProject({ ...project, tasks: [...project.tasks, newTask] });
            handleSuccess(`Tarefa "${newTask.id}" criada com sucesso a partir do documento!`);
        } catch (error) {
            handleError(error, 'Gerar tarefa do documento');
        } finally {
            setLoadingStates(prev => ({ ...prev, [doc.name]: null }));
        }
    };

    const handleDelete = (docName: string) => {
        onUpdateProject({
            ...project,
            documents: project.documents.filter(d => d.name !== docName)
        });
        handleSuccess('Documento removido com sucesso!');
    };

    const handleEdit = (doc: DocumentWithMetadata) => {
        setEditingDoc(doc);
    };

    const handleSaveEdit = () => {
        if (!editingDoc) return;
        
        const updatedDocuments = project.documents.map(d => 
            d.name === editingDoc.name 
                ? { ...d, name: editingDoc.name, content: editingDoc.content }
                : d
        );
        onUpdateProject({ ...project, documents: updatedDocuments });
        setEditingDoc(null);
        handleSuccess('Documento atualizado com sucesso!');
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const getPreviewContent = (doc: DocumentWithMetadata): string => {
        const lines = doc.content.split('\n');
        return lines.slice(0, 10).join('\n') + (lines.length > 10 ? '\n...' : '');
    };

    return (
        <div className="space-y-6">
        <Card>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-text-primary mb-2">Documentos do Projeto</h3>
                        <p className="text-text-secondary text-sm">
                            {stats.total} documento{stats.total !== 1 ? 's' : ''} • {formatFileSize(stats.totalSize)}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                            className="btn btn-secondary"
                        >
                            {viewMode === 'grid' ? '📋 Lista' : '🔲 Grade'}
                        </button>
                        {shouldShowSolusButton && (
                            <button
                                onClick={() => setIsSolusSchemaOpen(true)}
                                className="btn btn-secondary whitespace-nowrap"
                                aria-label="Abrir Esquema da API Solus"
                            >
                                📚 Esquema API Solus
                            </button>
                        )}
                <label className="btn btn-primary cursor-pointer">
                            📤 Carregar Documento
                            <input 
                                type="file" 
                                accept=".txt,.md,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.json,.csv,.xml,.jpg,.jpeg,.png,.gif,.webp,.svg" 
                                onChange={handleFileUpload} 
                                className="hidden" 
                            />
                </label>
            </div>
                </div>

                {/* Estatísticas */}
                {stats.total > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        {DOCUMENT_CATEGORIES.map(cat => (
                            <div key={cat.id} className="p-3 bg-surface border border-surface-border rounded-lg text-center">
                                <div className="text-2xl font-bold text-accent">
                                    {stats.categoryCounts[cat.id] || 0}
                                </div>
                                <div className="text-xs text-text-secondary">{cat.label}</div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filtros e Busca */}
                {stats.total > 0 && (
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="🔍 Buscar documentos..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full px-4 py-2 bg-surface border border-surface-border rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    selectedCategory === 'all'
                                        ? 'bg-accent text-white'
                                        : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover'
                                }`}
                            >
                                Todas ({stats.total})
                            </button>
                            {DOCUMENT_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        selectedCategory === cat.id
                                            ? 'bg-accent text-white'
                                            : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover'
                                    }`}
                                >
                                    {cat.label} ({stats.categoryCounts[cat.id] || 0})
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Lista de Documentos */}
                {filteredDocuments.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredDocuments.map(doc => {
                                const category = DOCUMENT_CATEGORIES.find(c => c.id === doc.category);
                                const hasAnalysis = !!doc.analysis;
                                
                                return (
                                    <div
                                        key={doc.name}
                                        className="p-4 bg-surface border border-surface-border rounded-lg hover:border-accent transition-all hover:shadow-lg"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-text-primary font-semibold truncate mb-1" title={doc.name}>
                                                    {doc.name}
                                                </h4>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {category && (
                                                        <Badge variant="info" size="sm">
                                                            {category.label}
                                                        </Badge>
                                                    )}
                                                    {hasAnalysis && (
                                                        <Badge variant="success" size="sm">
                                                            ✓ Analisado
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="text-xs text-text-secondary mb-3 space-y-1">
                                            <div>📏 {formatFileSize(doc.size || 0)}</div>
                                            {doc.content && !doc.content.startsWith('data:') && (
                                                <div>📄 {doc.content.split('\n').length} linhas</div>
                                            )}
                                            {doc.content && doc.content.startsWith('data:image/') && (
                                                <div>🖼️ Imagem</div>
                                            )}
                                            {doc.content && doc.content.startsWith('data:application/') && (
                                                <div>📎 Arquivo binário</div>
                                            )}
                                            {doc.tags && doc.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {doc.tags.slice(0, 3).map((tag, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 bg-accent/20 text-accent text-xs rounded">
                                                            #{tag}
                                                        </span>
                                                    ))}
                                                    {doc.tags.length > 3 && (
                                                        <span className="text-text-secondary">+{doc.tags.length - 3}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap gap-2 mt-4">
                                            <Tooltip content="Visualizar conteúdo">
                                                <button
                                                    onClick={() => {
                                                        setSelectedDoc(doc);
                                                        setShowPreview(true);
                                                    }}
                                                    className="btn btn-secondary text-xs !py-1 !px-2"
                                                >
                                                    👁️ Ver
                                                </button>
                                            </Tooltip>
                                            <Tooltip content="Analisar com IA">
                                                <button
                                                    onClick={() => handleAnalyze(doc)}
                                                    disabled={!!loadingStates[doc.name]}
                                                    className="btn btn-secondary text-xs !py-1 !px-2 bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/40"
                                                >
                                                    {loadingStates[doc.name] === 'analyze' ? <Spinner small/> : '🤖 Analisar'}
                                                </button>
                                            </Tooltip>
                                            <Tooltip content="Gerar tarefa">
                                                <button
                                                    onClick={() => handleGenerateTask(doc)}
                                                    disabled={!!loadingStates[doc.name]}
                                                    className="btn btn-secondary text-xs !py-1 !px-2 bg-purple-500/20 border-purple-500/30 hover:bg-purple-500/40"
                                                >
                                                    {loadingStates[doc.name] === 'generate' ? <Spinner small/> : '📝 Gerar'}
                                                </button>
                                            </Tooltip>
                                            <Tooltip content="Editar">
                                                <button
                                                    onClick={() => handleEdit(doc)}
                                                    className="btn btn-secondary text-xs !py-1 !px-2"
                                                >
                                                    ✏️ Editar
                                                </button>
                                            </Tooltip>
                                            <Tooltip content="Copiar conteúdo">
                                                <CopyButton text={doc.content} />
                                            </Tooltip>
                                            <Tooltip content="Excluir">
                                                <button
                                                    onClick={() => handleDelete(doc.name)}
                                                    className="btn btn-secondary text-xs !py-1 !px-2 hover:bg-red-500/20 hover:border-red-500/30"
                                                >
                                                    🗑️
                                                </button>
                                            </Tooltip>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                <ul className="space-y-3">
                            {filteredDocuments.map(doc => {
                                const category = DOCUMENT_CATEGORIES.find(c => c.id === doc.category);
                                const hasAnalysis = !!doc.analysis;
                                
                                return (
                                    <li
                                        key={doc.name}
                                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-surface border border-surface-border p-4 rounded-lg hover:border-accent transition-all gap-4"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="text-text-primary font-semibold truncate" title={doc.name}>
                                                    {doc.name}
                                                </h4>
                                                {category && (
                                                    <Badge variant="info" size="sm">
                                                        {category.label}
                                                    </Badge>
                                                )}
                                                {hasAnalysis && (
                                                    <Badge variant="success" size="sm">
                                                        ✓ Analisado
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-text-secondary flex-wrap">
                                                <span>📏 {formatFileSize(doc.size || 0)}</span>
                                                <span>📄 {doc.content.split('\n').length} linhas</span>
                                                {doc.tags && doc.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-1">
                                                        {doc.tags.slice(0, 5).map((tag, idx) => (
                                                            <span key={idx} className="px-2 py-0.5 bg-accent/20 text-accent rounded">
                                                                #{tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <Tooltip content="Visualizar">
                                                <button
                                                    onClick={() => {
                                                        setSelectedDoc(doc);
                                                        setShowPreview(true);
                                                    }}
                                                    className="btn btn-secondary text-sm !py-1.5 !px-3"
                                                >
                                                    👁️ Ver
                                                </button>
                                            </Tooltip>
                                            <Tooltip content="Analisar">
                                                <button
                                                    onClick={() => handleAnalyze(doc)}
                                                    disabled={!!loadingStates[doc.name]}
                                                    className="btn btn-secondary text-sm !py-1.5 !px-3 bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/40"
                                                >
                                                    {loadingStates[doc.name] === 'analyze' ? <Spinner small/> : '🤖 Analisar'}
                                                </button>
                                            </Tooltip>
                                            <Tooltip content="Gerar Tarefa">
                                                <button
                                                    onClick={() => handleGenerateTask(doc)}
                                                    disabled={!!loadingStates[doc.name]}
                                                    className="btn btn-secondary text-sm !py-1.5 !px-3 bg-purple-500/20 border-purple-500/30 hover:bg-purple-500/40"
                                                >
                                                    {loadingStates[doc.name] === 'generate' ? <Spinner small/> : '📝 Gerar'}
                                                </button>
                                            </Tooltip>
                                            <Tooltip content="Editar">
                                                <button
                                                    onClick={() => handleEdit(doc)}
                                                    className="btn btn-secondary text-sm !py-1.5 !px-3"
                                                >
                                                    ✏️
                                </button>
                                            </Tooltip>
                                            <Tooltip content="Excluir">
                                                <button
                                                    onClick={() => handleDelete(doc.name)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/80 hover:text-white transition-colors text-text-secondary"
                                                >
                                                    <TrashIcon/>
                                </button>
                                            </Tooltip>
                            </div>
                        </li>
                                );
                            })}
                </ul>
                    )
                ) : (
                    <EmptyState
                        title={searchQuery || selectedCategory !== 'all' ? 'Nenhum documento encontrado' : 'Nenhum documento carregado'}
                        description={searchQuery || selectedCategory !== 'all' ? 'Tente ajustar os filtros de busca' : 'Comece carregando seu primeiro documento'}
                        icon="📄"
                    />
            )}
        </Card>

            {/* Modal de Preview */}
            {showPreview && selectedDoc && (
                <Modal
                    isOpen={showPreview}
                    onClose={() => {
                        setShowPreview(false);
                        setSelectedDoc(null);
                    }}
                    title={selectedDoc.name}
                >
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="info" size="sm">
                                {formatFileSize(selectedDoc.size || 0)}
                            </Badge>
                            <Badge variant="info" size="sm">
                                {selectedDoc.content.split('\n').length} linhas
                            </Badge>
                            {selectedDoc.category && (
                                <Badge variant="info" size="sm">
                                    {DOCUMENT_CATEGORIES.find(c => c.id === selectedDoc.category)?.label}
                                </Badge>
                            )}
                        </div>
                        <div className="bg-surface-hover p-4 rounded-lg max-h-96 overflow-y-auto">
                            {selectedDoc.content.startsWith('data:image/') ? (
                                <div className="space-y-4">
                                    <img 
                                        src={selectedDoc.content} 
                                        alt={selectedDoc.name}
                                        className="max-w-full h-auto rounded-lg border border-surface-border"
                                    />
                                    <div className="text-sm text-text-secondary">
                                        <p><strong>Nome:</strong> {selectedDoc.name}</p>
                                        <p><strong>Tamanho:</strong> {formatFileSize(selectedDoc.size || 0)}</p>
                                        <p><strong>Tipo:</strong> {selectedDoc.category || 'Não categorizado'}</p>
                                    </div>
                                </div>
                            ) : selectedDoc.content.startsWith('data:application/pdf') ? (
                                <div className="space-y-4">
                                    <iframe 
                                        src={selectedDoc.content} 
                                        className="w-full h-96 rounded-lg border border-surface-border"
                                        title={selectedDoc.name}
                                    />
                                    <div className="text-sm text-text-secondary">
                                        <p><strong>Nome:</strong> {selectedDoc.name}</p>
                                        <p><strong>Tamanho:</strong> {formatFileSize(selectedDoc.size || 0)}</p>
                                    </div>
                                </div>
                            ) : (
                                <pre className="text-sm text-text-primary whitespace-pre-wrap font-mono">
                                    {selectedDoc.content}
                                </pre>
                            )}
                        </div>
                        {selectedDoc.analysis && (
                            <div>
                                <h4 className="text-sm font-semibold text-text-secondary mb-2">Análise IA</h4>
                                <div className="prose max-w-none bg-surface-hover p-4 rounded-lg" dangerouslySetInnerHTML={{ __html: selectedDoc.analysis }} />
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* Modal de Análise */}
            {analysisResult && (
                <Modal
                    isOpen={!!analysisResult}
                    onClose={() => setAnalysisResult(null)}
                    title={`Análise de ${analysisResult.name}`}
                >
                    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: analysisResult.content }} />
                </Modal>
            )}

            {/* Modal de Edição */}
            {editingDoc && (
                <Modal
                    isOpen={!!editingDoc}
                    onClose={() => setEditingDoc(null)}
                    title={`Editar: ${editingDoc.name}`}
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-text-secondary mb-2">
                                Nome do Documento
                            </label>
                            <input
                                type="text"
                                value={editingDoc.name}
                                onChange={(e) => setEditingDoc({ ...editingDoc, name: e.target.value })}
                                className="w-full px-4 py-2 bg-surface border border-surface-border rounded-lg text-text-primary focus:outline-none focus:border-accent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-text-secondary mb-2">
                                Conteúdo
                            </label>
                            <textarea
                                value={editingDoc.content}
                                onChange={(e) => setEditingDoc({ ...editingDoc, content: e.target.value })}
                                rows={15}
                                className="w-full px-4 py-2 bg-surface border border-surface-border rounded-lg text-text-primary font-mono text-sm focus:outline-none focus:border-accent"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setEditingDoc(null)}
                                className="btn btn-secondary"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="btn btn-primary"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {shouldShowSolusButton && (
                <SolusSchemaModal
                    isOpen={isSolusSchemaOpen}
                    onClose={() => setIsSolusSchemaOpen(false)}
                />
            )}
        </div>
    );
};
