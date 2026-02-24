import React, { useState, useMemo } from 'react';
import { Project, ProjectDocument } from '../types';
import type { JiraTask } from '../types';
import { analyzeDocumentContent, generateTaskFromDocument } from '../services/geminiService';
import { Modal } from './common/Modal';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { sanitizeHTML } from '../utils/sanitize';
import { Badge } from './common/Badge';
import { EmptyState } from './common/EmptyState';
import {
  createDocumentFromFile,
  convertDocumentFileToProjectDocument,
} from '../utils/documentService';
import { SolusSchemaModal } from './solus/SolusSchemaModal';
import { SpecificationDocumentProcessor } from './settings/SpecificationDocumentProcessor';
import { FileImportModal } from './common/FileImportModal';
import { FileViewer } from './common/FileViewer';
import { viewFileInNewTab } from '../services/fileViewerService';
import { DocumentStatsCards } from './documents/DocumentStatsCards';
import { DocumentCard } from './documents/DocumentCard';
import { Search, Upload, FileDown } from 'lucide-react';

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
  { id: 'outros', label: '📄 Outros', color: 'gray' },
] as const;

export const DocumentsView: React.FC<{
  project: Project;
  onUpdateProject: (project: Project) => void;
}> = ({ project, onUpdateProject }) => {
  const [analysisResult, setAnalysisResult] = useState<{ name: string; content: string } | null>(
    null
  );
  const [loadingStates, setLoadingStates] = useState<{
    [docName: string]: 'analyze' | 'generate' | null;
  }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [selectedDoc, setSelectedDoc] = useState<DocumentWithMetadata | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentWithMetadata | null>(null);
  const [isSolusSchemaOpen, setIsSolusSchemaOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<DocumentWithMetadata | null>(null);
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
        tags: extractTags(doc.content),
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
      filtered = filtered.filter(
        doc =>
          (doc.name || '').toLowerCase().includes(query) ||
          (doc.content || '').toLowerCase().includes(query) ||
          doc.tags?.some(tag => (tag || '').toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [documentsWithMetadata, selectedCategory, searchQuery]);

  // Estatísticas
  const stats = useMemo(() => {
    const totalSize = documentsWithMetadata.reduce((sum, doc) => sum + (doc.size || 0), 0);
    const categoryCounts = documentsWithMetadata.reduce(
      (acc, doc) => {
        acc[doc.category || 'outros'] = (acc[doc.category || 'outros'] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      total: documentsWithMetadata.length,
      totalSize,
      categoryCounts,
      avgSize: documentsWithMetadata.length > 0 ? totalSize / documentsWithMetadata.length : 0,
    };
  }, [documentsWithMetadata]);

  function detectCategory(name: string, content: string): DocumentWithMetadata['category'] {
    const lowerName = name.toLowerCase();
    const lowerContent = content.toLowerCase();

    if (
      lowerName.includes('requisito') ||
      lowerName.includes('requirement') ||
      lowerContent.includes('requisito') ||
      lowerContent.includes('requirement')
    ) {
      return 'requisitos';
    }
    if (
      lowerName.includes('teste') ||
      lowerName.includes('test') ||
      lowerContent.includes('caso de teste') ||
      lowerContent.includes('test case')
    ) {
      return 'testes';
    }
    if (
      lowerName.includes('arquitetura') ||
      lowerName.includes('architecture') ||
      lowerContent.includes('arquitetura') ||
      lowerContent.includes('architecture')
    ) {
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
        documents: [...project.documents, newDocument],
      });
      handleSuccess(`Documento "${file.name}" carregado com sucesso!`);
    } catch (error) {
      handleError(
        error instanceof Error ? error : new Error('Erro ao processar arquivo'),
        'Upload de documento'
      );
    } finally {
      event.target.value = '';
    }
  };

  const handleAnalyze = async (doc: ProjectDocument) => {
    setLoadingStates(prev => ({ ...prev, [doc.name]: 'analyze' }));
    try {
      const analysis = await analyzeDocumentContent(doc.content, project);
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
      const { task, strategy, testCases } = await generateTaskFromDocument(doc.content, project);
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
      documents: project.documents.filter(d => d.name !== docName),
    });
    handleSuccess('Documento removido com sucesso!');
  };

  const handleImportDocument = (document: ProjectDocument) => {
    onUpdateProject({
      ...project,
      documents: [...project.documents, document],
    });
  };

  const handleViewDocument = (doc: DocumentWithMetadata) => {
    try {
      // Detectar tipo MIME baseado no nome do arquivo
      const fileName = doc.name.toLowerCase();
      let mimeType = 'text/plain';

      if (fileName.endsWith('.pdf')) mimeType = 'application/pdf';
      else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) mimeType = 'image/jpeg';
      else if (fileName.endsWith('.png')) mimeType = 'image/png';
      else if (fileName.endsWith('.gif')) mimeType = 'image/gif';
      else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls'))
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      else if (fileName.endsWith('.docx') || fileName.endsWith('.doc'))
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (fileName.endsWith('.csv')) mimeType = 'text/csv';
      else if (fileName.endsWith('.json')) mimeType = 'application/json';
      else if (doc.content.startsWith('data:')) {
        // Extrair MIME type de data URL
        const match = doc.content.match(/^data:([^;]+)/);
        if (match) mimeType = match[1];
      }

      // Se for data URL, usar diretamente, senão converter para blob
      if (doc.content.startsWith('data:')) {
        viewFileInNewTab(doc.content, doc.name, mimeType, { openInNewTab: true });
      } else {
        const blob = new Blob([doc.content], { type: mimeType });
        viewFileInNewTab(blob, doc.name, mimeType, { openInNewTab: true });
      }
    } catch (error) {
      handleError(error, 'Visualizar documento');
    }
  };

  const handleEdit = (doc: DocumentWithMetadata) => {
    setEditingDoc(doc);
  };

  const handleSaveEdit = () => {
    if (!editingDoc) return;

    const updatedDocuments = project.documents.map(d =>
      d.name === editingDoc.name ? { ...d, name: editingDoc.name, content: editingDoc.content } : d
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

  return (
    <div className="space-y-6">
      {/* Documento de Especificação */}
      <SpecificationDocumentProcessor project={project} onUpdateProject={onUpdateProject} />

      <section className="space-y-6" aria-labelledby="documents-section-heading">
        <div className="flex flex-col gap-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2
                id="documents-section-heading"
                className="text-2xl md:text-3xl font-bold tracking-tight text-base-content"
              >
                Documentos do Projeto
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                Gerencie e analise documentos do projeto.{' '}
                <span className="font-medium">
                  {stats.total} documento{stats.total !== 1 ? 's' : ''} •{' '}
                  {formatFileSize(stats.totalSize)}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {shouldShowSolusButton && (
                <button
                  type="button"
                  onClick={() => setIsSolusSchemaOpen(true)}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold text-base-content/70 hover:bg-base-200 hover:text-base-content transition-colors duration-300 flex items-center gap-1.5"
                  aria-label="Abrir Esquema da API Solus"
                >
                  <FileDown className="w-3.5 h-3.5" aria-hidden /> Esquema API
                </button>
              )}
              <label className="rounded-full px-3 py-1.5 text-xs font-semibold bg-primary text-primary-content hover:bg-primary/90 transition-colors duration-300 flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-3.5 h-3.5" aria-hidden /> Carregar
                <input
                  type="file"
                  accept=".txt,.md,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.json,.csv,.xml,.jpg,.jpeg,.png,.gif,.webp,.svg"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
        <DocumentStatsCards categoryCounts={stats.categoryCounts} />
        {stats.total > 0 && (
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[300px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                aria-hidden
              />
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border-none rounded-[12px] focus:ring-2 focus:ring-primary/50 text-sm transition-all dark:text-white placeholder:text-slate-500"
                aria-label="Buscar documentos"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-300 flex items-center gap-1.5 ${selectedCategory === 'all' ? 'bg-primary text-primary-content hover:bg-primary/90' : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'}`}
                aria-pressed={selectedCategory === 'all'}
                aria-label={`Filtrar: todas, ${stats.total} documento(s)`}
              >
                Todas ({stats.total})
              </button>
              {DOCUMENT_CATEGORIES.map(cat => {
                const label = cat.label.replace(/^[^\s]+\s/, '');
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-300 flex items-center gap-1.5 ${isSelected ? 'bg-primary text-primary-content hover:bg-primary/90' : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'}`}
                    aria-pressed={isSelected}
                    aria-label={`Filtrar por ${label}, ${stats.categoryCounts[cat.id] || 0} documento(s)`}
                  >
                    {label} ({stats.categoryCounts[cat.id] || 0})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Lista de Documentos */}
        {filteredDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredDocuments.map(doc => (
              <DocumentCard
                key={doc.name}
                doc={doc}
                onView={() => handleViewDocument(doc)}
                onPreview={() => setViewingDocument(doc)}
                onAnalyze={() => handleAnalyze(doc)}
                onGenerate={() => handleGenerateTask(doc)}
                onEdit={() => handleEdit(doc)}
                onRemove={() => handleDelete(doc.name)}
                loadingState={loadingStates[doc.name] ?? null}
                formatFileSize={formatFileSize}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={
              searchQuery || selectedCategory !== 'all'
                ? 'Nenhum documento encontrado'
                : 'Nenhum documento carregado'
            }
            description={
              searchQuery || selectedCategory !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Comece carregando seu primeiro documento'
            }
            icon="📄"
          />
        )}
      </section>

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
            <div className="bg-base-200 p-4 rounded-lg max-h-96 overflow-y-auto">
              {selectedDoc.content.startsWith('data:image/') ? (
                <div className="space-y-4">
                  <img
                    src={selectedDoc.content}
                    alt={selectedDoc.name}
                    className="max-w-full h-auto rounded-lg border border-base-300"
                  />
                  <div className="text-sm text-base-content/70">
                    <p>
                      <strong>Nome:</strong> {selectedDoc.name}
                    </p>
                    <p>
                      <strong>Tamanho:</strong> {formatFileSize(selectedDoc.size || 0)}
                    </p>
                    <p>
                      <strong>Tipo:</strong> {selectedDoc.category || 'Não categorizado'}
                    </p>
                  </div>
                </div>
              ) : selectedDoc.content.startsWith('data:application/pdf') ? (
                <div className="space-y-4">
                  <iframe
                    src={selectedDoc.content}
                    className="w-full h-96 rounded-lg border border-base-300"
                    title={selectedDoc.name}
                  />
                  <div className="text-sm text-base-content/70">
                    <p>
                      <strong>Nome:</strong> {selectedDoc.name}
                    </p>
                    <p>
                      <strong>Tamanho:</strong> {formatFileSize(selectedDoc.size || 0)}
                    </p>
                  </div>
                </div>
              ) : (
                <pre className="text-sm text-base-content whitespace-pre-wrap font-mono">
                  {selectedDoc.content}
                </pre>
              )}
            </div>
            {selectedDoc.analysis && (
              <div>
                <h4 className="text-sm font-semibold text-base-content/70 mb-2">Análise IA</h4>
                <div
                  className="prose max-w-none bg-base-200 p-4 rounded-lg"
                  dangerouslySetInnerHTML={{ __html: selectedDoc.analysis }}
                />
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal de Importação */}
      <FileImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        importType="document"
        onImportDocument={handleImportDocument}
      />

      {/* Modal de Visualização */}
      {viewingDocument && (
        <FileViewer
          content={viewingDocument.content}
          fileName={viewingDocument.name}
          mimeType={
            viewingDocument.content.startsWith('data:')
              ? viewingDocument.content.match(/^data:([^;]+)/)?.[1] || 'application/octet-stream'
              : 'application/octet-stream'
          }
          onClose={() => setViewingDocument(null)}
          showDownload={true}
          showViewInNewTab={true}
        />
      )}

      {/* Modal de Análise */}
      {analysisResult && (
        <Modal
          isOpen={!!analysisResult}
          onClose={() => setAnalysisResult(null)}
          title={`Análise de ${analysisResult.name}`}
        >
          <div
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: analysisResult.content }}
          />
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
              <label className="block text-sm font-semibold text-base-content/70 mb-2">
                Nome do Documento
              </label>
              <input
                type="text"
                value={editingDoc.name}
                onChange={e => setEditingDoc({ ...editingDoc, name: e.target.value })}
                className="input input-bordered w-full bg-base-100 border-base-300 text-base-content focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-base-content/70 mb-2">
                Conteúdo
              </label>
              <textarea
                value={editingDoc.content}
                onChange={e => setEditingDoc({ ...editingDoc, content: e.target.value })}
                rows={15}
                className="textarea textarea-bordered w-full bg-base-100 border-base-300 text-base-content font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setEditingDoc(null)} className="btn btn-ghost">
                Cancelar
              </button>
              <button type="button" onClick={handleSaveEdit} className="btn btn-primary">
                Salvar
              </button>
            </div>
          </div>
        </Modal>
      )}

      {shouldShowSolusButton && (
        <SolusSchemaModal isOpen={isSolusSchemaOpen} onClose={() => setIsSolusSchemaOpen(false)} />
      )}
    </div>
  );
};
