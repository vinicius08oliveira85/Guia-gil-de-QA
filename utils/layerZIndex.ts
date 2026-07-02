/**
 * Pilha global de camadas da UI.
 * Toasts devem ficar acima de modais e popovers portaled dentro deles.
 */
export const LAYER_Z_INDEX = {
  modalOverlay: 9999,
  modalPopover: 10000,
  toast: 10100,
} as const;

/** Classe Tailwind para overlay de modal (sincronizada com `--z-modal-overlay` em index.css). */
export const modalOverlayZClass = 'z-[var(--z-modal-overlay)]';
