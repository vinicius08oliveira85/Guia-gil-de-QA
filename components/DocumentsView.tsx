import React, { useState, useMemo, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Project, ProjectDocument } from '../types';
import type { JiraTask } from '../types';
import { generateTaskFromDocument } from '../services/geminiService';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { withTimeout } from '../utils/withTimeout';
import { EmptyState } from './common/EmptyState';
import {
  createDocumentFromFile,
  convertDocumentFileToProjectDocument,
} from '../utils/documentService';
import { formatFileSize } from '../utils/attachmentService';
import { FileImportModal } from './common/FileImportModal';
import { FileViewer } from './common/FileViewer';
import { DocumentStatsCards } from './documents/DocumentStatsCards';
import { DocumentCard } from './documents/DocumentCard';
import { Search, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { documentCardGrid, projectViewPanel, projectViewShell } from './common/viewUi';
import {
  viewHeroChromeClass,
  viewHeroHeaderShellClass,
  viewHeroJiraBadgeClass,
  viewHeroPrimaryBtnClass,
  viewHeroSubtitleClass,
  viewHeroTitleClass,
} from './common/viewHeroChromeUi';
import { documentsCardListPanelClass } from './documents/documentsCardNeuUi';
import {
  documentsEyebrowClass,
  documentsFilterPillClass,
  documentsFilterPillsGroupClass,
  documentsFilterRowClass,
  documentsFiltersPanelClass,
  documentsModalBodyClass,
  documentsModalMutedTextClass,
  documentsModalPreviewInsetClass,
  documentsModalPrimaryBtnClass,
  documentsModalSecondaryBtnClass,
  documentsModalShellClass,
  documentsModalTitleClass,
  documentsOutlineBtnClass,
  documentsPageMutedClass,
  documentsSearchIconClass,
  documentsSearchInputClass,
  documentsSummaryStatIconAccentClass,
  documentsSummaryStatIconSuccessClass,
  documentsSummaryStatsClass,
  documentsSummaryStatStrongClass,
  documentsSummaryStripClass,
  documentsViewScopeClass,
} from './documents/documentsNeuUi';

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
  const [loadingStates, setLoadingStates] = useState<{
    [docName: string]: 'generate' | null;
  }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [onlyWithoutAnalysis, setOnlyWithoutAnalysis] = useState(false);
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
      <div className={viewHeroChromeClass}>
        <header className={viewHeroHeaderShellClass}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h1 id="documents-section-heading" className={viewHeroTitleClass}>
                  Documentos
                </h1>
                {jiraProjectKey ? (
                  <span className={viewHeroJiraBadgeClass}>Jira: {jiraProjectKey}</span>
                ) : null}
              </div>
              <p className={viewHeroSubtitleClass}>{documentsDescription}</p>
            </div>
            <label className={cn(viewHeroPrimaryBtnClass, 'shrink-0 cursor-pointer')}>
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
      </div>

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
                  onPreview={() => setViewingDocument(doc)}
                  onGenerate={() => handleGenerateTask(doc)}
                  onRemove={() => handleDelete(doc.name)}
                  isGenerating={loadingStates[doc.name] === 'generate'}
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
    </div>
  );
};
