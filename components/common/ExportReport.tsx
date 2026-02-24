import React, { useState, useEffect } from 'react';
import { Project } from '../../types';
import { useProjectMetrics } from '../../hooks/useProjectMetrics';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { formatDate } from '../../utils/dateUtils';
import { getExportPreferences } from '../../utils/preferencesService';

const convertToCSV = (data: any): string => {
  // Implementação básica de CSV
  if (data.tasks && Array.isArray(data.tasks)) {
    const headers = ['ID', 'Título', 'Tipo', 'Status', 'Prioridade'];
    const rows = data.tasks.map((task: any) => [
      task.id,
      task.title,
      task.type,
      task.status,
      task.priority
    ]);
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
  return '';
};

const convertToMarkdown = (data: any, project: Project): string => {
  let md = `# Relatório: ${project.name}\n\n`;
  md += `**Data:** ${formatDate(new Date())}\n\n`;
  
  if (data.metrics) {
    md += `## Métricas\n\n`;
    md += `- Fase Atual: ${data.metrics.currentPhase}\n`;
    md += `- Total de Tarefas: ${data.metrics.totalTasks}\n`;
    md += `- Casos de Teste: ${data.metrics.totalTestCases}\n`;
    md += `- Cobertura: ${data.metrics.testCoverage}%\n\n`;
  }
  
  if (data.tasks) {
    md += `## Tarefas\n\n`;
    data.tasks.forEach((task: any) => {
      md += `### ${task.id}: ${task.title}\n`;
      md += `- Tipo: ${task.type}\n`;
      md += `- Status: ${task.status}\n`;
      md += `- Prioridade: ${task.priority}\n\n`;
    });
  }
  
  return md;
};

interface ExportReportProps {
  project: Project;
  onClose: () => void;
}

export const ExportReport: React.FC<ExportReportProps> = ({ project, onClose }) => {
    const exportPrefs = getExportPreferences();
    const [format, setFormat] = useState<'json' | 'csv' | 'markdown'>(exportPrefs.defaultFormat);
    const [includeMetrics, setIncludeMetrics] = useState(exportPrefs.defaultIncludeMetrics);
    const [includeTasks, setIncludeTasks] = useState(exportPrefs.defaultIncludeTasks);
    const [includeTestCases, setIncludeTestCases] = useState(exportPrefs.defaultIncludeTestCases);
    const metrics = useProjectMetrics(project);
    const { handleSuccess, handleError } = useErrorHandler();

    useEffect(() => {
        const handlePreferencesUpdate = () => {
            const updatedPrefs = getExportPreferences();
            setFormat(updatedPrefs.defaultFormat);
            setIncludeMetrics(updatedPrefs.defaultIncludeMetrics);
            setIncludeTasks(updatedPrefs.defaultIncludeTasks);
            setIncludeTestCases(updatedPrefs.defaultIncludeTestCases);
        };
        window.addEventListener('preferences-updated', handlePreferencesUpdate);
        return () => window.removeEventListener('preferences-updated', handlePreferencesUpdate);
    }, []);

  const handleExport = async () => {
    try {
      const data: any = {
        project: {
          name: project.name,
          description: project.description,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt
        }
      };

      if (includeMetrics) {
        data.metrics = {
          currentPhase: metrics.currentPhase,
          totalTasks: metrics.totalTasks,
          totalTestCases: metrics.totalTestCases,
          testCoverage: metrics.testCoverage,
          testPassRate: metrics.testPassRate,
          automationRatio: metrics.automationRatio,
          bugsBySeverity: metrics.bugsBySeverity,
          openVsClosedBugs: metrics.openVsClosedBugs
        };
      }

      if (includeTasks) {
        data.tasks = project.tasks.map(task => ({
          id: task.id,
          title: task.title,
          type: task.type,
          status: task.status,
          assignee: task.assignee,
          priority: task.priority,
          tags: task.tags,
          estimatedHours: task.estimatedHours,
          actualHours: task.actualHours
        }));
      }

      if (includeTestCases) {
        data.testCases = project.tasks.flatMap(task =>
          task.testCases.map(tc => ({
            taskId: task.id,
            taskTitle: task.title,
            ...tc
          }))
        );
      }

      const fileName = `${project.name}_report_${formatDate(new Date()).replace(/\//g, '-')}`;
      
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'csv') {
        const csv = convertToCSV(data);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const markdown = convertToMarkdown(data, project);
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.md`;
        a.click();
        URL.revokeObjectURL(url);
      }
      handleSuccess('Relatório exportado com sucesso!');
      onClose();
    } catch (error) {
      handleError(error instanceof Error ? error : new Error('Erro ao exportar relatório'));
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Formato
        </label>
        <div className="flex gap-2">
          {(['json', 'csv', 'markdown'] as const).map(fmt => (
            <button
              key={fmt}
              onClick={() => setFormat(fmt)}
              className={`px-4 py-2 rounded-md transition-colors ${
                format === fmt
                  ? 'bg-accent text-white'
                  : 'bg-surface border border-surface-border text-text-secondary hover:bg-surface-hover'
              }`}
            >
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Incluir
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeMetrics}
            onChange={(e) => setIncludeMetrics(e.target.checked)}
            className="w-4 h-4 rounded border-surface-border text-accent"
          />
          <span className="text-text-primary">Métricas</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeTasks}
            onChange={(e) => setIncludeTasks(e.target.checked)}
            className="w-4 h-4 rounded border-surface-border text-accent"
          />
          <span className="text-text-primary">Tarefas</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeTestCases}
            onChange={(e) => setIncludeTestCases(e.target.checked)}
            className="w-4 h-4 rounded border-surface-border text-accent"
          />
          <span className="text-text-primary">Casos de Teste</span>
        </label>
      </div>

      <div className="flex gap-2 pt-4 border-t border-surface-border">
        <button onClick={onClose} className="flex-1 btn btn-secondary">
          Cancelar
        </button>
        <button onClick={handleExport} className="flex-1 btn btn-primary">
          Exportar Relatório
        </button>
      </div>
    </div>
  );
};

