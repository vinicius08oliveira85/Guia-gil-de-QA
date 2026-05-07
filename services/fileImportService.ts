import * as XLSX from 'xlsx';
import { Project, JiraTask, TestCase, ProjectDocument, JiraTaskType, TeamRole } from '../types';
import { logger } from '../utils/logger';
import { migrateTestCase } from '../utils/testCaseMigration';

const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024; // 50MB

const parseTeamRole = (value: unknown): TeamRole | undefined => {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim();
  if (normalized === 'Product' || normalized === 'QA' || normalized === 'Dev') {
    return normalized;
  }
  return undefined;
};

/**
 * Valida o tamanho do arquivo
 */
const validateFileSize = (file: File, maxSize: number = MAX_DOCUMENT_SIZE): void => {
  if (file.size > maxSize) {
    throw new Error(
      `Arquivo muito grande. Tamanho máximo: ${(maxSize / 1024 / 1024).toFixed(0)}MB`
    );
  }
  if (file.size === 0) {
    throw new Error('Arquivo vazio');
  }
};

/**
 * Valida o tipo de arquivo
 */
const validateFileType = (file: File, allowedTypes: string[]): void => {
  const isValidType = allowedTypes.some(
    type => file.type.includes(type) || file.name.toLowerCase().endsWith(`.${type}`)
  );

  if (!isValidType) {
    throw new Error(`Tipo de arquivo não suportado. Tipos permitidos: ${allowedTypes.join(', ')}`);
  }
};

export interface ImportResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

export interface ImportOptions {
  skipDuplicates?: boolean;
  validateData?: boolean;
}

/**
 * Importa um projeto de um arquivo JSON
 */
