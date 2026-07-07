/**
 * Mensagens de sucesso para a sincronização de Filas (Jira) a partir da seleção.
 *
 * Centraliza a construção do rótulo de fila e a flexão de número/verbo usados nos
 * botões "Importar" e "Atualizar" do painel de Filas, evitando duplicação e
 * permitindo testes unitários sem renderizar o componente.
 */

/** Ação que originou a sincronização, no particípio feminino singular. */
export type FilasSyncVerb = 'importada' | 'atualizada';

const PLURAL_VERB: Record<FilasSyncVerb, string> = {
  importada: 'importadas',
  atualizada: 'atualizadas',
};

/**
 * Rótulo da(s) fila(s) sincronizada(s): o nome entre aspas quando há uma única
 * fila, ou a contagem no plural (ex.: "3 filas") caso contrário.
 */
export function buildQueueLabel(queueCount: number, firstQueueName?: string): string {
  return queueCount === 1 ? `"${firstQueueName ?? ''}"` : `${queueCount} filas`;
}

/**
 * Monta a mensagem de sucesso da sincronização de Filas por seleção.
 *
 * @param verb - "importada" (importação) ou "atualizada" (atualização).
 * @param taskCount - Quantidade de tarefas sincronizadas.
 * @param queueCount - Quantidade de filas efetivamente sincronizadas.
 * @param firstQueueName - Nome da primeira fila (usado quando `queueCount === 1`).
 */
export function buildFilasQueueSyncMessage(
  verb: FilasSyncVerb,
  taskCount: number,
  queueCount: number,
  firstQueueName?: string
): string {
  const queueLabel = buildQueueLabel(queueCount, firstQueueName);
  return taskCount === 1
    ? `1 tarefa ${verb} da fila ${queueLabel}.`
    : `${taskCount} tarefas ${PLURAL_VERB[verb]} de ${queueLabel}.`;
}
