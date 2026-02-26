import React, { useState, useEffect, useMemo } from 'react';
import { Download, Copy, Check, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { Modal } from '../common/Modal';
import { JiraTask } from '../../types';
import { generateTestReport, TestReportFormat } from '../../utils/testReportGenerator';
import { downloadFile } from '../../utils/exportService';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { logger } from '../../utils/logger';
import { summarizeTestReport } from '../../services/ai/testReportSummaryService';

type ReportFormatOption = TestReportFormat | 'resumido';

interface TestReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: JiraTask;
}

function getReportGeneratorOptions(format: ReportFormatOption) {
  if (format === 'resumido') {
    return { format: 'text' as TestReportFormat, concise: true, includeTools: false };
  }
  return {
    format: format as TestReportFormat,
    concise: false,
    includeTools: false
  };
}

export const TestReportModal: React.FC<TestReportModalProps> = ({
  isOpen,
  onClose,
  task
}) => {
  const [reportText, setReportText] = useState('');
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<ReportFormatOption>('text');
  const [generationDate, setGenerationDate] = useState<Date | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const executedTestCases = useMemo(
    () => (task?.testCases || []).filter(testCase => testCase.status !== 'Not Run'),
    [task]
  );

  useEffect(() => {
    if (isOpen && task) {
      const now = new Date();
      setGenerationDate(now);
      const opts = getReportGeneratorOptions(format);
      const report = generateTestReport(task, now, opts);
      setReportText(report);
      setCopied(false);
    } else {
      setFormat('text');
      setGenerationDate(null);
    }
  }, [isOpen, task]);

  useEffect(() => {
    if (!isOpen || !task) {
      return;
    }
    const baseDate = generationDate ?? new Date();
    if (!generationDate) {
      setGenerationDate(baseDate);
    }
    const opts = getReportGeneratorOptions(format);
    const report = generateTestReport(task, baseDate, opts);
    setReportText(report);
    setCopied(false);
  }, [format, generationDate, isOpen, task]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error('Erro ao copiar', 'TestReportModal', error);
      // Fallback para navegadores antigos
      const textArea = document.createElement('textarea');
      textArea.value = reportText;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        logger.error('Fallback copy failed', 'TestReportModal', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleDownload = () => {
    if (!task) {
      return;
    }
    const extension = format === 'markdown' ? 'md' : 'txt';
    const mimeType = format === 'markdown' ? 'text/markdown' : 'text/plain';
    downloadFile(
      reportText,
      `${task.id}-registro-testes.${extension}`,
      mimeType
    );
  };

  const handleSummarizeWithAI = async () => {
    if (!reportText.trim() || summarizing) {
      return;
    }
    setSummarizing(true);
    try {
      const summarized = await summarizeTestReport(reportText);
      setReportText(summarized);
      toast.success('Relatório resumido com IA.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao resumir com IA. Verifique a API key do Gemini em Configurações.';
      toast.error(message);
    } finally {
      setSummarizing(false);
    }
  };

  const formatOptions: Array<{ label: string; value: ReportFormatOption; description: string }> = [
    { label: 'Texto estruturado', value: 'text', description: 'Formato ideal para colar em campos comuns.' },
    { label: 'Markdown', value: 'markdown', description: 'Melhor para docs e wikis com formatação.' },
    { label: 'Resumido', value: 'resumido', description: 'Versão compacta, sem ferramentas de teste.' }
  ];

  const getStatusBadge = (status: string) => {
    const isApproved = status === 'Passed';
    return {
      label: isApproved ? 'Aprovado' : 'Reprovado',
      variant: isApproved ? 'success' : 'error'
    } as const;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registro de Testes Realizados" size="2xl">
      <div className="h-full flex flex-col min-h-0 space-y-5">
        {/* Cabeçalho: subtítulo + botões de ação */}
        <div className="flex-shrink-0 space-y-4">
          <p className="text-sm text-base-content/70">
            Copie o registro abaixo para colar em outras plataformas
          </p>
          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button
              type="button"
              variant="brandOutline"
              size="panelXs"
              onClick={handleSummarizeWithAI}
              disabled={summarizing || !reportText.trim()}
              aria-label="Resumir relatório com IA"
            >
              <Sparkles className="w-3.5 h-3.5" aria-hidden />
              {summarizing ? 'Resumindo…' : 'Resumir com IA'}
            </Button>
            <Button
              type="button"
              variant="brandOutline"
              size="panelXs"
              onClick={handleDownload}
              aria-label={`Baixar relatório em .${format === 'markdown' ? 'md' : 'txt'}`}
            >
              <Download className="w-3.5 h-3.5" aria-hidden />
              Baixar .{format === 'markdown' ? 'md' : 'txt'}
            </Button>
            <button
              type="button"
              onClick={handleCopy}
              className={`
                flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-lg font-medium transition-colors shadow-sm
                ${copied
                  ? 'bg-success text-success-content hover:opacity-90'
                  : 'bg-brand-orange text-white hover:bg-brand-orange-selected-hover shadow-brand-orange/20'}
              `}
              aria-label={copied ? 'Copiado' : 'Copiar relatório'}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" aria-hidden />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" aria-hidden />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Formato do relatório - cards selecionáveis (v0 style) */}
        <div className="flex-shrink-0 flex flex-col gap-3">
          <p className="text-sm font-semibold text-base-content">Formato do relatório</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {formatOptions.map((option) => {
              const isSelected = format === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormat(option.value)}
                  role="button"
                  aria-pressed={isSelected}
                  aria-label={`${option.label}: ${option.description}`}
                  className={`
                    flex items-start gap-2 p-4 rounded-xl text-left transition-all duration-200
                    ${isSelected
                      ? 'border-2 border-brand-orange bg-orange-50 dark:bg-orange-950/20 ring-2 ring-brand-orange/20 text-base-content'
                      : 'border border-base-300 text-base-content/70 hover:text-base-content hover:border-base-content/20 hover:bg-base-200/50'}
                  `}
                >
                  <div
                    className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0
                      ${isSelected ? 'border-brand-orange bg-white dark:bg-base-100' : 'border-base-300 bg-base-100'}
                    `}
                  >
                    {isSelected && (
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-orange" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-base-content/70 mt-1">{option.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Resumo visual */}
        <div className="flex-shrink-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold text-base-content">Resumo visual</p>
            <div className="flex gap-4 text-sm text-base-content/70">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-success" aria-hidden />
                <span>Aprovado</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-error" aria-hidden />
                <span>Reprovado</span>
              </div>
            </div>
          </div>
          {executedTestCases.length > 0 ? (
            <div className="rounded-xl border border-base-300 overflow-hidden bg-base-100">
              <div className="max-h-32 overflow-y-auto divide-y divide-base-200">
                {executedTestCases.map((testCase, index) => {
                  const statusData = getStatusBadge(testCase.status);
                  return (
                    <div
                      key={`${testCase.id}-${index}`}
                      className="p-4 hover:bg-base-200/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-base-content">
                            {testCase.description || `Teste ${index + 1}`}
                          </p>
                          {testCase.executedStrategy && (
                            <p className="text-xs text-base-content/70 mt-1">
                              {Array.isArray(testCase.executedStrategy)
                                ? testCase.executedStrategy.join(', ')
                                : testCase.executedStrategy}
                            </p>
                          )}
                        </div>
                        <Badge variant={statusData.variant} size="sm">
                          {statusData.label}
                        </Badge>
                      </div>
                      {testCase.toolsUsed && testCase.toolsUsed.length > 0 && (
                        <p className="text-xs text-base-content/70 mt-2">
                          Ferramentas: {testCase.toolsUsed.join(', ')}
                        </p>
                      )}
                      {testCase.observedResult && testCase.observedResult.trim() && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-base-content/70 mb-0.5">Resultado Encontrado:</p>
                          <p className="text-xs text-error whitespace-pre-wrap">{testCase.observedResult}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-base-content/70">Nenhum teste executado até o momento.</p>
          )}
        </div>

        {/* Textarea do relatório */}
        <div className="relative flex-1 min-h-0 flex flex-col">
          <textarea
            value={reportText}
            readOnly
            className="w-full flex-1 min-h-[200px] px-4 py-3 rounded-xl border border-base-300 bg-base-100 dark:bg-base-200/50 text-sm text-base-content font-mono resize-none focus:outline-none focus:ring-2 focus:ring-brand-orange/30 focus:border-brand-orange/50 transition-all duration-200"
            onClick={(e) => {
              (e.target as HTMLTextAreaElement).select();
            }}
            aria-label="Conteúdo do relatório de testes"
          />
        </div>

        {/* Rodapé */}
        <div className="flex-shrink-0 pt-4 border-t border-base-200 flex justify-end">
          <Button type="button" variant="brandOutline" size="panel" onClick={onClose} aria-label="Fechar modal">
            Fechar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

