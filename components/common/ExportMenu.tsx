import React from 'react';
import { Project } from '../../types';
import {
  exportProjectToJSON,
  exportProjectToCSV,
  exportTestCasesToCSV,
  generateProjectReport,
  downloadFile,
} from '../../utils/exportService';

interface ExportMenuProps {
  project: Project;
  onClose: () => void;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ project, onClose }) => {
  const handleExportJSON = () => {
    const json = exportProjectToJSON(project);
    downloadFile(json, `${project.name}-export.json`, 'application/json');
    onClose();
  };

  const handleExportCSV = () => {
    const csv = exportProjectToCSV(project);
    downloadFile(csv, `${project.name}-tasks.csv`, 'text/csv');
    onClose();
  };

  const handleExportTestCasesCSV = () => {
    const csv = exportTestCasesToCSV(project.tasks);
    downloadFile(csv, `${project.name}-testcases.csv`, 'text/csv');
    onClose();
  };

  const handleExportReport = () => {
    const report = generateProjectReport(project);
    downloadFile(report, `${project.name}-relatorio.md`, 'text/markdown');
    onClose();
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleExportJSON}
        className="w-full text-left px-4 py-2 hover:bg-surface-hover rounded-md transition-colors flex items-center gap-3"
      >
        <span className="text-xl">📦</span>
        <div>
          <div className="font-semibold text-text-primary">Exportar JSON</div>
          <div className="text-sm text-text-secondary">Exporta todos os dados do projeto</div>
        </div>
      </button>

      <button
        onClick={handleExportCSV}
        className="w-full text-left px-4 py-2 hover:bg-surface-hover rounded-md transition-colors flex items-center gap-3"
      >
        <span className="text-xl">📊</span>
        <div>
          <div className="font-semibold text-text-primary">Exportar Tarefas (CSV)</div>
          <div className="text-sm text-text-secondary">Exporta todas as tarefas em formato CSV</div>
        </div>
      </button>

      <button
        onClick={handleExportTestCasesCSV}
        className="w-full text-left px-4 py-2 hover:bg-surface-hover rounded-md transition-colors flex items-center gap-3"
      >
        <span className="text-xl">✅</span>
        <div>
          <div className="font-semibold text-text-primary">Exportar Casos de Teste (CSV)</div>
          <div className="text-sm text-text-secondary">Exporta todos os casos de teste</div>
        </div>
      </button>

      <button
        onClick={handleExportReport}
        className="w-full text-left px-4 py-2 hover:bg-surface-hover rounded-md transition-colors flex items-center gap-3"
      >
        <span className="text-xl">📄</span>
        <div>
          <div className="font-semibold text-text-primary">Gerar Relatório</div>
          <div className="text-sm text-text-secondary">Gera relatório completo em Markdown</div>
        </div>
      </button>
    </div>
  );
};
