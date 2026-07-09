import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Modal } from './Modal';
import { Spinner } from './Spinner';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import {
  exportProjectToJSON,
  exportProjectToCSV,
  exportProjectToExcel,
  exportProjectToPDF,
  exportProjectToWord,
  exportTasksToExcel,
  exportTestCasesToCSV,
  exportDevTasksToCSV,
  generateProjectReport,
} from '../../utils/exportService';
import { Project, JiraTask } from '../../types';
import { downloadFile } from '../../utils/exportService';
import { cn } from '../../utils/cn';
import {
  tasksPanelExportFormatOptionClass,
  tasksPanelExportFormatStripClass,
  tasksPanelExportModalContentClass,
  tasksPanelExportModalFieldLabelClass,
  tasksPanelExportModalHintClass,
  tasksPanelExportModalInfoClass,
  tasksPanelExportModalInfoStrongClass,
  tasksPanelExportModalSubmitClass,
  tasksPanelNeuModalPanelClass,
  tasksPanelNeuModalTitleClass,
} from '../tasks/tasksPanelNeuStyles';

export type ExportType = 'project' | 'tasks' | 'test-cases';
export type ExportFormat = 'json' | 'csv' | 'excel' | 'pdf' | 'word' | 'markdown';

export interface FileExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  exportType: ExportType;
  project?: Project;
  tasks?: JiraTask[];
  onExport?: () => void;
  /** Projeto Dev: exportação sem colunas/planilhas de QA. */
  devMode?: boolean;
}

/**
 * Modal para exportar dados em diferentes formatos
 */
