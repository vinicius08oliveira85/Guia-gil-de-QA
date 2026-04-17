/** Identificador do envelope JSON parcial exportado pelo app (import opcional). */
export const BUSINESS_RULES_EXPORT_FORMAT_ID = 'qa-agile-guide-business-rules';

/** Versão gravada nos exports atuais. */
export const BUSINESS_RULES_EXPORT_FORMAT_VERSION = 1;

/**
 * Versão máxima de `formatVersion` aceita na importação.
 * Arquivos com versão maior exigem app atualizado (evita interpretação silenciosa errada).
 */
export const BUSINESS_RULES_IMPORT_MAX_FORMAT_VERSION = 1;
