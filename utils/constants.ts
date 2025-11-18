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
    'text/xml'
];

export const TOAST_DURATION = {
  SUCCESS: 3000,
  ERROR: 5000,
  WARNING: 4000,
  INFO: 3000,
} as const;