export const FileExportModal: React.FC<FileExportModalProps> = React.memo(
  ({ isOpen, onClose, exportType, project, tasks, onExport, devMode = false }) => {
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('excel');
    const [isExporting, setIsExporting] = useState(false);
    const { handleError, handleSuccess } = useErrorHandler();

    const availableFormats = useMemo((): ExportFormat[] => {
      switch (exportType) {
        case 'project':
          return ['json', 'csv', 'excel', 'pdf', 'word', 'markdown'];
        case 'tasks':
          return devMode ? ['csv'] : ['csv', 'excel'];
        case 'test-cases':
          return ['csv'];
        default:
          return ['json', 'csv', 'excel'];
      }
    }, [exportType, devMode]);

    useEffect(() => {
      if (!isOpen) return;
      if (!availableFormats.includes(selectedFormat)) {
        setSelectedFormat(availableFormats[0] ?? 'csv');
      }
    }, [isOpen, availableFormats, selectedFormat]);

    const handleExport = useCallback(async () => {
      if (!project && exportType === 'project') {
        handleError(new Error('Projeto não disponível para exportação'), 'Exportar');
        return;
      }

      if (!tasks && (exportType === 'tasks' || exportType === 'test-cases')) {
        handleError(new Error('Tarefas não disponíveis para exportação'), 'Exportar');
        return;
      }

      setIsExporting(true);

      try {
        const dateStr = new Date().toISOString().split('T')[0];
        let fileName: string;
        let mimeType: string;

        switch (exportType) {
          case 'project':
            if (!project) break;

            switch (selectedFormat) {
              case 'json': {
                const jsonContent = exportProjectToJSON(project);
                fileName = `${project.name}_${dateStr}.json`;
                mimeType = 'application/json';
                downloadFile(jsonContent, fileName, mimeType);
                break;
              }

              case 'csv': {
                const csvContent = exportProjectToCSV(project);
                fileName = `${project.name}_${dateStr}.csv`;
                mimeType = 'text/csv';
                downloadFile(csvContent, fileName, mimeType);
                break;
              }

              case 'excel':
                await exportProjectToExcel(project);
                break;

              case 'pdf':
                await exportProjectToPDF(project);
                break;

              case 'word':
                await exportProjectToWord(project);
                break;

              case 'markdown': {
                const mdContent = generateProjectReport(project);
                fileName = `${project.name}_${dateStr}.md`;
                mimeType = 'text/markdown';
                downloadFile(mdContent, fileName, mimeType);
                break;
              }
            }
            break;

          case 'tasks':
            if (!tasks) break;

            switch (selectedFormat) {
              case 'csv': {
                const csvContent = devMode
                  ? exportDevTasksToCSV(tasks)
                  : exportProjectToCSV({
                      ...project!,
                      tasks: tasks,
                    } as Project);
                fileName = devMode ? `Tarefas_Dev_${dateStr}.csv` : `Tarefas_${dateStr}.csv`;
                mimeType = 'text/csv';
                downloadFile(csvContent, fileName, mimeType);
                break;
              }

              case 'excel':
                if (!devMode) {
                  await exportTasksToExcel(tasks);
                }
                break;
            }
            break;

          case 'test-cases':
            if (!tasks) break;

            switch (selectedFormat) {
              case 'csv': {
                const csvContent = exportTestCasesToCSV(tasks);
                fileName = `CasosDeTeste_${dateStr}.csv`;
                mimeType = 'text/csv';
                downloadFile(csvContent, fileName, mimeType);
                break;
              }
            }
            break;
        }

        handleSuccess('Exportação concluída com sucesso!');
        onExport?.();
        onClose();
      } catch (error) {
        handleError(error, 'Exportar dados');
      } finally {
        setIsExporting(false);
      }
    }, [exportType, selectedFormat, project, tasks, onExport, onClose, handleError, handleSuccess, devMode]);

    const formatLabels: Record<ExportFormat, string> = {
      json: 'JSON',
      csv: 'CSV',
      excel: 'Excel (.xlsx)',
      pdf: 'PDF',
      word: 'Word (.docx)',
      markdown: 'Markdown (.md)',
    };

    const formatHint: Partial<Record<ExportFormat, string>> = {
      json: 'Formato JSON completo com todos os dados do projeto.',
      csv: 'Formato CSV para uso em planilhas. Contém dados tabulares.',
      excel: 'Arquivo Excel com múltiplas planilhas organizadas.',
      pdf: 'Documento PDF formatado para impressão e compartilhamento.',
      word: 'Documento Word editável com formatação.',
      markdown: 'Relatório em Markdown para documentação.',
    };

    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Exportar Dados"
        size="lg"
        panelClassName={tasksPanelNeuModalPanelClass}
        titleClassName={tasksPanelNeuModalTitleClass}
      >
        <div className={tasksPanelExportModalContentClass}>
          <div className={tasksPanelExportModalInfoClass}>
            {exportType === 'project' && project && (
              <p>
                Exportando projeto:{' '}
                <strong className={tasksPanelExportModalInfoStrongClass}>{project.name}</strong>
              </p>
            )}
            {exportType === 'tasks' && tasks && (
              <p>
                Exportando{' '}
                <strong className={tasksPanelExportModalInfoStrongClass}>{tasks.length}</strong>{' '}
                tarefa(s)
                {devMode ? ' (visão Dev, sem dados de QA)' : ''}
              </p>
            )}
            {exportType === 'test-cases' && tasks && (
              <p>
                Exportando casos de teste de{' '}
                <strong className={tasksPanelExportModalInfoStrongClass}>{tasks.length}</strong>{' '}
                tarefa(s)
              </p>
            )}
          </div>

          <div>
            <span className={tasksPanelExportModalFieldLabelClass}>Formato de exportação</span>
            <div
              className={cn(
                tasksPanelExportFormatStripClass,
                'mt-2',
                availableFormats.length === 2 && 'grid-cols-2 sm:grid-cols-2'
              )}
              role="radiogroup"
              aria-label="Formato de exportação"
            >
              {availableFormats.map(format => (
                <button
                  key={format}
                  type="button"
                  role="radio"
                  aria-checked={selectedFormat === format}
                  onClick={() => setSelectedFormat(format)}
                  className={tasksPanelExportFormatOptionClass(selectedFormat === format)}
                  disabled={isExporting}
                >
                  {formatLabels[format]}
                </button>
              ))}
            </div>
          </div>

          {formatHint[selectedFormat] ? (
            <p className={tasksPanelExportModalHintClass}>{formatHint[selectedFormat]}</p>
          ) : null}

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className={tasksPanelExportModalSubmitClass}
          >
            {isExporting ? (
              <>
                <Spinner small />
                <span>Exportando...</span>
              </>
            ) : (
              'Exportar'
            )}
          </button>
        </div>
      </Modal>
    );
  }
);

FileExportModal.displayName = 'FileExportModal';
