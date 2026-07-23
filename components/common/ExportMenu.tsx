import React from 'react';
import toast from 'react-hot-toast';
import { Project } from '../../types';
import {
  exportProjectToJSON,
  exportProjectToCSV,
  exportTestCasesToCSV,
  generateProjectReport,
  downloadFile,
  downloadCsvFile,
} from '../../utils/exportService';
import { useErrorHandler } from '../../hooks/useErrorHandler';

interface ExportMenuProps {
  project: Project;
  onClose: () => void;
}

const menuItemClass =
  'w-full text-left px-4 py-2 hover:bg-surface-hover rounded-md transition-colors flex items-center gap-3';

export const ExportMenu: React.FC<ExportMenuProps> = ({ project, onClose }) => {
  const { handleError } = useErrorHandler();

  const items = [
    {
      icon: '📦',
      title: 'Exportar JSON',
      desc: 'Exporta todos os dados do projeto',
      onClick: () => {
        try {
          const json = exportProjectToJSON(project);
          downloadFile(json, `${project.name}-export.json`, 'application/json');
          toast.success('Projeto exportado como JSON com sucesso!');
          onClose();
        } catch (error) {
          handleError(
            error instanceof Error ? error : new Error('Erro ao exportar JSON'),
            'Exportar JSON'
          );
        }
      },
    },
    {
      icon: '📊',
      title: 'Exportar Tarefas (CSV)',
      desc: 'Exporta todas as tarefas em formato CSV',
      onClick: () => {
        try {
          const csv = exportProjectToCSV(project);
          downloadCsvFile(csv, `${project.name}-tasks.csv`);
          toast.success('Tarefas exportadas como CSV com sucesso!');
          onClose();
        } catch (error) {
          handleError(
            error instanceof Error ? error : new Error('Erro ao exportar CSV'),
            'Exportar CSV'
          );
        }
      },
    },
    {
      icon: '✅',
      title: 'Exportar Casos de Teste (CSV)',
      desc: 'Exporta todos os casos de teste',
      onClick: () => {
        try {
          const csv = exportTestCasesToCSV(project.tasks);
          downloadCsvFile(csv, `${project.name}-testcases.csv`);
          toast.success('Casos de teste exportados como CSV com sucesso!');
          onClose();
        } catch (error) {
          handleError(
            error instanceof Error ? error : new Error('Erro ao exportar casos de teste'),
            'Exportar CSV'
          );
        }
      },
    },
    {
      icon: '📄',
      title: 'Gerar Relatório',
      desc: 'Gera relatório completo em Markdown',
      onClick: () => {
        try {
          const report = generateProjectReport(project);
          downloadFile(report, `${project.name}-relatorio.md`, 'text/markdown');
          toast.success('Relatório gerado em Markdown com sucesso!');
          onClose();
        } catch (error) {
          handleError(
            error instanceof Error ? error : new Error('Erro ao gerar relatório'),
            'Gerar relatório'
          );
        }
      },
    },
  ];

  return (
    <div className="space-y-2">
      {items.map(item => (
        <button key={item.title} onClick={item.onClick} className={menuItemClass}>
          <span className="text-xl">{item.icon}</span>
          <div>
            <div className="font-semibold text-text-primary">{item.title}</div>
            <div className="text-sm text-text-secondary">{item.desc}</div>
          </div>
        </button>
      ))}
    </div>
  );
};
