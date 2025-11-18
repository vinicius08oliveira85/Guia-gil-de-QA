import { Project, JiraTask, TestCase } from '../types';
import { format } from 'date-fns';

export const exportProjectToJSON = (project: Project): string => {
  const exportData = {
    project: {
      id: project.id,
      name: project.name,
      description: project.description,
      exportedAt: new Date().toISOString(),
      documents: project.documents,
      tasks: project.tasks,
      phases: project.phases,
      shiftLeftAnalysis: project.shiftLeftAnalysis,
      testPyramidAnalysis: project.testPyramidAnalysis
    }
  };
  return JSON.stringify(exportData, null, 2);
};

export const exportProjectToCSV = (project: Project): string => {
  const headers = ['ID', 'Título', 'Tipo', 'Status', 'Casos de Teste', 'Casos Executados', 'Casos Passados', 'Casos Falhados', 'Bugs Abertos'];
  const rows: string[] = [headers.join(',')];

  project.tasks.forEach(task => {
    const testCases = task.testCases || [];
    const executed = testCases.filter(tc => tc.status !== 'Not Run').length;
    const passed = testCases.filter(tc => tc.status === 'Passed').length;
    const failed = testCases.filter(tc => tc.status === 'Failed').length;
    const bugs = project.tasks.filter(t => t.type === 'Bug' && t.status !== 'Done').length;

    const row = [
      task.id,
      `"${task.title.replace(/"/g, '""')}"`,
      task.type,
      task.status,
      testCases.length.toString(),
      executed.toString(),
      passed.toString(),
      failed.toString(),
      bugs.toString()
    ];
    rows.push(row.join(','));
  });

  return rows.join('\n');
};

export const exportTestCasesToCSV = (tasks: JiraTask[]): string => {
  const headers = ['Tarefa ID', 'Tarefa Título', 'Caso de Teste ID', 'Descrição', 'Status', 'Automatizado', 'Estratégias'];
  const rows: string[] = [headers.join(',')];

  tasks.forEach(task => {
    (task.testCases || []).forEach(tc => {
      const row = [
        task.id,
        `"${task.title.replace(/"/g, '""')}"`,
        tc.id,
        `"${tc.description.replace(/"/g, '""')}"`,
        tc.status,
        tc.isAutomated ? 'Sim' : 'Não',
        `"${(tc.strategies || []).join('; ')}"`
      ];
      rows.push(row.join(','));
    });
  });

  return rows.join('\n');
};

export const generateProjectReport = (project: Project): string => {
  const tasks = project.tasks || [];
  const testCases = tasks.flatMap(t => t.testCases || []);
  const bugs = tasks.filter(t => t.type === 'Bug');
  const openBugs = bugs.filter(t => t.status !== 'Done');
  
  const totalTestCases = testCases.length;
  const executedTestCases = testCases.filter(tc => tc.status !== 'Not Run').length;
  const passedTestCases = testCases.filter(tc => tc.status === 'Passed').length;
  const failedTestCases = testCases.filter(tc => tc.status === 'Failed').length;
  const automatedTestCases = testCases.filter(tc => tc.isAutomated).length;

  const report = `
# Relatório do Projeto: ${project.name}

**Data de Geração:** ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}

## 📊 Resumo Executivo

- **Total de Tarefas:** ${tasks.filter(t => t.type !== 'Bug').length}
- **Total de Bugs:** ${bugs.length}
- **Bugs Abertos:** ${openBugs.length}
- **Total de Casos de Teste:** ${totalTestCases}
- **Casos Executados:** ${executedTestCases} (${totalTestCases > 0 ? Math.round((executedTestCases / totalTestCases) * 100) : 0}%)
- **Casos Passados:** ${passedTestCases}
- **Casos Falhados:** ${failedTestCases}
- **Taxa de Sucesso:** ${executedTestCases > 0 ? Math.round((passedTestCases / executedTestCases) * 100) : 0}%
- **Casos Automatizados:** ${automatedTestCases} (${totalTestCases > 0 ? Math.round((automatedTestCases / totalTestCases) * 100) : 0}%)

## 📋 Status das Fases

${project.phases.map(phase => `
### ${phase.name}
- **Status:** ${phase.status}
${phase.summary ? `- **Resumo:** ${phase.summary}` : ''}
${phase.testTypes && phase.testTypes.length > 0 ? `- **Tipos de Teste:** ${phase.testTypes.join(', ')}` : ''}
`).join('\n')}

## 🐛 Bugs Abertos

${openBugs.length > 0 ? openBugs.map(bug => `
- **${bug.id}:** ${bug.title}
  - Severidade: ${bug.severity || 'N/A'}
  - Prioridade: ${bug.priority || 'N/A'}
  - Status: ${bug.status}
`).join('\n') : 'Nenhum bug aberto.'}

## ✅ Tarefas por Status

- **To Do:** ${tasks.filter(t => t.status === 'To Do').length}
- **In Progress:** ${tasks.filter(t => t.status === 'In Progress').length}
- **Done:** ${tasks.filter(t => t.status === 'Done').length}

## 📈 Métricas de Teste

### Distribuição de Status dos Casos de Teste
- **Não Executados:** ${testCases.filter(tc => tc.status === 'Not Run').length}
- **Passados:** ${passedTestCases}
- **Falhados:** ${failedTestCases}

### Automação
- **Automatizados:** ${automatedTestCases}
- **Manuais:** ${totalTestCases - automatedTestCases}

## 📝 Recomendações

${failedTestCases > 0 ? `- ⚠️ Existem ${failedTestCases} casos de teste falhados que precisam de atenção.` : ''}
${openBugs.length > 0 ? `- 🐛 Existem ${openBugs.length} bugs abertos que devem ser priorizados.` : ''}
${automatedTestCases < totalTestCases * 0.5 ? `- 🤖 Considere aumentar a automação de testes. Apenas ${Math.round((automatedTestCases / totalTestCases) * 100)}% dos testes estão automatizados.` : ''}
${executedTestCases < totalTestCases * 0.8 ? `- ✅ Apenas ${Math.round((executedTestCases / totalTestCases) * 100)}% dos casos de teste foram executados.` : ''}

---
*Relatório gerado automaticamente pelo QA Agile Guide*
`;

  return report.trim();
};

export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

