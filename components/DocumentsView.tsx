import React, { useState, useMemo, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Project, ProjectDocument } from '../types';
import type { JiraTask } from '../types';
import { analyzeDocumentContent, generateTaskFromDocument } from '../services/geminiService';
import { Modal } from './common/Modal';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { sanitizeHTML } from '../utils/sanitize';
import { withTimeout } from '../utils/withTimeout';
import { Badge } from './common/Badge';
import { EmptyState } from './common/EmptyState';
import {
  createDocumentFromFile,
  convertDocumentFileToProjectDocument,
} from '../utils/documentService';
import { formatFileSize } from '../utils/attachmentService';
import { SpecificationDocumentProcessor } from './settings/SpecificationDocumentProcessor';
import { FileImportModal } from './common/FileImportModal';
import { FileViewer } from './common/FileViewer';
import { viewFileInNewTab } from '../services/fileViewerService';
import { DocumentStatsCards } from './documents/DocumentStatsCards';
import { DocumentCard } from './documents/DocumentCard';
import { Search, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { documentCardGrid, projectViewPanel, projectViewShell } from './common/viewUi';
import { documentsCardListPanelClass } from './documents/documentsCardNeuUi';
import {
  documentsEyebrowClass,
  documentsFilterPillClass,
  documentsFilterPillsGroupClass,
  documentsFilterRowClass,
  documentsFiltersPanelClass,
  documentsJiraBadgeClass,
  documentsModalAnalysisBodyClass,
  documentsModalBodyClass,
  documentsModalFieldLabelClass,
  documentsModalFooterCancelClass,
  documentsModalFooterClass,
  documentsModalFooterSaveClass,
  documentsModalIframeClass,
  documentsModalInputClass,
  documentsModalMediaClass,
  documentsModalMetaClass,
  documentsModalMutedTextClass,
  documentsModalPreClass,
  documentsModalPreviewInsetClass,
  documentsModalPrimaryBtnClass,
  documentsModalSecondaryBtnClass,
  documentsModalSectionLabelClass,
  documentsModalShellClass,
  documentsModalTextareaClass,
  documentsModalTitleClass,
  documentsOutlineBtnClass,
  documentsPageHeaderClass,
  documentsPageMutedClass,
  documentsPageSubtitleClass,
  documentsPageTitleClass,
  documentsSearchIconClass,
  documentsSearchInputClass,
  documentsSummaryStatIconAccentClass,
  documentsSummaryStatIconSuccessClass,
  documentsSummaryStatsClass,
  documentsSummaryStatStrongClass,
  documentsSummaryStripClass,
} from './documents/documentsNeuUi';
import { documentsPrimaryBtnClass, documentsViewScopeClass } from './documents/documentsNeuUi';
import { DocumentAnalysisBody } from './documents/DocumentAnalysisBody';

interface DocumentWithMetadata extends ProjectDocument {
  uploadedAt?: string;
  category?: 'requisitos' | 'testes' | 'arquitetura' | 'outros';
  tags?: string[];
  size?: number;
}

const DOCUMENT_AI_TIMEOUT_MS = 90_000;

const DOCUMENT_CATEGORIES = [
  { id: 'requisitos', label: '📋 Requisitos', color: 'blue' },
  { id: 'testes', label: '🧪 Testes', color: 'green' },
  { id: 'arquitetura', label: '🏗️ Arquitetura', color: 'purple' },
  { id: 'outros', label: '📄 Outros', color: 'gray' },
] as const;

export const DocumentsView: React.FC<{
  project: Project;
  onUpdateProject: (project: Project) => void;
  onNavigateToTab?: (tabId: string) => void;
}> = ({ project, onUpdateProject, onNavigateToTab }) => {
  const [analysisResult, setAnalysisResult] = useState<{ name: string; content: string } | null>(
    null
  );
  const [loadingStates, setLoadingStates] = useState<{
    [docName: string]: 'analyze' | 'generate' | null;
  }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [onlyWithoutAnalysis, setOnlyWithoutAnalysis] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentWithMetadata | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentWithMetadata | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<DocumentWithMetadata | null>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const { handleError, handleSuccess, handleWarning } = useErrorHandler();
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

    // Filtro: apenas documentos sem análise
    if (onlyWithoutAnalysis) {
      filtered = filtered.filter(doc => !doc.analysis || doc.analysis.trim() === '');
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
  }, [documentsWithMetadata, selectedCategory, searchQuery, onlyWithoutAnalysis]);

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
    const withAnalysisCount = documentsWithMetadata.filter(
      d => d.analysis && d.analysis.trim() !== ''
    ).length;
    const withoutAnalysisCount = documentsWithMetadata.length - withAnalysisCount;

    return {
      total: documentsWithMetadata.length,
      totalSize,
      categoryCounts,
      avgSize: documentsWithMetadata.length > 0 ? totalSize / documentsWithMetadata.length : 0,
      withAnalysisCount,
      withoutAnalysisCount,
    };
  }, [documentsWithMetadata]);

  const lastUpdatedText = useMemo(() => {
    const date = project.updatedAt || project.createdAt;
    if (!date) return null;
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ptBR });
    } catch {
      return null;
    }
  }, [project.updatedAt, project.createdAt]);

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
      const analysis = await withTimeout(
        analyzeDocumentContent(doc.content, project),
        DOCUMENT_AI_TIMEOUT_MS,
        'A operação demorou muito. Tente novamente ou use um documento menor.'
      );
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
      const { task, strategy, testCases } = await withTimeout(
        generateTaskFromDocument(doc.content, project),
        DOCUMENT_AI_TIMEOUT_MS,
        'A operação demorou muito. Tente novamente ou use um documento menor.'
      );
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
      onNavigateToTab?.('tasks');
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

  const documentsDescription = (
    <>
      Gerencie e analise documentos do projeto.{' '}
      <span className="font-medium text-[#4a423e]">
        {stats.total} documento{stats.total !== 1 ? 's' : ''} • {formatFileSize(stats.totalSize)}
      </span>
      {lastUpdatedText ? (
        <span className={cn(documentsPageMutedClass, 'text-xs')} title="Última alteração do projeto">
          {' '}
          — Atualizado {lastUpdatedText}
        </span>
      ) : null}
    </>
  );

  const jiraProjectKey = project.settings?.jiraProjectKey;

  return (
    <div
      className={cn(projectViewShell, documentsViewScopeClass)}
      role="main"
      aria-label="Documentos do projeto"
    >
      <header className={documentsPageHeaderClass}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h1 id="documents-section-heading" className={documentsPageTitleClass}>
                Documentos
              </h1>
              {jiraProjectKey ? (
                <span className={documentsJiraBadgeClass}>Jira: {jiraProjectKey}</span>
              ) : null}
            </div>
            <p className={documentsPageSubtitleClass}>{documentsDescription}</p>
          </div>
          <label className={cn(documentsPrimaryBtnClass, 'shrink-0 cursor-pointer')}>
            <Upload className="h-4 w-4 shrink-0" aria-hidden />
            Carregar
            <input
              ref={uploadInputRef}
              type="file"
              accept=".txt,.md,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.json,.csv,.xml,.jpg,.jpeg,.png,.gif,.webp,.svg"
              onChange={handleFileUpload}
              className="hidden"
              aria-label="Carregar documento"
            />
          </label>
        </div>
      </header>

      <section aria-label="Indicadores de documentos por categoria">
        <DocumentStatsCards
          categoryCounts={stats.categoryCounts}
          totalDocuments={stats.total}
          selectedCategory={selectedCategory}
          onCategorySelect={setSelectedCategory}
        />
      </section>

      <section aria-label="Documento de especificação para contexto de IA">
        <SpecificationDocumentProcessor project={project} onUpdateProject={onUpdateProject} />
      </section>

      <section className={documentsFiltersPanelClass} aria-label="Filtros e busca de documentos">
        {stats.total > 0 ? (
          <div className={documentsSummaryStripClass}>
            <span className={documentsEyebrowClass}>Resumo</span>
            <div className={documentsSummaryStatsClass}>
              <span className="inline-flex items-center gap-1.5">
                <FileText className={documentsSummaryStatIconAccentClass} aria-hidden />
                <strong className={documentsSummaryStatStrongClass}>{stats.total}</strong> documento
                {stats.total !== 1 ? 's' : ''}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className={documentsSummaryStatIconSuccessClass} aria-hidden />
                <strong className={documentsSummaryStatStrongClass}>{stats.withAnalysisCount}</strong>{' '}
                com análise
              </span>
              {stats.withoutAnalysisCount > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <AlertCircle className={documentsSummaryStatIconAccentClass} aria-hidden />
                  <strong className={documentsSummaryStatStrongClass}>
                    {stats.withoutAnalysisCount}
                  </strong>{' '}
                  sem análise
                </span>
              ) : null}
              <span>
                Total:{' '}
                <strong className={documentsSummaryStatStrongClass}>
                  {formatFileSize(stats.totalSize)}
                </strong>
              </span>
            </div>
          </div>
        ) : null}

        {stats.total > 0 ? (
          <div className={documentsFilterRowClass}>
            <div className="relative min-w-0 flex-1 sm:min-w-[240px]">
              <Search className={documentsSearchIconClass} aria-hidden />
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={documentsSearchInputClass}
                aria-label="Buscar documentos"
              />
            </div>
            <div className={documentsFilterPillsGroupClass} role="group" aria-label="Filtrar documentos">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={documentsFilterPillClass(selectedCategory === 'all')}
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
                    className={documentsFilterPillClass(isSelected)}
                    aria-pressed={isSelected}
                    aria-label={`Filtrar por ${label}, ${stats.categoryCounts[cat.id] || 0} documento(s)`}
                  >
                    {label} ({stats.categoryCounts[cat.id] || 0})
                  </button>
                );
              })}
              {stats.withoutAnalysisCount > 0 && (
                <button
                  type="button"
                  onClick={() => setOnlyWithoutAnalysis(prev => !prev)}
                  className={documentsFilterPillClass(onlyWithoutAnalysis)}
                  aria-pressed={onlyWithoutAnalysis}
                  aria-label={
                    onlyWithoutAnalysis
                      ? 'Mostrar todos'
                      : `Apenas sem análise (${stats.withoutAnalysisCount})`
                  }
                >
                  Sem análise ({stats.withoutAnalysisCount})
                </button>
              )}
              {(searchQuery || selectedCategory !== 'all' || onlyWithoutAnalysis) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setOnlyWithoutAnalysis(false);
                  }}
                  className={documentsOutlineBtnClass}
                  aria-label="Limpar filtros"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
        ) : null}
      </section>

      <section className={projectViewPanel}>
        <div className="flex flex-col gap-3">
        {filteredDocuments.length > 0 ? (
          <div
            className={cn(documentsCardListPanelClass, documentCardGrid)}
            role="list"
            aria-label="Lista de documentos do projeto"
          >
            {filteredDocuments.map((doc, index) => (
              <div
                key={doc.name}
                role="listitem"
                aria-posinset={index + 1}
                aria-setsize={filteredDocuments.length}
              >
                <DocumentCard
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
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={
              searchQuery || selectedCategory !== 'all' || onlyWithoutAnalysis
                ? 'Nenhum documento encontrado'
                : 'Nenhum documento carregado'
            }
            description={
              searchQuery || selectedCategory !== 'all' || onlyWithoutAnalysis
                ? onlyWithoutAnalysis && !searchQuery && selectedCategory === 'all'
                  ? 'Nenhum documento sem análise no momento.'
                  : 'Tente ajustar os filtros de busca.'
                : 'Comece carregando seu primeiro documento'
            }
            icon="📄"
            action={
              !(searchQuery || selectedCategory !== 'all' || onlyWithoutAnalysis)
                ? {
                    label: 'Carregar documento',
                    onClick: () => uploadInputRef.current?.click(),
                    variant: 'primary',
                  }
                : undefined
            }
            secondaryAction={
              searchQuery || selectedCategory !== 'all' || onlyWithoutAnalysis
                ? {
                    label: 'Limpar filtros',
                    onClick: () => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setOnlyWithoutAnalysis(false);
                    },
                  }
                : undefined
            }
          />
        )}
        </div>
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
          panelClassName={documentsModalShellClass}
          bodyClassName={documentsModalBodyClass}
          titleClassName={documentsModalTitleClass}
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="default" appearance="pill" size="sm">
                {formatFileSize(selectedDoc.size || 0)}
              </Badge>
              <Badge variant="default" appearance="pill" size="sm">
                {selectedDoc.content.split('\n').length} linhas
              </Badge>
              {selectedDoc.category && (
                <Badge variant="default" appearance="pill" size="sm">
                  {DOCUMENT_CATEGORIES.find(c => c.id === selectedDoc.category)?.label}
                </Badge>
              )}
            </div>
            <div className={documentsModalPreviewInsetClass}>
              {selectedDoc.content.startsWith('data:image/') ? (
                <div className="space-y-4">
                  <img
                    src={selectedDoc.content}
                    alt={selectedDoc.name}
                    className={documentsModalMediaClass}
                  />
                  <div className={documentsModalMetaClass}>
                    <p>
                      <strong className="text-[#401C31]">Nome:</strong> {selectedDoc.name}
                    </p>
                    <p>
                      <strong className="text-[#401C31]">Tamanho:</strong>{' '}
                      {formatFileSize(selectedDoc.size || 0)}
                    </p>
                    <p>
                      <strong className="text-[#401C31]">Tipo:</strong>{' '}
                      {selectedDoc.category || 'Não categorizado'}
                    </p>
                  </div>
                </div>
              ) : selectedDoc.content.startsWith('data:application/pdf') ? (
                <div className="space-y-4">
                  <iframe
                    src={selectedDoc.content}
                    className={documentsModalIframeClass}
                    title={selectedDoc.name}
                  />
                  <div className={documentsModalMetaClass}>
                    <p>
                      <strong className="text-[#401C31]">Nome:</strong> {selectedDoc.name}
                    </p>
                    <p>
                      <strong className="text-[#401C31]">Tamanho:</strong>{' '}
                      {formatFileSize(selectedDoc.size || 0)}
                    </p>
                  </div>
                </div>
              ) : (
                <pre className={documentsModalPreClass}>{selectedDoc.content}</pre>
              )}
            </div>
            {selectedDoc.analysis && (
              <div className="space-y-2">
                <p className={documentsModalSectionLabelClass}>Análise IA</p>
                <DocumentAnalysisBody
                  html={selectedDoc.analysis}
                  className={documentsModalAnalysisBodyClass}
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
          panelClassName={documentsModalShellClass}
          bodyClassName={documentsModalBodyClass}
          titleClassName={documentsModalTitleClass}
          mutedTextClassName={documentsModalMutedTextClass}
          primaryBtnClassName={documentsModalPrimaryBtnClass}
          secondaryBtnClassName={documentsModalSecondaryBtnClass}
          dividerClassName="border-[#DED7CD]"
          contentInsetClassName={documentsModalPreviewInsetClass}
        />
      )}

      {/* Modal de Análise */}
      {analysisResult && (
        <Modal
          isOpen={!!analysisResult}
          onClose={() => setAnalysisResult(null)}
          title={`Análise de ${analysisResult.name}`}
          panelClassName={documentsModalShellClass}
          bodyClassName={documentsModalBodyClass}
          titleClassName={documentsModalTitleClass}
        >
          <div className="space-y-3">
            <p className={documentsModalSectionLabelClass}>Resultado da análise</p>
            <DocumentAnalysisBody
              html={analysisResult.content}
              className={documentsModalAnalysisBodyClass}
            />
          </div>
        </Modal>
      )}

      {/* Modal de Edição */}
      {editingDoc && (
        <Modal
          isOpen={!!editingDoc}
          onClose={() => setEditingDoc(null)}
          title={`Editar: ${editingDoc.name}`}
          panelClassName={documentsModalShellClass}
          bodyClassName={documentsModalBodyClass}
          titleClassName={documentsModalTitleClass}
        >
          <div className="space-y-4">
            <div>
              <label className={documentsModalFieldLabelClass}>Nome do Documento</label>
              <input
                type="text"
                value={editingDoc.name}
                onChange={e => setEditingDoc({ ...editingDoc, name: e.target.value })}
                className={documentsModalInputClass}
              />
            </div>
            <div>
              <label className={documentsModalFieldLabelClass}>Conteúdo</label>
              <textarea
                value={editingDoc.content}
                onChange={e => setEditingDoc({ ...editingDoc, content: e.target.value })}
                rows={15}
                className={documentsModalTextareaClass}
              />
            </div>
            <div className={documentsModalFooterClass}>
              <button
                type="button"
                className={documentsModalFooterCancelClass}
                onClick={() => setEditingDoc(null)}
              >
                Cancelar
              </button>
              <button type="button" className={documentsModalFooterSaveClass} onClick={handleSaveEdit}>
                Salvar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
