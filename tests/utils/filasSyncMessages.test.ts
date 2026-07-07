import { describe, expect, it } from 'vitest';
import { buildFilasQueueSyncMessage, buildQueueLabel } from '../../utils/filasSyncMessages';

describe('buildQueueLabel', () => {
  it('usa o nome entre aspas quando há uma única fila', () => {
    expect(buildQueueLabel(1, 'Fila A')).toBe('"Fila A"');
  });

  it('usa a contagem no plural quando há múltiplas filas', () => {
    expect(buildQueueLabel(3, 'Fila A')).toBe('3 filas');
  });

  it('tolera nome ausente com uma única fila', () => {
    expect(buildQueueLabel(1)).toBe('""');
  });
});

describe('buildFilasQueueSyncMessage', () => {
  it('importação no singular com uma fila', () => {
    expect(buildFilasQueueSyncMessage('importada', 1, 1, 'Fila A')).toBe(
      '1 tarefa importada da fila "Fila A".'
    );
  });

  it('importação no plural com múltiplas filas', () => {
    expect(buildFilasQueueSyncMessage('importada', 5, 2, 'Fila A')).toBe(
      '5 tarefas importadas de 2 filas.'
    );
  });

  it('atualização no singular com uma fila', () => {
    expect(buildFilasQueueSyncMessage('atualizada', 1, 1, 'Fila B')).toBe(
      '1 tarefa atualizada da fila "Fila B".'
    );
  });

  it('atualização no plural com múltiplas filas', () => {
    expect(buildFilasQueueSyncMessage('atualizada', 4, 3, 'Fila B')).toBe(
      '4 tarefas atualizadas de 3 filas.'
    );
  });

  it('trata zero tarefas como plural', () => {
    expect(buildFilasQueueSyncMessage('importada', 0, 1, 'Fila A')).toBe(
      '0 tarefas importadas de "Fila A".'
    );
  });
});