export const importProjectFromJSON = async (file: File): Promise<ImportResult<Project>> => {
  try {
    validateFileSize(file);
    validateFileType(file, ['json', 'application/json']);

    const text = await file.text();
    const json = JSON.parse(text);

    // Suportar diferentes estruturas de JSON
    const projectData = json.project || json;

    if (!projectData.id || !projectData.name) {
      return {
        success: false,
        error: 'Arquivo JSON inválido: campos obrigatórios (id, name) não encontrados',
      };
    }

    const project: Project = {
      id: projectData.id,
      name: projectData.name,
      description: projectData.description || '',
      createdAt: projectData.createdAt,
      updatedAt: projectData.updatedAt,
      businessRules: projectData.businessRules || [],
      documents: projectData.documents || [],
      tasks: projectData.tasks || [],
      phases: projectData.phases || [],
      shiftLeftAnalysis: projectData.shiftLeftAnalysis,
      testPyramidAnalysis: projectData.testPyramidAnalysis,
      generalIAAnalysis: projectData.generalIAAnalysis,
      tags: projectData.tags || [],
      settings: projectData.settings,
      dashboardOverviewAnalysis: projectData.dashboardOverviewAnalysis,
      dashboardInsightsAnalysis: projectData.dashboardInsightsAnalysis,
      sdlcPhaseAnalysis: projectData.sdlcPhaseAnalysis,
      metricsHistory: projectData.metricsHistory,
      specificationDocument: projectData.specificationDocument,
      projectFullAnalyses: projectData.projectFullAnalyses,
    };

    logger.info(`Projeto importado do JSON: ${project.name}`, 'FileImportService');

    return {
      success: true,
      data: project,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Erro desconhecido ao importar JSON';
    logger.error('Erro ao importar projeto do JSON', 'FileImportService', error);
    return {
      success: false,
      error: `Erro ao importar JSON: ${errorMessage}`,
    };
  }
};

/**
 * Importa tarefas de um arquivo Excel
 */
export const importTasksFromExcel = async (
  file: File,
  options: ImportOptions = {}
): Promise<ImportResult<JiraTask[]>> => {
  try {
    validateFileSize(file);
    validateFileType(file, ['xlsx', 'xls', 'spreadsheet', 'excel']);

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    if (!Array.isArray(data) || data.length === 0) {
      return {
        success: false,
        error: 'Planilha Excel vazia ou formato inválido',
      };
    }

    const tasks: JiraTask[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as Record<string, any>;

      try {
        const task: JiraTask = {
          id: row['ID'] || row['id'] || `imported-${Date.now()}-${i}`,
          title:
            row['Título'] || row['Titulo'] || row['Title'] || row['title'] || `Tarefa ${i + 1}`,
          type: (row['Tipo'] || row['Type'] || row['type'] || 'Tarefa') as JiraTaskType,
          status: (row['Status'] || row['status'] || 'To Do') as JiraTask['status'],
          priority: (row['Prioridade'] ||
            row['Priority'] ||
            row['priority'] ||
            'Média') as JiraTask['priority'],
          description:
            row['Descrição'] || row['Descricao'] || row['Description'] || row['description'] || '',
          assignee: parseTeamRole(row['Responsável'] ?? row['Assignee'] ?? row['assignee']),
          testCases: [],
          testStrategy: [],
          bddScenarios: [],
          tags:
            row['Tags'] || row['tags']
              ? String(row['Tags'] || row['tags'])
                  .split(',')
                  .map((t: string) => t.trim())
              : [],
          createdAt: row['Criado em'] || row['Created At'] || new Date().toISOString(),
        };

        if (options.validateData) {
          if (!task.title || task.title.trim() === '') {
            warnings.push(`Linha ${i + 2}: Tarefa sem título, pulada`);
            continue;
          }
        }

        tasks.push(task);
      } catch (error) {
        warnings.push(
          `Linha ${i + 2}: Erro ao processar tarefa - ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        );
      }
    }

    logger.info(`${tasks.length} tarefas importadas do Excel`, 'FileImportService');

    return {
      success: true,
      data: tasks,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Erro desconhecido ao importar Excel';
    logger.error('Erro ao importar tarefas do Excel', 'FileImportService', error);
    return {
      success: false,
      error: `Erro ao importar Excel: ${errorMessage}`,
    };
  }
};

/**
 * Importa tarefas de um arquivo CSV
 */
export const importTasksFromCSV = async (
  file: File,
  options: ImportOptions = {}
): Promise<ImportResult<JiraTask[]>> => {
  try {
    validateFileSize(file);
    validateFileType(file, ['csv', 'text/csv']);

    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return {
        success: false,
        error: 'Arquivo CSV vazio ou sem dados',
      };
    }

    // Parsear header
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const tasks: JiraTask[] = [];
    const warnings: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));

      if (values.length !== headers.length) {
        warnings.push(`Linha ${i + 1}: Número de colunas não corresponde ao header, pulada`);
        continue;
      }

      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      try {
        const task: JiraTask = {
          id: row['ID'] || row['id'] || `imported-${Date.now()}-${i}`,
          title: row['Título'] || row['Titulo'] || row['Title'] || row['title'] || `Tarefa ${i}`,
          type: (row['Tipo'] || row['Type'] || row['type'] || 'Tarefa') as JiraTaskType,
          status: (row['Status'] || row['status'] || 'To Do') as JiraTask['status'],
          priority: (row['Prioridade'] ||
            row['Priority'] ||
            row['priority'] ||
            'Média') as JiraTask['priority'],
          description:
            row['Descrição'] || row['Descricao'] || row['Description'] || row['description'] || '',
          assignee: parseTeamRole(row['Responsável'] ?? row['Assignee'] ?? row['assignee']),
          testCases: [],
          testStrategy: [],
          bddScenarios: [],
          tags:
            row['Tags'] || row['tags'] ? row['Tags'].split(',').map((t: string) => t.trim()) : [],
          createdAt: row['Criado em'] || row['Created At'] || new Date().toISOString(),
        };

        if (options.validateData) {
          if (!task.title || task.title.trim() === '') {
            warnings.push(`Linha ${i + 1}: Tarefa sem título, pulada`);
            continue;
          }
        }

        tasks.push(task);
      } catch (error) {
        warnings.push(
          `Linha ${i + 1}: Erro ao processar tarefa - ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        );
      }
    }

    logger.info(`${tasks.length} tarefas importadas do CSV`, 'FileImportService');

    return {
      success: true,
      data: tasks,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Erro desconhecido ao importar CSV';
    logger.error('Erro ao importar tarefas do CSV', 'FileImportService', error);
    return {
      success: false,
      error: `Erro ao importar CSV: ${errorMessage}`,
    };
  }
};

/**
 * Importa casos de teste de um arquivo Excel
 */
export const importTestCasesFromExcel = async (
  file: File,
  taskId: string,
  options: ImportOptions = {}
): Promise<ImportResult<TestCase[]>> => {
  try {
    if (!taskId || taskId.trim() === '') {
      return {
        success: false,
        error: 'ID da tarefa é obrigatório para importar casos de teste',
      };
    }

    validateFileSize(file);
    validateFileType(file, ['xlsx', 'xls', 'spreadsheet', 'excel']);

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    if (!Array.isArray(data) || data.length === 0) {
      return {
        success: false,
        error: 'Planilha Excel vazia ou formato inválido',
      };
    }

    const testCases: TestCase[] = [];
    const warnings: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i] as Record<string, any>;

      try {
        const rawDesc =
          row['Ação necessária'] ||
          row['Ação'] ||
          row['Descrição'] ||
          row['Descricao'] ||
          row['Description'] ||
          row['description'];

        if (options.validateData && (!rawDesc || String(rawDesc).trim() === '')) {
          warnings.push(`Linha ${i + 2}: Caso de teste sem ação/descrição, pulado`);
          continue;
        }

        const stepsRaw = row['Passos'] || row['Steps'] || row['steps'];
        const steps =
          stepsRaw != null && String(stepsRaw).trim() !== ''
            ? String(stepsRaw)
                .split(';')
                .map((s: string) => s.trim())
                .filter(Boolean)
            : [];

        const legacyRow: Record<string, unknown> = {
          id: row['ID'] || row['id'] || `tc-${Date.now()}-${i}`,
          description: String(
            rawDesc !== undefined && rawDesc !== null && String(rawDesc).trim() !== ''
              ? rawDesc
              : `Caso de teste ${i + 1}`
          ),
          steps,
          expectedResult:
            row['Resultado Esperado'] || row['Expected Result'] || row['expectedResult'] || '',
          observedResult:
            row['Resultado Observado'] ||
            row['Resultado obtido'] ||
            row['Observed Result'] ||
            row['observedResult'] ||
            '',
          status: (row['Status'] || row['status'] || 'Not Run') as TestCase['status'],
          preconditions: row['Pré-condições'] || row['Preconditions'] || row['preconditions'],
          testSuite: row['Suite'] || row['testSuite'],
          testEnvironment: row['Ambiente'] || row['Environment'] || row['testEnvironment'],
        };

        const extraParams = [
          row['Parâmetros necessários'] || row['Parâmetros'] || row['Parameters'],
          row['Ferramentas'] || row['Tools'],
          row['Automatizado'] === 'Sim' || row['Automated'] === 'Yes'
            ? 'Importação: indicado como automatizado na planilha'
            : '',
        ]
          .filter(Boolean)
          .map(String);

        if (extraParams.length > 0) {
          legacyRow.parameters = extraParams.join('\n');
        }

        const structEnv =
          row['Ambiente (estruturado)'] || row['Ambiente filtro'] || row['Ambiente ID'];
        if (structEnv != null && String(structEnv).trim() !== '') {
          legacyRow.environment = String(structEnv).trim();
        }
        const structSuite =
          row['Suíte (estruturado)'] || row['Suite (estruturado)'] || row['Suíte ID'];
        if (structSuite != null && String(structSuite).trim() !== '') {
          legacyRow.suite = String(structSuite).trim();
        }

        const execCell = row['Tipo execução'] || row['Execução'] || row['executionKind'];
        if (typeof execCell === 'string') {
          const v = execCell.toLowerCase().trim();
          if (v.includes('misto') || v === 'mixed') legacyRow.executionKind = 'mixed';
          else if (v.includes('automat') || v === 'automated') legacyRow.executionKind = 'automated';
          else if (v.includes('manual')) legacyRow.executionKind = 'manual';
        }

        let tc = migrateTestCase(legacyRow);
        const extra =
          typeof legacyRow.parameters === 'string' ? legacyRow.parameters.trim() : '';
        if (extra) {
          const base = tc.parameters && tc.parameters !== '—' ? tc.parameters : '';
          tc = {
            ...tc,
            parameters: [base, extra].filter(Boolean).join('\n\n'),
          };
        }
        testCases.push(tc);
      } catch (error) {
        warnings.push(
          `Linha ${i + 2}: Erro ao processar caso de teste - ${error instanceof Error ? error.message : 'Erro desconhecido'}`
        );
      }
    }

    logger.info(`${testCases.length} casos de teste importados do Excel`, 'FileImportService');

    return {
      success: true,
      data: testCases,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Erro desconhecido ao importar Excel';
    logger.error('Erro ao importar casos de teste do Excel', 'FileImportService', error);
    return {
      success: false,
      error: `Erro ao importar Excel: ${errorMessage}`,
    };
  }
};

/**
 * Importa um documento genérico (PDF, Word, Excel, imagem, etc.)
 */
export const importDocument = async (file: File): Promise<ImportResult<ProjectDocument>> => {
  try {
    validateFileSize(file);

    const isImage = file.type.startsWith('image/');
    const isText =
      file.type.startsWith('text/') || file.type === 'application/json' || file.type === 'text/csv';

    let content: string;

    if (isImage) {
      // Converter imagem para base64
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      content = `data:${file.type};base64,${base64}`;
    } else if (isText) {
      // Ler como texto
      content = await file.text();
    } else {
      // Para arquivos binários (PDF, Word, Excel), converter para base64
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      content = `data:${file.type};base64,${base64}`;
    }

    const document: ProjectDocument = {
      name: file.name,
      content: content,
      analysis: undefined,
    };

    logger.info(`Documento importado: ${file.name} (${file.type})`, 'FileImportService');

    return {
      success: true,
      data: document,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Erro desconhecido ao importar documento';
    logger.error('Erro ao importar documento', 'FileImportService', error);
    return {
      success: false,
      error: `Erro ao importar documento: ${errorMessage}`,
    };
  }
};

/**
 * Detecta o tipo de arquivo e importa automaticamente
 */
export const autoImportFile = async (
  file: File,
  options: ImportOptions = {}
): Promise<ImportResult<Project | JiraTask[] | TestCase[] | ProjectDocument>> => {
  const fileName = file.name.toLowerCase();
  const fileType = file.type;

  // Projeto JSON
  if (fileName.endsWith('.json') || fileType === 'application/json') {
    return await importProjectFromJSON(file);
  }

  // Tarefas Excel
  if (
    fileName.endsWith('.xlsx') ||
    fileName.endsWith('.xls') ||
    fileType.includes('spreadsheet') ||
    fileType.includes('excel')
  ) {
    // Tentar detectar se é tarefas ou casos de teste pela estrutura
    // Por padrão, assumimos que é tarefas
    return await importTasksFromExcel(file, options);
  }

  // Tarefas CSV
  if (fileName.endsWith('.csv') || fileType === 'text/csv') {
    return await importTasksFromCSV(file, options);
  }

  // Documento genérico
  return await importDocument(file);
};
