import { create } from 'zustand';

/**
 * Ação "Jira" exibida no header global quando a tela Acompanhamento de Tarefas
 * está ativa. O painel de Filas registra o handler de atualização da fila e o
 * Header renderiza o botão — mesmo padrão do botão Jira em Tarefas & Testes.
 */
export interface TaskTrackingJiraAction {
  /** Dispara a atualização da fila exportada a partir do Jira. */
  onSync: () => void;
  /** Indica sincronização em andamento (estado de carregando). */
  isSyncing: boolean;
  /** Desabilita o botão (sem Jira configurado, sem fila ou sem tarefas). */
  disabled: boolean;
  /** Texto auxiliar do botão (tooltip). */
  title?: string;
}

/** Ação "Salvar" do Acompanhamento — persistência manual das filas Jira. */
export interface TaskTrackingSaveAction {
  onSave: () => void | Promise<void>;
  isSaving: boolean;
}

interface TaskTrackingHeaderState {
  jiraAction: TaskTrackingJiraAction | null;
  setJiraAction: (action: TaskTrackingJiraAction | null) => void;
  saveAction: TaskTrackingSaveAction | null;
  setSaveAction: (action: TaskTrackingSaveAction | null) => void;
}

export const useTaskTrackingHeaderStore = create<TaskTrackingHeaderState>(set => ({
  jiraAction: null,
  setJiraAction: action => set({ jiraAction: action }),
  saveAction: null,
  setSaveAction: action => set({ saveAction: action }),
}));
