import React, { useState, useCallback } from 'react';
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
    generateProjectReport
} from '../../utils/exportService';
import { Project, JiraTask } from '../../types';
import { downloadFile } from '../../utils/exportService';

export type ExportType = 'project' | 'tasks' | 'test-cases';
export type ExportFormat = 'json' | 'csv' | 'excel' | 'pdf' | 'word' | 'markdown';

export interface FileExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    exportType: ExportType;
    project?: Project;
    tasks?: JiraTask[];
    onExport?: () => void;
}

/**
 * Modal para exportar dados em diferentes formatos
 */
export const FileExportModal: React.FC<FileExportModalProps> = React.memo(({
    isOpen,
    onClose,
    exportType,
    project,
    tasks,
    onExport
}) => {
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('excel');
    const [isExporting, setIsExporting] = useState(false);
    const { handleError, handleSuccess } = useErrorHandler();

    const getAvailableFormats = (): ExportFormat[] => {
        switch (exportType) {
            case 'project':
                return ['json', 'csv', 'excel', 'pdf', 'word', 'markdown'];
            case 'tasks':
                return ['csv', 'excel'];
            case 'test-cases':
                return ['csv'];
            default:
                return ['json', 'csv', 'excel'];
        }
    };

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
                        case 'json':
                            const jsonContent = exportProjectToJSON(project);
                            fileName = `${project.name}_${dateStr}.json`;
                            mimeType = 'application/json';
                            downloadFile(jsonContent, fileName, mimeType);
                            break;

                        case 'csv':
                            const csvContent = exportProjectToCSV(project);
                            fileName = `${project.name}_${dateStr}.csv`;
                            mimeType = 'text/csv';
                            downloadFile(csvContent, fileName, mimeType);
                            break;

                        case 'excel':
                            await exportProjectToExcel(project);
                            break;

                        case 'pdf':
                            await exportProjectToPDF(project);
                            break;

                        case 'word':
                            await exportProjectToWord(project);
                            break;

                        case 'markdown':
                            const mdContent = generateProjectReport(project);
                            fileName = `${project.name}_${dateStr}.md`;
                            mimeType = 'text/markdown';
                            downloadFile(mdContent, fileName, mimeType);
                            break;
                    }
                    break;

                case 'tasks':
                    if (!tasks) break;

                    switch (selectedFormat) {
                        case 'csv':
                            const csvContent = exportProjectToCSV({
                                ...project!,
                                tasks: tasks
                            } as Project);
                            fileName = `Tarefas_${dateStr}.csv`;
                            mimeType = 'text/csv';
                            downloadFile(csvContent, fileName, mimeType);
                            break;

                        case 'excel':
                            await exportTasksToExcel(tasks);
                            break;
                    }
                    break;

                case 'test-cases':
                    if (!tasks) break;

                    switch (selectedFormat) {
                        case 'csv':
                            const csvContent = exportTestCasesToCSV(tasks);
                            fileName = `CasosDeTeste_${dateStr}.csv`;
                            mimeType = 'text/csv';
                            downloadFile(csvContent, fileName, mimeType);
                            break;
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
    }, [exportType, selectedFormat, project, tasks, onExport, onClose, handleError, handleSuccess]);

    const availableFormats = getAvailableFormats();

    const formatLabels: Record<ExportFormat, string> = {
        json: 'JSON',
        csv: 'CSV',
        excel: 'Excel (.xlsx)',
        pdf: 'PDF',
        word: 'Word (.docx)',
        markdown: 'Markdown (.md)'
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Exportar Dados"
            size="md"
        >
            <div className="p-4 space-y-4">
                {/* Informação sobre o que será exportado */}
                <div className="text-sm text-text-secondary">
                    {exportType === 'project' && project && (
                        <p>Exportando projeto: <strong>{project.name}</strong></p>
                    )}
                    {exportType === 'tasks' && tasks && (
                        <p>Exportando <strong>{tasks.length}</strong> tarefa(s)</p>
                    )}
                    {exportType === 'test-cases' && tasks && (
                        <p>Exportando casos de teste de <strong>{tasks.length}</strong> tarefa(s)</p>
                    )}
                </div>

                {/* Seleção de formato */}
                <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                        Formato de Exportação
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {availableFormats.map(format => (
                            <button
                                key={format}
                                onClick={() => setSelectedFormat(format)}
                                className={`btn ${selectedFormat === format ? 'btn-primary' : 'btn-secondary'}`}
                                disabled={isExporting}
                            >
                                {formatLabels[format]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Informações sobre o formato selecionado */}
                <div className="text-xs text-text-tertiary">
                    {selectedFormat === 'json' && (
                        <p>Formato JSON completo com todos os dados do projeto.</p>
                    )}
                    {selectedFormat === 'csv' && (
                        <p>Formato CSV para uso em planilhas. Contém dados tabulares.</p>
                    )}
                    {selectedFormat === 'excel' && (
                        <p>Arquivo Excel com múltiplas planilhas organizadas.</p>
                    )}
                    {selectedFormat === 'pdf' && (
                        <p>Documento PDF formatado para impressão e compartilhamento.</p>
                    )}
                    {selectedFormat === 'word' && (
                        <p>Documento Word editável com formatação.</p>
                    )}
                    {selectedFormat === 'markdown' && (
                        <p>Relatório em Markdown para documentação.</p>
                    )}
                </div>

                {/* Botão de exportação */}
                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="btn btn-primary w-full"
                >
                    {isExporting ? (
                        <>
                            <Spinner size="sm" />
                            <span>Exportando...</span>
                        </>
                    ) : (
                        'Exportar'
                    )}
                </button>
            </div>
        </Modal>
    );
});

FileExportModal.displayName = 'FileExportModal';

