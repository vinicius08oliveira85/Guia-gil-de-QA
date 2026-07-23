import type { Project } from '../types';
import { logger } from './logger';

/**
 * Schema version mantido junto com os dados.
 * Incrementar a cada quebra de compatibilidade.
 */
export const CURRENT_PROJECT_SCHEMA_VERSION = 1;

export interface VersionedProject extends Project {
  _schemaVersion?: number;
}

/**
 * Registry de migrações: versão → função de upgrade.
 * Cada função recebe dados da versão N e retorna dados da versão N+1.
 */
type MigrationFn = (data: Record<string, unknown>) => Record<string, unknown>;

const migrations: Record<number, MigrationFn> = {
  // Exemplo de migração (v0 → v1):
  // 0: (data) => ({
  //   ...data,
  //   _schemaVersion: 1,
  //   settings: { ...(data.settings as object || {}), lastJiraSyncAt: null },
  // }),
};

/**
 * Aplica migrações pendentes a um projeto carregado do armazenamento.
 * Retorna o projeto migrado para a versão mais recente.
 */
export function migrateProject(data: Record<string, unknown>): Project {
  let current = { ...data };
  const version = (current._schemaVersion as number) || 0;

  if (version > CURRENT_PROJECT_SCHEMA_VERSION) {
    logger.warn(
      `Projeto veio de versão mais nova (${version} > ${CURRENT_PROJECT_SCHEMA_VERSION}). Pode haver incompatibilidade.`,
      'dataMigration'
    );
    return current as unknown as Project;
  }

  if (version === CURRENT_PROJECT_SCHEMA_VERSION) {
    return current as unknown as Project;
  }

  logger.info(
    `Migrando projeto da versão ${version} → ${CURRENT_PROJECT_SCHEMA_VERSION}`,
    'dataMigration'
  );

  for (let v = version; v < CURRENT_PROJECT_SCHEMA_VERSION; v++) {
    const migrateFn = migrations[v];
    if (migrateFn) {
      current = migrateFn(current);
      logger.debug(`Migração v${v} → v${v + 1} aplicada`, 'dataMigration');
    } else {
      current = { ...current, _schemaVersion: v + 1 };
    }
  }

  return current as unknown as Project;
}

/**
 * Aplica migrações a um array de projetos carregados do armazenamento.
 */
export function migrateProjects(projects: Record<string, unknown>[]): Project[] {
  return projects.map(migrateProject);
}

/**
 * Aplica migrações a qualquer blob JSON do task tracking storage.
 */
export function migrateTaskTrackingSnapshot(
  data: Record<string, unknown>
): Record<string, unknown> {
  const version = (data._schemaVersion as number) || 0;

  if (version >= CURRENT_PROJECT_SCHEMA_VERSION) {
    return data;
  }

  // Migrações específicas para task tracking podem ser adicionadas aqui
  if (version < 1) {
    data._schemaVersion = 1;
    // Exemplo: normalizar campo deprecated
    // if (!data.tasks && data.issues) data.tasks = data.issues;
  }

  return data;
}
