export const PHASE_NAMES = [
  'Request',
  'Analysis',
  'Design',
  'Analysis and Code',
  'Build',
  'Test',
  'Release',
  'Deploy',
  'Operate',
  'Monitor',
] as const;

export const DB_NAME = 'QAProjectsDB';
/**
 * Versão do schema IndexedDB. Incrementar a cada mudança de stores/índices.
 *
 * Histórico:
 * - 1: store inicial `projects`
 * - 2: novo store `testGenerationCache` (persiste artefatos gerados pela IA por taskId)
 * - 3: novo store `localFolderHandles` (persiste handle da pasta de backup automático)
 * - 4: novo store `taskTracking` (persiste dados do Acompanhamento de Tarefas / Filas Jira)
 */
export const DB_VERSION = 4;
export const STORE_NAME = 'projects';
/** Object store que persiste o cache de `TestGenerationArtifacts` por `taskId`. */
export const TEST_GENERATION_CACHE_STORE = 'testGenerationCache';
/** Object store que persiste o `FileSystemDirectoryHandle` da pasta de backup local. */
export const LOCAL_FOLDER_HANDLES_STORE = 'localFolderHandles';
/** Object store que persiste dados do Acompanhamento de Tarefas (Filas Jira). */
export const TASK_TRACKING_STORE = 'taskTracking';

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const ALLOWED_FILE_TYPES = [
  'text/plain',
  'text/markdown',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-rar-compressed',
  'application/json',
  'text/csv',
  'application/xml',
  'text/xml',
];

export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  WARNING: 4000,
  INFO: 3000,
} as const;
