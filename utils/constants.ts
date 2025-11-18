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
  'Monitor'
] as const;

export const DB_NAME = 'QAProjectsDB';
export const DB_VERSION = 1;
export const STORE_NAME = 'projects';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ['text/plain', 'text/markdown', 'text/markdown'];

export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  WARNING: 4000,
  INFO: 3000,
} as const;

