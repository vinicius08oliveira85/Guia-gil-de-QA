import React, { useState, useCallback, useRef } from 'react';
import { Modal } from './Modal';
import { Spinner } from './Spinner';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import {
    importProjectFromJSON,
    importTasksFromExcel,
    importTasksFromCSV,
    importTestCasesFromExcel,
    importDocument,
    autoImportFile,
    ImportResult
} from '../../services/fileImportService';
import { Project, JiraTask, TestCase, ProjectDocument } from '../../types';

export type ImportType = 'project' | 'tasks' | 'test-cases' | 'document' | 'auto';

export interface FileImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    importType?: ImportType;
    onImportProject?: (project: Project) => void;
    onImportTasks?: (tasks: JiraTask[]) => void;
    onImportTestCases?: (testCases: TestCase[], taskId?: string) => void;
    onImportDocument?: (document: ProjectDocument) => void;
    taskId?: string; // Para importar casos de teste de uma tarefa específica
}

/**
 * Modal para importar arquivos (projetos, tarefas, casos de teste, documentos)
 */
export const FileImportModal: React.FC<FileImportModalProps> = React.memo(({
    isOpen,
    onClose,
    importType = 'auto',
    onImportProject,
    onImportTasks,
    onImportTestCases,
    onImportDocument,
    taskId
}) => {
    const [selectedType, setSelectedType] = useState<ImportType>(importType);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult<any> | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { handleError, handleSuccess, handleWarning } = useErrorHandler();

    const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportResult(null);

        try {
            let result: ImportResult<any>;

            switch (selectedType) {
                case 'project':
                    if (file.name.endsWith('.json') || file.type === 'application/json') {
                        result = await importProjectFromJSON(file);
                        if (result.success && result.data && onImportProject) {
                            onImportProject(result.data);
                            handleSuccess('Projeto importado com sucesso!');
                            onClose();
                        }
                    } else {
                        throw new Error('Formato inválido. Use um arquivo JSON para importar projetos.');
                    }
                    break;

                case 'tasks':
                    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                        result = await importTasksFromExcel(file, { validateData: true });
                    } else if (file.name.endsWith('.csv')) {
                        result = await importTasksFromCSV(file, { validateData: true });
                    } else {
                        throw new Error('Formato inválido. Use um arquivo Excel (.xlsx, .xls) ou CSV para importar tarefas.');
                    }
                    if (result.success && result.data && onImportTasks) {
                        onImportTasks(result.data);
                        handleSuccess(`${result.data.length} tarefa(s) importada(s) com sucesso!`);
                        if (result.warnings && result.warnings.length > 0) {
                            handleWarning(`Avisos: ${result.warnings.join('; ')}`);
                        }
                        onClose();
                    }
                    break;

                case 'test-cases':
                    if (!taskId) {
                        throw new Error('ID da tarefa é necessário para importar casos de teste.');
                    }
                    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                        result = await importTestCasesFromExcel(file, taskId, { validateData: true });
                    } else {
                        throw new Error('Formato inválido. Use um arquivo Excel (.xlsx, .xls) para importar casos de teste.');
                    }
                    if (result.success && result.data && onImportTestCases) {
                        onImportTestCases(result.data, taskId);
                        handleSuccess(`${result.data.length} caso(s) de teste importado(s) com sucesso!`);
                        if (result.warnings && result.warnings.length > 0) {
                            handleWarning(`Avisos: ${result.warnings.join('; ')}`);
                        }
                        onClose();
                    }
                    break;

                case 'document':
                    result = await importDocument(file);
                    if (result.success && result.data && onImportDocument) {
                        onImportDocument(result.data);
                        handleSuccess('Documento importado com sucesso!');
                        onClose();
                    }
                    break;

                case 'auto':
                default:
                    result = await autoImportFile(file, { validateData: true });
                    if (result.success && result.data) {
                        if (result.data instanceof Array) {
                            // Tarefas ou casos de teste
                            if (onImportTasks && result.data.length > 0 && 'type' in result.data[0]) {
                                onImportTasks(result.data as JiraTask[]);
                                handleSuccess(`${result.data.length} tarefa(s) importada(s) com sucesso!`);
                            } else if (onImportTestCases && result.data.length > 0) {
                                onImportTestCases(result.data as TestCase[], taskId);
                                handleSuccess(`${result.data.length} caso(s) de teste importado(s) com sucesso!`);
                            }
                        } else if ('id' in result.data && 'name' in result.data) {
                            // Projeto
                            if (onImportProject) {
                                onImportProject(result.data as Project);
                                handleSuccess('Projeto importado com sucesso!');
                            }
                        } else if ('name' in result.data && 'content' in result.data) {
                            // Documento
                            if (onImportDocument) {
                                onImportDocument(result.data as ProjectDocument);
                                handleSuccess('Documento importado com sucesso!');
                            }
                        }
                        if (result.warnings && result.warnings.length > 0) {
                            handleWarning(`Avisos: ${result.warnings.join('; ')}`);
                        }
                        onClose();
                    }
                    break;
            }

            if (!result.success) {
                handleError(new Error(result.error || 'Erro ao importar arquivo'), 'Importar arquivo');
                setImportResult(result);
            }
        } catch (error) {
            handleError(error, 'Importar arquivo');
            setImportResult({
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            });
        } finally {
            setIsImporting(false);
            // Limpar input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [selectedType, taskId, onImportProject, onImportTasks, onImportTestCases, onImportDocument, onClose, handleError, handleSuccess, handleWarning]);

    const handleTypeChange = useCallback((type: ImportType) => {
        setSelectedType(type);
        setImportResult(null);
    }, []);

    const handleFileButtonClick = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const getAcceptedFileTypes = (): string => {
        switch (selectedType) {
            case 'project':
                return '.json,application/json';
            case 'tasks':
                return '.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv';
            case 'test-cases':
                return '.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel';
            case 'document':
                return '*';
            case 'auto':
            default:
                return '*';
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Importar Arquivo"
            size="md"
        >
            <div className="p-4 space-y-4">
                {/* Seleção de tipo de importação */}
                {importType === 'auto' && (
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            Tipo de Importação
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleTypeChange('project')}
                                className={`btn ${selectedType === 'project' ? 'btn-primary' : 'btn-secondary'}`}
                            >
                                Projeto
                            </button>
                            <button
                                onClick={() => handleTypeChange('tasks')}
                                className={`btn ${selectedType === 'tasks' ? 'btn-primary' : 'btn-secondary'}`}
                            >
                                Tarefas
                            </button>
                            <button
                                onClick={() => handleTypeChange('test-cases')}
                                className={`btn ${selectedType === 'test-cases' ? 'btn-primary' : 'btn-secondary'}`}
                            >
                                Casos de Teste
                            </button>
                            <button
                                onClick={() => handleTypeChange('document')}
                                className={`btn ${selectedType === 'document' ? 'btn-primary' : 'btn-secondary'}`}
                            >
                                Documento
                            </button>
                        </div>
                    </div>
                )}

                {/* Informações sobre o tipo selecionado */}
                <div className="text-sm text-text-secondary">
                    {selectedType === 'project' && (
                        <p>Importe um projeto completo de um arquivo JSON.</p>
                    )}
                    {selectedType === 'tasks' && (
                        <p>Importe tarefas de um arquivo Excel (.xlsx, .xls) ou CSV.</p>
                    )}
                    {selectedType === 'test-cases' && (
                        <p>Importe casos de teste de um arquivo Excel (.xlsx, .xls).</p>
                    )}
                    {selectedType === 'document' && (
                        <p>Importe um documento (PDF, Word, Excel, imagem, etc.).</p>
                    )}
                    {selectedType === 'auto' && (
                        <p>O tipo de arquivo será detectado automaticamente.</p>
                    )}
                </div>

                {/* Input de arquivo oculto */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={getAcceptedFileTypes()}
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* Botão para selecionar arquivo */}
                <button
                    onClick={handleFileButtonClick}
                    disabled={isImporting}
                    className="btn btn-primary w-full"
                >
                    {isImporting ? (
                        <>
                            <Spinner size="sm" />
                            <span>Importando...</span>
                        </>
                    ) : (
                        'Selecionar Arquivo'
                    )}
                </button>

                {/* Resultado da importação */}
                {importResult && !importResult.success && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm text-red-600">
                        <strong>Erro:</strong> {importResult.error}
                    </div>
                )}

                {importResult && importResult.warnings && importResult.warnings.length > 0 && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm text-yellow-600">
                        <strong>Avisos:</strong>
                        <ul className="list-disc list-inside mt-1">
                            {importResult.warnings.map((warning, index) => (
                                <li key={index}>{warning}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </Modal>
    );
});

FileImportModal.displayName = 'FileImportModal';

